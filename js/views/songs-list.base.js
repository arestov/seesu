provoda.addPrototype("songsListBaseView", {
	state_change: {
		'list_loading': function(loading){
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
		"can_play": function(state) {
			if (state){
				//make-trs-plable
				this.c.addClass('has_files-in-songs');
			} else {
				this.c.removeClass('has_files-in-songs');
			}
		}
	},
	parts_builder: {
		"load-more-b": function() {
			var _this = this;
			var node = $("<a class='load-more-list-data'></a>").click(function() {
				_this.md.requestMoreData(true);
			}).text(localize("load-more")).appendTo(this.c);

			this.addWayPoint(node, {
				canUse: function() {
					return _this.state('more_load_available');
				}
			});
			
			return node;
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
	appendSongDOM: function(song_view, array, current_index){
		var
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
				$(next_dom_hook).before(song_dom);
			} else {
				this.lc.append(song_dom);
			}
		}

	},
	'collch-songs-list': function(name, arr) {
		for (var i = 0; i < arr.length; i++) {
			var view = this.getFreeChildView(name, arr[i], 'main', {lite: this.opts && this.opts.overview});
			if (view){
				this.appendSongDOM(view, arr, i);
			}
		}
		this.requestAll();
	}
});