(function() {
	var js_toload = [
	"js/w_storage.js", 
	"js/c_quene.js", 
	"js/c_cache_ajax.js",  
	"js/md5.min.js", 
	"js/jquery-1.6.2.mod.min.js", 
	"js/app_serv.js", 
	"js/serv.js", 
	"js/widget.resize.js", 
	"js/browse_map.js", 
	"js/htmlencoding.js", 
	"js/localizer.js", 
	"js/jquery.debounce-1.0.5.js", 
	"js/network.js", 
	"js/network.soundcloud.js", 
	"js/network.vk.api.js", 
	"js/network.lastfm.js", 
	"js/seesu.ui.dom_ready.js", 
	"js/seesu.ui.js", 
	"js/seesu.s.js", 
	"js/seesu.song_ui.js", 
	"js/seesu.js", 
	"js/seesu.url_games.js", 
	"js/seesu.mp3_search.js", 
	"js/seesu.search.js", 
	"js/seesu.player.sm2.js", 
	"js/seesu.player.js", 
	"js/c_buttmen.js", 
	"js/pressed_node_tester.js"
	];
	if (typeof bpath != 'undefined' && bpath){
		for (var i=0; i < js_toload.length; i++) {
			js_toload[i] = bpath + js_toload[i];
		};
	}
	var js_loadcomplete = [];
	window.jsLoadComplete = function(callback){
		if (js_toload.completed){
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
			load: js_toload,
			complete: function(){
				js_toload.completed = true;
				for (var i = js_loadcomplete.length - 1; i >= 0; i--){
					var f = js_loadcomplete.pop();
					f();
				};
			}
		}
	]);
})();




