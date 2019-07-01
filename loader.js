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

			hex_md5: 'js/common-libs/md5',
			'Promise': 'js/common-libs/Promise-3.1.0.mod'
		}
	},
	waitSeconds: window.tizen && 0
});
var seesu_version = 4.97;

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
	requirejs(['su', 'pv', 'env', 'js/initBrowsing'], function(SeesuApp, pv, env, initBrowsing) {
		//app thread;
		var views_proxies = new pv.views_proxies.Proxies();
		window.views_proxies = views_proxies;
    var flow = new pv.CallbacksFlow(window)
    flow.input(function() {
      window.appModel = su = seesu  = new SeesuApp({
        _highway: {
          models_counters: 1,
          sync_sender: new pv.SyncSender(),
          views_proxies: views_proxies,
          models: {},
          calls_flow: flow,
          proxies: views_proxies,
          env: env
        }
      }, seesu_version);

      window.root_bwlev = initBrowsing(window.appModel);

      if (need_ui) {
  			initViews(window.root_bwlev, window.appModel, views_proxies, window, false, true);
  		}
    })


	});

	if (need_ui) {
		requirejs(['js/views/AppView', 'pv', 'spv'], function() {
			// preload modules
		});
	}

	function initViews(root_bwlev, appModel, proxies, win, can_die, need_exposed) {
		//ui thread;
		requirejs(
			['js/views/AppView', 'js/views/RootBwlevView', 'pv', 'spv'],
			function(AppView, createRootBwlevView, pv, spv) {
			appModel.input(function() {
        appModel.updateLVTime(); // useless?
      })

			var proxies_space = Date.now();
			proxies.addSpaceById(proxies_space, root_bwlev);
			var mpx = proxies.getMPX(proxies_space, appModel);
			var doc = win.document;

			initMainView();

			if (!need_exposed) {
				return;
			}

			initExposedView();
			return;

			function initMainView() {
				var mpx = proxies.getMPX(proxies_space, root_bwlev);

				var RootView = createRootBwlevView(AppView);
				var view = new RootView(options(false, mpx), {d: doc, can_die: can_die, bwlev: root_bwlev});

				mpx.addView(view, 'root');
				view.onDie(function() {
					//views_proxies.removeSpaceById(proxies_space);
					view = null;
				});
				view.requestAll();
			}

			function initExposedView() {
				var exposed_view = new AppView.AppExposedView(options(true, mpx), {d: doc, can_die: can_die});
				mpx.addView(exposed_view, 'exp_root');
				exposed_view.requestAll();
			}

			function options(usual_flow, mpx) {
				return {
					mpx: mpx,
					proxies_space: proxies_space,
					_highway: {
						views_counter: 1,
						views_proxies: proxies,
						calls_flow: new pv.CallbacksFlow(win),
						local_calls_flow: new pv.CallbacksFlow(spv.getDefaultView(doc), !usual_flow, 250)
					}
				};
			}
		});
	}

})();



})();
