define(['pv', 'app_serv', 'spv', 'js/libs/BrowseMap'], function(pv, app_serv, spv, BrowseMap){
"use strict";
var localize = app_serv.localize;
var UserAcquaintance = function() {};
pv.Model.extendTo(UserAcquaintance, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.sender = params.sender;
		this.user_photo = params.user_photo;
		this.receiver = params.sender;
		//this.current_user = params.current_user;
		this.remainded_date = params.remainded_date;
		pv.update(this, 'remainded_date', params.remainded_date);
		this.accepted = params.accepted;
		pv.update(this, 'user_info', params.info);
		pv.update(this, 'user_photo', params.user_photo);

		this.current_user_is_sender = params.current_user_is_sender;

		pv.update(this, 'current_user_is_sender', params.current_user_is_sender);
		pv.update(this, 'accepted', params.accepted);
	//	this.update

		//accept_button

		//need_accept b
		//after_request_desc
		//after_accept_desc

		//localize('if-one-accept-i') + ' ' + localize('will-get-link')
		//localize('if-you-accept-one-i') + ' ' + localize('will-get-link')
	},
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
				pv.update(_this, 'remainded_date', r.done.est);
				pv.update(_this, 'accepted', true);
				su.trackEvent('people likes', 'accepted', false, 5);

				if (new Date(r.done.est) < new Date()){
					su.s.susd.ri.getData();
					//checkRelationsInvites();
				}
			}
		});
	}
});

var UserAcquaintancesLists = function() {};
BrowseMap.Model.extendTo(UserAcquaintancesLists, {
	model_name: 'user_acqs_list',
	init: function() {
		this._super.apply(this, arguments);
		var _this = this;

		this.wch(this.app, 'su_userid', 'current_user');

		var su = this.app;

		su.on('state_change-su_server_api', function(e) {
			if (e.value){
				_this.bindDataSteams();
			}
		});

		this.initStates();

	},
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
			var user_acq = new UserAcquaintance();

			user_acq.init({
				app: this.app
			}, {
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
