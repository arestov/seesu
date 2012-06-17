(function(){
	"use strict";
	var songsListBaseView = function() {};
	provoda.extendFromTo("songsListBaseView", suServView, songsListBaseView);
	var songsListBase = function() {};
	provoda.extendFromTo("songsListBase", suMapModel, songsListBase);



	var songsListView = function(pl){};
	songsListBaseView.extendTo(songsListView, {
		appendChildren: function() {
			
		}
	});



	songsListView.prototype.state_change = cloneObj({
		"mp-show": function(opts) {
			if (opts){
				this.c.removeClass('hidden');
				$(su.ui.els.slider).addClass('show-player-page');
			} else {
				$(su.ui.els.slider).removeClass('show-player-page');
				this.c.addClass('hidden');
			}
		},
		"mp-blured": function(state) {
			if (state){
				
			} else {
				
			}
		},
		error: function(error){
			if (this.error_b && this.error_b.v !== error){
				this.error_b.n.remove();
			}
			if (error){
				if (error == 'vk_auth'){
					this.error_b = {
						v: error,
						n: $('<li></li>').append(su.ui.samples.vk_login.clone()).prependTo(this.c)
					};
				} else {
					this.error_b = {
						v: error,
						n: $('<li>' + localize('nothing-found','Nothing found') + '</li>').appendTo(this.c)
					};
				}
			}
		}
	}, songsListView.prototype.state_change);


	songsList = function(params, first_song, findMp3, player){
		//playlist_title, playlist_type, info
		//params.title, params.type, params.data
		this.init();
		this.info = params.data || {};
		if (params.title){
			this.playlist_title = params.title;
		}
		if (params.type){
			this.playlist_type = params.type;
			this.updateState('nav-text', this.playlist_title);
			this.updateState('nav-title', this.playlist_title);
		}
		this.player = player;
		this.findMp3 = findMp3;
		this.findSongOwnPosition(first_song);

		this.changed();
		
		var _this = this;

		this.regDOMDocChanges(function() {
			var child_ui;
			if (su.ui && su.ui.els.artsTracks){


				child_ui = _this.getFreeView();
				if (child_ui){
					su.ui.els.artsTracks.append(child_ui.getC());

					
					child_ui.appended();
				}
			}

			if (su.ui.nav.daddy){
				child_ui = _this.getFreeView('nav');
				if (child_ui){
					su.ui.nav.daddy.append(child_ui.getC());
					child_ui.appended();
				}
			}
		});
			
	};


	songsListBase.extendTo(songsList, {
		ui_constr: {
			main: songsListView,
			nav: playlistNavUI
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
				return new song(omo, player, mp3_search);
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

	
})();