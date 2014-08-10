define(['provoda', 'app_serv','./LoadableList', './comd', './Song', './SongsListBase'], function(provoda, app_serv, LoadableList, comd, Song, lb){
	"use strict";
	var localize = app_serv.localize;
	var app_env = app_serv.app_env;

	var ExternalTextedPlaylist = function(array){ //array = [{artist_name: '', track_title: '', duration: '', mp3link: ''}]
		this.result = this.header + '\n';
		for (var i=0; i < array.length; i++) {
			this.result += this.preline + ':' + (array[i].duration || '-1') + ',' + array[i].artist_name + ' - ' + array[i].track_title + '\n' + array[i].mp3link + '\n';
		}
		this.data_uri = this.request_header + escape(this.result);
		
	};
	ExternalTextedPlaylist.prototype = {
		header : '#EXTM3U',
		preline: '#EXTINF',
		request_header : 'data:audio/x-mpegurl; filename=seesu_playlist.m3u; charset=utf-8,'
	};



	var PlARow = function(){};

	comd.PartsSwitcher.extendTo(PlARow, {
		'nest_posb-context_parts': [MultiAtcsRow, PlaylistSettingsRow],
		init: function() {
			this._super.apply(this, arguments);
			this.pl = this.map_parent;

			this.updateState('active_part', false);
			this.addPart(new MultiAtcsRow(this, this.pl));
			this.addPart(new PlaylistSettingsRow(this, this.pl));
		},
		'compx-loader_disallowing_desc': [
			['^loader_disallowing_desc'],
			function(loader_disallowing_desc) {
				return loader_disallowing_desc;
			}
		]
	});


	var PlaylistSettingsRow = function(actionsrow){
		this.init(actionsrow);
	};
	comd.BaseCRow.extendTo(PlaylistSettingsRow, {
		init: function(actionsrow){
			this.actionsrow = actionsrow;
			this._super();


			this.wch(su, 'settings-dont-rept-pl', 'dont_rept_pl');


		},
		setDnRp: function(state) {
			this.updateState('dont_rept_pl', state);
			su.setSetting('dont-rept-pl', state);
		},
		model_name: 'row-pl-settings'
	});




	var MultiAtcsRow = function(actionsrow){
		this.init(actionsrow);
	};
	comd.BaseCRow.extendTo(MultiAtcsRow, {
		init: function(actionsrow){
			this.actionsrow = actionsrow;
			this._super();
		},
		makePlayable: function() {
			this.actionsrow.pl.makePlayable(true);
			su.trackEvent('Controls', 'make playable all tracks in playlist');
		},
		makeExternalPlaylist: function() {
			this.actionsrow.pl.makeExternalPlaylist();
			su.trackEvent('Controls', 'make *.m3u');
		},
		model_name: 'row-multiatcs'
	});


	var SongsListBase = function() {};
	provoda.extendFromTo("SongsListBase", LoadableList, SongsListBase);
	

	var SongsList = function(){};
	SongsListBase.extendTo(SongsList, {
		'nest-plarow': [PlARow],
		bindStaCons: function() {
			this._super();
			this.wch(this.app, 'settings-dont-rept-pl', 'dont_rept_pl');
			this.wch(this.app, 'settings-pl-shuffle', 'pl-shuffle');
		},
		'nest_rqc-songs-list': Song,
		/*makeDataItem: function(obj) {
			return this.extendSong(obj);
		},
		extendSong: function(omo){
			if (!(omo instanceof Song)){
				return this.initSi(Song,  omo, {
					file: omo.file
				});
			} else{
				return omo;
			}
		},*/
		makeExternalPlaylist: function() {
			var songs_list = this.getMainlist();
			if (!songs_list.length){return false;}
			var simple_playlist = [];
			for (var i=0; i < songs_list.length; i++) {
				var files = songs_list[i].getMFCore().getFilteredFiles();
				var song = files && files[0];
				if (song){
					simple_playlist.push({
						track_title: song.track,
						artist_name: song.artist,
						duration: song.duration,
						mp3link: song.link
					});
				}
					
				
			}
			
			if (simple_playlist.length){
				this.current_external_playlist = new ExternalTextedPlaylist(simple_playlist);
				//su.ui.els.export_playlist.attr('href', su.p.current_external_playlist.data_uri);
				if (this.current_external_playlist.result) {
					app_env.openURL(
						'http://seesu.me/generated_files/seesu_playlist.m3u?mime=m3u&content=' + escape(this.current_external_playlist.result)
					);
				}
					
			}
		}
	});
	


var HypemPlaylist = function() {};
SongsList.extendTo(HypemPlaylist, {
	init: function() {
		this._super.apply(this, arguments);
		this.can_use = this.app.hypem.can_send;
		this.updateState('browser_can_load', this.can_use);
		this.updateState('possible_loader_disallowing', localize('Hypem-cant-load'));
	},
	page_limit: 20,
	'compx-loader_disallowing_desc': {
		depends_on: ['loader_disallowed', 'possible_loader_disallowing'],
		fn: function(disallowed, desc) {
			if (disallowed){
				return desc;
			}
		}
	},
	'compx-loader_disallowed': {
		depends_on: ['browser_can_load'],
		fn: function(can_load) {
			return !can_load;
		}
	}
});
SongsList.HypemPlaylist = HypemPlaylist;
return SongsList;
});

