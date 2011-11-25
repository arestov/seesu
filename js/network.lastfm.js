$.extend(lastfm_api.prototype, {
	nowplay: function(mo, duration){
		var _this = this;
		if (!_this.sk){return false}
			_this.post('track.updateNowPlaying', {
				sk: _this.sk,
				artist: mo.artist,
				track: mo.track,
				duration: duration
				
			});
	},
	submit: function(mo, duration){
		var _this = this;
		var artist = mo.artist,
			track = mo.track,
			starttime = mo.start_time,
			last_scrobble = mo.last_scrobble,
			timestamp = ((new Date()).getTime()/1000).toFixed(0);
			
		
		if (((timestamp - starttime)/duration > 0.2) || (last_scrobble && ((timestamp - last_scrobble)/duration > 0.6)) ){
			this.music.push({
				'artist': artist, 
				'track': track,
				'duration': duration, 
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
					post_m_obj['duration[' + i + ']'] = _this.music[i].duration;
				};
				
				
				_this.post('track.scrobble', post_m_obj)
					.done(function(r){
						if (r){
							_this.music = [];
							_this.stSet('lfm_scrobble_music', '');
						} 
						
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


$.extend(lastfm_api.prototype, {
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
		this.use('auth.getToken', false, function(r){
			_this.newtoken = r.token;
			if (open){_this.open_lfm_to_login(r.token);}
		}, true);
	},
	open_lfm_to_login: function(token){
		app_env.openURL('http://www.last.fm/api/auth/?api_key=' + this.apikey + '&token=' + token);
		dstates.add_state('body','lfm-waiting-for-finish');
	},
	try_to_login: function(callback){
		var _this = this
		if (_this.newtoken ){
				_this.use('auth.getSession',{'token':_this.newtoken },function(r){
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
	}
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