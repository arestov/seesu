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
			
			this._getDataFunc(function(r){
				_this.setNewData(r);
				
				_this._processing = false;
			});
		}
	
	},
	setNewData: function(data){
		this._timestamp = +new Date;
		this._store = data;
		this._fireCallbacks();
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

	getData: function(callback, force_newdata){
		
		if (!force_newdata && callback && this._freshness && this._store && (this._timestamp + this._freshness > (+ new Date))){
			callback(this._store);
		} else{
			if (callback){
				this.regCallback(false, callback);
			}
			
			if (!this._processing){
				this._request();
			}
		}
	},
	regCallback: function(key, f){
	
		if (key){
			if (f){
				this._callbacks[key] = f;
				if (this._store){
					f(this._store);
				}
			} else{
				delete this._callbacks[key];
			}
		} else{
			if (f){
				this._onetime_callbacks.push(f);
			}
			
		}

	},
	_fireCallbacks: function(){
		for (var a in this._callbacks) {
			this._callbacks[a](this._store);
		};
		for (var i = this._onetime_callbacks.length - 1; i >= 0; i--){
			this._onetime_callbacks.pop()(this._store);
		};
	}
};

var seesuServerAPI = function(auth){
	var _this = this;
	
	
	if (auth){
		this.setAuth(auth);
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
	
};
seesuServerAPI.prototype = {
	susd: {
		rl: false,
		ri: false,
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
			w_storage('dg_auth', auth_data, true);
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
				su.vk_api.use('storage.get', {key:su_sess.secret_container}, function(r){
					if (r && r.response){
						su.s.setAuth({
							userid: su_sess.userid,
							secret: r.response,
							sid: su_sess.sid
						});
						su.s.setInfo('vk', su.vk.user_info);
						su.s.api('user.update', su.vk.user_info);
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
						if (seesu.vk.id ){
							_this.getAuth(seesu.vk.id);
						}
						
						
						
					} else{
						if (callback){callback(r);}
					}
				}
				
			},
			error: error
		});
		
	},
};