var su, seesu;

(function(){
"use strict";
requirejs.config({
	paths: {
		jquery: 'js/common-libs/jquery-2.1.4.min',
		angbo: 'js/libs/provoda/StatementsAngularParser.min',
	},
	map: {
		'*': {
			su: 'js/seesu',

			pv: 'js/libs/provoda/provoda',
			View: 'js/libs/provoda/View',

			spv: 'js/libs/spv',
			app_serv: "js/app_serv",
			localizer: 'js/libs/localizer',
			view_serv: "js/views/modules/view_serv",
			cache_ajax: 'js/libs/cache_ajax',
			env: "js/env",

			hex_md5: 'js/common-libs/md5'

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
	requirejs(['su', 'pv', 'env'], function(SeesuApp, pv, env) {
		//app thread;
		var proxies = new pv.views_proxies.Proxies();
		su = seesu  = new SeesuApp();
		su.init({
			_highway: {
				models_counters: 1,
				sync_sender: new pv.SyncSender(),
				views_proxies: proxies,
				models: {},
				calls_flow: new pv.CallbacksFlow(window),
				proxies: proxies,
				env: env
			}
		}, seesu_version);

		if (need_ui) {
			initViews(su, proxies);
		}
	});

	if (need_ui) {
		requirejs(['js/views/AppView', 'pv', 'spv'], function() {
			// preload modules
		});
	}

	function initViews(su, proxies) {
		//ui thread;
		requirejs(['js/views/AppView', 'pv', 'spv'], function(AppView, pv, spv) {
			var can_die = false;
			var md = su;

			var proxies_space = Date.now();
			// var views_proxies = pv.views_proxies;
			proxies.addSpaceById(proxies_space, md);
			var mpx = proxies.getMPX(proxies_space, md);

			var doc = window.document;

			md.updateLVTime();

			(function() {
				var view = new AppView(options(), {d: doc, can_die: can_die});
				mpx.addView(view, 'root');
				view.onDie(function() {
					//views_proxies.removeSpaceById(proxies_space);
					view = null;
				});
				view.requestAll();
			})();


			(function() {
				var exposed_view = new AppView.AppExposedView(options(true), {d: doc, can_die: can_die});
				mpx.addView(exposed_view, 'exp_root');
				exposed_view.requestAll();
			})();

			function options(usual_flow) {
				return {
					mpx: mpx,
					proxies_space: proxies_space,
					_highway: {
						views_counter: 1,
						views_proxies: proxies,
						calls_flow: new pv.CallbacksFlow(window),
						local_calls_flow: new pv.CallbacksFlow(spv.getDefaultView(doc), !usual_flow, 250)
					}
				};
			}
		});
	}

})();



})();
