define(['provoda', 'jquery', 'app_serv', './coct'], function(provoda, $, app_serv, coct) {
'use strict';
var localize = app_serv.localize;

var UserAcquaintanceView = function() {};
provoda.View.extendTo(UserAcquaintanceView, {
	createBase: function() {
		this.c = $('<li class="people-list-item"></li>');
		var li = this.c;

		this.userphoto_c = $('<div class="people-image"></div>').appendTo(li);
		this.userphoto_img = $('<img/>').attr('src', 'https://vk.com/images/camera_b.gif').appendTo(this.userphoto_c);
		this.button_place = $('<div class="button-place-people-el"></div>').appendTo(li);
		this.link_place = $('<div class="p-link-place"></div>').appendTo(li);
	},
	'stch-user_photo': function(state) {
		if (state){
			this.userphoto_img.attr('src', state);
		}
	},
	'stch-needs_accept_b': function(state) {
		if (state){
			if (!this.button_c){
				var nb = this.root_view.createNiceButton();
					nb.b.text( localize('accept-inv', 'Accept invite'));
					nb.enable();
				var _this = this;
				nb.b.click(function() {
					_this.RPCLegacy('acceptInvite');
					//_this.RPCLegacy('acceptInvite');
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
				.attr('href', state.href)
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

var UserAcquaintancesListView = function() {};
coct.PageView.extendTo(UserAcquaintancesListView, {
	createBase: function() {
		this._super();

		var fr_so_wrap = $('<div class="relations-invites-wrap"></div>').appendTo(this.c);
		
		$('<h3></h3>')
			.text(localize('rels-people-you'))
			.appendTo(fr_so_wrap);

		this.from_someone_c = $('<ul class="people-list people-l-wide"></ul>').appendTo(fr_so_wrap);

		var fr_me_wrap = $('<div class="relations-likes-wrap"></div>').appendTo(this.c);

		$('<h3></h3>')
			.text(localize('rels-you-people'))
			.appendTo(fr_me_wrap);

		this.from_me_c = $('<ul class="people-list people-l-wide"></ul>').appendTo(fr_me_wrap);
	},
	children_views: {
		acqs_from_someone: {
			main: UserAcquaintanceView
		},
		acqs_from_me: {
			main: UserAcquaintanceView
		}
	},
	'collch-acqs_from_someone': 'from_someone_c',
	'collch-acqs_from_me': 'from_me_c'
});

var UserAcqPreview = function() {};
provoda.View.extendTo(UserAcqPreview, {
	dom_rp: true,
	createBase: function() {
		this.c = $("<span></span>");
		this.userimg = $('<img/>').attr('src', 'https://vk.com/images/camera_b.gif').appendTo(this.c);
		this.dom_related_props.push('userimg');

	},
	'stch-user_photo': function(state) {
		if (state){
			this.userimg.attr('src', state);
		}
	}
});
var UserAcquaintancesListPreview = function() {};
provoda.View.extendTo(UserAcquaintancesListPreview, {
	dom_rp: true,
	createBase: function() {
		this.c = $('<div class="user_acqes-preview"></div>');
		this.sended_tome_c = $('<span></span>').appendTo(this.c);

		var _this = this;

		this.c.click(function() {
			//_this.RPCLegacy('requestPage');
			_this.RPCLegacy('requestPage');
		});

		this.acqs_frsmone_c = $('<span></span>').appendTo(this.c);
		this.acqs_frme_c = $('<span></span>').appendTo(this.c);
		this.dom_related_props.push('sended_tome_c', 'acqs_frsmone_c', 'acqs_frme_c');
	},
	children_views: {
		acqs_from_someone: {
			main: UserAcqPreview
		},
		acqs_from_me: {
			main: UserAcqPreview
		}
	},
	'collch-acqs_from_someone': 'acqs_frsmone_c',
	'collch-acqs_from_me': 'acqs_frme_c'

});


return {
	UserAcquaintanceView:UserAcquaintanceView,
	UserAcquaintancesListView:UserAcquaintancesListView,
	UserAcqPreview:UserAcqPreview,
	UserAcquaintancesListPreview:UserAcquaintancesListPreview
};

});