(function(){
	var songsListView = function(pl){
		this.init(pl);
	};
	createPrototype(songsListView, new songsListViewBase(), {
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


	songsList = function(playlist_title, playlist_type, info, first_song, findMp3, player){
		this.init();
		this.info = info || {};
		if (playlist_title){
			this.playlist_title = playlist_title;
		}
		if (playlist_type){
			this.playlist_type = playlist_type;
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
	createPrototype(songsList, new songsListModel(), {
		ui_constr: {
			main: function(){
				return new songsListView(this);
			},
			nav: function() {
				return new playlistNavUI(this);
			}
		},
		getURL: function(){
			var url ='';
			if (this.playlist_type == 'artist'){
				url += '/_';
			} else if (this.playlist_type == 'album'){
				url += '/' + this.info.album;
			} else if (this.playlist_type == 'similar artists'){
				url += '/+similar';
			} else if (this.playlist_type == 'artists by tag'){
				url += '/tags/' + this.info.tag;
			} else if (this.playlist_type == 'tracks'){
				url += '/ds';
			} else if (this.playlist_type == 'artists by recommendations'){
				url += '/recommendations';
			} else if (this.playlist_type == 'artists by loved'){
				url += '/loved';
			} else if (this.playlist_type == 'cplaylist'){
				url += '/playlist/' + this.info.name;
			} else if (this.playlist_type == 'chart'){
				url += '/chart/' +  this.info.country + '/' + this.info.metro;
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
			if (!this.length){return false;}
			var simple_playlist = [];
			for (var i=0; i < this.length; i++) {
				var song = this[i].song();
				if (song){
					simple_playlist.push({
						track_title: song.track,
						artist_name: song.artist,
						duration: song.duration,
						mp3link: song.link
					});
				}
					
				
			};
			
			if (simple_playlist.length){
				this.current_external_playlist = new external_playlist(simple_playlist);
				//su.ui.els.export_playlist.attr('href', su.p.current_external_playlist.data_uri);
				if (this.current_external_playlist.result) {
					app_env.openURL(
						'http://seesu.me/generated_files/seesu_playlist.m3u?mime=m3u&content=' + escape(this.current_external_playlist.result)
					)
				}
					
			}



			
		}
	});

	
})();