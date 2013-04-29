requirejs.config({
	paths: {
		provoda: 'js/prototype/provoda',
		spv: 'js/libs/spv',
		su: 'js/seesu',
		jquery: 'js/common-libs/jquery-2.0.0.min.js'
	}
});
(function() {
	var cbp;
	if (window.chrome && chrome.extension){
		cbp = chrome.extension.getBackgroundPage();
	} else if (window.opera && opera.extension && opera.extension.bgProcess){
		cbp = opera.extension.bgProcess;
	}
	//если у приложения не бывает вспслывающих окон, то интерфейс должен создаваться на странице этого окна
	var need_ui = !cbp || cbp != window;

	if (need_ui){
		require(['spv', 'js/app_serv'], function(spv, app_serv) {
			app_serv.handleDocument(window.document, {category: big_timer.base_category, start_time: "page-start"});
		});
		require(['js/seesu', 'js/views/AppView'], function(su, AppView) {
			var can_die = false;
			var md = su;
			var view = new AppView();
			md.mpx.addView(view, 'root');
			md.updateLVTime();

			view.init({
				mpx: md.mpx
			}, {d: window.document, allow_url_history: true, can_die: can_die});
			view.requestAll();
			provoda.sync_r.connectAppRoot();
			window.app_view = view;
			var tracking_opts =  {category: big_timer.base_category, start_time: "page-start"};
		});
	}
})();


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
			require(['js/app_serv'], function(app_serv) {
				
				
				if (need_ui){
					//big_timer.sui_want = new Date();

					

				}
			});
			
			
		}
	});
});