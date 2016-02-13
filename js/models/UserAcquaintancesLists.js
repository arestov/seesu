define(['pv', 'app_serv', 'spv', 'js/libs/BrowseMap'], function(pv, app_serv, spv, BrowseMap){
"use strict";
var pvUpdate = pv.update;
var localize = app_serv.localize;
var UserAcquaintance = spv.inh(pv.Model, {
		init: function(target, opts, params) {
		target.sender = params.sender;
		target.user_photo = params.user_photo;
		target.receiver = params.sender;
		//target.current_user = params.current_user;
		target.remainded_date = params.remainded_date;
		pvUpdate(target, 'remainded_date', params.remainded_date);
		target.accepted = params.accepted;
		pvUpdate(target, 'user_info', params.info);
		pvUpdate(target, 'user_photo', params.user_photo);

		target.current_user_is_sender = params.current_user_is_sender;

		pvUpdate(target, 'current_user_is_sender', params.current_user_is_sender);
		pvUpdate(target, 'accepted', params.accepted);
	}
}, {
	complex_states: {
		userlink: {
			depends_on: ['accepted', 'user_info'],
			fn: function(accepted, user_info) {
				if (accepted){
					if (user_info && user_info.full_name && (user_info.domain || user_info.uid)){
						return {
							href: '#/users/vk:' + user_info.uid,
							text: user_info.full_name
						};
					}
				}
			}
		},
		after_accept_desc: {
			depends_on: ['accepted', 'remainded_date', 'userlink'],
			fn: function(accepted, remainded_date, userlink) {
				if (accepted && !userlink){
					return app_serv.getRemainTimeText(remainded_date, true);
				}

			}
		},
		needs_accept_b: {
			depends_on: ['accepted', 'current_user_is_sender'],
			fn: function(accepted, current_user_is_sender) {
				if (!accepted && !current_user_is_sender){
					return true;
				}
			}
		}
	},
	/*
	return ;
} else {
	return localize('if-you-accept-one-i') + ' ' + localize('will-get-link');
	*/
	acceptInvite: function() {
		var _this = this;
		var su = this.app;
		su.s.api('relations.acceptInvite', {from: this.sender}, function(r){
			if (r.done){
				pvUpdate(_this, 'remainded_date', r.done.est);
				pvUpdate(_this, 'accepted', true);
				su.trackEvent('people likes', 'accepted', false, 5);

				if (new Date(r.done.est) < new Date()){
					su.s.susd.ri.getData();
					//checkRelationsInvites();
				}
			}
		});
	}
});

var UserAcquaintancesLists = spv.inh(BrowseMap.Model, {
	init: function(target) {
		target.wch(target.app, 'su_userid', 'current_user');
		target.app.on('state_change-su_server_api', function(e) {
			if (e.value){
				target.bindDataSteams();
			}
		});
	}
}, {
	model_name: 'user_acqs_list',

	'compx-wait_me_desc': {
		depends_on: ['@every:accepted:acqs_from_someone'],
		fn: function(not_wait_me) {
			if (!not_wait_me){
				return localize('if-you-accept-one-i') + ' ' + localize('will-get-link');
			}
		}
	},
	'compx-wait_someone_desc': {
		depends_on: ['@every:accepted:acqs_from_me'],
		fn: function(not_wait_someone) {
			if (!not_wait_someone){
				return localize('if-one-accept-i') + ' ' + localize('will-get-link');
			}

		}
	},
	bindDataSteams: function() {
		if (this.data_st_binded){
			return;
		}
		this.data_st_binded = true;
		var _this = this;
		this.app.s.susd.rl.regCallback('user_acqes', function(r){
			_this.replaceChildrenArray('acqs_from_me', r.done);
		});
		this.app.s.susd.ri.regCallback('user_acqes', function(r){
			_this.replaceChildrenArray('acqs_from_someone', r.done);
		});
	},
	replaceChildrenArray: function(array_name, new_array) {
		if (!this.state('current_user')){
			throw new Error('there is no current_user!');
		}


		var filtered = spv.filter(new_array, 'item.accepted', function(v){
			return !!v;
		});

		var concated = [].concat(filtered, filtered.not);



		for (var i = 0; i < concated.length; i++) {
			var cur = concated[i];
			var user_acq = this.initSi(UserAcquaintance, {
				current_user_is_sender: this.state('current_user') == cur.item.from,
				sender: cur.item.from,
				receiver: cur.item.to,
				sended_date: cur.item.ts,
				accepted_date: cur.item.ats,
				remainded_date: cur.item.est,
				accepted: cur.item.accepted,
				info: cur.info,
				user_photo: cur.info && cur.info.photo
			});

			concated[i] = user_acq;
		}
		this.removeChildren(array_name);

		pv.updateNesting(this, array_name, concated);

	},
	removeChildren: function(array_name) {
		var array = this.getNesting(array_name) || [];
		for (var i = 0; i < array.length; i++) {
			array[i].die();
		}
	}
});
return UserAcquaintancesLists;
});
