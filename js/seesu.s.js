var local_server = false && 'http://127.0.0.1:9013/';

var asyncDataSteam = function(getDataFunc, freshness, interval, data){
	this._getDataFunc = getDataFunc;
	this._interval = interval;
	this._freshness = freshness;
	
	if (data){
		this._store = data;
	} else{
		this._store = false;
	}
	
	this._processing = false;
	this._timestamp = false;
	this._callbacks = {};
	this._onetime_callbacks = [];
	
};
asyncDataSteam.prototype = {
	_request: function(){
		if (this._getDataFunc){
			var _this = this;
		
			this._processing = true;
			
			this._fireCallbacks();
			
			this._getDataFunc(function(r){
				_this.setNewData(r);
				
				_this._processing = false;
			});
		}
	
	},
	setNewData: function(data){
		this._timestamp = +new Date;
		this._store = data;
		this._fireCallbacks(true);
	},
	init: function(){
		if (!this._inited){
			var _this = this;
			
			if (this._interval){
				setInterval(function(){
					_this._request();
				}, this._interval);
			}
			
			
			this._request();
			
			this._inited = true;
		}
		
		
	},

	getData: function(callback, force_newdata, loading_marking){
		
		if (!force_newdata && callback && this._freshness && this._store && (this._timestamp + this._freshness > (+ new Date))){
			callback(this._store);
		} else{
			if (callback){
				this.regCallback(false, callback, loading_marking);
			}
			
			if (!this._processing){
				this._request();
			}
		}
	},
	regCallback: function(key, cb, lcb){
	
		if (key){
			if (cb){
				this._callbacks[key] = {cb: cb, lcb: lcb};
				if (this._store){
					var _this = this;
					setTimeout(function(){
						cb(_this._store);
					},10);
					
				}
			} else{
				delete this._callbacks[key];
			}
		} else{
			if (cb){
				this._onetime_callbacks.push({cb: cb, lcb: lcb});
			}
			
		}

	},
	_fireLoading: function(){
		for (var i=0; i < this.length; i++) {
			this[i]
		};
	},
	_fireCallbacks: function(real){//real callbacks or just loading marks
		for (var a in this._callbacks) {
			var f = this._callbacks[a];
			f = real ? f.cb : f.lcb;
			if (f){f(this._store)}
		};
		for (var i = this._onetime_callbacks.length - 1; i >= 0; i--){
			var f = this._onetime_callbacks.pop();
			f = real ? f.cb : f.lcb;
			if (f){f(this._store)}
		};
	}
};

var seesuServerAPI = function(auth){
	var _this = this;
	
	
	if (auth){
		this.setAuth(auth, true);
	};
	
	var update_interval = 1000 * 60 * 4;
	
	this.susd.rl = new asyncDataSteam(function(callback){
		_this.api('relations.getLikes', function(r){
			_this.susd.updateRelationsLikes(r.done);
			if (callback){callback(r)};
		});
	}, update_interval,  update_interval);
	
	this.susd.ri = new asyncDataSteam(function(callback){
		_this.api('relations.getInvites', function(r){
			_this.susd.updateRelationsInvites(r.done);
			if (callback){callback(r)};
		});
	}, update_interval,  update_interval);

	this.auth.regCallback('relations.likes', function(d){
		_this.susd.rl.init();
		_this.susd.ri.init();
	});
	
	
	this.susd.ligs =  new asyncDataSteam(function(callback){		
		$.ajax({
		  url: 'http://seesu.me/last_listenings/',
		  type: "GET",
		  dataType: "json",
		  error: function(){
		  	callback();
		  },
		  success: function(r){
			callback(r);
		  }
		});
	}, update_interval,  update_interval);
	suReady(function(){
		_this.susd.ligs.init();
	});
	
};
seesuServerAPI.prototype = {
	susd: {
		rl: false,
		ri: false,
		ligs: false,
		relations:{
			likes: {},
			invites: {}
		},
		addLike: function(user){
			if (!this.relations.likes[user]){
				this.relations.likes[user] = [{}];
			}	
		},
		addInvite: function(user){
			if (!this.relations.likes[user]){
				this.relations.likes[user] = [{}];
			}	
		},
		updateRelationsInvites: function(invites){
			this.relations.invites = makeIndexByField(invites, 'user');
		},
		updateRelationsLikes: function(likes){
			this.relations.likes = makeIndexByField(likes, 'user');
		},
		didUserInviteMe: function(user){
			var rel = this.relations.invites[user];
			return rel && rel[0];
		},
		isUserLiked: function(user){
			var rel = this.relations.likes[user];
			return rel && rel[0];
		},
		user_info: {}
	},
	auth: new asyncDataSteam(false, false, false),
	getInfo: function(type){
		return this.susd.user_info[type];
	},
	setInfo: function(type, data){
		this.susd.user_info[type] = data;
	},

	
	getId: function(){
		return this.auth._store && this.auth._store.userid;
	},
	loggedIn: function(){
		var auth = this.auth._store;
		return !!(auth.secret && auth.sid && auth.userid)
	},
	url: local_server || 'http://seesu.me/',

	setAuth: function(auth_data, not_save){
		var _this = this;
		if (!not_save){
			suStore('dg_auth', auth_data, true);
		}
		this.auth.setNewData(auth_data);
	},

	getAuth: function(vk_user_id, callback){
		su.s.api('user.getAuth', {
			type:'vk',
			ver: 0.3,
			vk_user: vk_user_id
		}, function(su_sess){
			if (su_sess.secret_container && su_sess.sid){
				su.vk_api.get('storage.get', {key:su_sess.secret_container})
					.done(function(r){
						if (r && r.response){
							su.s.setAuth({
								userid: su_sess.userid,
								secret: r.response,
								sid: su_sess.sid
							});
							//su.s.setInfo('vk', su.vk.user_info);

							//su.s.api('user.update', su.vk.user_info);
							su.fire('dg-auth');
							if (callback){callback();}
						}
					});
			}
			
		});
	},
	api: function(method, p, c, error){
		var params = (typeof p == 'object' && p) || {};
		var callback = c || (typeof p == 'function' && p);
		var _this = this;
		
	
		params.method = method;
		
		var auth = this.auth._store;
		
		
		if (!bN(['track.getListeners', 'user.getAuth'].indexOf(method))){
			if (!auth){
				return false
			} else {
				params.sid = auth.sid;
				params.sig = hex_md5(stringifyParams(params, ['sid']) + auth.secret);
			}
			
		}
		
		$.ajax({
			type: "GET",
			url: _this.url + 'api/',
			data: params,
			success: function(r){
				if (r){
					if (r.error && r.error[0]  && r.error[0] == 'wrong signature'){
						
						_this.setAuth('');
						_this.getAuth(_this.vk_id);
						
						
						
						
					} else{
						if (callback){callback(r);}
					}
				}
				
			},
			error: error
		});
		
	}
};