define(['pv', 'spv', 'app_serv', 'hex_md5'], function(pv, spv, app_serv, hex_md5) {
"use strict";
var localize = app_serv.localize;
var pvUpdate = pv.update;


var LfmLogin = spv.inh(pv.Model, {
	init: function(target) {
		target.auth = target.app.auths.lfm;

		target.updateNesting('auth', target.auth);

		if (target.auth.deep_sanbdox){
			pvUpdate(target, 'deep_sandbox', true);
		}

		if (target.auth && target.auth.data_wait){
			target.waitData();
		} else {
			target.auth.on('data_wait', function(){
				target.waitData();
			});
		}
		return target;
	}
}, {
	model_name: 'auth_block_lfm',
	'compx-has_session': [[
		'@one:session:auth'
	]],
	triggerSession: function() {
		pvUpdate(this, 'has_session', true);
	},
	waitData: function() {
		pvUpdate(this, 'data_wait', true);
	},
	notWaitData: function() {
		pvUpdate(this, 'data_wait', false);
	},
	'compx-access_desc': [['#locales.to-get-access']],
	'compx-request_description': [
		['access_desc', '#locales.lfm-auth-invitation'],
		function(text, invite) {
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
		target.wch(target.app, 'settings-lfm-scrobbling', 'scrobbling');
		pvUpdate(target, 'active', true);
	}
}, {
	'compx-access_desc': [['#locales.lastfm-scrobble-access']],
	beforeRequest: function() {
		this.bindAuthCallback();
	},
	bindAuthCallback: function(){
		var _this = this;
		this.auth.once("session.input_click", function() {
			_this.app.setSetting('lfm-scrobbling', true);
			//_this.auth.setScrobbling(true);
		}, {exlusive: true});
	},
	setScrobbling: function(state) {
		pvUpdate(this, 'scrobbling', state);
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
	},
}, {

	requestAuth: function(p){

		this.authInit(p || {});
		return;
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
	waitData: function() {
		this.trigger('data_wait');
		this.data_wait = true;
	},
	createAuthFrame: function(first_key){
		if (this.lfm_auth_inited){
			return false;
		}
		var _this = this;
		var i = this.auth_frame = document.createElement('iframe');
		spv.addEvent(window, 'message', function(e){
			var iframe_win = _this.auth_frame && _this.auth_frame.contentWindow;
			if (e.source != iframe_win) {
				return;
			}
			if (e.data == 'lastfm_bridge_ready:'){
				e.source.postMessage("add_keys:" + first_key, '*');
			} else if(e.data.indexOf('lastfm_token:') === 0){
				_this.setToken(e.data.replace('lastfm_token:',''));
				console.log('got token!!!!');
				console.log(e.data.replace('lastfm_token:',''));
			}
		});
		i.className = 'serv-container';
		i.src = this.opts.bridge_url;
		document.body.appendChild(i);
		this.lfm_auth_inited = true;
	},
	setAuthBridgeKey: function(key){
		if (!this.lfm_auth_inited){
			this.createAuthFrame(key);
		} else{
			this.auth_frame.contentWindow.postMessage("add_keys:" + key, '*');
		}
	},
	authInit: function(p){


		//init_auth_data.bridgekey

		var init_auth_data = this.getInitAuthData();
		if (init_auth_data.bridgekey){
			this.setAuthBridgeKey(init_auth_data.bridgekey);
		}
		if (!p.not_open){
			this.trigger('want-open-url', init_auth_data.link, init_auth_data);
			this.waitData();
		}


		return;

	},
	setToken: function(token){
		this.newtoken = token;
		this.try_to_login();
	},
	get_lfm_token: function(){
		var _this = this;
		this.api.get('auth.getToken', false, {nocache: true})
			.done(function(r){
				_this.newtoken = r.token;
			});
	},
	try_to_login: function(callback){
		var _this = this;
		if (_this.newtoken ){
			_this.api.get('auth.getSession', {'token':_this.newtoken })
				.done(function(r){
					if (!r.error) {
						_this.login(r,callback);
						pvUpdate(_this, 'session', true);
						_this.trigger("session");

						_this.has_session = true;
						_this.trigger('api-full-ready');




						console.log('lfm scrobble access granted');
					} else{
						console.log('error while granting lfm scrobble access');
					}

				});
		}
	}
});

LfmAuth.LfmLogin =LfmLogin;
LfmAuth.LfmScrobble =LfmScrobble;

return LfmAuth;
});
