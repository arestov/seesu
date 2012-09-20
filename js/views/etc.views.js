var vkLoginUI = function() {};

provoda.View.extendTo(vkLoginUI, {
	createDetailes: function(){
		this.createBase();
	},
	state_change: {
		wait: function(state) {
			if (state){
				this.c.addClass("waiting-vk-login");
			} else {
				this.c.removeClass("waiting-vk-login");
			}
		},
		"request-description": function(state) {
			this.c.find('.login-request-desc').text(state || "");
		}
	},
	createBase: function() {
		this.c = app_view.samples.vklc.clone();
		var _this = this;
		this.c.find('.sign-in-to-vk').click(function(e){
			_this.md.requestAuth();
			e.preventDefault();
		});

	}
});
var LfmLoginView = function() {};

provoda.View.extendTo(LfmLoginView, {
	createDetailes: function(){
		this.createBase();
	},
	'stch-active': function(state){
		if (state){
			this.c.removeClass("hidden");
		} else {
			this.c.addClass("hidden");
		}
	},
	'stch-deep-sanbdox': function(state){
		if (state){
			this.c.addClass("deep-sandbox");
		} else {
			this.c.removeClass("deep-sandbox");
		}
	},
	'stch-wait': function(state) {
		if (state){
			this.c.addClass("waiting-lfm-auth");
		} else {
			this.c.removeClass("waiting-lfm-auth");
		}
	},
	'stch-request-description': function(state) {
		this.c.find('.lfm-auth-request-desc').text(state || "");
	},
	createBase: function() {
		this.c = app_view.samples.lfm_authsampl.clone();
		this.auth_block = this.c.children(".auth-block");
		var _this = this;
		this.auth_block.find('.lastfm-auth-bp a').click(function(e){
			_this.md.requestAuth();
			e.preventDefault();
		});
		this.code_input = this.auth_block.find('.lfm-code');
		this.auth_block.find('.use-lfm-code').click(function(){
			var value = _this.code_input.val();
			if (value){
				_this.md.useCode(value)
			}
			return false;
		});
	}
});

var LfmLoveItView = function() {};
LfmLoginView.extendTo(LfmLoveItView, {
	createBase: function() {
		this._super();
		var _this = this;
		var wrap = $('<div class="add-to-lfmfav"></div>');

		this.nloveb = app_view.createNiceButton();
		this.nloveb.c.appendTo(wrap);
		this.nloveb.b.click(function(){
			if (_this.nloveb._enabled){
				_this.md.makeLove();
			}
		});
		this.nloveb.b.text(localize('addto-lfm-favs'));
		this.c.append(wrap);
		
	
	},
	"stch-has-session": function(state) {
		state = !!state;
		this.c.toggleClass('has-session', state);
		this.auth_block.toggleClass('hidden', state);
		this.nloveb.toggle(state);
	},
	"stch-wait-love-done": function(state){
		this.c.toggleClass('wait-love-done', !!state);
	}
});


var LfmScrobbleView = function(){};
LfmLoginView.extendTo(LfmScrobbleView, {
	createBase: function(){
		this._super();
		this.scrobbling_switchers = app_view.samples.lfm_scrobling.clone().appendTo(this.c);
		this.chbx_enabl = this.scrobbling_switchers.find('.enable-scrobbling');
		this.chbx_disabl = this.scrobbling_switchers.find('.disable-scrobbling');
		var _this = this;
		this.chbx_enabl.click(function() {
			_this.md.setScrobbling(true);
		});
		this.chbx_disabl.click(function() {
			_this.md.setScrobbling(false);
		});
	},
	"stch-has-session": function(state) {
		if (state){
			this.c.addClass('has-session');
			this.auth_block.addClass('hidden');
			this.chbx_enabl.add(this.chbx_disabl).removeProp('disabled');
		} else {
			this.c.removeClass('has-session');
			this.auth_block.removeClass('hidden');
			this.chbx_enabl.add(this.chbx_disabl).prop('disabled', true);
		}
	},
	"stch-scrobbling": function(state) {
		this.chbx_enabl.prop('checked', !!state);
		this.chbx_disabl.prop('checked', !state);
	}
});