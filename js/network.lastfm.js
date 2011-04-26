function lastfm_api(apikey, s, cache, crossdomain){
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
	this.queue = new funcs_queue(100);
	
	
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
	var _this = this;
	this.asearch = {
		test: function(mo){
			return canUseSearch(mo, _this.search_source);
		},
		search: function(){
			return _this.searchMp3.apply(_this, arguments);
		},
		name: this.search_source.name,
		description: 'last.fm',
		slave: false,
		preferred: null,
		s: this.search_source,
		q: this.queue,
		getById: function(id){
			return false;
			return _this.getAudioById.apply(_this, arguments);
		}
	};
};
lastfm_api.prototype = {
	api_path: 'http://ws.audioscrobbler.com/2.0/',
	use: function(method, params, callback, nocache_or_errorcallback, type_of_xhr_is_post, nc, options) {
		var o = options || {};
		var _this = this;
		if (method) {
			var error_callback = typeof nocache_or_errorcallback== 'function' ? nocache_or_errorcallback : false;
			var nocache = (!error_callback && nocache_or_errorcallback) || nc;
			
			
			var use_cache = (_this.cache && !type_of_xhr_is_post && !nocache)
			var no_need_for_post_serv = (!type_of_xhr_is_post || _this.crossdomain);
	
			var pv_signature_list = [], // array of <param>+<value>
				params_full = params || {},
				apisig = ((params && (params.sk || params.token )) || (method == 'auth.getToken')) ? true : false; // yes, we need signature
			
			params_full.method = method;
			params_full.api_key = _this.apikey;
			var f = params_full.format || (no_need_for_post_serv ? 'json' : '');
			if (f){
				params_full.format = f;
			}
	
			var paramsstr = '';
			if (apisig || use_cache) {
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
				var cache_used = cache_ajax.get('lastfm', params_full.api_sig, callback);
				if (cache_used) {
					return true;
				}
			}
	
			if (!cache_used){
				return _this.queue.add(function(){
					
					if (no_need_for_post_serv){
						if (use_cache){
							var cache_used = cache_ajax.get('lastfm', params_full.api_sig, callback)	
						}
						if (!cache_used){
							$.ajax({
							  url: _this.api_path,
							  global: false,
							  type: type_of_xhr_is_post ? "POST" : "GET",
							  dataType: _this.crossdomain ? 'json' : 'jsonp',
							  data: params_full,
							  error: function(r){
							  	if (error_callback){
							  		error_callback(r)
							  	}
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
							if (o.after_ajax){
								o.after_ajax();
							}
							//console.log(params_full)	
						}

					} else{
						_this.post_serv.post(params_full, callback);
					} 
					
				}, o.not_init_queue)
			}
	
		}
	},
	search_source:{
		name:"lastfm",
		key:0	
	},
	createLastfmTrack: function(tr, link, duration, id, downloadable){
		return {
			from:'lastfm',
			artist: tr.artist,
			link: link,
			track: tr.track,
			duration: duration,
			downloadable: downloadable,
			_id: id
		}	
	},
	searchMp3: function(msq, callback, error, nocache, after_ajax, only_cache){
		var _this = this;
		if (!(msq.artist && msq.track)){
			if (error){error(_this.search_source);}
		} else{
			return this.use('track.getInfo', {artist: msq.artist, track: msq.track}, function(r){
				if (r && r.track){

					var free = r.track.freedownload;
					if (free){
						
						callback([_this.createLastfmTrack(msq, free, r.track.duration/1000, r.track.id, true)], _this.search_source);
					} else{
						var steamable = r && r.track && r.track.streamable && r.track.streamable['#text'] == '1';
						if (steamable){
							duration = 30;
							var link = 'http://ws.audioscrobbler.com/2.0/?method=track.previewmp3&trackid=' + r.track.id + "&api_key=" + _this.apikey;
							callback([_this.createLastfmTrack(msq, link, 30, r.track.id)], _this.search_source);
						} else{
							if (error){error(_this.search_source);}
						}
					}
				} else{
					if (error){error(_this.search_source);}
				}
				
				
				
				console.log(r);
			}, function(){
				if (error){error(_this.search_source);}
			}, false, nocache, {after_ajax: after_ajax, not_init_queue: true});
		}
		
	},
	getAudioById: function(id, callback, error, nocache, after_ajax, only_cache){
		var _this = this;
		callback({
			downloadable: false,
			from:'lastfm',
			link: 'http://ws.audioscrobbler.com/2.0/?method=track.previewmp3&trackid=' + id + "&api_key=" + _this.apikey,
			_id: id
		}, _this.search_source);
	},
	nowplay: function(mo, duration){
		var _this = this;
		if (!_this.sk){return false}
		
		
			_this.use('track.updateNowPlaying', {
				sk: _this.sk,
				artist: mo.artist,
				track: mo.track,
				duration: duration
				
			}, function(r){}, true, true);
		
		
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
			su.lfm_api.newtoken = r.token;
			if (open){_this.open_lfm_to_login(r.token);}
		}, true);
	},
	open_lfm_to_login: function(token){
		open_url('http://www.last.fm/api/auth/?api_key=' + this.apikey + '&token=' + token);
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
							w_storage('lfm_scrobbling_enabled', 'true', true);
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
};

var lastfm_toptags = ["80s", "90s", "acoustic", "alternative", "alternative rock", "ambient", "black metal", "blues", "british", "chillout", "classical", "classic rock", "country", "dance", "death metal", "electronic", "electronica", "emo", "experimental", "favorites", "female vocalists", "folk", "hardcore", "hard rock", "heavy metal", "hip-hop", "hip hop", "indie", "indie rock", "industrial", "instrumental", "japanese", "jazz", "metal", "metalcore", "pop", "progressive metal", "progressive rock", "punk", "punk rock", "rap", "reggae", "rock", "seen live", "singer-songwriter", "soul", "soundtrack", "thrash metal", "trance", "trip-hop"];














var lastfm_metros = [{"name":"Sydney","country":"Australia"},{"name":"Adelaide","country":"Australia"},{"name":"Melbourne","country":"Australia"},{"name":"Linz","country":"Austria"},{"name":"Graz","country":"Austria"},{"name":"Innsbruck","country":"Austria"},{"name":"Salzburg","country":"Austria"},{"name":"Vienna","country":"Austria"},{"name":"Minsk","country":"Belarus"},{"name":"Charleroi","country":"Belgium"},{"name":"Brussels","country":"Belgium"},{"name":"Ghent","country":"Belgium"},{"name":"Antwerp","country":"Belgium"},{"name":"Liège","country":"Belgium"},{"name":"Rio de Janeiro","country":"Brazil"},{"name":"Belém","country":"Brazil"},{"name":"São Paulo","country":"Brazil"},{"name":"Salvador","country":"Brazil"},{"name":"Fortaleza","country":"Brazil"},{"name":"Belo Horizonte","country":"Brazil"},{"name":"Brasília","country":"Brazil"},{"name":"Curitiba","country":"Brazil"},{"name":"Manaus","country":"Brazil"},{"name":"Recife","country":"Brazil"},{"name":"Porto Alegre","country":"Brazil"},{"name":"Winnipeg","country":"Canada"},{"name":"Calgary","country":"Canada"},{"name":"Vancouver","country":"Canada"},{"name":"Quebec","country":"Canada"},{"name":"Edmonton","country":"Canada"},{"name":"Saskatoon","country":"Canada"},{"name":"Montreal","country":"Canada"},{"name":"Ottawa","country":"Canada"},{"name":"Toronto","country":"Canada"},{"name":"Halifax","country":"Canada"},{"name":"Valparaíso","country":"Chile"},{"name":"Santiago","country":"Chile"},{"name":"Guangzhou","country":"China"},{"name":"Tianjin","country":"China"},{"name":"Shanghai","country":"China"},{"name":"Chongqing","country":"China"},{"name":"Changsha","country":"China"},{"name":"Beijing","country":"China"},{"name":"Bogotá","country":"Colombia"},{"name":"Copenhagen","country":"Denmark"},{"name":"Helsinki","country":"Finland"},{"name":"Bordeaux","country":"France"},{"name":"Montpellier","country":"France"},{"name":"Metz","country":"France"},{"name":"Clermont-Ferrand","country":"France"},{"name":"Nice","country":"France"},{"name":"Rennes","country":"France"},{"name":"Strasbourg","country":"France"},{"name":"Lille","country":"France"},{"name":"Marseille","country":"France"},{"name":"Lyon","country":"France"},{"name":"Paris","country":"France"},{"name":"Nancy","country":"France"},{"name":"Grenoble","country":"France"},{"name":"Toulouse","country":"France"},{"name":"Nantes","country":"France"},{"name":"Cologne","country":"Germany"},{"name":"Hamburg","country":"Germany"},{"name":"Stuttgart","country":"Germany"},{"name":"Berlin","country":"Germany"},{"name":"Rostock","country":"Germany"},{"name":"Dresden","country":"Germany"},{"name":"Bremen","country":"Germany"},{"name":"Munich","country":"Germany"},{"name":"Frankfurt","country":"Germany"},{"name":"Magdeburg","country":"Germany"},{"name":"Hong Kong","country":"Hong Kong"},{"name":"Belfast","country":"Ireland"},{"name":"Dublin","country":"Ireland"},{"name":"Florence","country":"Italy"},{"name":"Turin","country":"Italy"},{"name":"Bari","country":"Italy"},{"name":"Milan","country":"Italy"},{"name":"Rome","country":"Italy"},{"name":"Naples","country":"Italy"},{"name":"Genoa","country":"Italy"},{"name":"Palermo","country":"Italy"},{"name":"Bologna","country":"Italy"},{"name":"Osaka","country":"Japan"},{"name":"Sendai","country":"Japan"},{"name":"Hiroshima","country":"Japan"},{"name":"Kobe","country":"Japan"},{"name":"Tokyo","country":"Japan"},{"name":"Nagoya","country":"Japan"},{"name":"Shizuoka","country":"Japan"},{"name":"Sapporo","country":"Japan"},{"name":"Kyoto","country":"Japan"},{"name":"Fukuoka","country":"Japan"},{"name":"Niigata","country":"Japan"},{"name":"Saitama","country":"Japan"},{"name":"Puebla","country":"Mexico"},{"name":"Ciudad Juárez","country":"Mexico"},{"name":"Guadalajara","country":"Mexico"},{"name":"Mexico City","country":"Mexico"},{"name":"Mérida","country":"Mexico"},{"name":"Mexicali","country":"Mexico"},{"name":"Monterrey","country":"Mexico"},{"name":"Tijuana","country":"Mexico"},{"name":"Villahermosa","country":"Mexico"},{"name":"Christchurch","country":"New Zealand"},{"name":"Wellington","country":"New Zealand"},{"name":"Auckland","country":"New Zealand"},{"name":"Bergen","country":"Norway"},{"name":"Oslo","country":"Norway"},{"name":"Łódź","country":"Poland"},{"name":"Wrocław","country":"Poland"},{"name":"Poznań","country":"Poland"},{"name":"Gdańsk","country":"Poland"},{"name":"Szczecin","country":"Poland"},{"name":"Katowice","country":"Poland"},{"name":"Cracow","country":"Poland"},{"name":"Warsaw","country":"Poland"},{"name":"Coimbra","country":"Portugal"},{"name":"Matosinhos","country":"Portugal"},{"name":"Lisbon","country":"Portugal"},{"name":"Porto","country":"Portugal"},{"name":"Bragança","country":"Portugal"},{"name":"Aveiro","country":"Portugal"},{"name":"Braga","country":"Portugal"},{"name":"Évora","country":"Portugal"},{"name":"Faro","country":"Portugal"},{"name":"Setúbal","country":"Portugal"},{"name":"Vila Nova de Gaia","country":"Portugal"},{"name":"Ekaterinburg","country":"Russian Federation"},{"name":"Saint Petersburg","country":"Russian Federation"},{"name":"Moscow","country":"Russian Federation"},{"name":"Penza","country":"Russian Federation"},{"name":"Ufa","country":"Russian Federation"},{"name":"Ryazan","country":"Russian Federation"},{"name":"Barcelona","country":"Spain"},{"name":"Bilbao","country":"Spain"},{"name":"Gijón","country":"Spain"},{"name":"Oviedo","country":"Spain"},{"name":"Salamanca","country":"Spain"},{"name":"Madrid","country":"Spain"},{"name":"Valencia","country":"Spain"},{"name":"Alicante","country":"Spain"},{"name":"Murcia","country":"Spain"},{"name":"Granada","country":"Spain"},{"name":"Burgos","country":"Spain"},{"name":"Zaragoza","country":"Spain"},{"name":"Seville","country":"Spain"},{"name":"A Coruña","country":"Spain"},{"name":"Uppsala","country":"Sweden"},{"name":"Umeå","country":"Sweden"},{"name":"Malmö","country":"Sweden"},{"name":"Stockholm","country":"Sweden"},{"name":"Gothenburg","country":"Sweden"},{"name":"Västerås","country":"Sweden"},{"name":"Linköping","country":"Sweden"},{"name":"Winterthur","country":"Switzerland"},{"name":"Fribourg","country":"Switzerland"},{"name":"St. Gallen","country":"Switzerland"},{"name":"Lausanne","country":"Switzerland"},{"name":"Berne","country":"Switzerland"},{"name":"Lucerne","country":"Switzerland"},{"name":"Basel","country":"Switzerland"},{"name":"Zurich","country":"Switzerland"},{"name":"Geneva","country":"Switzerland"},{"name":"Taipei","country":"Taiwan"},{"name":"Istanbul","country":"Turkey"},{"name":"Antalya","country":"Turkey"},{"name":"Adana","country":"Turkey"},{"name":"Bursa","country":"Turkey"},{"name":"İzmir","country":"Turkey"},{"name":"Ankara","country":"Turkey"},{"name":"Odesa","country":"Ukraine"},{"name":"Kyiv","country":"Ukraine"},{"name":"Exeter","country":"United Kingdom"},{"name":"Cardiff","country":"United Kingdom"},{"name":"Newport","country":"United Kingdom"},{"name":"Bristol","country":"United Kingdom"},{"name":"Birmingham","country":"United Kingdom"},{"name":"Southampton","country":"United Kingdom"},{"name":"Edinburgh","country":"United Kingdom"},{"name":"Manchester","country":"United Kingdom"},{"name":"Newcastle","country":"United Kingdom"},{"name":"Liverpool","country":"United Kingdom"},{"name":"Brighton","country":"United Kingdom"},{"name":"Leeds","country":"United Kingdom"},{"name":"Aberdeen","country":"United Kingdom"},{"name":"Glasgow","country":"United Kingdom"},{"name":"Nottingham","country":"United Kingdom"},{"name":"Plymouth","country":"United Kingdom"},{"name":"London","country":"United Kingdom"},{"name":"Orlando","country":"United States"},{"name":"Miami","country":"United States"},{"name":"Phoenix","country":"United States"},{"name":"Los Angeles","country":"United States"},{"name":"San Diego","country":"United States"},{"name":"San Francisco","country":"United States"},{"name":"San Jose","country":"United States"},{"name":"Sacramento","country":"United States"},{"name":"Las Vegas","country":"United States"},{"name":"West Palm Beach","country":"United States"},{"name":"Portland","country":"United States"},{"name":"Seattle","country":"United States"},{"name":"Buffalo","country":"United States"},{"name":"Rochester","country":"United States"},{"name":"Syracuse","country":"United States"},{"name":"Cincinnati","country":"United States"},{"name":"Louisville","country":"United States"},{"name":"Indianapolis","country":"United States"},{"name":"St Louis","country":"United States"},{"name":"Chicago","country":"United States"},{"name":"Detroit","country":"United States"},{"name":"Richmond","country":"United States"},{"name":"Virginia Beach","country":"United States"},{"name":"Baltimore","country":"United States"},{"name":"Washington DC","country":"United States"},{"name":"Pittsburgh","country":"United States"},{"name":"Cleveland","country":"United States"},{"name":"Columbus","country":"United States"},{"name":"Minneapolis","country":"United States"},{"name":"Philadelphia","country":"United States"},{"name":"New York","country":"United States"},{"name":"Tampa","country":"United States"},{"name":"El Paso","country":"United States"},{"name":"Milwaukee","country":"United States"},{"name":"Denver","country":"United States"},{"name":"Little Rock","country":"United States"},{"name":"Memphis","country":"United States"},{"name":"Nashville","country":"United States"},{"name":"Atlanta","country":"United States"},{"name":"Houston","country":"United States"},{"name":"New Orleans","country":"United States"},{"name":"Pensacola","country":"United States"},{"name":"Jacksonville","country":"United States"},{"name":"Austin","country":"United States"},{"name":"Boston","country":"United States"},{"name":"Wichita","country":"United States"}]