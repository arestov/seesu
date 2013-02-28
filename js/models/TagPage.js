var HypemTagPlaylist = function() {};
HypemPlaylist.extendTo(HypemTagPlaylist, {
	
	getHypeTagName: function() {
		// instrumental hip-hop >> instrumental hip hop,
		//but trip-hip >> trip-hip (not change)
		var test_regexp = /\s|-/gi;
		var result = this.tag_name.match(test_regexp);
		if (result && result.length >= 2){
			return this.tag_name.replace(test_regexp, ' ');
		} else {
			return this.tag_name;
		}
	},
	sendMoreDataRequest: function(paging_opts) {
		return this.makePlaylistRequest(paging_opts, '/playlist/tags/' + this.getHypeTagName() + '/json/' + paging_opts.next_page +'/data.js');
	}
});
var Fav25HypemTagSongs = function() {};
HypemTagPlaylist.extendTo(Fav25HypemTagSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;

		this.updateManyStates({
			'nav-title': localize('Blogged-25-hypem'),
			'url-part': '/blogged?fav_from=25&fav_to=250',
			'browser_can_load': this.can_use
		});

	},
	send_params: {
		fav_from: 25,
		fav_to: 250
	}
});
var Fav250HypemTagSongs = function() {};
HypemTagPlaylist.extendTo(Fav250HypemTagSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;

		this.updateManyStates({
			'nav-title': localize('Blogged-250-hypem'),
			'url-part': '/blogged?fav_from=250&fav_to=100000',
			'browser_can_load': this.can_use
		});

	},
	send_params: {
		fav_from: 250,
		fav_to: 100000
	}
});

var AllHypemTagSongs = function() {};
HypemTagPlaylist.extendTo(AllHypemTagSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;

		this.updateManyStates({
			'nav-title': localize('Blogged-all-hypem'),
			'url-part': '/blogged',
			'loader_disallowed': !(this.app.env.cross_domain_allowed || this.app.env.xhr2)
		});
	}
});

var ExplorableTagSongs = function() {};
songsList.extendTo(ExplorableTagSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;

		this.updateState('nav-title', localize('Explore-songs-exfm'));
		this.updateState('url-part', '/explore:exfm');
	},
	page_limit: 100,
	sendMoreDataRequest: function(paging_opts) {
		var _this = this;
		var request_info = {};

		request_info.request = this.app.exfm.get('/explore/' + this.tag_name, {
				results: paging_opts.page_limit,
				start: paging_opts.next_page
			})
			.done(function(r){
				var tracks = toRealArray(getTargetField(r, 'songs'));
				var track_list = [];
				var files_list = [];

				for (var i = 0; i < tracks.length; i++) {
					var cur = tracks[i];
					track_list.push({
						artist: cur.artist,
						track: cur.title
					});
					
				}

				_this.setLoaderFinish();

				_this.app.mp3_search.pushSomeResults(files_list);

				_this.putRequestedData(request_info.request, track_list, r.error);

			})
			.fail(function() {
				_this.requestComplete(request_info.request, true);
			})
			.always(function() {
				request_info.done = true;
			});
			

		return request_info;
	}
});

var TrendingTagSongs = function() {};
songsList.extendTo(TrendingTagSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;

		this.updateState('nav-title', localize('Trending-songs-exfm'));
		this.updateState('url-part', '/trending:exfm');
	},
	page_limit: 100,
	sendMoreDataRequest: function(paging_opts) {
		var _this = this;
		var request_info = {};

		request_info.request = this.app.exfm.get('/trending/tag/' + this.tag_name, {
				results: paging_opts.page_limit,
				start: paging_opts.next_page
			})
			.done(function(r){
				var tracks = toRealArray(getTargetField(r, 'songs'));
				var track_list = [];
				var files_list = [];

				for (var i = 0; i < tracks.length; i++) {
					var cur = tracks[i];
					track_list.push({
						artist: cur.artist,
						track: cur.title
					});
					
				}

				_this.setLoaderFinish();

				_this.app.mp3_search.pushSomeResults(files_list);

				_this.putRequestedData(request_info.request, track_list, r.error);

			})
			.fail(function() {
				_this.requestComplete(request_info.request, true);
			})
			.always(function() {
				request_info.done = true;
			});
			

		return request_info;
	}
});

var FreeTagSongs = function() {};
songsList.extendTo(FreeTagSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;

		this.updateState('nav-title', localize('Free-songs'));
		this.updateState('url-part', '/free');
	},
	sendMoreDataRequest: function(paging_opts) {
		var _this = this;
		var request_info = {};
		request_info.request = lfm.get('playlist.fetch', {
			playlistURL: 'lastfm://playlist/tag/' + this.tag_name + '/freetracks'
		})
			.done(function(r){
				var tracks = toRealArray(getTargetField(r, 'playlist.trackList.track'));
				
				var track_list = [];
				var files_list = [];
				if (tracks) {
					
					for (var i = 0; i < tracks.length; i++) {
						if (!tracks[i].location){
							continue;
						}
						var track_obj = {
							artist: tracks[i].creator,
							track: tracks[i].title,
							lfm_image: {
								item: tracks[i].image
							}
						};

						track_list.push(track_obj);
						files_list.push(_this.app.createLFMFile(track_obj.artist, track_obj.track, tracks[i].location));
						
					}
					
				}

				_this.app.mp3_search.pushSomeResults(files_list);

				if (!r.error){
					_this.setLoaderFinish();
				}

				_this.putRequestedData(request_info.request, track_list, r.error);

			})
			.fail(function() {
				_this.requestComplete(request_info.request, true);
			})
			.always(function() {
				request_info.done = true;
			});

		return request_info;
	}
});




var TopTagSongs = function() {};
songsList.extendTo(TopTagSongs, {
	init: function(opts, params) {

		this._super(opts);
		this.tag_name = params.tag_name;

		this.updateState('nav-title', localize('Top'));
		this.updateState('url-part', '/_');
	},
	sendMoreDataRequest: function(paging_opts) {
		var _this = this;
		var request_info = {};
		request_info.request = lfm.get('tag.getTopTracks', {
			tag: (this.tag_name),
			limit: paging_opts.page_limit,
			page: paging_opts.next_page
		})
			.done(function(r){
				var tracks = toRealArray(getTargetField(r, 'toptracks.track'));
				var track_list = [];
				if (tracks) {
					for (var i=paging_opts.remainder, l = Math.min(tracks.length, paging_opts.page_limit); i < l; i++) {
						track_list.push({
							'artist' : tracks[i].artist.name,
							'track': tracks[i].name,
							lfm_image:  {
								array: tracks[i].image
							}
						});
					}
				}
				

				_this.putRequestedData(request_info.request, track_list, r.error);

			})
			.fail(function() {
				_this.requestComplete(request_info.request, true);
			})
			.always(function() {
				request_info.done = true;
			});

		return request_info;
	}

});


var SongsLists = function() {};
mapLevelModel.extendTo(SongsLists, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;
		this.updateState('nav-title', localize('Songs'));
		this.updateState('url-part', '/songs');

		var lists_list = [];

		lists_list.push(new TopTagSongs());
		lists_list.push(new FreeTagSongs());
		lists_list.push(new TrendingTagSongs());
		lists_list.push(new ExplorableTagSongs());
		lists_list.push(new AllHypemTagSongs());
		lists_list.push(new Fav25HypemTagSongs());
		lists_list.push(new Fav250HypemTagSongs());

		this.on('state-change.mp-show', function(e) {
			if (e.value && e.value.userwant){
				for (var i = 0; i < lists_list.length; i++) {
					lists_list[i].preloadStart();
				}
			}
		});

		for (var i = 0; i < lists_list.length; i++) {
			lists_list[i].init({app:this.app, map_parent:this}, {tag_name:this.tag_name});
		}

		this.setChild('lists_list', lists_list);

	},
	model_name: 'tag_songs'
});


var WeekTagArtists = function() {};
ArtistsList.extendTo(WeekTagArtists, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;

		this.updateState('nav-title', localize('Week-chart'));
		this.updateState('url-part', '/week');
	},
	page_limit: 100,
	getRqData: function(paging_opts) {
		return {
			tag: this.tag_name,
			limit: paging_opts.page_limit,
			page: paging_opts.next_page
		};
	},
	sendMoreDataRequest: function(paging_opts) {
		//lastfm images
		var _this = this;

		var request_info = {};
		request_info.request = lfm.get('tag.getWeeklyArtistChart', this.getRqData(paging_opts)).done(function(r){


				var artists = toRealArray(getTargetField(r, 'weeklyartistchart.artist'));
				var data_list = [];

				if (artists && artists.length) {

					var l = Math.min(artists.length, paging_opts.page_limit);
					for (var i=0; i < l; i++) {
						data_list.push({
							artist: artists[i].name,
							lfm_image: {
								array: artists[i].image
							}
						});
					}

				}
				_this.putRequestedData(request_info.request, data_list, r.error);

				if (!r.error){
					_this.setLoaderFinish();
				}
				
			})
			.fail(function() {
				_this.requestComplete(request_info.request, true);
			}).always(function() {
				request_info.done = true;
			});
		return request_info;
	}
});

var TagTopArtists = function() {};
ArtistsList.extendTo(TagTopArtists, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;

		this.updateState('nav-title', localize('Top'));
		this.updateState('url-part', '/_');
	},
	getRqData: function(paging_opts) {
		return {
			tag: this.tag_name,
			limit: paging_opts.page_limit,
			page: paging_opts.next_page
		};
	},
	sendMoreDataRequest: function(paging_opts){

		var _this = this;

		var request_info = {};
		request_info.request = lfm.get('tag.getTopArtists', this.getRqData(paging_opts))
			.done(function(r){
				var artists = toRealArray(getTargetField(r, 'topartists.artist'));
				var track_list = [];

				if (artists && artists.length) {

					var l = Math.min(artists.length, paging_opts.page_limit);
					for (var i=0; i < l; i++) {
						track_list.push({
							artist: artists[i].name,
							lfm_image: {
								array: artists[i].image
							}
						});
					}

				}
				_this.putRequestedData(request_info.request, track_list, r.error);
				
			})
			.fail(function() {
				_this.requestComplete(request_info.request, true);
			}).always(function() {
				request_info.done = true;
			});
		return request_info;
	}
});

var ArtistsLists = function() {};
mapLevelModel.extendTo(ArtistsLists, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;
		this.updateState('nav-title', localize('Artists'));
		this.updateState('url-part', '/artists');

		var lists_list = [];


		lists_list.push(new TagTopArtists());
		lists_list.push(new WeekTagArtists());


		for (var i = 0; i < lists_list.length; i++) {
			lists_list[i].init({app:this.app, map_parent:this}, {tag_name:this.tag_name});
		}
		
		this.on('state-change.mp-show', function(e) {
			if (e.value && e.value.userwant){
				for (var i = 0; i < lists_list.length; i++) {
					lists_list[i].preloadStart();
				}
			}
		});

		this.setChild('lists_list', lists_list);

	},
	model_name: 'tag_artists'
});


var TagPage = function() {};
mapLevelModel.extendTo(TagPage, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;
		this.updateState('nav-title', 'Tag ' + this.tag_name);
		this.updateState('url-part', '/tags/' + this.tag_name);
		this.updateState('tag-name', this.tag_name);

		var artists_lists = new ArtistsLists();
		artists_lists.init({app:this.app, map_parent:this}, {tag_name:this.tag_name});
		this.setChild('artists_lists', artists_lists);

		var songs_list = new SongsLists();
		songs_list.init({app:this.app, map_parent:this}, {tag_name:this.tag_name});
		this.setChild('songs_list', songs_list);
	},
	model_name: 'tag_page'

});