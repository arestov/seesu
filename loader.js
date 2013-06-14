var big_timer;
(function(){
"use strict";
requirejs.config({
	paths: {
		provoda: 'js/libs/provoda',
		spv: 'js/libs/spv',
		su: 'js/seesu',
		jquery: 'js/common-libs/jquery-2.0.0.min',
		localizer: 'js/libs/localizer',
		cache_ajax: 'js/libs/cache_ajax',
		app_serv: "js/app_serv",
		hex_md5: 'js/common-libs/md5.min',
		angbo: 'js/libs/StatementsAngularParser.min'
	},
	shim: {
		hex_md5: {
			exports: 'hex_md5'
		}
	}
});

window._gaq = window._gaq || [];
big_timer = {
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


(function() {
	var cbp;
	var opera = window.opera;
	var chrome = window.chrome;
	if (window.chrome && chrome.extension){
		cbp = chrome.extension.getBackgroundPage();
	} else if (window.opera && opera.extension && opera.extension.bgProcess){
		cbp = opera.extension.bgProcess;
	}
	//если у приложения не бывает вспслывающих окон, то интерфейс должен создаваться на странице этого окна
	var need_ui = (!cbp || cbp != window) && (!opera || !opera.contexts);
	if (need_ui){
		require(['spv', 'app_serv'], function(spv, app_serv) {
			app_serv.handleDocument(window.document);
		});
	}
	if (!need_ui){
		if (opera){
			window.opera_extension_button = opera.contexts.toolbar.createItem( {
					disabled: false,
					title: "Seesu - search and listen music",
					icon: "icons/icon18.png",
					popup:{
						href: "index.html",
						width: 600,
						height: 570
					}
				} );
			opera.contexts.toolbar.addItem( window.opera_extension_button );
		}
	}
	require(['su'], function() {
		
		//app thread;
	});
	if (need_ui){
		//ui thread;
		require(['su', 'js/views/AppView', 'angbo'], function(su, AppView, angbo) {
			var can_die = false;
			var md = su;
			var view = new AppView();
			md.mpx.addView(view, 'root');
			md.updateLVTime();

			view.init({
				mpx: md.mpx
			}, {d: window.document, allow_url_history: true, can_die: can_die, angbo: angbo});
			view.requestAll();
			//provoda.sync_r.connectAppRoot();
			window.app_view = view;
		});
	}

})();



})();
