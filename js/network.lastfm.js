$.extend(lastfm_api.prototype, {
	nowplay: function(mo, duration){
		var _this = this;
		if (!_this.sk){return false}
			_this.post('track.updateNowPlaying', {
				sk: _this.sk,
				artist: mo.artist,
				track: mo.track,
				duration: duration || ""
				
			});
	},
	submit: function(mo, duration){
		var _this = this;
		var artist = mo.artist,
			track = mo.track,
			starttime = mo.start_time,
			last_scrobble = mo.last_scrobble,
			timestamp = ((new Date()).getTime()/1000).toFixed(0);
			
		
		if (!duration || ((timestamp - starttime)/duration > 0.2) || (last_scrobble && ((timestamp - last_scrobble)/duration > 0.6)) ){
			this.music.push({
				'artist': artist, 
				'track': track,
				'duration': duration || "", 
				'timestamp': timestamp
			});
			mo.start_time = false;
			mo.last_scrobble = timestamp;
		} 
		if (this.music.length){
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
		}
	}
});
lastfm_api.prototype.initers.push(function(){
	this.music = this.stGet && this.stGet('lfm_scrobble_music') || [];
});

var LfmAuth = function(lfm, opts) {
	this.api = lfm;
	this.opts = opts;
	if (opts){
		this.init();
	}
};
provoda.Eventor.extendTo(LfmAuth, {
	//init: function() {};
	requestAuth: function(p){
		
		this.authInit(p || {});
		return 
	},
	login: function(r, callback){
		this.api.sk = r.session.key;
		this.user_name = r.session.name;
		this.api.stSet('lfm_user_name', this.user_name, true);
		this.api.stSet('lfmsk', this.sk, true);
		if (callback){callback();}
	},
	getInitAuthData: function(){
		var o = {};
		o.link = 'http://www.last.fm/api/auth/?api_key=' + this.api.apikey ;
		var link_tag = 'http://seesu.me/lastfm/callbacker.html';
		if (!su.env.deep_sanbdox){
			o.bridgekey = hex_md5(Math.random() + 'bridgekey'+ Math.random());
			link_tag += '?key=' + o.bridgekey;
		}
		
		o.link += '&cb=' + encodeURIComponent(link_tag);
		return o;
	},
	waitData: function() {
		this.trigger('data-wait');
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
		i.src = 'http://seesu.me/lastfm/bridge.html';
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
		
	
		
		su.main_level.updateState('lfm-waiting-for-finish', true);
		
		
		return
		
	},
	setToken: function(token){
		this.newtoken = token;
		this.try_to_login();
	},
	get_lfm_token: function(open){
		var _this = this;
		this.api.get('auth.getToken', false, {nocache: true})
			.done(function(r){
				_this.newtoken = r.token;
				if (open){_this.open_lfm_to_login(r.token);}
			})
	},
	open_lfm_to_login: function(token){
		app_env.openURL('http://www.last.fm/api/auth/?api_key=' + this.apikey + '&token=' + token);
		su.main_level.updateState('lfm-waiting-for-finish', true);
	},
	try_to_login: function(callback){
		var _this = this
		if (_this.newtoken ){
				_this.api.get('auth.getSession', {'token':_this.newtoken })
					.done(function(r){
						if (!r.error) {
							_this.login(r,callback);
							_this.lfm_logged();
							_this.trigger("session");

							
							
							console.log('lfm scrobble access granted')
						} else{
							console.log('error while granting lfm scrobble access')
						}
						
					});
		}
	},
	
	
	
	
	lfm_logged : function(){
		su.main_level.updateState('lfm-auth-done', true);
		su.main_level.updateState('lfm-auth-req-loved', false);
		su.main_level.updateState('lfm-auth-req-recomm', false);
		$('.lfm-finish input[type=checkbox]',su.ui.d).prop('checked', true);
		var f = $('.scrobbling-switches', su.ui.d);
		var ii = f.find('input');
		ii.removeAttr('disabled');
	},
	lfm_change_scrobbling:function(enable, context){
		var lfm_ssw = $('.scrobbling-switches', context || su.ui.d);
		if (lfm_ssw) {
			lfm_ssw.find('.enable-scrobbling').prop('checked', enable ? true : false);
			lfm_ssw.find('.disable-scrobbling').prop('checked',enable ? false : true);
		}
	},
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