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
		this.addChild(this.mf_cor);
		this.mf_cor.on('before-mf-play', function(mopla) {
			_this.player.changeNowPlaying(_this);
			_this.findNeighbours();
			_this.mopla = mopla;
		});

		var _this = this;
		this.regDOMDocChanges(function() {
			if (su.ui.nav.daddy){
				var child_ui = _this.getFreeView('nav');
				if (child_ui){
					su.ui.nav.daddy.append(child_ui.getC());
					child_ui.appended();
				}
			}
		});
		this.watchStates(['files_search', 'marked_as'], function(files_search, marked_as) {
			if (marked_as && files_search && files_search.complete){
				this.updateState('can-expand', true);
			} else {
				this.updateState('can-expand', false);
			}
		});
		this.watchState('mp-show', function(opts) {
			var
				_this = this,
				oldCb = this.makePlayableOnNewSearch;

			if (opts){
				if (!oldCb){
					this.makePlayableOnNewSearch = function() {
						_this.makeSongPlayalbe(true);
					};
					this.mp3_search.on('new-search', this.makePlayableOnNewSearch)
					
				}
			} else {
				if (oldCb){
					this.mp3_search.off('new-search', oldCb)
					delete this.makePlayableOnNewSearch;
				}
			}
		});
	};
	createPrototype(song, new baseSong(), {
		ui_constr: {
			main: function(){
				return new songUI(this);
			},
			nav: function() {
				return new trackNavUI(this);
			}
		},
		updateFilesSearchState: function(complete, get_next){
			baseSong.prototype.updateFilesSearchState.apply(this, arguments);
			if (this.isHaveTracks()){
				this.plst_titl.markAsPlayable();
			}
		},	
		mlmDie: function() {
			this.hide();	
		},
		view: function(no_navi){
			if (!this.state('mp-show')){
				this.fire('view');
				this.findFiles();
				su.ui.views.show_track_page(this, no_navi);
			}
			
		}
	});
	//song.prototype = song_methods;
})();
