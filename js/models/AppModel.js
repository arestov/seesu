/*
freeze
!restoreFreezed

*/

define(['./AppModelBase', 'spv', 'app_serv'], function(AppModelBase, spv, app_serv) {
"use strict";

var localize = app_serv.localize;

var AppModel = function(){};
AppModelBase.extendTo(AppModel, {
	init: function(){
		this._super();

		for (var func_name in this.bmap_travel){
			this[func_name] = this.getBMapTravelFunc(this.bmap_travel[func_name], this);
		}

		return this;
	},
	checkUserInput: function(opts) {
		if (opts.ext_search_query) {
			this.search(opts.ext_search_query);
		}

		var state_recovered;
		if (this.p && this.p.c_song){
			if (this.p.c_song){
				this.showNowPlaying(true);
				state_recovered = true;
			}
		}

		if (state_recovered){
			opts.state_recovered = true;
		}
		if (!state_recovered && !opts.ext_search_query){
			this.trigger('handle-location');
		}

		//big_timer.q.push([tracking_opts.category, 'process-thins-sui', big_timer.comp(tracking_opts.start_time), 'seesu ui in process', 100]);
		this.start_page.updateState('can_expand', true);

	},
	infoGen: function(dp, c, base_string){
		if (dp){
			if (c.prev){
				c.str += ', ';
			}
			c.str += base_string.replace('%s', dp);
			if (!c.prev){
				c.prev = true;
			}
		}
	},
	getRemainTimeText: function(time_string, full){
		var d = new Date(time_string);
		var remain_desc = '';
		if (full){
			remain_desc += localize('wget-link') + ' ';
		}


		remain_desc += d.getDate() +
		" " + localize('m'+(d.getMonth()+1)) +
		" " + localize('attime') + ' ' + d.getHours() + ":" + d.getMinutes();

		return remain_desc;
	},

	nowPlaying: function(mo) {
		this.updateState('now_playing', mo.getTitle());
		this.current_playing = mo;
		this.checkNowPlayNav();
	},
	checkNowPlayNav: spv.debounce(function() {
		if (this.current_playing){
			this.updateState('viewing_playing', this.nav_tree.indexOf(this.current_playing) != -1);
		}

	}, 30),
	playing: function() {
		this.updateState('playing', true);
	},
	notPlaying: function() {
		this.updateState('playing', false);
	},
	setDocTitle: function(title) {
		this.updateState('doc_title', title);
	},
	createSonglist: function(map_parent, params, first_song) {
		var pl = new songsList();
		pl.init({
			app: this,
			map_parent: map_parent
		}, params, first_song);
		return pl;
	},
	preparePlaylist: function(params, first_song){
		var pl = new songsList();
		pl.init({
			app: this
		}, params, first_song);
		return pl;
	},
	keyNav: function(key_name) {
		var md = this.map.getCurMapL().resident;
		if (md.key_name_nav){
			var func = md.key_name_nav[key_name];
			func.call(md);
		}

	},
	bmap_travel: {
		
		showArtcardPage: function(artist){
			var md = this.start_page.getSPI('catalog/' + artist, true);
			md.showOnMap();
			/*
			var md = new ArtCard();
			md.init({
				app: this,
				map_parent: page_md || this.start_page
			}, {
				artist: artist
			});
			md.showOnMap();*/
			return md;
		},
		showArtistAlbum: function(params, page_md, start_song){
			var artcard = this.showArtcardPage(params.album_artist, page_md);
			var pl = artcard.showAlbum(params, start_song);
			if (start_song) {
				pl.showTrack(start_song);
			}
			return pl;
		},
		showNowPlaying: function(no_stat) {
			this.p.c_song.showOnMap();
			if (!no_stat){
				this.trackEvent('Navigation', 'now playing');
			}
		},
		showResultsPage: function(query){
			var lev;
			var cur_el = this.search_el;
			if (!cur_el || !cur_el.state('mp_has_focus') || !cur_el.lev.isOpened()){
				var md = this.createSearchPage();
				var _this = this;
				md.on('state-change.mp_show', function(e) {
					if (e.value){
						_this.search_el = this;
					}
				}, {immediately: true});

				md.showOnMap();
				lev = md.lev;
			} else {
				lev = this.search_el.lev;
			}
			var invstg = lev.resident;
			invstg.changeQuery(query);
			return invstg;

		},
		show_tag: function(tag){
			var md = this.start_page.getSPI('tags/' + tag, true);
			md.showOnMap();
			return md;
		},
		showArtistTopTracks: function(artist, page_md, start_song) {
			var artcard = this.showArtcardPage(artist, page_md);

			var track_name = start_song && start_song.track;
			var pl = artcard.showTopTacks(track_name);

			return pl;
		},
		showArtistSimilarArtists: function(artist){
			var artcard = this.showArtcardPage(artist, this.start_page);
			return artcard.showSimilarArtists();
		}
	},
	search: function(query){
		var old_v = this.state('search_query');
		if (query != old_v){
			if (!query) {
				this.showStartPage();
			} else {
				this.showResultsPage(query);
			}

		}
		this.updateState('search_query', query);
	}

});

return AppModel;
});