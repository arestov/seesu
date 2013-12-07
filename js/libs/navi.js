define(['spv'], function(spv) {
'use strict';

var history_api = !!(window.history && window.history.pushState);
var hash_start = /^\#/;

var bindLocationChange = function(hashchangeHandler) {
	if (history_api){
		
		spv.addEvent(window, 'popstate', function(e){
			
			if (!e.state){
				var newhash = decodeURI(location.hash).replace(hash_start, '');
				if (typeof hashchangeHandler == 'function'){
					hashchangeHandler({
						newURL: newhash
					});
				}
			} else {
				if (typeof hashchangeHandler == 'function'){
					hashchangeHandler({
						newURL: e.state.uniq_url
					});
				}
			}
			//console.log(e.state);
		});
	} else if ('onhashchange' in window){
		(function(){
			var hash = decodeURI(location.hash).replace(hash_start, '');
			spv.addEvent(window, 'hashchange', function(e){
				e = e || window.Event;
				var newhash = decodeURI(location.hash).replace(hash_start, '');
				if (newhash != hash){
					
					if (typeof hashchangeHandler == 'function'){
						hashchangeHandler({
							newURL: newhash
						});
					}
					hash = newhash;


				}
			});
		})();

	} else{
		(function(){
			var hash = decodeURI(location.hash).replace(hash_start, '');
			setInterval(function(){
				var newhash = decodeURI(location.hash).replace(hash_start, '');
				if (newhash != hash){
					
					if (typeof hashchangeHandler == 'function'){
						hashchangeHandler({
							newURL: newhash
						});
					}
					hash = newhash;
				}

			},150);
		})();
	}
};

var navi;
(function() {
	var url_base = null;
	var getURLBase = function(){
		if (url_base === null){
			var cbase;
			if (location.href.indexOf('#') > -1){
				cbase = location.href.slice(0, location.href.indexOf('#'));
			} else{
				cbase = location.href;
			}
			url_base = cbase;
		}
		
		return url_base;
	};
	var zerofy = function(str, digits){
		str = "" + str;
		if (digits){
			while (str.length < digits){
				str = 0 + str;
			}
		}
		return str;
	};
	var tag_regexp = /\ ?\$...$/;
	var history_array = [];
	var current_histate = null;

	navi = {
		disallow_native_history: false,
		counter: Math.round((Math.random() * parseInt('zzz', 36))),
		states_index: {},
		fake_current_url:'',

		init: function(hashChangeRecover) {
			this.hashChangeRecover = hashChangeRecover;
			var _this = this;
			bindLocationChange(function(){
				_this.hashchangeHandler.apply(_this, arguments);
			});
		},
		getUniqId: function(){
			var uniq_tag = (uniq_tag = (this.counter++).toString(36)) && zerofy(uniq_tag.substring(uniq_tag.length-3, uniq_tag.length), 3);
			return uniq_tag;
		},
		setFakeURL: function(url){
			if (this.fake_current_url != url){
				this.fake_current_url = url;
			}
			current_histate = this.findHistory(url);
			//
		},
		getFakeURL: function(){
			return this.fake_current_url;
		},
		getURLData: function(url){
			var parts = url.match(tag_regexp);
			var tag = parts && parts[0],
				clear_url	= url.replace(tag_regexp, ''),
				uniq_url	= url + (tag || (' $' + this.getUniqId()));

			return {
				clear_url: clear_url,
				uniq_url: uniq_url
			};
		},
		_saveHistory: function(url, data, old_url){

			var fakeud = this.getURLData(this.fake_current_url);
			var replace;

			if (old_url){

				var oldud = this.getURLData(old_url);
					replace = fakeud.clear_url == oldud.clear_url;
			}

			var ud = this.getURLData(url);
			if ((fakeud.clear_url !=  ud.clear_url) || replace){
				if (!this.states_index[ud.uniq_url]){
					this.setFakeURL(ud.uniq_url);
					var history_obj = {
						url: ud.clear_url,
						data: data,
						num: 0
					};
					this.states_index[ud.uniq_url] = history_obj;
					if (!replace){
						history_obj.num = history_array.length;
						history_array[history_obj.num] = history_obj;

						if (!this.disallow_native_history){
							if (history_api){
								window.history.pushState({uniq_url: ud.uniq_url}, '', getURLBase() + '#' + ud.clear_url);
							} else {
								location.assign(getURLBase() + '#' + ud.uniq_url);
							}
						}

						
						
						
					} else {

						var num = (current_histate && current_histate.num);
						if (typeof num != 'number'){
							num = history_array.length;//must be zero
							//if (num !== 0){
								//console.log(fakeud, ud, history_obj);
							//}
						}
						history_array.length = num + 1;
						history_array[num] = history_obj;

						if (!this.disallow_native_history){
							if (history_api){
								window.history.replaceState({uniq_url: ud.uniq_url}, '', getURLBase() + '#' + ud.clear_url);
							} else {
								location.replace(getURLBase() + '#' + ud.uniq_url);
							}
						}
						
						

					}
					current_histate = history_obj;

				}
			}


		},
		set: function(url, data){
			this._saveHistory(decodeURI(url), data);
		},
		replace: function(oldurl, url, data){
			this._saveHistory(decodeURI(url), data, decodeURI(oldurl));
		},
		findHistory: function(url){
			return this.states_index[url];
		},
		hashchangeHandler: function(e, soft){
			if (e.newURL != decodeURI(this.getFakeURL())){
				this.setFakeURL(e.newURL);
				this.hashChangeRecover(e, soft);
			}
		},
		trickyBack: function() {
			if (current_histate){
				this.hashChangeRecover({
					
				});
				return true;
			} else {
				return false;
			}
			//можно использовать только, когда гарантированного параллельно не будет использоваться другие способы навигации (вызвать браузером кнопку назад, или ввести другой url)
		}

	};
})();

return navi;
});