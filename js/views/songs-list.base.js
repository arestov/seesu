provoda.addPrototype("songsListBaseView", {
	createDetailes: function(){
		this.createBase();
	},
	state_change: {
		loading: function(loading){
			if (loading){
				this.lc.addClass('loading');
			} else {
				this.lc.removeClass('loading');
			}
		},
		"more_load_available": function(state) {
			
			if (state){
				this.requirePart("load-more-b").removeClass("hidden");
			} else {
				var button = this.getPart("load-more-b");
				if (button){
					button.addClass("hidden");
				}
			}
		},
		"can-play": function(state) {
			if (state){
				//make-trs-plable
				this.c.addClass('has-files-in-songs');
			} else {
				this.c.removeClass('has-files-in-songs');
			}
		}
	},
	parts_builder: {
		"load-more-b": function() {
			var _this = this;
			
			return $("<a class='load-more-songs'></a>").click(function() {
					_this.md.loadMoreSongs(true);
				}).text(localize("load-more")).appendTo(this.c);
		}
	},
	createBase: function() {
		this.c = $('<div class="playlist-container"></div>');
		if (this.createPanel){
			this.createPanel();
		}
		this.panel.appendTo(this.c)
		this.lc = $('<ul class="tracks-c current-tracks-c tracks-for-play"></ul>').appendTo(this.c);
	},
	appendSongDOM: function(song_view, mo, array){
		var
			moc,
			song_dom = song_view.getA();
		if (!song_dom){
			return;
		}

		var _this = this.md;

		// todo USE SIMPLE DETECT OF NEXT SONG VIEW;
		if (_this.first_song){
			if (!_this.firstsong_inseting_done){
				if (mo == _this.first_song.mo){
					this.lc.append(song_dom);
				} else{
					moc = _this.first_song.mo.getThing();
					if (moc){
						moc.before(song_dom);
					}
				}
			} else if (_this.first_song.mo != mo){
				var f_position = array.indexOf(_this.first_song.mo);
				var t_position = array.indexOf(mo);
				if (t_position < f_position){
					moc = _this.first_song.mo.getThing();
					if (moc){
						moc.before(song_dom);
					}
				} else{
					this.lc.append(song_dom);
				}
			} else{
				this.lc.append(song_dom);
			}
			
			
		} else{
			this.lc.append(song_dom);
		}
	},
	'collch-song': function(name, arr) {
		for (var i = 0; i < arr.length; i++) {
			var view = this.getFreeChildView(name, arr[i], 'main');
			if (view){
				this.appendSongDOM(view, arr[i], arr);
			}
		}
		this.requestAll();
	}
});