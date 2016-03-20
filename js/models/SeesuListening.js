define(['pv', './comd', 'app_serv'], function(pv, comd, app_serv) {
'use strict';
var pvUpdate = pv.update;

var auth = pv.behavior({
	'compx-access_desc': [['#locales.to-meet-man-vk-short']],
	beforeRequest: function() {
		var auth = this.getNesting('auth');
		pvUpdate(auth, 'requested_by', this._provoda_id);
	},
	'compx-active': [
		['has_session', '@one:requested_by:auth'],
		function(has_session, requested_by) {
			return has_session && requested_by == this._provoda_id;
		}
	]
}, comd.VkLoginB, function SeesuListeningVkAuth () {});

// 1 есть вк авторизация
// 2 есть фотка


return pv.behavior({
	'nest-user': ['#users/su:[:user]'],
	'compx-is_current_user': [
		['#su_userid', 'user'],
		function(current_user, user) {
			return current_user == user;
		}
	],
	pmd_switch_is_parent: true,
	'compx-rel': [
		['#relations_likes', '#relations_invites', 'user'],
		function(likes, invites, user) {
			if (!user) {return;}

			var like = likes && likes[user] && likes[user][0];
			var invite = invites && invites[user] && invites[user][0];
			return like || invite;
		}
	],
	'compx-remain_time_desc': [
		['rel', 'just_accepted_est'],
		function(rel, just_accepted_est) {
			var est = just_accepted_est || (rel && rel.item.est);
			if (!est) {return;}

			return app_serv.getRemainTimeText(est, true);
		}
	],

	'nest-auth_part': [auth, true, 'pmd_vswitched'],
	'compx-current_user': [[ '#vk_userid']],
	'compx-has_vk_auth': [['@one:has_session:auth_part']],
	'compx-current_user_has_photo': [
		['current_su_user_info'],
		function(info) {
			return info && info.photo_big;
		}
	],
	'compx-current_su_user_info': [['#current_su_user_info']],
	setLike: function() {
		var target = this;

		pvUpdate(target, 'sending_like', true);

		var req = this.api('relations.setLike', {to: this.state('user')});

		req.then(function(resp) {
			if (!resp.done) {return;}
			pvUpdate(target, 'like_just_sended', true);
		});

		var anyway = function() {
			pvUpdate(target, 'sending_like', false);
		};
		req.then(anyway, anyway);
		return req;
	},
	acceptInvite: function() {
		var target = this;

		pvUpdate(target, 'sending_accept', true);

		var req = this.api('relations.acceptInvite', {from: this.state('user')});
		req.then(function(resp) {
			if (!resp.done) {return;}
			pvUpdate(target, 'invite_accepted', true);
			pvUpdate(target, 'just_accepted_est', resp.done.est);
		});
		var anyway = function() {
			pvUpdate(target, 'sending_accept', false);
		};
		req.then(anyway, anyway);
		return req;
	}
}, pv.HModel, function SeesuListening(){});
});
