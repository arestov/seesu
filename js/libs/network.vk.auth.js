var vkAuth = function(opts) {
	this.init(opts);
};
provoda.Eventor.extendTo(vkAuth, {
	init: function(opts) {

		//app_id, urls, permissions, open_api, deep_sanbdox



		this.app_id = opts.app_id;
		this.urls = opts.urls;
		this.permissions = spv.toRealArray(opts.permissions);
		if (opts.open_api){
			this.open_api = true;
		}
		if (opts.vksite_app){
			this.vksite_app = true;
			if (opts.vksite_settings){
				this.vksite_settings = parseFloat(opts.vksite_settings);
			}
		}
		if (opts.deep_sanbdox){
			this.deep_sanbdox = true;
		}
		this._super();

		this.on('vk-site-api', function(VK) {
			var _this = this;
			if (_this.vksite_app){
				VK.addCallback('onSettingsChanged', function(sts){
					_this.vksite_settings = sts;
					setTimeout(function() {
						_this.trigger('settings-change', sts);
					}, 500);
					
					
				});
			}
			
			_this.VK = VK;
		});
		return this;
	},
	checkSettings: function(settings_bits) {
		if (this.vksite_app && this.vksite_settings){
			if ((this.vksite_settings & settings_bits) * 1){
				return true;
			}
		}
	},
	requestAuth: function(p){
		if (this.vksite_app){
			if (!p.settings_bits){
				throw new Error('give me settings bits');
			}
			if (this.VK){
				this.VK.callMethod('showSettingsBox', p.settings_bits);
			} else {
				
			}
			return true;
		} else {
			return this.authInit(p || {});
		}
		
	},
	bindAuthReady: function(exlusive_space, callback, settings_bits) {
		var event_name;
		if (this.vksite_app){
			event_name = exlusive_space ? 'settings-change.' + exlusive_space : 'settings-change';
			this.on(event_name, function(sts) {
				if (settings_bits){
					if ((sts & settings_bits) * 1){
						callback.call(this);
					}
				} else {
					callback.call(this);
				}
				
			}, {
				exlusive: !!exlusive_space
			});
		} else {
			event_name = exlusive_space ? 'full-ready.' + exlusive_space : 'full-ready';
			this.on(event_name, callback,  {
				exlusive: !!exlusive_space
			});
		}
	},
	startIndicating: function() {
		
	},
	stopIndicating: function() {
		
	},
	getInitAuthData: function(p){
		var ru = p && p.ru;
		
		var o = {};
		
		var domain = ru ? "vkontakte.ru" :  'vk.com';
		var base = this.open_api ? 'http://api.' + domain + "/oauth/authorize?" : "http://oauth." + domain + "/authorize?" ;

		o.link = base + 'client_id=' + this.app_id +'&scope=' + this.permissions.join(',')+ '&display=page&response_type=token';
		var link_tag = this.urls.callbacker;
		
		if (!this.deep_sanbdox){
			o.bridgekey = hex_md5(Math.random() + 'bridgekey'+ Math.random());
			link_tag += '?key=' + o.bridgekey;
		}
		o.link += '&redirect_uri=' + encodeURIComponent(link_tag);
		return o;
	},
	waitData: function() {
		this.trigger('data_wait');
		this.data_wait = true;
	},
	createAuthFrame: function(first_key){
		var _this = this;
		if (this.auth_inited){
			return false;
		}
		var i = this.auth_frame = document.createElement('iframe');
		spv.addEvent(window, 'message', function(e){
			if (e.data == 'vk_bridge_ready:'){
			//	console.log('vk_bridge_ready');
				_this.trigger('vk-bridge-ready');
				e.source.postMessage("add_keys:" + first_key, '*');
			} else if(e.data.indexOf('vk_token:') === 0){
				_this.trigger('vk-token-receive', e.data.replace('vk_token:',''));
				//vkTokenAuth(e.data.replace('vk_token:',''));
			//	console.log('got vk_token!!!!');
			//	console.log(e.data.replace('vk_token:',''));
				seesu.trackEvent('Auth to vk', 'end');
			} else if (e.data == 'vk_error:'){
				_this.trigger('vk-token-error');
			}
		});
		$(i).addClass('hidden');
		i.src = this.urls.bridge;
		$(function() {
			document.body.appendChild(i);
		});
		this.auth_inited = true;
	},
	setAuthBridgeKey: function(key){
		if (!this.auth_inited){
			this.createAuthFrame(key);
		} else{
			this.auth_frame.contentWindow.postMessage("add_keys:" + key, '*');
		}
	},
	authInit: function(p){
		var _this = this;
		
		//init_auth_data.bridgekey

		var init_auth_data = this.getInitAuthData(p);
		if (init_auth_data.bridgekey){
			this.setAuthBridgeKey(init_auth_data.bridgekey);
		}
		//open_urls

		if (!p.not_open){
			this.trigger('want-open-url', init_auth_data.link, init_auth_data);
			this.waitData();
		} else{
			this.startIndicating();
			setTimeout(function(){
				_this.stopIndicating();
			},10000);
			
		}
		return init_auth_data;
	}
	
});

var vkTokenAuth = function(app_id, vk_t) {
	vk_t = (vk_t ===  Object(vk_t)) ? vk_t : JSON.parse(vk_t);
	vk_t.expires_in = parseFloat(vk_t.expires_in) * 1000;
	cloneObj(this, vk_t);
	this.app_id = app_id;
};



