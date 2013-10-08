define(['provoda', 'spv', 'app_serv', 'hex_md5'], function(provoda, spv, app_serv, hex_md5) {
"use strict";
var localize = app_serv.localize;



var LfmLogin = function() {};

provoda.Model.extendTo(LfmLogin, {
	model_name: 'auth_block_lfm',
	init: function(opts, params) {
		this._super();

		var _this = this;
		this.auth = opts.auth;
		this.pmd = opts.pmd;

		if (params && params.desc){
			this.setRequestDesc(params.desc);
		} else {
			this.setRequestDesc(localize('to-get-access'));
		}

		if (this.auth.deep_sanbdox){
			_this.updateState('deep-sandbox', true);
		}
		if (this.auth.has_session){
			this.triggerSession();
		}
		this.auth.once('session', function(){
			_this.triggerSession();
		});
		if (this.auth && this.auth.data_wait){
			this.waitData();
		} else {
			this.auth.on('data_wait', function(){
				_this.waitData();
			});
		}
		return this;
	},
	triggerSession: function() {
		this.updateState('has_session', true);
		
	},
	waitData: function() {
		this.updateState('data_wait', true);
	},
	notWaitData: function() {
		this.updateState('data_wait', false);
	},
	setRequestDesc: function(text) {
		this.updateState('request_description', text ? text + " " + localize("lfm-auth-invitation") : "");
	},
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
		this.updateState('active', !this.state('active'));
	}
});





var LfmScrobble = function(auth){
	this.init(auth);
};
LfmLogin.extendTo(LfmScrobble, {
	init: function(opts){
		this._super(opts);

		var _this = this;

		var setScrobbling = function(state) {
			_this.updateState('scrobbling', state);
		};
		if (su.settings['lfm-scrobbling']){
			setScrobbling(true);
		}
		su.on('settings.lfm-scrobbling', setScrobbling);


	
		this.setRequestDesc(localize('lastfm-scrobble-access'));
		this.updateState('active', true);
	},
	beforeRequest: function() {
		this.bindAuthCallback();
	},
	bindAuthCallback: function(){
		var _this = this;
		this.auth.once("session.input_click", function() {
			su.setSetting('lfm-scrobbling', true);
			//_this.auth.setScrobbling(true);
		}, {exlusive: true});
	},
	setScrobbling: function(state) {
		this.updateState('scrobbling', state);
		su.setSetting('lfm-scrobbling', state);
		//this.auth.setScrobbling(state);
	}
});




var LfmAuth = function(lfm, opts) {
	this.api = lfm;
	this.opts = opts || {};
	if (this.opts){
		this.init(this.opts);
	}
};
provoda.Eventor.extendTo(LfmAuth, {
	init: function(opts) {
		this._super();
		if (this.api.sk){
			this.has_session = true;
		}
	},
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
