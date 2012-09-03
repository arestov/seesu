$.extend(lastfm_api.prototype, {
	nowplay: function(omo, duration){
		var _this = this;
		if (!_this.sk){return false}
			_this.post('track.updateNowPlaying', {
				sk: _this.sk,
				artist: omo.artist,
				track: omo.track,
				duration: duration || ""
				
			});
	},
	submit: function(mo, duration, timestamp){
		var _this = this;
		var artist = omo.artist,
			track = omo.track;


		this.music.push({
			'artist': artist, 
			'track': track,
			'duration': duration || "", 
			'timestamp': timestamp
		});
		
		if (this.sk){
			var post_m_obj = {sk: _this.sk};
			for (var i=0,l=_this.music.length; i < l; i++) {
				post_m_obj['artist[' + i + ']'] = _this.music[i].artist;
				post_m_obj['track[' + i + ']'] = _this.music[i].track;
				post_m_obj['timestamp[' + i + ']'] = _this.music[i].timestamp;
				if (_this.music[i].duration){
					post_m_obj['duration[' + i + ']'] = _this.music[i].duration;
				}
			};
			
			
			_this.post('track.scrobble', post_m_obj)
				.done(function(r){
					_this.music = [];
					_this.stSet('lfm_scrobble_music', '');
					
				});
		} else{
			_this.stSet('lfm_scrobble_music', _this.music);
		}
		return timestamp;
		
	}
});
lastfm_api.prototype.initers.push(function(){
	this.music = this.stGet && this.stGet('lfm_scrobble_music') || [];
});

var LfmLoginView = function() {};

provoda.View.extendTo(LfmLoginView, {
	init: function(md) {
		this._super();
		this.md = md;
		this.createBase();
		this.setModel(md);
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
		this.c = su.ui.samples.lfm_authsampl.clone();
		this.auth_block = this.c.children(".auth-block");
		var _this = this;
		this.auth_block.find('.lastfm-auth-button').click(function(e){
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


var LfmLogin = function(auth) {};

provoda.Model.extendTo(LfmLogin, {
	ui_constr: LfmLoginView,
	init: function(auth) {
		this._super();

		var _this = this;
		this.auth = auth;
		if (auth.opts.deep_sanbdox){
			_this.updateState('deep-sanbdox', true);
		}
		if (this.auth.has_session && this.onSession){
			this.onSession();
		}
		this.auth.once('session', function(){
			if (_this.onSession){
				_this.onSession();
			}
		});
		if (this.auth.wait_data){
			this.waitData();
		} else {
			this.auth.on('data-wait', function(){
				_this.waitData();
			})
		}

		
	},
	waitData: function() {
		this.updateState('wait', true);
	},
	notWaitData: function() {
		this.updateState('wait', false);
	},
	setRequestDesc: function(text) {
		this.updateState('request-description', text ? text + " " + localize("lfm-auth-invitation") : "");
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

var LfmCommonLoginView = function(){};
LfmLoginView.extendTo(LfmCommonLoginView, {
	createBase: function(){
		this._super();
		this.un_form = su.ui.samples.lfm_input.clone().appendTo(this.c);
		this.un_input = this.un_form.find('.lfm-username');

		var _this = this;
		this.un_form.on('submit', function(e) {
			_this.md.handleUsername(_this.un_input.val());
			return false;
		});
	},
	'stch-can-fetch-crossdomain': function(state) {
		if (state){
			this.un_form.removeClass('needs-cross-domain');
		} else {
			this.un_form.addClass('needs-cross-domain');
		}
		
	}
});


var LfmReccoms = function(auth){
	this.init(auth);
};
LfmLogin.extendTo(LfmReccoms, {
	init: function(auth){
		this._super(auth);
		this.setRequestDesc(localize('lastfm-reccoms-access'));
	},
	onSession: function(){
		this.updateState('active', false);
	},
	beforeRequest: function() {
		this.bindAuthCallback();
		
	},
	bindAuthCallback: function(){
		this.auth.once("session.input_click", function() {
			render_recommendations();
		}, {exlusive: true});
	},
	handleUsername: function(username) {
		render_recommendations_by_username(username);
	},
	ui_constr: LfmCommonLoginView
});

var LfmLoved = function(auth){
	this.init(auth);
}; 
LfmLogin.extendTo(LfmLoved, {
	init: function(auth){
		this._super(auth);
		this.setRequestDesc(localize('grant-love-lfm-access'));
		this.updateState('can-fetch-crossdomain', true);
	},
	onSession: function(){
		this.updateState('active', false);
	},
	beforeRequest: function() {
		this.bindAuthCallback();
		
	},
	bindAuthCallback: function(){
		this.auth.once("session.input_click", function() {
			render_loved();
		}, {exlusive: true});
	},
	handleUsername: function(username) {
		render_loved(username);
	},
	ui_constr: LfmCommonLoginView
});


var LfmScrobbleView = function(){};
LfmLoginView.extendTo(LfmScrobbleView, {
	createBase: function(){
		this._super();
		this.scrobbling_switchers = su.ui.samples.lfm_scrobling.clone().appendTo(this.c);
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

var LfmScrobble = function(auth){
	this.init(auth);
};
LfmLogin.extendTo(LfmScrobble, {
	init: function(auth){
		this._super(auth);
		if (this.auth.api.scrobbling){
			this.updateState('scrobbling', true);
		}
		var _this = this;
		this.auth.on('scrobbling', function(state) {
			_this.updateState('scrobbling', state);
		});
		this.setRequestDesc(localize('lastfm-scrobble-access'));
		this.updateState('active', true);
	},
	onSession: function(){
		this.updateState('has-session', true);
	},
	beforeRequest: function() {
		this.bindAuthCallback();
	},
	bindAuthCallback: function(){
		var _this = this;
		this.auth.once("session.input_click", function() {
			_this.auth.setScrobbling(true);
		}, {exlusive: true});
	},
	setScrobbling: function(state) {
		this.updateState('scrobbling', state);
		this.auth.setScrobbling(state);
	},
	ui_constr: LfmScrobbleView
});
var LfmLoveItView = function() {};
LfmLoginView.extendTo(LfmLoveItView, {
	createBase: function() {
		this._super();
		var wrap = $('<div class="add-to-lfmfav"></div>');

		this.love_button = $('<button type="button" disabled="disabled" class="lfm-loveit"></button>').text(localize('addto-lfm-favs')).appendTo(wrap);
		this.c.append(wrap);
		var _this = this;
		this.love_button.click(function() {
			_this.md.makeLove();
		});
	},
	"stch-has-session": function(state) {
		state = !!state;
		this.c.toggleClass('has-session', state);
		this.auth_block.toggleClass('hidden', state);
		this.love_button.prop('disabled', !state);
	},
	"stch-wait-love-done": function(state){
		this.c.toggleClass('wait-love-done', !!state);
	}
});


var LfmLoveIt = function(auth, mo) {
	this.init(auth, mo);
};

LfmLogin.extendTo(LfmLoveIt, {
	init: function(auth, mo) {
		this._super(auth);
		this.song = mo;
		this.setRequestDesc(localize('lastfm-loveit-access'));
		this.updateState('active', true);
	},
	onSession: function(){
		this.updateState('has-session', true);
	},
	beforeRequest: function() {
		this.bindAuthCallback();
	},
	bindAuthCallback: function(){
		var _this = this;
		this.auth.once("session.input_click", function() {
			_this.makeLove();
		}, {exlusive: true});
	},
	makeLove: function() {

		if (lfm.sk){
			var _this = this;
			this.updateState('wait-love-done', true);
			lfm.post('Track.love', {
				sk: lfm.sk,
				artist: this.song.artist,
				track: this.song.track
			})
				.always(function(){
					_this.updateState('wait-love-done', false);
					_this.trigger('love-success');
				})
			seesu.trackEvent('song actions', 'love');
		}
		
		
	},
	ui_constr: LfmLoveItView
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
		return 
	},
	login: function(r, callback){
		this.api.sk = r.session.key;
		this.api.user_name = r.session.name;
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
		this.trigger('data-wait');
		this.wait_data = true;
	},
	createAuthFrame: function(first_key){
		if (this.lfm_auth_inited){
			return false;
		}
		var _this = this;
		var i = this.auth_frame = document.createElement('iframe');	
		addEvent(window, 'message', function(e){
			if (e.data == 'lastfm_bridge_ready:'){
				e.source.postMessage("add_keys:" + first_key, '*');
			} else if(e.data.indexOf('lastfm_token:') === 0){
				_this.setToken(e.data.replace('lastfm_token:',''))
				console.log('got token!!!!')
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
			this.createAuthFrame(key)
		} else{
			this.auth_frame.contentWindow.postMessage("add_keys:" + key, '*');
		}
	},
	authInit: function(p){
		
		
		//init_auth_data.bridgekey		
		
		var init_auth_data = this.getInitAuthData();
		if (init_auth_data.bridgekey){
			this.setAuthBridgeKey(init_auth_data.bridgekey)
		} 
		if (!p.not_open){
			this.trigger('want-open-url', init_auth_data.link, init_auth_data);
			this.waitData();
		} 
			
		
		return
		
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
			})
	},
	try_to_login: function(callback){
		var _this = this
		if (_this.newtoken ){
			_this.api.get('auth.getSession', {'token':_this.newtoken })
				.done(function(r){
					if (!r.error) {
						_this.login(r,callback);
						_this.trigger("session");
						_this.has_session = true;


						
						
						console.log('lfm scrobble access granted')
					} else{
						console.log('error while granting lfm scrobble access')
					}
					
				});
		}
	},
	setScrobbling: function(active){
		active = !!active;
		this.api.stSet('lfm_scrobbling_enabled', active || '');
		this.api.scrobbling = active;
		this.trigger('scrobbling', active);
	}
});


lastfm_api.prototype.initers.push(function(){
	this.scrobbling = this.stGet && !!this.stGet('lfm_scrobbling_enabled');	
	var _this = this;
	
	if (!this.sk) {
		suReady(function(){
			su.lfm_auth.get_lfm_token();
		});
		
	}
});