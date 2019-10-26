define(function(require) {
'use strict';
var $ = require('jquery');
var spv = require('spv');
var View = require('View');
var createNiceButton = require('./modules/createNiceButton');

var VkLoginUI = spv.inh(View, {}, {
  state_change: {
    'data_wait': function(target, state) {
      if (state){
        target.getCustomCon().addClass("waiting-auth");
      } else {
        target.getCustomCon().removeClass("waiting-auth");
      }
    },
    "request_description": function(target, state) {
      target.login_desc.text(state || "");
    },
    'deep_sandbox': function(target, state) {
      target.getCustomCon().toggleClass('deep-sandbox', !!state);
    }
  },

  'stch-has_notify_closer': function(target, state) {
    target.getCustomCon().toggleClass('has_notify_closer', !!state);
  },
  'stch-notify_readed': function(target, state) {
    target.getCustomCon().toggleClass('notf-readed', !!state);
  },
  'stch-has_session': function(target, state){
    if (!state){
      target.getCustomCon().removeClass("hidden");
    } else {
      target.getCustomCon().addClass("hidden");
    }
  },
  createBase: function() {
    this.c = this.root_view.getSample('vklc');
    this.bindBase();
  },
  bindBase: function() {
    var _this = this;
    var sign_link = this.getCustomCon().find('.sign-in-to-vk').click(function(e){
      _this.RPCLegacy('requestAuth');
      e.preventDefault();
    });
    this.login_desc = this.getCustomCon().find('.login-request-desc');
    this.addWayPoint(sign_link, {
      canUse: function() {

      }
    });
    var input = this.getCustomCon().find('.vk-code');
    this.getCustomCon().find('.use-vk-code').click(function() {
      var vk_t_raw = input.val();
      _this.root_view.RPCLegacy('vkSessCode', vk_t_raw);


    });
    this.addWayPoint(input, {
      canUse: function() {

      }
    });
    this.getCustomCon().find('.notify-closer').click(function() {
      _this.RPCLegacy('removeNotifyMark');
    });

    var inpco = this.getCustomCon().find('.js-input-code').click(function() {
      _this.RPCLegacy('waitData');
    });

    if (inpco[0]) {
      this.addWayPoint(inpco);
    }
  }
});


var LfmLoginView = spv.inh(View, {}, {
  'stch-has_session': function(target, state){
    if (!state){
      target.getCustomCon().removeClass("hidden");
    } else {
      target.getCustomCon().addClass("hidden");
    }
  },
  'stch-deep_sandbox': function(target, state){
    target.getCustomCon().toggleClass('deep-sandbox', !!state);
  },
  'stch-data_wait': function(target, state) {
    if (state){
      target.getCustomCon().addClass("waiting-auth");
    } else {
      target.getCustomCon().removeClass("waiting-auth");
    }
  },
  'stch-request_description': function(target, state) {
    target.getCustomCon().find('.lfm-auth-request-desc').text(state || "");
  },
  createBase: function () {
    this.c = this.root_view.getSample('lfm-auth-module');
    this.bindBase();
  },
  bindBase: function() {
    this.auth_block = this.getCustomCon().find(".auth-block");
    var _this = this;
    var auth_link = this.auth_block.find('.lastfm-auth-bp a').click(function(e){
      _this.RPCLegacy('requestAuth');
      e.preventDefault();
    });
    this.addWayPoint(auth_link);
    this.code_input = this.auth_block.find('.lfm-code');
    var use_code_button = this.auth_block.find('.use-lfm-code').click(function(){
      var value = _this.code_input.val();
      if (value){
        _this.RPCLegacy('useCode', value);
      }
      return false;
    });
    this.addWayPoint(use_code_button);
  }
});

var LfmLoveItView = spv.inh(LfmLoginView, {}, {
  "+states": {
    "lo_button_text": [
      "compx",
      ['#locales.addto-lfm-favs']
    ]
  },

  createBase: function() {
    this._super();
    var _this = this;
    var wrap = $('<div class="add-to-lfmfav"></div>');

    this.nloveb = createNiceButton();
    this.nloveb.c.appendTo(wrap);
    this.nloveb.b.click(function(){
      if (_this.nloveb._enabled){
        _this.RPCLegacy('makeLove');
      }
    });
    this.addWayPoint(this.nloveb.b);

    this.getCustomCon().append(wrap);


  },

  'stch-lo_button_text': function(target, state) {
    target.nloveb.b.text(state);
  },

  "stch-has_session": function(target, state) {
    state = !!state;
    target.getCustomCon().toggleClass('has_session', state);
    target.auth_block.toggleClass('hidden', state);
    target.nloveb.toggle(state);
  },

  "stch-wait_love_done": function(target, state){
    target.getCustomCon().toggleClass('wait_love_done', !!state);
  }
});


var LfmScrobbleView = spv.inh(LfmLoginView, {}, {
  createBase: function(){
    this._super();
    this.scrobbling_switchers = this.root_view.getSample('scrobbling-switches').appendTo(this.c);
    this.chbx_enabl = this.scrobbling_switchers.find('.enable-scrobbling');
    this.chbx_disabl = this.scrobbling_switchers.find('.disable-scrobbling');
    var _this = this;


    this.chbx_enabl.click(function() {
      _this.RPCLegacy('setScrobbling', true);
    });
    this.chbx_disabl.click(function() {
      _this.RPCLegacy('setScrobbling', false);
    });
    this.addWayPoint(this.chbx_enabl, {

    });
    this.addWayPoint(this.chbx_disabl, {

    });
  },
  "stch-has_session": function(target, state) {
    state = !!state;
    target.getCustomCon().toggleClass('has_session', state);
    target.auth_block.toggleClass('hidden', state);
    target.chbx_enabl.add(target.chbx_disabl).prop('disabled', !state);
  },
  "stch-scrobbling": function(target, state) {
    target.chbx_enabl.prop('checked', !!state);
    target.chbx_disabl.prop('checked', !state);
  }
});

return {
  LfmLoginView: LfmLoginView,
  LfmScrobbleView: LfmScrobbleView,
  LfmLoveItView: LfmLoveItView,
  VkLoginUI:VkLoginUI,
};
});
