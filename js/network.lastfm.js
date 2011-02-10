var lastfm_api = function(apikey, s, cache, crossdomain){
	this.apikey = apikey;
	this.s = s;
	this.cache = cache;
	this.crossdomain = crossdomain;
	if (!crossdomain){
		var srvc = document.createElement('div');srvc.className="serv-container";$(function(){document.body.appendChild(srvc)});
		
		var _i = document.createElement('iframe'); _i.width='30'; _i.height= '30';
		var _f = document.createElement('form'); _f.method ='POST'; _f.action=this.api_path; srvc.appendChild(_f);
		
		this.post_serv = {
			name: 'lfmpost',
			i: _i,
			c: 0,
			f: _f,
			post: function(data,callback){
				$(this.f).empty();
				for (var a in data) {
					var input = document.createElement('input');input.type='hidden';
					input.name = a;
					input.value = data[a];
					this.f.appendChild(input)
				};
				var new_i = this.i.cloneNode(true);
				this.f.target = new_i.name = new_i.id = (this.name + (++this.c));
				srvc.appendChild(new_i);
				this.f.submit();
				if (callback){callback({});}
			}
		};
	}
	this.quene = new funcs_quene(100);
	
	
	this.scrobbling =  w_storage('lfm_scrobbling_enabled') ? true : false;
	this.sk =  w_storage('lfmsk') || false;
	this.user_name = w_storage('lfm_user_name') || false;
	this.music = (function(){
		var lfmscm = w_storage('lfm_scrobble_music');
		if (lfmscm) {
			return JSON.parse(lfmscm);
		} else {
			return [];
		}
	})();
	
	this.ss =  w_storage('lfm_scrobble_s');
	
	if (!this.sk) {
		$(function(){
			su.lfm_api.get_lfm_token();
		});
	}
	/*
	if (crossdomain){
		this.old_sc_handshake();
	}
	*/
	
};
lastfm_api.prototype = {
	api_path: 'http://ws.audioscrobbler.com/2.0/',
	use: function(method, params, callback, nocache, type_of_xhr_is_post) {
		var _this = this;
		if (method) {
			var use_cache = (_this.cache && !type_of_xhr_is_post && !nocache)
			var no_need_for_post_serv = (!type_of_xhr_is_post || _this.crossdomain);
	
			var pv_signature_list = [], // array of <param>+<value>
				params_full = params || {},
				apisig = ((params && (params.sk || params.token )) || (method == 'auth.getToken')) ? true : false; // yes, we need signature
			
			params_full.method = method;
			params_full.api_key = _this.apikey;
			var f = params_full.format || no_need_for_post_serv ? 'json' : '';
			if (f){
				params_full.format = f;
			}
	
			var paramsstr = '';
			if(apisig || use_cache) {
				for (var param in params_full) {
					if ((param != 'format') && (param != 'callback')){
						pv_signature_list.push(param + params_full[param]);
					}
				}
				pv_signature_list.sort();
				
				for (var i=0, l = pv_signature_list.length; i < l; i++) {
					paramsstr += pv_signature_list[i];
				};
				params_full.api_sig = hex_md5(paramsstr + _this.s);
			}
			
			if (use_cache){
				var cache_used = cache_ajax.get('lastfm', params_full.api_sig, callback)	
			}
	
			if (!cache_used){
				return _this.quene.add(function(){
					if (no_need_for_post_serv){
						$.ajax({
						  url: _this.api_path,
						  global: false,
						  type: type_of_xhr_is_post ? "POST" : "GET",
						  dataType: _this.crossdomain ? 'json' : 'jsonp',
						  data: params_full,
						  error: function(r){
						  },
						  success: function(r){
							if (callback) {callback(r);}
							if (!type_of_xhr_is_post){
								cache_ajax.set('lastfm', params_full.api_sig, r)
							}
						  },
						  complete: function(xhr){
							//console.log(xhr.responseText)
						  }
						});
						//console.log(params_full)
					} else{
						_this.post_serv.post(params_full, callback);
					} 
					
				})
			}
	
		}
	},
	nowplay: function(mo){
		var _this = this;
		if (!_this.sk){return false}
		
		
			_this.use('track.updateNowPlaying', {
				sk: _this.sk,
				artist: mo.artist,
				track: mo.track,
				duration: mo.duration
				
			}, function(r){}, true, true);
		
		
	},
	submit: function(mo){
		var _this = this;
		var artist = mo.artist,
			track = mo.track,
			duration = mo.duration,
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
		
		if (_this.sk && this.music.length) {
			
			
				var post_m_obj = {sk: _this.sk};
				for (var i=0,l=_this.music.length; i < l; i++) {
					post_m_obj['artist[' + i + ']'] = _this.music[i].artist;
					post_m_obj['track[' + i + ']'] = _this.music[i].track;
					post_m_obj['timestamp[' + i + ']'] = _this.music[i].timestamp;
					post_m_obj['duration[' + i + ']'] = _this.music[i].duration;
				};
				
				
				_this.use('track.scrobble', post_m_obj, function(r){
					if (r){
						_this.music = [];
						w_storage('lfm_scrobble_music', '');
					} 
					
				}, true, true);
			
			
		} else {
			if (_this.music.length){
				w_storage('lfm_scrobble_music', _this.music);
			} 
		}
	},
	login: function(r, callback){
		this.sk = r.session.key;
		this.user_name = r.session.name;
		w_storage('lfm_user_name', this.user_name, true);
		w_storage('lfmsk', this.sk, true);
		if (callback){callback();}
	},
	get_lfm_token: function(open){
		var _this = this;
		this.use('auth.getToken', false, function(r){
			su.lfm_api.newtoken = r.token;
			if (open){_this.open_lfm_to_login(r.token);}
		}, true);
	},
	open_lfm_to_login: function(token){
		open_url('http://www.last.fm/api/auth/?api_key=' + this.apikey + '&token=' + token);
		dstates.add_state('body','lfm-waiting-for-finish');
	},
	try_to_login: function(){
		var _this = this
		if (_this.newtoken && _this.waiting_for){
				_this.use('auth.getSession',{'token':_this.newtoken },function(r){
				if (!r.error) {
					_this.login(r);
					switch(_this.waiting_for) {
					  case('recommendations'):
						render_recommendations();
						break;
					  case('loved'):
						render_loved();
						break;    
					  case('scrobbling'):
						w_storage('lfm_scrobbling_enabled', 'true', true);
						_this.scrobbling = true;
						su.ui.lfm_enable_scrobbling();
						break;
					  default:
						//console.log('Do nothing');
					}
					
					console.log('lfm scrobble access granted')
				} else{
					console.log('error while granting lfm scrobble access')
				}
				_this.waiting_for = false;
			});
		}
	},
	old_sc_handshake: function(callback){
		var _this = this;
		var timestamp = ((new Date()).getTime()/1000).toFixed(0);
		$.ajax({
			  url: 'http://post.audioscrobbler.com/',
			  global: false,
			  type: "GET",
			  dataType: "text",
			  data: {
				'hs': 'true',
				'p': '1.2.1',
				'c': 'see',
				'v': '1.0',
				'u': _this.user_name,
				't': timestamp,
				'a': hex_md5(_this.s + timestamp),
				'api_key': _this.apikey,
				'sk': _this.sk
			  },
			  error: function(r){
			  },
			  success: function(r){
				var response = r.split(/\n/);
				if (response[0] == 'OK'){
					_this.ss = response[1];
					w_storage('lfm_scrobble_s', _this.s, true);
					if (callback) {callback();}
					console.log('handshake:' + '\n' + r)
				} else {
					console.log(r)
				}
				
			  }
		});
	},
	old_sc_nowplay: function(mo){	
		var _this = this;	
		if (_this.ss) {
			
			$.ajax({
			  url: 'http://post.audioscrobbler.com:80/np_1.2',
			  global: false,
			  type: "POST",
			  dataType: "text",
			  data: {
				's': _this.ss,
				'a': mo.artist,
				't': mo.track
			  },
			  error: function(r){
			  },
			  success: function(r){
				if (r.match('BADSESSION')){
					_this.ss = null;
					w_storage('lfm_scrobble_s', '', true);
					_this.old_sc_handshake();
				};
			  }
			});	
		} else {
			_this.old_sc_handshake(function(){
				_this.old_sc_nowplay(mo);
			});
		} 
		
	},
	old_sc_submit: function(){
		var _this = this;

	
		if (_this.ss) {
			var _this = this;
			
			var post_m_obj = {'s':_this.ss};
			for (var i=0,l=_this.music.length; i < l; i++) {
				post_m_obj['a[' + i + ']'] = _this.music[i].artist,
				post_m_obj['t[' + i + ']'] = _this.music[i].track,
				post_m_obj['i[' + i + ']'] = _this.music[i].timestamp,
				post_m_obj['o[' + i + ']'] = 'P',
				post_m_obj['r[' + i + ']'] = ' ',
				post_m_obj['l[' + i + ']'] = _this.music[i].duration,
				post_m_obj['b[' + i + ']'] = ' ',
				post_m_obj['n[' + i + ']'] = ' ',
				post_m_obj['m[' + i + ']'] = ' '
			};
			$.ajax({
			  url: 'http://post2.audioscrobbler.com:80/protocol_1.2',
			  global: false,
			  type: "POST",
			  dataType: "text",
			  data: post_m_obj,
			  error: function(r){
				console.log('error while scrobble')
				
			  },
			  success: function(r){
				if (!r.match('OK')) {
					if (r.match('BADSESSION')){
						_this.ss = null;
						w_storage('lfm_scrobble_s', '', true);
						
						_this.old_sc_handshake();
					}
					w_storage('lfm_scrobble_music', _this.music);
				} else {
					_this.music = [];
					w_storage('lfm_scrobble_music', '');
				}
				
			  },
			  complete: function(xhr){
				console.log(xhr);
			  }
			})
				console.log(' data sended')
		} else {
			_this.old_sc_handshake(function(){
				_this.old_sc_submit(mo);
			});
		
		}
		console.log('submit done');
	}
}
