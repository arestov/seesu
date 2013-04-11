var songsList;
(function(){
	"use strict";

	var songsListBase = function() {};
	provoda.extendFromTo("songsListBase", LoadableList, songsListBase);
	

	songsList = function(){};
	songsListBase.extendTo(songsList, {
		init: function(opts, params, first_song) {
			//playlist_title, playlist_type, info
			//params.title, params.type, params.data
			
			this._super.apply(this, arguments);
			if (params){
				this.setBaseInfo(params);
			}
			
			if (first_song){
				this.findSongOwnPosition(first_song);
			}
			

			var plarow = new PlARow();
			plarow.init(this);

			this.updateNesting('plarow', plarow);
			
			var _this = this;
			
			var doNotReptPl = function(state) {
				_this.updateState('dont_rept_pl', state);
			};
			if (su.settings['dont-rept-pl']){
				doNotReptPl(true);
			}
			su.on('settings.dont-rept-pl', doNotReptPl);
			if (this.playlist_type){
				this.updateState('url_part', this.getURL());
			}
			
		},
		page_name: 'playlist',
		setBaseInfo: function(params) {
			this.info = params.data || {};
			if (params.title){
				this.playlist_title = params.title;
			}
			if (params.type){
				this.playlist_type = params.type;
				this.updateState('nav_title', this.playlist_title);
			}
		},
		getURL: function(){
			var url ='';
			if (this.playlist_type == 'artist'){
				url += '/_';
			} else if (this.playlist_type == 'album'){
				url += '/' + su.encodeURLPart(this.info.album);
			} else if (this.playlist_type == 'similar artists'){
				url += '/+similar';
			} else if (this.playlist_type == 'artists by tag'){
				url += '/tags/' + su.encodeURLPart(this.info.tag);
			} else if (this.playlist_type == 'tracks'){
				url += '/ds';
			} else if (this.playlist_type == 'artists by recommendations'){
				url += '/recommendations';
			} else if (this.playlist_type == 'artists by loved'){
				url += '/loved';
			} else if (this.playlist_type == 'cplaylist'){
				url += '/playlist/' + su.encodeURLPart(this.info.name);
			} else if (this.playlist_type == 'chart'){
				url += '/chart/' +  su.encodeURLPart(this.info.country) + '/' + su.encodeURLPart(this.info.metro);
			}
			return url;
		},
		extendSong: function(omo){
			if (!(omo instanceof song)){
				var mo = new song();
				mo.init({
					map_parent: this,
					app: this.app,
					omo: omo,
					plst_titl: this,
					player: this.player,
					mp3_search: this.mp3_search
				}, {
					file: omo.file
				});
				return mo;
			} else{
				return omo;
			}
		},
		makeExternalPlaylist: function() {
			var songs_list = this.getMainList();
			if (!songs_list.length){return false;}
			var simple_playlist = [];
			for (var i=0; i < songs_list.length; i++) {
				var files = songs_list[i].mf_cor.getFilteredFiles();
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
				this.current_external_playlist = new external_playlist(simple_playlist);
				//su.ui.els.export_playlist.attr('href', su.p.current_external_playlist.data_uri);
				if (this.current_external_playlist.result) {
					app_env.openURL(
						'http://seesu.me/generated_files/seesu_playlist.m3u?mime=m3u&content=' + escape(this.current_external_playlist.result)
					);
				}
					
			}
		}
	});
	

	var PlARow = function(){};

	PartsSwitcher.extendTo(PlARow, {
		init: function(pl) {
			this._super();
			this.pl = pl;
			this.updateState('active_part', false);
			this.addPart(new MultiAtcsRow(this, pl));
			this.addPart(new PlaylistSettingsRow(this, pl));
		}
	});


	var PlaylistSettingsRow = function(actionsrow){
		this.init(actionsrow);
	};
	BaseCRow.extendTo(PlaylistSettingsRow, {
		init: function(actionsrow){
			this.actionsrow = actionsrow;
			this._super();

			var _this = this;

			var doNotReptPl = function(state) {
				_this.updateState('dont_rept_pl', state);
			};
			if (su.settings['dont-rept-pl']){
				doNotReptPl(true);
			}
			su.on('settings.dont-rept-pl', doNotReptPl);


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
	BaseCRow.extendTo(MultiAtcsRow, {
		init: function(actionsrow){
			this.actionsrow = actionsrow;
			this._super();
		},
		model_name: 'row-multiatcs'
	});

window.HypemPlaylist = function() {};
songsList.extendTo(HypemPlaylist, {
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
})();

