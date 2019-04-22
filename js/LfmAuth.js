define(function(require) {
'use strict';
var pv = require('pv');
var pvState = require('pv/state')
var spv = require('spv');
var hex_md5 = require('hex_md5');

var pvUpdate = pv.update;


var LfmLogin = spv.inh(pv.Model, {
  init: function(target) {
    target.auth = target.app.auths.lfm;

    target.updateNesting('auth', target.auth);

    if (pvState(target.auth, 'deep_sandbox')){
      pvUpdate(target, 'deep_sandbox', true);
    }

    return target;
  }
}, {
  "+states": {
    "has_session": ["compx", [
      '@one:session:auth'
    ]],

    "data_wait": [
      "compx",
      ['@one:data_wait:auth']
    ],

    "default_access_desc": [
      "compx",
      ['#locales.to-get-access']
    ],

    "request_description": [
      "compx",
      ['access_desc', 'default_access_desc', '#locales.lfm-auth-invitation'],
      function(desc, default_desc, invite) {
        var text = desc || default_desc;
        return text ? text + " " + invite : "";
      }
    ]
  },

  model_name: 'auth_block_lfm',

  useCode: function(auth_code){
    if (this.bindAuthCallback){
      this.bindAuthCallback();
    }
    this.auth.setToken(auth_code);

  },

  requestAuth: function(opts) {
    if (this.beforeRequest){
      this.beforeRequest();
    }
    this.auth.requestAuth(opts);
  },

  switchView: function(){
    pvUpdate(this, 'active', !this.state('active'));
  }
});


var LfmScrobble = spv.inh(LfmLogin, {
  init: function(target){
    pvUpdate(target, 'active', true);
  }
}, {
  "+states": {
    "scrobbling": [
      "compx",
      ['#settings-lfm-scrobbling']
    ],

    "access_desc": [
      "compx",
      ['#locales.lastfm-scrobble-access']
    ]
  },

  beforeRequest: function() {
    this.bindAuthCallback();
  },

  act: function () {
    this.app.setSetting('lfm-scrobbling', true);
  },

  bindAuthCallback: function(){
    pvUpdate(this.app, 'lfm_auth_request', this);
  },

  setScrobbling: function(state) {
    this.app.setSetting('lfm-scrobbling', state);
    //this.auth.setScrobbling(state);
  }
});

var LfmAuth = spv.inh(pv.Model, {
  init: function(target, opts, data, params) {
    target.api = data.lfm;
    var has_session = !!target.api.sk;

    pvUpdate(target, 'deep_sandbox', params.deep_sandbox);
    pvUpdate(target, 'callback_url', params.callback_url);
    pvUpdate(target, 'bridge_url', params.bridge_url);

    pvUpdate(target, 'session', !!has_session);

  },
}, {
  "+effects": {
    "api": {
      "bridge": ["requested_once", ["window"], function(window) {
        return window.document.createElement("iframe");
      }],

      "window": function() {
        return window;
      }
    },

    "produce": {
      "started_bridge": {
        api: ["bridge", "window"],
        trigger: "bridge_url",
        require: "bridge_url",

        fn: function(bridge, win, bridge_url) {
          bridge.className = "serv-container";
          bridge.src = bridge_url;
          win.document.body.appendChild(bridge);
        }
      },

      "prepared_bridge": {
        api: "bridge",
        trigger: "bridge_key",
        require: ["_bridge_ready", "bridge_key"],
        effects: "started_bridge",

        fn: function(bridge, key) {
          bridge.contentWindow.postMessage("add_keys:" + key, "*");
        }
      },

      "asked_permission": {
        api: "self",
        trigger: "auth_data",
        require: "auth_data",
        effects: "prepared_bridge",

        fn: function(self, data) {
          self.trigger("want-open-url", data.link, data.opts);
        }
      }
    },

    "consume": {
      "token": {
        type: "subscribe",
        api: ["window", "bridge"],

        fn: function(update, win, bridge) {
          return spv.listenEvent(win, "message", function(e) {
            if (e.source != bridge.contentWindow || !spv.startsWith(e.data, "lastfm_token:")) {
              return;
            }

            update(e.data.replace("lastfm_token:", ""));
          });
        }
      },
      "_bridge_ready": {
        type: "subscribe",
        api: ["window", "bridge"],

        fn: function(update, win, bridge) {
          return spv.listenEvent(win, "message", function(e) {
            if (e.source != bridge.contentWindow || e.data != "lastfm_bridge_ready:") {
              return;
            }

            update(true);
          });
        }
      }
    }
  },

  "+states": {
    "data_wait": [
      "compx",
      ['requested_once', 'session'],
      function (once, session) {
        return once && !session;
      }
    ],

    "requested_once": [
      "compx",
      ['requested_once', 'requested'],
      function (once, req) {
        return Boolean(once || req);
      }
    ],

    "bridge_key": [
      "compx",
      ['auth_data.bridgekey']
    ]
  },

  requestAuth: function() {
    pvUpdate(this, 'requested', Date.now());
  },

  login: function(r, callback){
    this.api.sk = r.session.key;
    this.api.username = r.session.name;
    this.api.stSet('lfm_user_name', r.session.name, true);
    this.api.stSet('lfmsk', this.api.sk, true);
    if (callback){callback();}
  },

  getInitAuthData: function(){
    var o = {};
    o.link = 'http://www.last.fm/api/auth/?api_key=' + this.api.apikey ;
    var link_tag = pvState(this, 'callback_url');

    if (!pvState(this, 'deep_sandbox')){
      o.bridgekey = hex_md5(Math.random() + 'bridgekey'+ Math.random());
      link_tag += '?key=' + o.bridgekey;
    }

    o.link += '&cb=' + encodeURIComponent(link_tag);
    return o;
  },

  'stch-requested': function (target, state) {
    if (!state) {
      return;
    }

    target.updateState('auth_data', target.getInitAuthData());
  },


  'stch-token': function (target, token) {
    target.setToken(token);
  },

  setToken: function(token){
    this.newtoken = token;
    this.try_to_login();
  },

  get_lfm_token: function(){
    var _this = this;
    this.api.get('auth.getToken', false, {nocache: true})
      .then(function(r){
        _this.newtoken = r.token;
      });
  },

  try_to_login: function(){
    var _this = this;
    if (!_this.newtoken) {
      return;
    }

    _this.api.get('auth.getSession', {'token':_this.newtoken }).then(function(r) {
      if (r.error) {
        console.log('error while granting lfm scrobble access');
        return;
      }

      _this.login(r);
      pvUpdate(_this, 'session', true);
      _this.trigger("session");

      console.log('lfm scrobble access granted');
    });
  }
});

LfmAuth.LfmLogin =LfmLogin;
LfmAuth.LfmScrobble =LfmScrobble;

return LfmAuth;
});
