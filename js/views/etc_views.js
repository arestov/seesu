define(['provoda', 'app_serv', 'jquery'], function(provoda, app_serv, $) {
"use strict";
var localize = app_serv.localize;
var contextRow = function(container){
	this.m = {
		c: container.addClass('hidden'),
		active: false
	};
	this.arrow = container.children('.rc-arrow');
	this.parts = {};
	
};
contextRow.prototype = {
	getC: function(){
		return this.m.c;
	},
	addPart: function(cpart, name){
		if (name){
			this.parts[name] = {
				c: cpart.addClass('hidden'),
				d:{},
				active: false
			};
		}
		
	},
	C: function(name){
		return this.parts[name] && this.parts[name].c;
	},
	D: function(name, key, value){
		if (name && this.parts[name]){
			if (typeof value != 'undefined' && key){
				return this.parts[name].d[key] = value;
			} else if (key){
				return this.parts[name].d[key];
			}
		}
		
	},
	isActive: function(name){
		return !!this.parts[name].active;
	},
	showPart: function(name, posFn){
		

		if (!this.parts[name].active){

			this.hide(true);
		
		
			this.parts[name].c.removeClass('hidden');
			this.parts[name].active = true;
			
			
			if (!this.m.active){
				this.m.c.removeClass('hidden');
				this.m.active = true;
			}
			
		}
		if (posFn){
			//used for positioning
			this.arrow.removeClass('hidden');
			var pos = posFn();
			var arrow_papos = this.arrow.offsetParent().offset();

			//.removeClass('hidden');
			this.arrow.css('left', ((pos.left + pos.owidth/2) - arrow_papos.left) + 'px');
			
		}
		
	},
	hide: function(not_itself, skip_arrow){
		if (!not_itself){
			if (this.m.active){
				this.m.c.addClass('hidden');
				this.m.active = false;
			}
			
		}
		
		for (var a in this.parts){
			if (this.parts[a].active){
				this.parts[a].c.addClass('hidden');
				this.parts[a].active = false;
			}
			
		}
		if (!skip_arrow){
			this.arrow.addClass('hidden');
		}
		
		
		
	}
};


var AuthBlockView = function() {};
provoda.View.extendTo(AuthBlockView, {

});

var VkLoginUI = function() {};

provoda.View.extendTo(VkLoginUI, {
	state_change: {
		'data_wait': function(state) {
			if (state){
				this.c.addClass("waiting-auth");
			} else {
				this.c.removeClass("waiting-auth");
			}
		},
		"request_description": function(state) {
			this.login_desc.text(state || "");
		},
		'deep_sandbox': function(state) {
			this.c.toggleClass('deep-sandbox', !!state);
		}
	},

	'stch-has_notify_closer': function(state) {
		this.c.toggleClass('has_notify_closer', !!state);
	},
	'stch-notify_readed': function(state) {
		this.c.toggleClass('notf-readed', !!state);
	},
	'stch-has_session': function(state){
		if (!state){
			this.c.removeClass("hidden");
		} else {
			this.c.addClass("hidden");
		}
	},
	createBase: function() {
		this.c = this.root_view.getSample('vklc');
		var _this = this;
		var sign_link = this.c.find('.sign-in-to-vk').click(function(e){
			_this.RPCLegacy('requestAuth');
			e.preventDefault();
		});
		this.login_desc = this.c.find('.login-request-desc');
		this.addWayPoint(sign_link, {
			canUse: function() {

			}
		});
		var input = this.c.find('.vk-code');
		this.c.find('.use-vk-code').click(function() {
			var vk_t_raw = input.val();
			_this.root_view.RPCLegacy('vkSessCode', vk_t_raw);
			
			
		});
		this.addWayPoint(input, {
			canUse: function() {

			}
		});
		this.c.find('.notify-closer').click(function() {
			_this.RPCLegacy('removeNotifyMark');
		});

		var inpco = this.c.find('.js-input-code').click(function() {
			_this.RPCLegacy('waitData');
		});
		
		if (inpco[0]) {
			this.addWayPoint(inpco);
		}
	}
});


var LfmLoginView = function() {};

provoda.View.extendTo(LfmLoginView, {
	'stch-has_session': function(state){
		if (!state){
			this.c.removeClass("hidden");
		} else {
			this.c.addClass("hidden");
		}
	},
	'stch-deep_sandbox': function(state){
		this.c.toggleClass('deep-sandbox', !!state);
	},
	'stch-data_wait': function(state) {
		if (state){
			this.c.addClass("waiting-auth");
		} else {
			this.c.removeClass("waiting-auth");
		}
	},
	'stch-request_description': function(state) {
		this.c.find('.lfm-auth-request-desc').text(state || "");
	},
	createBase: function() {
		this.c = this.root_view.getSample('lfm_authsampl');
		this.auth_block = this.c.children(".auth-block");
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

var LfmLoveItView = function() {};
LfmLoginView.extendTo(LfmLoveItView, {
	createBase: function() {
		this._super();
		var _this = this;
		var wrap = $('<div class="add-to-lfmfav"></div>');

		this.nloveb = this.root_view.createNiceButton();
		this.nloveb.c.appendTo(wrap);
		this.nloveb.b.click(function(){
			if (_this.nloveb._enabled){
				_this.RPCLegacy('makeLove');
			}
		});
		this.addWayPoint(this.nloveb.b);
		this.nloveb.b.text(localize('addto-lfm-favs'));
		this.c.append(wrap);
		
	
	},
	"stch-has_session": function(state) {
		state = !!state;
		this.c.toggleClass('has_session', state);
		this.auth_block.toggleClass('hidden', state);
		this.nloveb.toggle(state);
	},
	"stch-wait_love_done": function(state){
		this.c.toggleClass('wait_love_done', !!state);
	}
});


var LfmScrobbleView = function(){};
LfmLoginView.extendTo(LfmScrobbleView, {
	createBase: function(){
		this._super();
		this.scrobbling_switchers = this.root_view.getSample('lfm_scrobling').appendTo(this.c);
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
	"stch-has_session": function(state) {
		state = !!state;
		this.c.toggleClass('has_session', state);
		this.auth_block.toggleClass('hidden', state);
		this.chbx_enabl.add(this.chbx_disabl).prop('disabled', !state);
	},
	"stch-scrobbling": function(state) {
		this.chbx_enabl.prop('checked', !!state);
		this.chbx_disabl.prop('checked', !state);
	}
});



var ActionsRowUI = function(){};
provoda.View.extendTo(ActionsRowUI, {
	bindBase: function() {
	},
	getCurrentButton: function() {
		var active_part = this.state('active_part');
		if (active_part){
			return this.tpl.ancs['bt' + active_part];
		}
	},
	getArPaOffset: function() {
		return this.tpl.ancs['arrow'].offsetParent().offset();
	},
	getCurrentButtonOWidth: function() {
		var current_button = this.getCurrentButton();
		return current_button.outerWidth();
	},
	getCurrentButtonOffset: function() {
		var current_button = this.getCurrentButton();
		return current_button.offset();
	},
	
	'compx-key-button_owidth': [
		['#workarea_width', 'active_part'],
		function(workarea_width, active_part) {
			if (workarea_width && active_part){
				//ширина кнопки, зависит типа вьюхи и активной части
				return this.getBoxDemensionKey('button_owidth', active_part);
			}
		}
	],
	'compx-key-button_offset': [
		['#workarea_width', 'active_part'],
		function(workarea_width, active_part) {
			if (workarea_width && active_part){
				//расположение кнопки, зависит от ширины окна и названия части
				return this.getBoxDemensionKey('button_offset', workarea_width, active_part);
			}
		}
	],
	'compx-key-arrow_parent_offset': [
		['#workarea_width', 'active_part'],
		function(workarea_width, active_part) {
			if (workarea_width && active_part){
				//расположенние позиционного родителя стрелки, зависит от ширины окна
				return this.getBoxDemensionKey('arrow_parent_offset', workarea_width);
			}
		}
	],
	'stch-key-button_owidth': function(state) {
		if (state) {
			this.updateState('button_owidth', this.getBoxDemensionByKey(this.getCurrentButtonOWidth, state));
		}
	},
	'stch-key-button_offset': function(state) {
		if (state) {
			this.updateState('button_offset', this.getBoxDemensionByKey(this.getCurrentButtonOffset, state));
		}
	},
	'stch-key-arrow_parent_offset': function(state) {
		if (state) {
			this.updateState('arrow_parent_offset', this.getBoxDemensionByKey(this.getArPaOffset, state));
		}
	},
	'compx-arrow_pos':{
		depends_on: ['button_owidth', 'button_offset', 'arrow_parent_offset'],
		fn: function(button_width, button_offset, parent_offset) {
			if (button_offset && parent_offset){
				return ((button_offset.left + button_width/2) - parent_offset.left) + 'px';
			}
		}
	}
});




return {
	LfmLoginView: LfmLoginView,
	LfmScrobbleView: LfmScrobbleView,
	LfmLoveItView: LfmLoveItView,
	VkLoginUI:VkLoginUI,
	contextRow: contextRow,
	ActionsRowUI:ActionsRowUI
};
});