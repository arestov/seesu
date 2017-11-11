define(function(require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var hex_md5 = require('hex_md5');

var pvUpdate = pv.update;


var LfmLogin = spv.inh(pv.Model, {
	init: function(target) {
		target.auth = target.app.auths.lfm;

		target.updateNesting('auth', target.auth);

		if (target.auth.deep_sanbdox){
			pvUpdate(target, 'deep_sandbox', true);
		}

		return target;
	}
}, {
	model_name: 'auth_block_lfm',
	'compx-has_session': [[
		'@one:session:auth'
	]],
	'compx-data_wait':[['@one:data_wait:auth']],
	'compx-default_access_desc': [['#locales.to-get-access']],
	'compx-request_description': [
		['access_desc', 'default_access_desc', '#locales.lfm-auth-invitation'],
		function(desc, default_desc, invite) {
			var text = desc || default_desc;
			return text ? text + " " + invite : "";
		}
	],
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
		this.auth.requestAuth(opts);
	},
	switchView: function(){
		pvUpdate(this, 'active', !this.state('active'));
	}
});


var LfmScrobble = spv.inh(LfmLogin, {
	init: function(target){
		pvUpdate(target, 'active', true);
	}
}, {
	'compx-scrobbling':[['#settings-lfm-scrobbling']],
	'compx-access_desc': [['#locales.lastfm-scrobble-access']],
	beforeRequest: function() {
		this.bindAuthCallback();
	},
	act: function () {
		this.app.setSetting('lfm-scrobbling', true);
	},
	bindAuthCallback: function(){
		pvUpdate(this.app, 'lfm_auth_request', this);
	},
	setScrobbling: function(state) {
		this.app.setSetting('lfm-scrobbling', state);
		//this.auth.setScrobbling(state);
	}
});

var LfmAuth = spv.inh(pv.Model, {
	init: function(target, opts, data, params) {
		target.api = data.lfm;
		target.opts = params || {};
		target.has_session = !!target.api.sk;
		target.deep_sanbdox = !!params.deep_sanbdox;

		pvUpdate(target, 'session', !!target.has_session);
		pvUpdate(target, 'bridge_url', params.bridge_url);

	},
}, {

	requestAuth: function() {
		pvUpdate(this, 'requested', Date.now());
	},
	login: function(r, callback){
		this.api.sk = r.session.key;
		this.api.username = r.session.name;
		this.api.stSet('lfm_user_name', r.session.name, true);
		this.api.stSet('lfmsk', this.api.sk, true);
		if (callback){callback();}
	},
	getInitAuthData: function(){
		var o = {};
		o.link = 'http://www.last.fm/api/auth/?api_key=' + this.api.apikey ;
		var link_tag = this.opts.callback_url;
		if (!this.opts.deep_sanbdox){
			o.bridgekey = hex_md5(Math.random() + 'bridgekey'+ Math.random());
			link_tag += '?key=' + o.bridgekey;
		}

		o.link += '&cb=' + encodeURIComponent(link_tag);
		return o;
	},
	'compx-data_wait': [
		['requested_once', 'session'],
		function (once, session) {
			return once && !session;
		}
	],
	'compx-requested_once': [
		['requested_once', 'requested'],
		function (once, req) {
			return Boolean(once || req);
		}
	],
	'stch-requested': function (target, state) {
		if (!state) {
			return;
		}

		target.updateState('auth_data', target.getInitAuthData());
	},
	'compx-bridge_key': [
		['auth_data.bridgekey']
	],
	'api-window': function () {
		return window;
	},
	'api-bridge': [
		'requested_once',
		['window'],
		function (window) {
			return window.document.createElement('iframe');
		}
	],
	'state-token': [
		['window', 'bridge'],
		function (update, win, bridge) {
			return spv.listenEvent(win, 'message', function(e) {
				if (e.source != bridge.contentWindow || !spv.startsWith(e.data, 'lastfm_token:')) {
					return;
				}

				update(e.data.replace('lastfm_token:', ''));
			});
		}
	],
	'state-_bridge_ready': [
		['window', 'bridge'],
		function (update, win, bridge) {
			return spv.listenEvent(win, 'message', function(e) {
				if (e.source != bridge.contentWindow || e.data != 'lastfm_bridge_ready:') {
					return;
				}

				update(true);
			});
		}
	],
	'effect-started_bridge': [
		[
			['bridge', 'window'], 'bridge_url',
			function (bridge, win, bridge_url) {
				bridge.className = 'serv-container';
				bridge.src = bridge_url;
				win.document.body.appendChild(bridge);
			}
		],
		['bridge_url'],
	],
	'effect-prepared_bridge': [
		[
			'bridge', 'bridge_key',
			function (bridge, key) {
				bridge.contentWindow.postMessage("add_keys:" + key, '*');
			}
		],
		[['_bridge_ready', 'bridge_key'], ['started_bridge']]
	],
	'effect-asked_permission': [
		[
			'self', 'auth_data',
			function (self, data) {
				self.trigger('want-open-url', data.link, data.opts);
			}
		],
		['auth_data', 'prepared_bridge']
	],
	'stch-token': function (target, token) {
		target.setToken(token);
	},
	setToken: function(token){
		this.newtoken = token;
		this.try_to_login();
	},
	get_lfm_token: function(){
		var _this = this;
		this.api.get('auth.getToken', false, {nocache: true})
			.then(function(r){
				_this.newtoken = r.token;
			});
	},
	try_to_login: function(callback){
		var _this = this;
		if (!_this.newtoken) {
			return;
		}

		_this.api.get('auth.getSession', {'token':_this.newtoken }).then(function(r) {
			if (r.error) {
				console.log('error while granting lfm scrobble access');
				return;
			}

			_this.login(r,callback);
			pvUpdate(_this, 'session', true);
			_this.trigger("session");

			_this.has_session = true;

			console.log('lfm scrobble access granted');
		});
	}
});

LfmAuth.LfmLogin =LfmLogin;
LfmAuth.LfmScrobble =LfmScrobble;

return LfmAuth;
});
