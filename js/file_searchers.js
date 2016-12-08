define(function (require) {
'use strict';
var spv = require('spv');
var FuncsQueue = require('./libs/FuncsQueue');
var ProspApi = require('./libs/ProspApi');
var ScApi = require('./libs/ScApi');
// var torrent_searches = require('./modules/torrent_searches');

return function (app, mp3_search, app_env, cache_ajax, resortQueue, addQueue) {
  app.pleer_net = new ProspApi(new FuncsQueue({
    time: [3500, 5000, 4],
    resortQueue: resortQueue,
    init: addQueue
  }), app_env.cross_domain_allowed, cache_ajax);

  mp3_search.add(new ScApi.ScMusicSearch({
    api: app.sc_api,
    mp3_search: mp3_search
  }));

  if (app_env.cross_domain_allowed) {
		mp3_search.add(new ProspApi.ProspMusicSearch({
			api: app.pleer_net,
			mp3_search: mp3_search
		}));
	}


	/*var exfm_api = new ExfmApi(new FuncsQueue({
		time: [3500, 5000, 4],
		resortQueue: resortQueue,
		init: addQueue
	}), app_env.cross_domain_allowed, cache_ajax);
	app.exfm = exfm_api;

	mp3_search.add(new ExfmApi.ExfmMusicSearch({
		api: exfm_api,
		mp3_search: mp3_search
	}));
	*/
  if (app_env.nodewebkit) {
		// requirejs(['js/libs/TorrentsAudioSearch'], function(TorrentsAudioSearch) {
		// 	mp3_search.add(new TorrentsAudioSearch({
		// 		cache_ajax: cache_ajax,
		// 		queue: new FuncsQueue({
		// 			time: [100, 150, 4],
		// 			resortQueue: resortQueue,
		// 			init: addQueue
		// 		}),
		// 		mp3_search: mp3_search,
		// 		torrent_search: new torrent_searches.BtdiggTorrentSearch({
		// 			queue: new FuncsQueue({
		// 				time: [3500, 5000, 4],
		// 				resortQueue: resortQueue,
		// 				init: addQueue
		// 			}),
		// 			cache_ajax: cache_ajax,
		// 			mp3_search: mp3_search
		// 		})
		// 	}));
    //
		// });
	} else {
		// var allow_torrents = false || app_env.nodewebkit;
    //
		// if (allow_torrents && !(app_env.chrome_app || app_env.chrome_ext || app_env.tizen_app)){
		// 	if (app_env.torrents_support) {
		// 		mp3_search.add(new torrent_searches.BtdiggTorrentSearch({
		// 			queue: new FuncsQueue({
		// 				time: [3500, 5000, 4],
		// 				resortQueue: resortQueue,
		// 				init: addQueue
		// 			}),
		// 			cache_ajax: cache_ajax,
		// 			mp3_search: mp3_search
		// 		}));
		// 	} else if (app_env.cross_domain_allowed){
		// 		mp3_search.add(new torrent_searches.isohuntTorrentSearch({
		// 			cache_ajax: cache_ajax,
		// 			mp3_search: mp3_search
		// 		}));
		// 	} else {
		// 		mp3_search.add(new torrent_searches.googleTorrentSearch({
		// 			crossdomain: app_env.cross_domain_allowed,
		// 			mp3_search: mp3_search,
		// 			cache_ajax: cache_ajax
		// 		}));
		// 	}
		// }
	}

  var reportSearchEngs = spv.debounce(function(string){
    app.trackVar(4, 'search', string, 1);
  }, 300);

  mp3_search.on('list-changed', function(list){
    list = spv.filter(list, 'name').sort();
    for (var i = 0; i < list.length; i++) {
      list[i] = list[i].slice(0, 2);
    }
    reportSearchEngs(list.join(','));
  });
};
});
