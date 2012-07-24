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

var lfmAuth = function(lfm, opts) {
	this.api = lfm;
	this.opts = opts;
	if (init){
		this.init();
	}
};
provoda.Eventor.extendTo(lfmAuth, {
	//init: function() {};
	login: function(r, callback){
		this.sk = r.session.key;
		this.user_name = r.session.name;
		this.stSet('lfm_user_name', this.user_name, true);
		this.stSet('lfmsk', this.sk, true);
		if (callback){callback();}
	},
	getInitAuthData: function(){
		var o = {};
		o.link = 'http://www.last.fm/api/auth/?api_key=' + this.apikey ;
		var link_tag = 'http://seesu.me/lastfm/callbacker.html';
		if (!su.env.deep_sanbdox){
			o.bridgekey = hex_md5(Math.random() + 'bridgekey'+ Math.random());
			link_tag += '?key=' + o.bridgekey;
		}
		
		o.link += '&cb=' + encodeURIComponent(link_tag);
		return o;
	},
	get_lfm_token: function(open){
		var _this = this;
		this.get('auth.getToken', false, {nocache: true})
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
				_this.get('auth.getSession', {'token':_this.newtoken })
					.done(function(r){
						if (!r.error) {
							_this.login(r,callback);
							if (_this.waiting_for){
								switch(_this.waiting_for) {
								  case('recommendations'):
									render_recommendations();
									break;
								  case('loved'):
									render_loved();
									break;    
								  case('scrobbling'):
									_this.stSet('lfm_scrobbling_enabled', 'true', true);
									_this.scrobbling = true;
									su.ui.lfm_change_scrobbling(true);
									break;
								  default:
									//console.log('Do nothing');
								}
								_this.waiting_for = false;
							}
							
							console.log('lfm scrobble access granted')
						} else{
							console.log('error while granting lfm scrobble access')
						}
						
					});
		}
	},
	lfmRequestAuth: function(){
		
		this.lfmAuthInit();
		return 
	},
	lfmCreateAuthFrame: function(first_key){
		if (this.lfm_auth_inited){
			return false;
		}
		var i = this.auth_frame = document.createElement('iframe');	
		addEvent(window, 'message', function(e){
			if (e.data == 'lastfm_bridge_ready:'){
				e.source.postMessage("add_keys:" + first_key, '*');
			} else if(e.data.indexOf('lastfm_token:') === 0){
				this.newtoken = e.data.replace('lastfm_token:','');
				this.try_to_login(seesu.ui.lfm_logged);
				console.log('got token!!!!')
				console.log(e.data.replace('lastfm_token:',''));
			}
		});
		i.className = 'serv-container';
		i.src = 'http://seesu.me/lastfm/bridge.html';
		document.body.appendChild(i);
		this.lfm_auth_inited = true;
	},
	lfmSetAuthBridgeKey: function(key){
		if (!this.lfm_auth_inited){
			this.lfmCreateAuthFrame(key)
		} else{
			this.auth_frame.contentWindow.postMessage("add_keys:" + key, '*');
		}
	},
	lfmAuthInit: function(){
		
		
		//init_auth_data.bridgekey		
		
		var init_auth_data = this.getInitAuthData();
		if (init_auth_data.bridgekey){
			this.lfmSetAuthBridgeKey(init_auth_data.bridgekey)
		} 
		if (app_env.showWebPage){
			
			app_env.showWebPage(init_auth_data.link, function(url){
				var path = url.split('/')[3];
				if (!path || path == 'home'){
					app_env.hideWebPages();
					app_env.clearWebPageCookies();
					return true
				} else{
					var sb = 'http://seesu.me/lastfm/callbacker.html';
					if (url.indexOf(sb) == 0){
						var params = get_url_parameters(url.replace(sb, ''));
						if (params.token){
							this.newtoken = params.token;
							this.try_to_login(seesu.ui.lfm_logged);
						}

						app_env.hideWebPages();
						app_env.clearWebPageCookies();
						return true;
					}
				}
				
			}, function(e){
				app_env.openURL(init_auth_data.link);
				
			}, 960, 750);
		} else{
			app_env.openURL(init_auth_data.link);
		}
	
		
		su.main_level.updateState('lfm-waiting-for-finish', true);
		
		
		return
		
	},
	lfm_logged : function(){
		su.main_level.updateState('lfm-auth-done', true);
		su.main_level.updateState('lfm-auth-req-loved', false);
		su.main_level.updateState('lfm-auth-req-recomm', false);
		$('.lfm-finish input[type=checkbox]',this.d).prop('checked', true);
		var f = $('.scrobbling-switches', this.d);
		var ii = f.find('input');
		ii.removeAttr('disabled');
	},
	lfm_change_scrobbling:function(enable, context){
		var lfm_ssw = $('.scrobbling-switches', context || this.d);
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
			_this.get_lfm_token();
		});
		
	}
});