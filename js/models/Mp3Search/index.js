define(function(require){
"use strict";
var pv = require('pv');
var spv = require('spv');
var Sources = require('./Sources/index');
var FilesInvestg = require('./FilesInvestg');
var SongFileModel = require('./SongFileModel');
var routePathByModels = require('js/libs/BrowseMap').routePathByModels;
var guessArtist = require('./guessArtist');
var sortMusicFilesArray = require('./sortMusicFilesArray');
var pvState = pv.state;
var QMI = require('./QMI');
var getQueryString = QMI.getQueryString;
var QueryMatchIndex = QMI.QueryMatchIndex;
var setFileQMI = QMI.setFileQMI;
var getFileQMI = QMI.getFileQMI;

var pvUpdate = pv.update;
var FilesSourceTuner = spv.inh(pv.Model, {
	init: function(target, opts, data) {
		target.updateManyStates(data);
	}
}, {
	'compx-settings': [
		['search_name', '#settings-files_sources'],
		function (search_name, value) {
			return value && value[search_name];
		}
	],
	'compx-disable_search': [
		['settings'],
		function(settings) {
			return settings && settings['disable_search'];
		}

	],
	'compx-wait_before_playing': [
		['settings'],
		function(settings) {
			return settings && settings['wait_before_playing'];
		}
	],
	changeSetting: function(setting_name, value) {
		var all_settings = this.app.settings['files_sources'];
		all_settings = all_settings ? spv.cloneObj({}, all_settings) : {};
		spv.setTargetField(all_settings, [this.state('search_name'), setting_name], value);
		all_settings[this.state('search_name')] = spv.cloneObj({}, all_settings[this.state('search_name')]);
		this.app.setSetting('files_sources', all_settings);
	},
	changeTune: function(tune_name, value) {
		this.changeSetting(tune_name, value);
	}

});

function byBestSearchIndex(g,f, searches_pr){
	if (g && f) {
		var gg = searches_pr[pvState(g, 'search_name')];
		var ff = searches_pr[pvState(f, 'search_name')];
		if (typeof gg =='undefined'){
			gg = -1000;
		}
		if (typeof ff =='undefined'){
			ff = -1000;
		}
		if (gg < ff){
			return 1;
		}
		else if (gg > ff){
			return -1;
		}
		else{
			return 0;
		}
	} else {
		return 0;
	}
}

var hasMusicCopy = function (array, entity, from_position){
	var ess = /(^\s*)|(\s*$)/g;
	if (!array.length) {return false;}

	for (var i = from_position || 0, l = array.length; i < l; i++) {
		if ((array[i].artist.replace(ess, '') == entity.artist.replace(ess, '')) && (array[i].track.replace(ess, '') == entity.track.replace(ess, '')) && (array[i].duration == entity.duration)) {
			return true;
		}
	}
};

	var Mp3Search = spv.inh(pv.Model, {
		init: function(target) {
			// this._super.apply(this, arguments);

			// this.app = opts.app;
			target.se_list = [];
			target.tools_by_name = {};
			target.api_wrappers = {};

			target.investgs = {};
			target.investgs_by_artist = {};
			target.files_ids = {};
			target.pushed_files_by_artist = {};
			target.tuners = {};
			target.on('list-changed', function(list) {
				var tools_by_name = {};
				if (list) {
					for (var i = 0; i < list.length; i++) {
						var cur = list[i];
						if (!cur.disabled) {
							tools_by_name[cur.name] = true;
						}
					}
				}
			});
		}
	},  {
    'nest-all_sources': [
      [
        'sources/vk',
        'sources/soundcloud',
        'sources/pleer.net',
      ]
    ],
    'nest_sel-sources_sorted_list': {
      from: 'all_sources',
      where: {
        '>ready': [['=', 'boolean'], [true]]
      },
      sort: [
				['>search_name', 'searches_pr'],
				function (one, two, base) {
					return byBestSearchIndex(one, two, pvState(base, 'searches_pr'));
				}
			]
    },
    'compx-tools_by_name': [
      ['@search_name:sources_sorted_list'],
      function (list) {
        var index = {};
        if (!list) {return index;}

        for (var i = 0; i < list.length; i++) {
          index[list[i]] = true;
        }

        return index;
      }
    ],
		'compx-searches_pr': [['#mp3_search_order']],
    sub_page: {
  		'sources': {
  			constr: Sources,
  			title: [[]],
  		},
  	},
		sub_pager: {
			type: {
				tuners: 'tuner',
				lookups: 'lookup',
			},
			by_type: {
				lookup: [
					FilesInvestg, null, {
						artist_name: 'by_comma.0',
						track_title: 'by_comma.1',
						'msq.artist': 'by_comma.0',
						'msq.track': 'by_comma.1',
					}
				],
				tuner: [
					FilesSourceTuner, null, {
						search_name: 'simple_name'
					}
				],
			}
		},
		getFilesInvestg: function(msq, motivator) {
			return routePathByModels(
				this,
				'lookups/' + this.app.encodeURLPart(msq.artist) + ',' + this.app.encodeURLPart(msq.track),
				false,
				true);
		},
		'regfr-listchange': {
			event_name: 'list-changed',
			fn: function() {
				if (this.se_list.length){
					return this.se_list;
				}
			}
		},
		'chi-tuner': FilesSourceTuner,
		getSourceTuner: function(search_name) {
			if (!this.tuners[search_name]) {
				var tuner = this.initChi('tuner', {search_name: search_name});
				this.tuners[search_name] = tuner;
			}
			return this.tuners[search_name];
		},
		getQueryString: getQueryString,
		sortMusicFilesArray: function (music_list, msq, time_limit) {
		  sortMusicFilesArray(this, music_list, msq, time_limit);
		},
		getFileQMI: getFileQMI,
		setFileQMI: setFileQMI,
		/*
		getCache: function(sem, name){
			return cache_ajax.get(name + 'mp3', sem.q, function(r){

				sem.addSteamPart(r.search_source, r.music_list, r.type);
				sem.change();

			});
		},*/
		newSearchInit: function(filter, search){
			this.tools_by_name[filter] = search;


			this.trigger('list-changed', this.se_list);
			this.trigger('new-search', search, filter);


			var wrapper = this.initChi('api_wrapper', null, null, null, {search_name: filter});
			var core_list = this.getNesting('sources_core_list') || [];
			core_list.push(wrapper);
			this.updateNesting('sources_core_list', core_list);

		},
		'chi-api_wrapper': pv.Model,
		getMasterSlaveSearch: function(filter){
			var o = {
				exist_slave: false,
				exist_alone_master: false,
				exitst_master_of_slave: false
			};
			var i;
			for (i=0; i < this.se_list.length; i++) {
				var cmp3s = this.se_list[i];
				if (!cmp3s.disabled && cmp3s.name == filter){
					if (cmp3s.slave){
						if (!o.exist_slave){
							o.exist_slave = cmp3s;
							break;
						}
					}
				}
			}
			for (i=0; i < this.se_list.length; i++) {
				var cmp3s = this.se_list[i];
				if (!cmp3s.disabled && cmp3s.name == filter){
					if (!cmp3s.slave){
						if (o.exist_slave){
							if (o.exist_slave.preferred == cmp3s){
								o.exitst_master_of_slave = cmp3s;
							} else{
								o.exist_alone_master = cmp3s;
							}
						} else{
							o.exist_alone_master = cmp3s;
						}
					}
				}
			}
			return o;
		},
    addFile: function (file, msq) {
      if (!file.from) {
        throw new Error('file must have `from` value');
      }
      if (!file._id) {
        throw new Error('file must have `_id` value');
      }

      var cur = routePathByModels(
        this,
        'sources/' + file.from + '/files/' + file._id,
        false,
        true);

      cur.updateManyStates(file);
      this.addFileToInvestg(file, cur, msq);
    },
		addFileToInvestg: function(file, music_file, msq) {
			var qmi = this.setFileQMI(file, msq);
			if (qmi != -1) {
				var investg = this.getFilesInvestg(msq);
				investg.addFile(music_file, file.from);
			}
		},
		haveSearch: function(search_name){
			var o = this.getMasterSlaveSearch(search_name);
			return !!o.exist_slave || !!o.exitst_master_of_slave || !!o.exist_alone_master;
		},
		isNoMasterOfSlave: function(filter){
			var o = this.getMasterSlaveSearch(filter);
			return !!o.exist_slave && !o.exitst_master_of_slave;
		},

		addSearch: function(space, msearch){
			this.spaces = this.spaces || {};
			var spaces = this.spaces;

			spaces[space] = msearch;
		},
		getSearchByName: function(tool_name) {
			return this.tools_by_name[tool_name];
		},
		add: function(asearch, force){
			var o = this.getMasterSlaveSearch(asearch.name);
			if (o.exist_slave){
				if (force || !o.exitst_master_of_slave){
					if (o.exist_slave.preferred){
						o.exist_slave.preferred.disabled = true;
					}
					this.se_list.push(asearch);
					o.exist_slave.preferred = asearch;
					this.newSearchInit(asearch.name, asearch);
				}
			} else if (o.exist_alone_master){
				if (force){
					o.exist_alone_master.disabled = true;
					this.se_list.push(asearch);
					this.newSearchInit(asearch.name, asearch);
				}
			} else{
				this.se_list.push(asearch);
				this.newSearchInit(asearch.name, asearch);
			}
		},
		remove: function(msearch) {
			var se_list = this.se_list;
			this.se_list = spv.arrayExclude(this.se_list, msearch);
			if (se_list.length != this.se_list){
				this.trigger('list-changed', this.se_list);
				this.updateNesting('sources_core_list', this.se_list);
			}

		}

	});

	Mp3Search.getSongFileModel = function(map_parent){
		return map_parent.initSi(SongFileModel, null, {file:this});
	};
	Mp3Search.getSFM = function(map_parent, file) {
		if (file.getSongFileModel) {
			return file.getSongFileModel(map_parent);
		} else {
			return map_parent.initSi(SongFileModel, null, {file: file});
		}

	};

	Mp3Search.setFileQMI = setFileQMI;
	Mp3Search.getFileQMI = getFileQMI;
	Mp3Search.hasMusicCopy = hasMusicCopy;
	Mp3Search.guessArtist = guessArtist;
	Mp3Search.QueryMatchIndex = QueryMatchIndex;

return Mp3Search;
});
