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
	createListBase: function() {
		this.lc = $('<ul class="tracks-for-play list-overview"></ul>').appendTo(this.c);
	},
	createBase: function() {
		this.c = $('<div class="playlist-container"></div>');
		if (this.createPanel){
			this.createPanel();
		}
		this.createListBase();
		
	},
	appendSongDOM: function(song_view, mo, array, current_index){
		var
			moc,
			song_dom = song_view.getA();
		if (!song_dom){
			return;
		}

		var prev_dom_hook = this.getPrevView(array, current_index);
		if (prev_dom_hook){
			$(prev_dom_hook).after(song_dom);
		} else {
			var next_dom_hook = this.getNextView(array, current_index);
			if (next_dom_hook){
				$(next_dom_hook).before(song_dom)
			} else {
				this.lc.append(song_dom);
			}
		}

	},
	'collch-song': function(name, arr) {
		for (var i = 0; i < arr.length; i++) {
			var view = this.getFreeChildView(name, arr[i]);
			if (view){
				this.appendSongDOM(view, arr[i], arr, i);
			}
		}
		this.requestAll();
	}
});