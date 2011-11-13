(function() {
	var completed;
	var base_path = '';
	if (typeof bpath != 'undefined' && bpath){
		base_path = bpath;
	}
	
	var js_toload = [
	"js/w_storage.js", 
	"js/c_quene.js", 
	"js/c_cache_ajax.js",
	"js/md5.min.js", 
	"js/jquery-1.6.2.mod.min.js", 
	"js/app_serv.js", 
	"js/serv.js", 
	"js/jquery.debounce-1.0.5.js",
	"js/browse_map.js", 
	"js/htmlencoding.js", 
	"js/localizer.js", 
	"js/network.js", 
	"js/network.soundcloud.js", 
	"js/network.vk.api.js", 
	"js/network.lastfm.js", 
	"js/seesu.ui.dom_ready.js", 
	"js/seesu.ui.views.js", 
	"js/seesu.ui.js", 
	"js/seesu.s.js", 
	"js/seesu.song_ui.js", 
	"js/seesu.js",
	"js/seesu.mp3_search.js", 
	"js/seesu.search.js", 
	"js/seesu.player.js", 
	"js/c_buttmen.js", 
	"js/pressed_node_tester.js"
	];
	var bpathWrap = function(array){
		if (base_path){
			for (var i=0; i < array.length; i++) {
				array[i] = base_path + array[i];
			};
		}
		return array;
	}
	
	var js_loadcomplete = [];
	window.jsLoadComplete = function(callback){
		if (completed){
			setTimeout(function(){
				callback();
			},30)
			
		} else{
			js_loadcomplete.push(callback);
		}
	};
	yepnope([
		{
			test: window.JSON,
			nope: "js/json2.min.js"
		},
		{
			load: bpathWrap(js_toload),
			complete: function(){
				completed = true;
				for (var i = js_loadcomplete.length - 1; i >= 0; i--){
					var f = js_loadcomplete.pop();
					f();
				};
			},
			callback: function(url){
				if (url.indexOf('jquery.debounce-1.0.5.js') != -1){
					if(!$.browser.msie && (app_env.opera_widget || app_env.firefox_widget)){
						yepnope(base_path + "js/widget.resize.js")
					}
				} else if (url.indexOf('seesu.js') != -1){
					if (app_env.needs_url_history){
						yepnope(base_path +  "js/seesu.url_games.js")
					} else{
						navi = {};
						navi.set = navi.replace = function(){return false;};
					}
				} else if (url.indexOf('app_serv.js') != -1){
					if (!app_env.safe_data){
						yepnope(base_path + "js/seesu.network.data.js")
					}
				}
			
			}
		}
	]);
})();




