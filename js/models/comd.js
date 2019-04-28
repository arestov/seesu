define(function(require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var BrowseMap = require('../libs/BrowseMap');
var pvState = require('pv/state')
var pvUpdate = require('pv/update');
var getNesting = require('pv/getNesting')

var CommonMessagesStore = spv.inh(pv.Eventor, {
  naming: function(constr) {
    return function CommonMessagesStore(app, glob_store, store_name){
      constr(this, app, glob_store, store_name);
    };
  },
  init: function (self, app, glob_store, store_name) {
    self.glob_store = glob_store;
    self.store_name = store_name;
  },
  props: {
    markAsReaded: function(message) {
      var changed = this.glob_store.set(this.store_name, message);
      if (changed){
        this.trigger('read', message);
      }
    },
    getReadedMessages: function() {
      return this.glob_store.get(this.store_name);
    }
  }
});

var GMessagesStore = function(app, set, get) {
  this.app = app;
  this.sset = set;
  this.sget = get;
  this.store = this.sget() || {};
  this.cm_store = {};
};

spv.Class.extendTo(GMessagesStore, {
  set: function(space, message) {
    this.store[space] = this.store[space] || [];
    if ( this.store[space].indexOf(message) == -1 ){
      this.store[space].push(message);
      this.sset(this.store);
      return true;
    }
  },
  get: function(space) {
    return this.store[space] || [];
  },
  getStore: function(name) {
    return this.cm_store[name] || (this.cm_store[name] = new CommonMessagesStore(this.app, this, name));
  }
});


var PartsSwitcher = spv.inh(pv.Model, {
  init: function(target) {
    // this._super.apply(this, arguments);
    target.context_parts = {};
    target.active_part = null;
  }
}, {
  hideAll: function() {
    if (this.active_part){
      pvUpdate(this, 'active_part', false);
      this.active_part.deacivate();
      this.active_part = null;
    }
  },
  hide: function(name){
    ensurePart(this, name);
    var target = this.context_parts[name] || BrowseMap.routePathByModels(this, name);
    if (target === this.active_part){
      this.hideAll();
    }
  },
  addPart: function(model) {
    if (!this.context_parts[model.model_name]){
      this.context_parts[model.model_name] = model;

      var array = this.getNesting('context_parts') || [];
      array.push(model);
      pv.updateNesting(this, 'context_parts', array);

    }
  },
  getAllParts: function(){
    return this.context_parts;
  },
  switchPart: function(name) {
    ensurePart(this, name);
    var target = this.context_parts[name] || BrowseMap.routePathByModels(this, name);
    if (target && target != this.active_part){
      if (this.active_part){
        this.active_part.deacivate();
      }
      this.active_part = target;
      pvUpdate(this, 'active_part', name);
      this.active_part.acivate();


    } else {
      this.hideAll();
    }
  }
});

function ensurePart(self, name) {
  if (self.context_parts[name]) {
    return;
  }

  var part = self.context_parts[name] || BrowseMap.routePathByModels(self, name);
  var array = self.getNesting('context_parts') || [];
  if (array.indexOf(part) != -1) {
    return;
  }
  array.push(part);

  self.updateNesting('context_parts', array);

}


var BaseCRow = spv.inh(pv.Model, {
  init: function(target) {
    target.actionsrow = target.actionsrow;
    if (target.actionsrow_src && !target.actionsrow) {
      var count = target.actionsrow_src.length;
      var cur = count && target;
      while (count) {
        cur = cur.map_parent;
        count--;
      }

      target.actionsrow = cur;
    }
  }
}, {

  switchView: function(){
    this.actionsrow.switchPart(this.model_name);
  },
  hide: function(){
    this.actionsrow.hide(this.model_name);
  },
  deacivate: function(){
    pvUpdate(this, "active_view", false);
  },
  acivate: function(){
    pvUpdate(this, "active_view", true);
  }
});


var VkLoginB = spv.inh(pv.Model, {
  init: function(target) {
    var auth = getNesting(target.app, 'vk_auth')
    target.auth = auth;
    target.updateNesting('auth', target.auth);

    var target_bits;

    var config = target.config;

    var open_opts = config && config.open_opts;
    if (open_opts){
      target.open_opts = open_opts;
      if (target.open_opts.settings_bits){
        target_bits = target.open_opts.settings_bits;
      }
    }

    var notf_args = config && config.getNotf && config.getNotf(target);

    if (notf_args) {
      target.notf = notf_args.notf;
      target.notf.on('read', function(value) {
        if (value == 'vk_audio_auth '){
          pvUpdate(target, 'notify_readed', true);
        }

      });

      if (notf_args.readed){
        pvUpdate(target, 'notify_readed', true);
      }

      pvUpdate(target, 'has_notify_closer', true);
    }

    if (target.auth.deep_sandbox || pvState(target.auth, 'deep_sandbox')){
      pvUpdate(target, 'deep_sandbox', true);
    }

    pvUpdate(target, 'target_bits', target_bits);

    if (target.auth && target.auth.data_wait){
      target.waitData();
    } else {
      target.auth.on('data_wait', function(){
        target.waitData();
      });
    }

  }
}, {
  "+states": {
    "has_session": [
      "compx",
      ['@one:has_token:auth', 'target_bits', '@one:settings_bits:auth'],
      function(has_token, target_bits, settings_bits) {
        if (has_token) {return true;}
        if (typeof target_bits != 'undefined' && settings_bits != 'undefined') {
          return (settings_bits & target_bits) * 1;
        }
      }
    ],

    "request_description": [
      "compx",
      ['access_desc', '#locales.vk-auth-invitation'],
      function(desc, vk_inv) {
        return desc ? (desc + ' ' + vk_inv): '';
      }
    ]
  },

  model_name: 'auth_block_vk',
  access_desc: null,

  removeNotifyMark: function() {
    this.notf.markAsReaded('vk_audio_auth ');
  },

  bindAuthReady: function(exlusive_space, callback) {
    this.auth.bindAuthReady(exlusive_space, callback, this.open_opts && this.open_opts.settings_bits);
  },

  // triggerSession: function() {
  // 	pvUpdate(this, 'has_session', true);
  // },
  waitData: function() {
    pvUpdate(this, 'data_wait', true);
  },

  notWaitData: function() {
    pvUpdate(this, 'data_wait', false);
  },

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
    this.auth.requestAuth(opts || this.open_opts);
  },

  switchView: function(){
    pvUpdate(this, 'active', !this.state('active'));
  }
});



return {
  GMessagesStore:GMessagesStore,
  PartsSwitcher:PartsSwitcher,
  BaseCRow:BaseCRow,
  VkLoginB: VkLoginB
};
});
