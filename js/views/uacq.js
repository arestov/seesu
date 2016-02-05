define(['pv', 'jquery', 'app_serv', './coct', 'spv'], function(pv, $, app_serv, coct, spv) {
'use strict';
var View = pv.View;
var localize = app_serv.localize;

var UserAcquaintanceView = spv.inh(View, {}, {
	createBase: function() {
		this.c = $('<li class="people-list-item"></li>');
		var li = this.c;

		this.userphoto_c = $('<div class="people-image"></div>').appendTo(li);
		this.userphoto_img = $('<img/>').attr('src', 'https://vk.com/images/camera_b.gif').appendTo(this.userphoto_c);
		this.button_place = $('<div class="button-place-people-el"></div>').appendTo(li);
		this.link_place = $('<div class="p-link-place"></div>').appendTo(li);
	},
	'stch-user_photo': function(target, state) {
		if (state){
			target.userphoto_img.attr('src', state);
		}
	},
	'stch-needs_accept_b': function(target, state) {
		if (state){
			if (!target.button_c){
				var nb = target.root_view.createNiceButton();
					nb.b.text( localize('accept-inv', 'Accept invite'));
					nb.enable();
				nb.b.click(function() {
					target.RPCLegacy('acceptInvite');
				});
				target.button_c = nb.c;
				nb.c.appendTo(target.button_place);
			}

		} else {
			if (target.button_c){
				target.button_c.remove();
			}
		}
	},

	'stch-userlink': function(target, state) {
		if (state){
			if (!target.ulink){
				target.ulink = $('<a class=""></a>').appendTo(target.link_place);
			}
			target.ulink
				.attr('href', state.href)
				.text(state.text);
		} else {
			if (target.ulink){
				target.ulink.remove();
			}
		}
	},
	'stch-after_accept_desc': function(target, state) {
		if (state){
			if (!target.af_ac_desc){
				target.af_ac_desc = $('<span class="desc"></span>').appendTo(target.link_place);
			}
			target.af_ac_desc.text(state);
		} else {
			if (target.af_ac_desc){
				target.af_ac_desc.remove();
			}
		}

	}
});

var UserAcquaintancesListView = spv.inh(coct.PageView, {}, {
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

var UserAcqPreview = spv.inh(View, {}, {
	dom_rp: true,
	createBase: function() {
		this.c = $("<span></span>");
		this.userimg = $('<img/>').attr('src', 'https://vk.com/images/camera_b.gif').appendTo(this.c);
		this.dom_related_props.push('userimg');

	},
	'stch-user_photo': function(target, state) {
		if (state){
			target.userimg.attr('src', state);
		}
	}
});
var UserAcquaintancesListPreview = spv.inh(View, {}, {
	dom_rp: true,
	createBase: function() {
		this.c = $('<div class="user_acqes-preview"></div>');
		this.sended_tome_c = $('<span></span>').appendTo(this.c);

		var _this = this;

		this.c.click(function() {
			_this.requestPage();
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
