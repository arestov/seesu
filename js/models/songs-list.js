var songsList;
(function(){
	"use strict";

	var songsListBase = function() {};
	provoda.extendFromTo("songsListBase", mapLevelModel, songsListBase);
	

	songsList = function(){};
	songsListBase.extendTo(songsList, {
		init: function(opts, params, first_song) {
			//playlist_title, playlist_type, info
			//params.title, params.type, params.data
			this._super.apply(this, arguments);
			this.info = params.data || {};
			if (params.title){
				this.playlist_title = params.title;
			}
			if (params.type){
				this.playlist_type = params.type;
				this.updateState('nav-text', this.playlist_title);
				this.updateState('nav-title', this.playlist_title);
			}
			
			this.findSongOwnPosition(first_song);

			var plarow = new PlARow();
			plarow.init(this);

			this.setChild('plarow', plarow);


			this.changed();
			
			var _this = this;
			
			var doNotReptPl = function(state) {
				_this.updateState('dont-rept-pl', state);
			};
			if (su.settings['dont-rept-pl']){
				doNotReptPl(true);
			}
			su.on('settings.dont-rept-pl', doNotReptPl);
		},
		page_name: 'playlist',
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
		extendSong: function(omo, player, mp3_search){
			if (!(omo instanceof song)){
				var mo = new song();
				mo.init(omo, this, player, mp3_search)
				return mo;
			} else{
				return omo;
			}
		},
		makeExternalPlaylist: function() {
			if (!this.palist.length){return false;}
			var simple_playlist = [];
			for (var i=0; i < this.palist.length; i++) {
				var song = this.palist[i].song();
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
				_this.updateState('dont-rept-pl', state);
			};
			if (su.settings['dont-rept-pl']){
				doNotReptPl(true);
			}
			su.on('settings.dont-rept-pl', doNotReptPl);


		},
		setDnRp: function(state) {
			this.updateState('dont-rept-pl', state);
			su.setSetting('dont-rept-pl', state);
		},
		row_name: 'pl-settings'
	});




	var MultiAtcsRow = function(actionsrow){
		this.init(actionsrow);
	};
	BaseCRow.extendTo(MultiAtcsRow, {
		init: function(actionsrow){
			this.actionsrow = actionsrow;
			this._super();
		},
		row_name: 'multiatcs'
	});



	
})();