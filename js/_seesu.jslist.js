var jsLoadComplete,
	navi;

(function() {
	"use strict";
	var completed;
	var base_path = '';
	if (typeof bpath != 'undefined' && bpath){
		base_path = bpath;
	}
	
	var js_toload = [
	"js/libs/serv.js",
	"js/libs/w_storage.js",
	"js/app_serv.js",

	"js/seesu.ui.dom_ready.js",
	"js/common-libs/jquery-1.8.0.mod.min.js",
	"js/libs/localizer.js",
	
	"js/libs/c_cache_ajax.js",
	"js/common-libs/md5.min.js",

	"js/libs/funcsStack.js",
	"js/libs/funcsQueue.js",
	//"js/libs/c_quene.js",
	"js/prototypes/provoda.js",
	
	//"js/common-libs/jquery.debounce-1.0.5.js", //remove!
	
	"js/libs/browse_map.js",
	"js/common-libs/htmlencoding.js",
	
	"js/network.js",
	"js/network.songs-search.js",
	"js/libs/network.soundcloud.js",
	"js/libs/network.vk.auth.js",
	"js/libs/network.vk.api.js",
	"js/libs/exfm.js",
	"js/libs/lastfm.core.js",
	"js/libs/lastfm.serv.js",
	"js/network.lastfm.js",
	"js/lastfm.data.js",
	"js/su-prototypes/su.serv-prototypes.js",
	"js/seesu.star-page-blocks.js",

	"js/seesu.ui.views.js",
	"js/seesu.ui.js",
	"js/seesu.s.js",
	"js/libs/mp3_search.js",
	"js/su-prototypes/su-song.ui.js",
	"js/prototypes/song.m.js",

	"js/su-prototypes/su-song.m.js",
	"js/su-prototypes/su-mfcomplect.js",
	"js/seesu.js",
	"js/prototypes/songs-list.js",
	"js/su-prototypes/su-songs-list.js",
	"js/prototypes/songFile.js",
	"js/prototypes/search-investigation.js",
	"js/prototypes/searchSection.js",
	
	"js/libs/lastfm.search.js",
	"js/seesu.search.js",
	"js/su-prototypes/su-playlists-row.js",
	"js/su-prototypes/su-share-row.js",
	"js/su-prototypes/su-love-row.js",
	"js/prototypes/player.base.js",
	"js/prototypes/player.complex.js",

	"js/su-prototypes/su-player.js",

	"js/libs/c_buttmen.js",
	"js/pressed_node_tester.js"
	];
	var bpathWrap = function(array){
		if (base_path){
			for (var i=0; i < array.length; i++) {
				array[i] = base_path + array[i];
			}
		}
		return array;
	};
	
	var
		js_loadcomplete = [],
		js_loadtest = [];

	var testCbs = function() {
		for (var i = 0; i < js_loadtest.length; i++) {
			var cur = js_loadtest[i];
			if (cur && cur.test()){
				js_loadtest[i] = null;
				cur.fn();
			}
		};
	};;



	jsLoadComplete = function(callback){
		if (typeof callback == 'function'){
			if (completed){
				callback();
			} else{
				js_loadcomplete.push(callback);
			}
		} else if (callback && callback.fn && callback.test){
			if (callback.test()){
				callback.fn();
			} else {
				js_loadtest.push(callback);
			}
			
		}
	};
	jsLoadComplete.change = function() {
		testCbs();
	};
	jsLoadComplete({
		test: function(){
			return window.app_env && (app_env.opera_widget || app_env.firefox_widget) && window.debounce && window.domReady && window.suStore;
		},
		fn: function() {
			yepnope(base_path + "js/widget.resize.js");
		}
	});

	jsLoadComplete({
		test: function(){
			return window.su;
		},
		fn: function() {
			if (app_env.needs_url_history){
				yepnope(base_path +  "js/seesu.url_games.js");
			} else {
				navi = {};
				navi.set = navi.replace = function(){return false;};
			}
		}
	});
	jsLoadComplete({
		test: function(){
			return window.browseMap;
		},
		fn: function() {
			if (!app_env.safe_data){
				yepnope(base_path + "js/network.data.js");
			}
		}
	});

	yepnope([
		{
			test: window.JSON,
			nope: "js/common-libs/json2.min.js"
		},
		{
			load: bpathWrap(js_toload),
			complete: function(){
				completed = true;
				big_timer.q.push([big_timer.base_category, 'ready-jsload', big_timer.comp('page-start'), 'All JSs loaded', 100]);
				while (js_loadcomplete.length){
					js_loadcomplete.shift()();
				}
			},
			callback: function(url){
				testCbs();
			}
		}
	]);
})();