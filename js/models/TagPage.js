
var SimilarTags = function() {};
TagsList.extendTo(SimilarTags, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;
		this.updateManyStates({
			'nav_title': 'Similar to ' + this.tag_name + ' tags',
			'url_part': '/similar'
		});
	},
	sendMoreDataRequest: function(paging_opts) {
		var _this = this;
		var request_info = {};
		request_info.request = this.app.lfm.get('tag.getSimilar', {
			tag: this.tag_name
		})
			.done(function(r){
				var res_list = toRealArray(getTargetField(r, 'similartags.tag'));
				var data_list = spv.filter(res_list, 'name');
				_this.putRequestedData(request_info.request, data_list, r.error);
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

var TagAlbums = function() {};
AlbumsList.extendTo(TagAlbums, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;
		this.updateManyStates({
			'nav_title': 'Top ' + this.tag_name + ' ' + 'Albums',
			'url_part': '/albums'
		});
	},
	page_limit: 50,
	sendMoreDataRequest: function(paging_opts) {
		//artist.getTopAlbums
		var tag_name = this.tag_name;
		var _this = this;
		var request_info = {};
		request_info.request = this.app.lfm.get('tag.getTopAlbums', {
			tag: tag_name,
			limit: paging_opts.page_limit,
			page: paging_opts.next_page
		})
			.done(function(r){
				
				var albums_data = toRealArray(getTargetField(r, 'topalbums.album'));


				var data_list = [];
				if (albums_data.length) {
					var l = Math.min(albums_data.length, paging_opts.page_limit);
					for (var i=paging_opts.remainder; i < l; i++) {
						var cur = albums_data[i];
						data_list.push({
							album_artist: getTargetField(cur, 'artist.name'),
							album_name: cur.name,
							lfm_image: {
								array: cur.image
							},
							playcount: cur.playcount
						});
					}
					
				}
				_this.putRequestedData(request_info.request, data_list, r.error);
				
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
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendHypemDataRequest(paging_opts, request_info, {
			path: '/playlist/tags/' + this.getHypeTagName() + '/json/' + paging_opts.next_page +'/data.js',
			parser: this.getHypemTracksList,
			data: this.send_params
		});
	}
});
var Fav25HypemTagSongs = function() {};
HypemTagPlaylist.extendTo(Fav25HypemTagSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;

		this.updateManyStates({
			'nav_title': localize('Blogged-25-hypem'),
			'url_part': '/blogged?fav_from=25&fav_to=250',
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
			'nav_title': localize('Blogged-250-hypem'),
			'url_part': '/blogged?fav_from=250&fav_to=100000',
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
			'nav_title': localize('Blogged-all-hypem'),
			'url_part': '/blogged',
			'loader_disallowed': !(this.app.env.cross_domain_allowed || this.app.env.xhr2)
		});
	}
});

var ExplorableTagSongs = function() {};
songsList.extendTo(ExplorableTagSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;

		this.updateState('nav_title', localize('Explore-songs-exfm'));
		this.updateState('url_part', '/explore_exfm');
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

		this.updateState('nav_title', localize('Trending-songs-exfm'));
		this.updateState('url_part', '/trending_exfm');
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

		this.updateState('nav_title', localize('Free-songs'));
		this.updateState('url_part', '/free');
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

		this.updateState('nav_title', localize('Top'));
		this.updateState('url_part', '/_');
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
		this.updateState('nav_title', localize('Songs'));
		this.updateState('url_part', '/songs');

		this.lists_list = [
			new TopTagSongs(), new FreeTagSongs(), new TrendingTagSongs(), new ExplorableTagSongs(),
			new AllHypemTagSongs(), new Fav25HypemTagSongs(), new Fav250HypemTagSongs()
		];

		this.initItems(this.lists_list, {app:this.app, map_parent:this}, {tag_name:this.tag_name});

		this.setChild('lists_list', this.lists_list);
		this.bindChildrenPreload();
	},
	model_name: 'tag_songs'
});


var WeekTagArtists = function() {};
ArtistsList.extendTo(WeekTagArtists, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;

		this.updateState('nav_title', localize('Week-chart'));
		this.updateState('url_part', '/week');
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

		this.updateState('nav_title', localize('Top'));
		this.updateState('url_part', '/_');
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
		this.updateManyStates({
			'nav_title':  localize('Artists'),
			'url_part': '/artists'
		});


		this.lists_list = [new TagTopArtists(), new WeekTagArtists()];

	

		this.initItems(this.lists_list, {app:this.app, map_parent:this}, {tag_name:this.tag_name});
		this.setChild('lists_list', this.lists_list);
		this.bindChildrenPreload();
	},
	model_name: 'tag_artists'
});


var TagPage = function() {};
mapLevelModel.extendTo(TagPage, {
	init: function(opts, params) {
		this._super(opts);

		this.tag_name = this.urp_name = params.urp_name || params.tag_name;
		this.updateState('nav_title', 'Tag ' + this.tag_name);
		this.updateState('url_part', '/tags/' + this.tag_name);
		this.updateState('tag_name', this.tag_name);


		var common_init_children = [];

		var artists_lists = new ArtistsLists();
		var songs_list = new SongsLists();
		var albums_list = new TagAlbums();
		var similar_tags = new SimilarTags();
		common_init_children.push(artists_lists, songs_list, albums_list, similar_tags);

		for (var i = 0; i < common_init_children.length; i++) {
			common_init_children[i].init({app:this.app, map_parent:this}, {tag_name:this.tag_name});
		}

		this.setChild('artists_lists', artists_lists);
		this.setChild('songs_list', songs_list);
		this.setChild('albums_list', albums_list);
		this.setChild('similar_tags', similar_tags);

		this.on('vip-state-change.mp_show', function(e) {
			if (e.value && e.value.userwant){
				albums_list.preloadStart();
				similar_tags.preloadStart();
			}
		});
	},
	model_name: 'tag_page'

});