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

	var Mp3Search = spv.inh(pv.Model, {},  {
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
	Mp3Search.guessArtist = guessArtist;
	Mp3Search.QueryMatchIndex = QueryMatchIndex;

return Mp3Search;
});
