var UserAcquaintanceView = function() {};
provoda.View.extendTo(UserAcquaintanceView, {
	createBase: function() {
		this.c = $('<li class="people-list-item"></li>');
		var li = this.c;

		this.userphoto_c = $('<div class="people-image"></div>').appendTo(li);
		this.userphoto_img = $('<img/>').attr('src', 'http://vk.com/images/camera_b.gif').appendTo(img_c);
		this.button_place = $('<div class="button-place-people-el"></div>').appendTo(li);
		this.link_place = $('<div class="p-link-place"></div>').appendTo(li);
	},
	'stch-needs_accept_b': function(state) {
		if (state){
			if (!this.button_c){
				var nb = this.root_view.createNiceButton();
					nb.b.text( localize('accept-inv', 'Accept invite'));
					nb.enable();
				var _this = this;
				nb.b.click(function() {
					_this.acceptInvite();
				});
				this.button_c = nb.c;
				nb.c.appendTo(this.button_place);
			}
			
		} else {
			if (this.button_c){
				this.button_c.remove();
			}
		}
	},
	'stch-userlink': function(state) {
		if (state){
			if (!this.ulink){
				this.ulink = $('<a class="external"></a>').appendTo(this.link_place);
			}
			this.ulink
				.attr('href', state.link)
				.text(state.text);
		} else {
			if (this.ulink){
				this.ulink.remove();
			}
		}
	},
	'stch-after_accept_desc': function(state) {
		if (state){
			if (!this.af_ac_desc){
				this.af_ac_desc = $('<span class="desc"></span>').appendTo(this.link_place);
			}
			this.af_ac_desc.text(state);
		} else {
			if (this.af_ac_desc){
				this.af_ac_desc.remove();
			}
		}
		
	}
});