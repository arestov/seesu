var bpath = '';
window._gaq = window._gaq || [];
var big_timer = {
	setN: function(name){
		var time = new Date() * 1;
		if (name){
			this[name] = time;
		}
		return time;
	},
	comp: function(name) {
		var now = this.setN();
		return now - this[name];
	},
	base_category: 'App init',
	"page-start": new Date() * 1,
	q: []
};
		
(function(){
function isFileReady ( readyState ) {
    // Check to see if any of the ways a file can be ready are available as properties on the file's element
    return ( ! readyState || readyState == 'loaded' || readyState == 'complete' );
}
	
	
var p = document.getElementsByTagName('script');
p = p[p.length-1];
		
window.loadJS = function(src, callback){
	var s = document.createElement('script'),
		done;
	s.onreadystatechange = s.onload = function () {

	if ( ! done && isFileReady( s.readyState ) ) {

		// Set done to prevent this function from being called twice.
		done = true;
		callback();

		// Handle memory leak in IE
		s.onload = s.onreadystatechange = null;
	}
	};
	s.src = src;
	p.parentNode.insertBefore(s, p);
};
})();
loadJS(bpath + 'js/common-libs/yepnope.1.5.4-min.js', function(){
	big_timer.q.push([big_timer.base_category, 'ready-yepnope', big_timer.comp('page-start'), 'yepnope loaded', 100]);

	yepnope({
		load: bpath + 'js/_seesu.jslist.js',
		complete: function(){
			var cbp;
			if (window.chrome && chrome.extension){
				cbp = chrome.extension.getBackgroundPage();
			} else if (window.opera && opera.extension && opera.extension.bgProcess){
				cbp = opera.extension.bgProcess;
			}
			//если у приложения не бывает вспслывающих окон, то интерфейс должен создаваться на странице этого окна
			if (!cbp || cbp != window){
				//big_timer.sui_want = new Date();
				jsLoadComplete({
					test: function() {
						return window.app_env;
					},
					fn: function() {
						handleDocument(window.document, {category: big_timer.base_category, start_time: "page-start"});
						//
					}
				});
				jsLoadComplete({
					test: function() {
						return window.appTelegrapher;
					},
					fn: function() {

						var app_tph = new appTelegrapher();
						app_tph.init(window, {category: big_timer.base_category, start_time: "page-start"});
						//
						provoda.sync_r.connectAppRoot();
						window.app_view = app_tph.app_view;
					}
				});
			}
			
		}
	});
});