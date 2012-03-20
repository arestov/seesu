var vkAuth = function(app_id, urls, permissions, open_api, deep_sanbdox) {
	this.init(app_id, urls, permissions, open_api, deep_sanbdox);
};
eemiter.extendTo(vkAuth, {
	init: function(app_id, urls, permissions, open_api, deep_sanbdox) {
		this.app_id = app_id;
		this.urls = urls;
		this.permissions = toRealArray(permissions);
		if (open_api){
			this.open_api = true;
		}
		
		if (deep_sanbdox){
			this.deep_sanbdox = true;
		}
		this._super();
		return this;
	},
	requestAuth: function(p){
		return this.authInit(p || {});
	},
	startIndicating: function() {
		
	},
	stopIndicating: function() {
		
	},
	waitData: function() {
		this.fire('data-wait');
	},
	createAuthFrame: function(first_key){
		var _this = this;
		if (this.auth_inited){
			return false;
		}
		var i = this.auth_frame = document.createElement('iframe');	
		addEvent(window, 'message', function(e){
			if (e.data == 'vk_bridge_ready:'){
				console.log('vk_bridge_ready')
				_this.fire('vk-bridge-ready');
				e.source.postMessage("add_keys:" + first_key, '*');
			} else if(e.data.indexOf('vk_token:') === 0){
				_this.fire('vk-token-receive', e.data.replace('vk_token:',''));
				//vkTokenAuth(e.data.replace('vk_token:',''));
				console.log('got vk_token!!!!')
				console.log(e.data.replace('vk_token:',''));
				//seesu.track_event('Auth to vk', 'end');
			} else if (e.data == 'vk_error:'){
				_this.fire('vk-token-error');
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
			this.createAuthFrame(key)
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
			this.fire('want-open-url', init_auth_data.link, init_auth_data);
			this.waitData();
		} else{
			this.startIndicating();
			setTimeout(function(){
				_this.stopIndicating();
			},10000);
			
		}
		return init_auth_data;
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
	}
});

var vkTokenAuth = function(app_id, vk_t) {
	vk_t = (vk_t ===  Object(vk_t)) ? vk_t : JSON.parse(vk_t);
	vk_t.expires_in = parseFloat(vk_t.expires_in) * 1000;
	cloneObj(this, vk_t);
	this.app_id = app_id;
};



