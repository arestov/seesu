define(['./AppModelBase', 'spv', 'app_serv', './SongsList'], function(AppModelBase, spv, app_serv, SongsList) {
"use strict";

var localize = app_serv.localize;

var AppModel = function(){};
AppModelBase.extendTo(AppModel, {
	init: function(){
		this._super();

		for (var func_name in this.bmap_travel){
			this[func_name] = this.getBMapTravelFunc(this.bmap_travel[func_name], this);
		}
		this.on('child_change-current_mp_md', function(e) {
			if (e.target){
				this.resortQueue();
			}

		});
		return this;
	},
	checkUserInput: function(opts) {
		if (opts.ext_search_query) {
			this.search(opts.ext_search_query);
		}

		var state_recovered;
		if (this.p && this.p.c_song){
			this.showNowPlaying(true);
			state_recovered = true;
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
		this.matchNav();
	},
	matchNav: function() {
		if (this.current_playing){
			this.updateState('viewing_playing', this.nav_tree.indexOf(this.current_playing) != -1);
		}

	},
	playing: function() {
		this.updateState('playing', true);
	},
	notPlaying: function() {
		this.updateState('playing', false);
	},
	createSonglist: function(map_parent, params, first_song) {
		var pl = new SongsList();
		pl.init({
			app: this,
			map_parent: map_parent
		}, params, first_song);
		return pl;
	},
	preparePlaylist: function(params, first_song){
		var pl = new SongsList();
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
			var md = this.getArtcard(artist);
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
				md.on('state_change-mp_show', function(e) {
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
		showLastfmUser: function(username) {
			var md = this.getLastfmUser(username);
			md.showOnMap();
			return md;
		},
		show_tag: function(tag){
			var md = this.routePathByModels('tags/' + tag );
			
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
	getVkUser: function(userid) {
		return this.start_page.getSPI('users/vk:' + encodeURIComponent(userid), true);
	},
	getLastfmUser: function(username) {
		return this.start_page.getSPI('users/lfm:' + encodeURIComponent(username), true);
	},
	getSongcard: function(artist_name, track_name) {
		if (!artist_name || !track_name){
			return false;
		}
		return this.start_page.getSPI('tracks/' + this.joinCommaParts([artist_name, track_name]), true);
	},
	getArtcard: function(artist_name) {

		return this.start_page.getSPI('catalog/' + encodeURIComponent(artist_name), true);
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
	},
	checkActingRequestsPriority: function() {
		var raw_array = [];
		var acting = [];
		var i;

		var w_song = this.p && this.p.wanted_song;

		var addToArray = function(arr, item) {
			if (arr.indexOf(item) == -1){
				arr.push(item);
			}
		};

		if (w_song){
			addToArray(acting, w_song);
		}
		var imporant_models = [ this.p && this.p.waiting_next, this.getNesting('current_mp_md'), this.p && this.p.c_song ];
		for (i = 0; i < imporant_models.length; i++) {
			var cur = imporant_models[i];
			if (cur){
				if (cur.getActingPriorityModels){
					var models = cur.getActingPriorityModels();
					if (models.length){
						raw_array = raw_array.concat(models);
					}
				} else {
					raw_array.push(cur);
				}
			}
		}

		for (i = 0; i < raw_array.length; i++) {
			addToArray(acting, raw_array[i]);
			
		}

		acting.reverse();
		for (i = 0; i < acting.length; i++) {
			acting[i].setPrio('acting');
		}

	}

});

return AppModel;
});