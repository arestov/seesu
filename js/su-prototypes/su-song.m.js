(function(){

	song = function(omo, player, mp3_search){
		this.constructor.prototype.init.call(this, omo, player, mp3_search);
		var _this = this;
		this.updateNavTexts();

		
		this.on('view', function(){
			if (_this.state('playable')){
				var zoomed = !!su.ui.els.slider.className.match(/show-zoom-to-track/);
				if (this.c_song){
			 		if (mo == this.c_song){
						su.track_event('Song click', 'zoom to track', zoomed ? "zoomed" : "playlist");
					} else if (this.c_song.next_song && mo == this.c_song.next_song){
						su.track_event('Song click', 'next song', zoomed ? 'zommed' : 'playlist');
					} else if (this.c_song.prev_song && mo == this.c_song.prev_song){
						su.track_event('Song click', 'previous song', zoomed ? 'zommed' : 'playlist');
					} else{
						su.track_event('Song click', 'simple click');
					}
				} else{
			  		su.track_event('Song click', 'simple click');
				}
				if (!zoomed){
					su.track_page('track zoom');
				}
			} else {
				su.track_event('Song click', 'empty song');
			}
		});
		this.mf_cor = new mfCor(this, this.omo);
		this.mf_cor.on('before-mf-play', function(mopla) {
			_this.player.changeNowPlaying(_this);
			_this.findNeighbours();
			_this.updateProp('mopla', mopla);
		});
	};
	createPrototype(song, new baseSong(), {
		ui_constr: {
			main: function(){
				return new songUI(this)
			},
			nav: function() {
				return new trackNavUI(this);
			}
		},
		onMapLevAssign: function() {
			if (su.ui.views.nav.daddy){
				var child_ui = this.getFreeView('nav');
				if (child_ui){
					su.ui.views.nav.daddy.append(child_ui.getC());
					child_ui.appended();
				}
			}
		},
		updateFilesSearchState: function(complete, get_next){
			baseSong.prototype.updateFilesSearchState.apply(this, arguments);
			if (this.isHaveTracks()){
				su.ui.els.export_playlist.addClass('can-be-used');
			}
		},	
		mlmDie: function() {
			this.hide();	
		},
		view: function(no_navi){
			this.fire('view');
			this.findFiles();
			su.ui.views.show_track_page(this, no_navi);
		},
	});
	//song.prototype = song_methods;
})();
