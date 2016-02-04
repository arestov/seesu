var su, seesu;

(function(){
"use strict";
requirejs.config({
	packages: [
		{
			name: 'pv',
			location: 'js/libs/provoda',
			main: 'provoda'
		}
	],
	paths: {
		//pv: 'js/libs/provoda/provoda',
		spv: 'js/libs/spv',
		su: 'js/seesu',
		angbo: 'js/libs/provoda/StatementsAngularParser.min',
		jquery: 'js/common-libs/jquery-2.1.4.min',
		localizer: 'js/libs/localizer',
		cache_ajax: 'js/libs/cache_ajax',
		app_serv: "js/app_serv",
		view_serv: "js/views/modules/view_serv",
		env: "js/env",
		hex_md5: 'js/common-libs/md5.min',
	},
	shim: {
		hex_md5: {
			exports: 'hex_md5'
		}
	},
	waitSeconds: window.tizen && 0
});
var seesu_version = 4.8;

window._gaq = window._gaq || [];

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
		requirejs(['spv', 'view_serv'], function(spv, view_serv) {
			view_serv.handleDocument(window.document);
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
	requirejs(['su', 'pv'], function(SeesuApp, pv) {

		su = seesu = new SeesuApp();
		su.init(seesu_version);
		pv.sync_s.setRootModel(su);


		if (need_ui) {
			initViews(su);
		}

		//app thread;
	});

	if (need_ui) {
		requirejs(['js/views/AppView', 'pv'], function() {
			// preload modules
		});
	}

	function initViews(su) {
		//ui thread;
		requirejs(['js/views/AppView', 'pv'], function(AppView, pv) {
			var can_die = false;
			var md = su;

			var proxies_space = Date.now();
			var views_proxies = pv.views_proxies;
			views_proxies.addSpaceById(proxies_space, md);
			var mpx = views_proxies.getMPX(proxies_space, md);


			md.updateLVTime();

			(function() {
				var view = new AppView({
					mpx: mpx,
					proxies_space: proxies_space
				}, {d: window.document, can_die: can_die});
				mpx.addView(view, 'root');
				view.onDie(function() {
					//views_proxies.removeSpaceById(proxies_space);
					view = null;
				});
				view.requestAll();
			})();


			(function() {
				var exposed_view = new AppView.AppExposedView({
					mpx: mpx,
					proxies_space: proxies_space
				}, {d: window.document, can_die: can_die, usual_flow: true});
				mpx.addView(exposed_view, 'exp_root');
				exposed_view.requestAll();
			})();


		});
	}

})();



})();
