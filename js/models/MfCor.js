define(['pv', 'spv', 'app_serv' ,'cache_ajax', 'js/modules/aReq', 'js/models/Mp3Search/index', './comd', './YoutubeVideo', './LoadableList', 'js/libs/BrowseMap'],
function(pv, spv, app_serv, cache_ajax, aReq, Mp3Search, comd, YoutubeVideo, LoadableList, BrowseMap) {
"use strict";
var routePathByModels = BrowseMap.routePathByModels;
var pvState = pv.state;
var pvUpdate = pv.update;
var MFCorVkLogin = spv.inh(comd.VkLoginB, {}, {
	'compx-access_desc': [
		['#locales.to-find-and-play', '#locales.music-files-from-vk'],
		function(to_find, files) {
			if (!to_find || !files) {return;}
			return to_find + ' ' + files;
		}
	],
	config: {
		open_opts: {settings_bits: 8},
		getNotf: function(target) {
			return {
				notf: target.map_parent.sf_notf,
				readed: target.map_parent.vk_ntf_readed
			};
		}
	}
});


var NotifyCounter = spv.inh(pv.Model, {
	naming: function(fn) {
		return function NotifyCounter(opts, data, params) {
			fn(this, opts, data, params);
		};
	},
	init: function(self, opts, data, params) {
		self.messages = {};
		self.banned_messages = (params && params.banned_messages) || [];
	}
}, {
	addMessage: function(m) {
		if (!this.messages[m] && this.banned_messages.indexOf(m) == -1){
			this.messages[m] = true;
			this.recount();
		}
	},
	banMessage: function(m) {
		this.removeMessage(m);
		this.banned_messages.push(m);
	},
	removeMessage: function(m) {
		if (this.messages[m]){
			delete this.messages[m];
			this.recount();
		}
	},
	recount: function() {
		var counter = 0;
		for (var a in this.messages){
			++counter;
		}
		pv.update(this, 'counter', counter);
	}
});



var MfComplectBase = spv.inh(pv.Model, {
	naming: function(fn) {
		return function MfComplectBase(opts, data, params) {
			fn(this, opts, data, params);
		};
	},
	init: function(self, opts, data, params) {
		self.mo = self.map_parent.map_parent;
		self.mf_cor = self.map_parent;

		self.source_name = data.head.source_name;

		// var _self = self;
		// self.selectMf = null;
		// self.selectMf = function() {
		// 	_self.mf_cor.playSelectedByUser(this);
		// };

		self.on('child_change-moplas_list', function(e) {
			if (e.value) {
				var part_start = e.value.slice(0, 5);

				var part_end = e.value.slice(5);
				pv.updateNesting(self, 'moplas_list_start', part_start);
				pv.updateNesting(self, 'moplas_list_end', part_end);
			}
		});
	}
}, {
  'compx-mf_cor_id': [['^_provoda_id']],
	'compx-artist_name': [['^artist_name']],
	'compx-track_name': [['^track_name']],
	'compx-can_search': [
		['artist_name', 'track_name'],
		function (artist_name, track_name) {
			return artist_name && track_name;
		}
	],
	toggleOverstocked: function() {
		pv.update(this, 'show_overstocked', !this.state('show_overstocked'));
	},
	overstock_limit: 5,
	hasManyFiles: function() {
		return this.sem_part && this.sem_part.t && this.sem_part.t.length > 1;
	},
	getFiles: function() {
		var lookup = this.map_parent.getNesting('lookup');
		if (!lookup) {return [];}
    var source = lookup.bindSource(pvState(this, 'search_name'));
		return source.getNesting('mp3files');
	},
  'nest-pioneer': ['#mp3_search/lookups/[:artist_name],[:track_name]/[:search_name]', {
		ask_for: 'can_search'
	}]
});

var MfComplect = spv.inh(MfComplectBase, {}, {
	'compx-use_multisearch': [
		['can_search', 'file'],
		function (can_search, file) {
			return can_search && !file;
		}
	],
  'nest-multi_pioneer': ['#mp3_search/lookups/[:artist_name],[:track_name]/[:search_name]', {
    ask_for: 'use_multisearch'
  }],
  'nest_sel-available_to_play': {
    from: 'multi_pioneer.able_to_play_mp3files'
  },
  'nest_sel-music_files': {
    from: 'multi_pioneer.music_files_sorted',
  },
  'nest_sel-moplas_list': {
    from: 'multi_pioneer.music_files_sorted',
    map: '>playable_files/[:mf_cor_id]'
  },
});

var MfComplectSingle = spv.inh(MfComplectBase, {}, {
	'compx-file': [['^file']],
  'compx-file_from': [['file.from']],
  'compx-file_id': [['file._id']],
  'nest-music_files': [['#mp3_search/sources/[:file_from]/files/[:file_id]']],
  'nest_sel-moplas_list': {
    from: 'music_files',
    map: '>playable_files/[:mf_cor_id]'
  },
});


function getSFM(mf_cor, file) {
  if (file.constructor.name == 'MusicFile') {
    return routePathByModels(
      file,
      'playable_files/' + mf_cor._provoda_id,
      false,
      true);
  }
  debugger;
  return mf_cor.getSFM(file);
}

var file_id_counter = 0;


var sources_map = {
	'vk': 'https://vk.com',
	'pleer.com': 'http://pleer.com',
	'soundcloud': 'https://soundcloud.com',
	'btdigg-torrents': 'http://btdigg.org/'
};

var MfCorBase = spv.inh(LoadableList, {
	naming: function(fn) {
		return function MfCor(opts, data, params, more, states) {
			fn(this, opts, data, params, more, states);
		};
	},
	init: function(self, opts, data, omo) {
		self.files_investg = null;
		self.last_search_opts = null;
		self.file = null;
		self.notifier = null;
		self.sf_notf = null;
		self.vk_ntf_readed = null;
		self.player = null;
		self.vk_auth_rqb = null;

		self.sfs_models = {};
		self.omo = omo;
		self.mo = self.map_parent;
		self.files_models = {};

		self.initNotifier();
		self.intMessages();
	}
}, {
	'compx-artist_name': [['^artist_name']],
	'compx-track_name': [['^track_name']],
	'compx-can_search': [
		['artist_name', 'track_name'],
		function (artist_name, track_name) {
			return artist_name && track_name;
		}
	],
  'compx-use_multisearch': [
    ['can_search', 'file'],
    function (can_search, file) {
      return can_search && !file;
    }
  ],
  'nest-multi_lookup': ['#mp3_search/lookups/[:artist_name],[:track_name]', {
		ask_for: 'use_multisearch'
	}],
	'nest-lookup': ['#mp3_search/lookups/[:artist_name],[:track_name]', {
		ask_for: 'can_search'
	}],
	hndTrackNameCh: function(e) {
		if (e.value){
			this.files_investg = this.mo.mp3_search.getFilesInvestg({artist: this.mo.state('artist'), track: this.mo.state('track')}, this.current_motivator);
			this.bindInvestgChanges();
			this.mo.bindFilesSearchChanges(this.files_investg);
			if (this.last_search_opts){
				this.files_investg.startSearch(this.last_search_opts);
				this.last_search_opts = null;
			}
			pv.update(this, 'files_investg', this.files_investg);
		}

	},
	'compx-play': [
		['@one:play:used_mopla']
	],
	'stch-used_mopla': function(target, state) {
		target.updateNesting('used_mopla', state);
	},
	'compx-is_important': [
		['^is_important']
	],
	'compx-has_files': [
		['@some:music_files$exists:sorted_completcs'],
		function (state) {
			return state;
		}
	],
	'compx-has_vk_tool': [
		['@one:tools_by_name:mp3_search'],
		function (tools) {
			return !!tools && !!tools.vk;
		}
	],
	'compx-needs_vk_auth': [
		['has_vk_tool', 'has_any_vk_results'],
		function (has_vk_tool, has_any_vk_results) {
			return !has_vk_tool && !has_any_vk_results;
		}
	],
	'nest-vk_auth': [MFCorVkLogin, {
		ask_for: 'needs_vk_auth'
	}],
	'nest_sel-vk_source': {
		from: 'sorted_completcs',
    where: {
      '>search_name': ['=', ['vk']]
    }
	},
	'compx-has_any_vk_results': [
		['@one:music_files$exists:vk_source', 'file'],
		function (has_any_data, file) {
			return !!has_any_data || (file && file.from == 'vk');
		}
	],
	'stch-needs_vk_auth': function(target, state) {
		if (state) {
			target.notifier.addMessage('vk_audio_auth ');
		} else {
			target.notifier.removeMessage('vk_audio_auth ');
		}

		if (state) {

		} else {
			var vk_auth = target.getNesting('vk_auth');
			if (vk_auth) {
				pv.updateNesting(target, 'vk_auth', null);
				vk_auth.die();
			}

		}
	},
	'compx-few_sources': [
		['sorted_completcs$length'],
		function (length) {
			return length > 1;
		}
	],
	sub_pager: {
		type: {
			complects: 'complect',
			'single-complects': 'single-complect',
		},
		by_type: {
			complect: [
				MfComplect, null, {
					search_name: 'by_slash.0'
				}
			],
			'single-complect': [
				MfComplectSingle, null, {
					search_name: 'by_slash.0'
				}
			],
		}
	},
  'stch-@sorted_completcs.moplas_list': function (target) {
		target.updateDefaultMopla();
	},
	getSource: function (source_name) {
		return BrowseMap.routePathByModels(this, 'complects/' + source_name, false, true);
	},
	'nest-mp3_search': ['#mp3_search'],
	getSFM: function(file) {

		if (!file.hasOwnProperty('file_id')){
			file.file_id = ++file_id_counter;
		}
		if ( !this.sfs_models[ file.file_id ] ) {
			this.sfs_models[ file.file_id ] = Mp3Search.getSFM(this, file);
		}
		return this.sfs_models[ file.file_id ];


	},
	'compx-almost_loaded': [
		['@loading_progress:current_mopla'],
		function (array) {
			return array && array[0] > 0.8;
		}
	],
	'stch-is_important': function(target, state) {
		if (state) {
			target.requestMoreData('yt_videos');
		}
	},
	'nest_rqc-yt_videos': YoutubeVideo,
	'nest_req-yt_videos': [
		[(function() {
			var end = /default.jpg$/;
			var list = ['start', 'middle', 'end'];
			var previews = function(url) {
				if (end.test(url)) {
					var result = {};
					for (var i = 0; i < list.length; i++) {
						var key = list[i];
						var file_name = (i + 1) + '.jpg';
						result[key] = url.replace(end, file_name);
					}
					return result;
				} else {
					return {
						'default': url
					};
				}
				// var url2 =
			};
			return function(r) {
				var items = r && r.items;
				if (items && items.length) {
					var result = [];
					for (var i = 0; i < Math.min(items.length, 3); i++) {
						var cur = items[i];
						result.push({
							yt_id: cur.id.videoId,
							title: cur.snippet.title,
							cant_show: true,
							previews: previews(cur.snippet.thumbnails.default.url)
						});
					}
					return result;
				} else {
					return [];
				}
			};
		})()],
		[function() {
			return {
				api_name: 'youtube_d',
				source_name: 'youtube.com',
				get: function(q) {
					var data = {
						key: 'AIzaSyBvg9b_rzQJJ3ubhS1TeipHpOTqsVnShj4',
						part: 'id,snippet',
						type: 'video',
						maxResults: 3,
						q: q
					};

					return aReq({
						url: 'https://www.googleapis.com/youtube/v3/search',
						dataType: 'jsonp',
						data: data,
						resourceCachingAvailable: true,
						thisOriginAllowed: true
					});
				},
				errors_fields: []
			};
		}, 'get', function() {
			return [this.mo.state('artist') + " - " + this.mo.state('track')];
		}]
	],

	complex_states: {
		"must_be_expandable": {
			depends_on: ['has_files', 'needs_vk_auth', 'few_sources', 'cant_play_music'],
			fn: function(has_files, needs_vk_auth, fsrs, cant_play){
				return !!(has_files || needs_vk_auth || fsrs || cant_play);
			}
		},


		user_preferred: {
			depends_on: ["selected_mopla_to_use", "almost_selected_mopla"],
			fn: function(selected_mopla_to_use, almost_selected_mopla) {
				return selected_mopla_to_use || almost_selected_mopla;
			}
		},
		can_play: [
			['mopla_to_use'],
			function(mopla) {
				return !!mopla;
			}
		],

		mopla_to_use: {
			depends_on: ["user_preferred", "default_mopla"],
			fn: function(user_preferred, default_mopla){
				return user_preferred || default_mopla;
			}
		},
		has_available_tracks: {
			depends_on: ['mopla_to_use'],
			fn: function(mopla_to_use) {
				return !!mopla_to_use;
			}
		},
		current_mopla: {
			depends_on: ["used_mopla", "mopla_to_use"],
			fn: function(used_mopla, mopla_to_use) {
				return used_mopla || mopla_to_use;
			}
		},
		mopla_to_preload: {
			depends_on: ['search_ready', '^player_song', '^preload_current_file', 'current_mopla'],
			fn: function(search_ready, player_song, preload_current_file, current_mopla){
				return search_ready && (player_song || preload_current_file) && current_mopla;
			}
		}
	},
	'stch-unavailable@sorted_completcs.moplas_list': function(target, state, old_state, source) {
		if (state) {
			target.checkMoplas(source.item);
		}
	},
	state_change: {
		"selected_mopla": function() {

		},
		"current_mopla": function(target, nmf, omf) {
			if (omf){
				omf.stop();
				omf.deactivate();
			}
			if (nmf){
				nmf.activate();
			}
			pv.updateNesting(target, 'current_mopla', nmf);
		},
	},
	'compx-current_source': [
		['current_mopla', 'default_mopla'],
		function (current_mopla, default_mopla) {
			var vis_mopla = current_mopla || default_mopla;
			return vis_mopla && {
				source_name: vis_mopla.state('from'),
				source_link: vis_mopla.state('page_link') || sources_map[vis_mopla.state('from')]
			};
		}
	],
	'compx-$relation:file_to_load-for-player_song': [
		['search_ready', 'current_mopla', '^player_song'],
		function (search_ready, current_mopla, player_song) {
			return search_ready && player_song && current_mopla;
		}
	],
	'compx-$relation:file_to_load-for-preload_current_file': [
		['search_ready', 'current_mopla', '^preload_current_file'],
		function (search_ready, current_mopla, preload_current_file) {
			return search_ready && preload_current_file && current_mopla;
		}
	],
	'compx-$relation:investg_to_load-for-song_need': [
		['^need_files', 'files_investg'],
		function (need_files, files_investg) {
			return need_files && files_investg;
		}
	],
	'stch-$relation:investg_to_load-for-song_need': pv.getRDep('$relation:investg_to_load-for-song_need'),
	'stch-$relation:file_to_load-for-player_song': pv.getRDep('$relation:file_to_load-for-player_song'),
	'stch-$relation:file_to_load-for-preload_current_file': pv.getRDep('$relation:file_to_load-for-preload_current_file'),

	isSearchAllowed: function() {
		return !this.file;
	},
	'chi-notifier': NotifyCounter,
	initNotifier: function() {
		this.notifier = this.initChi('notifier');
		pv.updateNesting(this, 'notifier', this.notifier);
		this.sf_notf = this.app.notf.getStore('song-files');
		var rd_msgs = this.sf_notf.getReadedMessages();

		for (var i = 0; i < rd_msgs.length; i++) {
			this.notifier.banMessage(rd_msgs[i]);
			if (rd_msgs[i] == 'vk_audio_auth '){
				this.vk_ntf_readed = true;
			}
		}
		this.bindMessagesRecieving();
	},
	intMessages: function() {
		this.player = this.mo.player;

		this.player
			.on('core-fail', this.hndPCoreFail, this.getContextOpts())
			.on('core-ready', this.hndPCoreReady, this.getContextOpts());


	},
	hndPCoreFail: function() {
		pv.update(this, 'cant_play_music', true);
		this.notifier.addMessage('player-fail');
	},
	hndPCoreReady: function() {
		pv.update(this, 'cant_play_music', false);
		this.notifier.banMessage('player-fail');
	},
	getCurrentMopla: function(){
		return this.state('current_mopla');
	},
	showOnMap: function() {
		this.mo.showOnMap();
		pv.update(this, 'want_more_songs', true);
	},
	switchMoreSongsView: function() {
		if (!this.state('want_more_songs')){
			pv.update(this, 'want_more_songs', true);
		} else {
			pv.update(this, 'want_more_songs', false);
		}

	},
	markMessagesReaded: function() {
		this.sf_notf.markAsReaded('vk_audio_auth ');
	},
	hndNtfRead: function(message_id) {
		this.notifier.banMessage(message_id);
	},
	bindMessagesRecieving: function() {
		this.sf_notf.on('read', this.hndNtfRead, this.getContextOpts());

	},
	collapseExpanders: function() {
		pv.update(this, 'want_more_songs', false);
	},
	startSearch: function(opts) {
		if (this.files_investg){
			this.files_investg.startSearch(opts);
		} else {
			this.last_search_opts = opts;
		}
	},
	bindInvestgChanges: function() {
		var investg = this.files_investg;
		if (!investg){
			return;
		}
		this.wlch(investg, 'search_ready_to_use', 'search_ready');
	},
	checkMoplas: function(unavailable_mopla) {
		var current_mopla_unavailable;
		if (this.state("used_mopla") == unavailable_mopla){
			pv.update(this, "used_mopla", false);
			current_mopla_unavailable = true;
		}
		if (this.state("default_mopla") == unavailable_mopla){
			this.updateDefaultMopla();
		}
		if (this.state("user_preferred") == unavailable_mopla){
			pv.update(this, "selected_mopla_to_use", false);
			var from = pvState(this.state("selected_mopla"), 'from');
			var available = this.getFilteredFiles(from, function(mf) {

				if (pvState(mf, 'from') == from && !pvState(mf, 'unavailable')){
					return true;
				}
			});
			available = available && available[0];
			if (available){
				pv.update(this, "almost_selected_mopla", getSFM(this, available));
			} else {
				pv.update(this, "almost_selected_mopla", false);
			}
		}
		if (current_mopla_unavailable){
			this.trigger("error", this.canPlay());
		}

	},
	updateDefaultMopla: function() {
		var available = this.getFilteredFiles(false, function(mf) {
			if (!pvState(mf, 'unavailable')){
				return true;
			}
		});
		available = available && available[0];
		if (available){
			pv.update(this, "default_mopla", getSFM(this, available));
		} else {
			pv.update(this, "default_mopla", false);
		}

	},
	setVolume: function(vol, fac){
		var cmf = this.state('current_mopla');
		if (cmf){
			cmf.setVolume(vol, fac);
		}
	},
	stop: function(){
		var cmf = this.state('current_mopla');
		if (cmf){
			cmf.stop();
		}
	},
	switchPlay: function(){
		if (this.state('play')){
			this.pause();
		} else {
			this.play();
		}

	},
	pause: function(){
		var cmf = this.state('current_mopla');
		if (cmf){
			cmf.pause();
		}

	},
	selectMopla: function(mopla) {
		this.updateManyStates({
			'selected_mopla_to_use': mopla,
			'selected_mopla': mopla
		});

		var t_mopla = this.state("mopla_to_use");
		if (t_mopla){
			if (this.state("used_mopla") != t_mopla){
				pv.update(this, "used_mopla", false);
			}
			return true;
		}
	},
	playSelectedByUser: function(mopla) {
		if (this.selectMopla(mopla)) {
			this.play();
		}
	},
	play: function(){
		if (this.mo.state('forbidden_by_copyrh')) {
			return;
		}
		var cm = this.state("used_mopla");
		if (cm){
			if (!cm.state('play')){
				this.trigger('before-mf-play', cm);
				cm.play();
			}
		} else {
			var mopla = this.state("mopla_to_use");
			if (mopla){
				pv.update(this, "used_mopla", mopla);
				this.trigger('before-mf-play', mopla);
				mopla.play();
			}
		}

	},
	getVKFile: function(){
		var file = this.state('current_mopla');
		if (file && file.from == 'vk'){
			return file;
		} else{
			var files = this.getFilteredFiles('vk');
			return files && files[0];
		}
	},
	getFilteredFiles: function(source_name, fn, type) {
		type = type || 'mp3';
		var all_files;

		if (this.file){
      var single = this.getNesting('sorted_completcs');
      return single && single.getNesting('music_files');
		} else {
			if (source_name){
				var list = this.getNesting('sorted_completcs');
				var complect;
				if (list) {
					for (var i = 0; i < list.length; i++) {
						if (pvState(list[i], 'search_name') == source_name) {
							complect = list[i];
						}
					}
				}

				if (complect){
          var files = complect.getFiles(type);
					all_files = files && files.slice();
				}

			} else {
        var list = this.getNesting('multi_lookup') && this.getNesting('multi_lookup').getNesting('mp3files_all');
        if (!list || !list.length) {
          return [];
        }

        all_files = list;
			}
		}
    if (!fn) {
      return all_files;
    }

    var mfs = [];
    for (var i = 0; i < all_files.length; i++) {
      var el = all_files[i];
      if (fn(el)){
        mfs.push(el);
      }
    }
    return mfs;

	},
	canPlay: function() {
		return !!this.state("mopla_to_use");
	}
});

var MfCorUsual = spv.inh(MfCorBase, {
  init: function(self) {
    self.mo.on('vip_state_change-track', self.hndTrackNameCh, {immediately: true, soft_reg: false, context: self});
  }
}, {
  'nest_sel-sorted_completcs': {
    from: '#mp3_search>sources_sorted_list',
    map: 'complects/[:search_name]'
  },
});

var MfCorSingle = spv.inh(MfCorBase, {
  init: function(self, opts, data, omo) {
    pvUpdate(self, 'file', omo.file);

    self.file = omo.file;
    self.file.states = self.file;
    self.updateDefaultMopla();
  }
}, {
  'compx-file_from': [['file.from']],
  'nest-sorted_completcs': [
    'single-complects/[:file_from]', {
      ask_for: 'file'
    },
  ],
});

MfCorUsual.Single = MfCorSingle;


return MfCorUsual;
});
