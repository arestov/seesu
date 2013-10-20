define(['spv'], function(spv) {
'use strict';

var history_api = !!(window.history && window.history.pushState);
var hash_start = /^\#/;

var bindLocationChange = function(hashchangeHandler) {
	if (history_api){
		var hash = location.hash.replace(hash_start, '');
		spv.addEvent(window, 'popstate', function(e){
			var newhash = location.hash.replace(hash_start, '');
			if (!e.state){
				if (newhash != hash){
					if (typeof hashchangeHandler == 'function'){
						hashchangeHandler({
							newURL: newhash,
							oldURL: hash
						});
					}
				}
			}
			
			hash = newhash;
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
							newURL: newhash,
							oldURL: hash
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
							newURL: newhash,
							oldURL: hash
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
	var getURLBase = function(){
		var cbase;
		if (location.href.indexOf('#') > -1){
			cbase = location.href.slice(0, location.href.indexOf('#'));
		} else{
			cbase = location.href;
		}
		return cbase;
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
	navi = {
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
					this.states_index[ud.uniq_url] = {
						url: ud.clear_url,
						data: data
					};
					if (!replace){
						location.assign(getURLBase() + '#' + ud.uniq_url);
					} else{
						location.replace(getURLBase() + '#' + ud.uniq_url);
					}

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
				if (e.oldURL != e.newURL){
					this.hashChangeRecover(e, soft);
				}
			}
		}

	};
})();

//https://developer.tizen.org/
spv.addEvent(window, 'tizenhwkey', function(e) {
	if(e.keyName == "back"){
		//tizen.application.getCurrentApplication().exit();
		window.history.back();
	}
});

return navi;
});