
var ArtCard;
var AlbumsList;
/*
aReq({
	url: "https://ajax.googleapis.com/ajax/services/search/web",
	type: "GET",
	dataType: app_env.cross_domain_allowed ? "json": "jsonp",
	data: {
		cx: "001069742470440223270:t1xni-63__0",
		v: "1.0",
		rsz: 1,
		q: 'Star Slinger' //"allintext:" + song + '.mp3'
	},
	timeout: 20000
	
})
.done(function(r){console.log(r)})
.fail(function(){
	
});

*/

(function(){
"use strict";
var ArtistAlbumSongs;
AlbumsList = function() {};
LoadableList.extendTo(AlbumsList, {
	model_name: 'albslist',
	main_list_name: 'albums_list',
	makeAlbum: function(obj, start_song) {
		var pl = new ArtistAlbumSongs();
		pl.init({
			map_parent: this,
			app: this.app
		}, obj, start_song);
		return pl;
	},
	addAlbum: function(obj, silent) {
		var main_list = this[this.main_list_name];
		main_list.push(this.makeAlbum(obj));

		if (!silent){
			this.setChild(this.main_list_name, main_list, true);
		}
	},
	addItemToDatalist: function(obj, silent) {
		this.addAlbum(obj, silent);
	}
});
var ArtistAlbums = function() {};
AlbumsList.extendTo(ArtistAlbums, {
	init: function(opts, params) {
		this._super(opts);
		this.artist = params.artist;
		this.updateManyStates({
			'nav-title': 'Albums of ' + this.artist,
			'url-part': '/albums'
		});
	},
	page_limit: 50,
	sendMoreDataRequest: function(paging_opts) {
		//artist.getTopAlbums
		var artist_name = this.artist;
		var _this = this;
		var request_info = {};
		request_info.request = this.app.lfm.get('artist.getTopAlbums', {
			artist: artist_name,
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
							original_artist: artist_name,
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

ArtistAlbumSongs = function() {};
songsList.extendTo(ArtistAlbumSongs, {
	init: function(opts, params, start_song) {
		this._super(opts, false, start_song);
		this.playlist_artist = this.album_artist = params.album_artist;
		this.album_name = params.album_name;
		this.original_artist = params.original_artist;

		this.updateManyStates({
			'album_artist': this.playlist_artist,
			'album_name': this.album_name,
			'original_artist': this.original_artist,
			'nav-title': '(' + params.album_artist + ') ' + params.album_name,
			'url-part': '/' + this.getAlbumURL()
		});


		/*
		var pl = this.app.createSonglist(this, {
			title: '(' + params.album_artist + ') ' + params.album_name,
			type: 'album',
			data: {artist: this.artist || params.album_artist, album: params.album_name}
		}, start_song);
		*/

		this.playlist_type = 'album';
		this.info = {artist: this.playlist_artist, album: this.album_name};
		if (params.lfm_image){
			
			this.updateState('lfm-image', this.app.art_images.getImageWrap(params.lfm_image.array));
		}

	},
	'compx-can-hide-artist-name': {
		depends_on: ['album_artist', 'original_artist'],
		fn: function(alb_artist, orgn_artist) {
			return alb_artist == orgn_artist;
		}
	},
	'compx-selected-image': {
		depends_on: ['lfm-image', 'profile-image'],
		fn: function(lfmi_wrap, pi_wrap) {
			return pi_wrap || lfmi_wrap;
		}
	},
	getAlbumURL: function() {
		if (this.playlist_artist == this.original_artist){
			return encodeURIComponent(this.album_name);
		} else {
			return stringifyParams({
				artist: encodeURIComponent(this.playlist_artist),
				album: encodeURIComponent(this.album_name)
			}, false, '=', '&', {not_sort: true});
		}
	},
	sendMoreDataRequest: function(paging_opts) {
		/*
		var loadById = function() {
			if (album_id) {
				this.app.lfm.get('playlist.fetch',{
					'playlistURL': 'lastfm://playlist/album/' + album_id
				})
					.done(function(r){
						var playlist = toRealArray(getTargetField(r, 'playlist.trackList.track'));
						var music_list = [];
						for (var i=0; i < playlist.length; i++) {
							music_list.push({
								track: playlist[i].title,
								artist: playlist[i].creator,
								lfm_image: {
									item: playlist[i].image
								}
							});
						}
						pl.putRequestedData(false, music_list);
					});
			}
		};*/

		var request_info = {};
		var _this = this;
		request_info.request = this.app.lfm.get('album.getInfo',{'artist': this.playlist_artist, album : this.album_name})
			.done(function(r){
				var tracks = toRealArray(getTargetField(r, 'album.tracks.track'));
				var track_list = [];
				var imgs = getTargetField(r, 'album.image');
				for (var i = 0; i < tracks.length; i++) {
					var cur = tracks[i];
					track_list.push({
						artist: cur.artist.name,
						track: cur.name,
						lfm_image: {
							array: imgs
						}
					});
				}
				_this.putRequestedData(request_info.request, track_list, !!r.error);

				if (!r.error){
					_this.setLoaderFinish();
				}
				//pl.putRequestedData(false, track_list);
				//getAlbumPlaylist(r.album.id, pl);
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

var TopArtistSongs = function() {};
songsList.extendTo(TopArtistSongs, {
	init: function(opts, params, start_song) {
		this._super(opts, false, start_song);
		this.artist = params.artist;

		this.info = {artist: this.artist};
		this.playlist_type = 'artist';
		this.playlist_artist = params.artist;

		this.updateManyStates({
			'nav-title': localize('Top-tracks'),
			'url-part': '/_'
		});
		
	},
	sendMoreDataRequest: function(paging_opts) {
		var artist_name = this.playlist_artist;
		var _this = this;
		var request_info = {};
		request_info.request = this.app.lfm.get('artist.getTopTracks', {
			artist: artist_name,
			limit: paging_opts.page_limit,
			page: paging_opts.next_page
		})
			.done(function(r){
				
				var tracks = toRealArray(getTargetField(r, 'toptracks.track'));


				var track_list = [];
				if (tracks.length) {
					var l = Math.min(tracks.length, paging_opts.page_limit);
					for (var i=paging_opts.remainder; i < l; i++) {
						track_list.push({
							artist : artist_name,
							track: tracks[i].name,
							lfm_image: {
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

var FreeArtistTracks = function() {};
songsList.extendTo(FreeArtistTracks, {
	sendMoreDataRequest: function(paging_opts) {
		var artist_name = this.playlist_artist;
		var _this = this;
		var request_info = {};
		request_info.request = this.app.lfm.get('artist.getPodcast', {artist: artist_name})
			.done(function(r){
				var tracks = toRealArray(getTargetField(r, 'rss.channel.item'));
				
				var track_list = [];
				var files_list = [];
				if (tracks) {
					
					for (var i = 0; i < tracks.length; i++) {
						var cur = tracks[i];

						var link = getTargetField(cur, 'enclosure.url');
						if (link){
							continue;
						}

						var track_obj = guessArtist(cur.title, cur['itunes:author']);
						if (!track_obj.track){
							continue;
						}
						if (!track_obj.artist){
							track_obj.artist = artist_name;
						}
	
						track_list.push(track_obj);
						files_list.push(_this.app.createLFMFile(track_obj.artist, track_obj.track, link));
						
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

ArtCard = function() {};
mapLevelModel.extendTo(ArtCard, {
	model_name: 'artcard',
	page_name: "art card",
	getURL: function() {
		return '/catalog/' + this.app.encodeURLPart(this.artist);
	},
	complex_states: {
		'selected-image': {
			depends_on: ['lfm-image', 'profile-image'],
			fn: function(lfmi_wrap, pi_wrap) {
				return pi_wrap || lfmi_wrap;
			}
		}
	},
	init: function(opts, params) {
		this._super(opts);
		this.app = opts.app;
		this.albums_models = {};
		this.artist = params.artist;
		this.getTopTracks();
		this.getSimilarArtists();
		this.updateState('nav-title', this.artist);
		this.updateState('artist-name', this.artist);

		this.albums = new ArtistAlbums();
		this.albums.init({
			map_parent: this,
			app: this.app
		}, {artist: this.artist});
		this.setChild('albums_list', this.albums);

		this.updateState('lfm-image', params.lfm_image &&
			this.app.art_images.getImageWrap(params.lfm_image.array));

		var _this = this;
		this.on('state-change.mp-show', function(e) {
			if (e.value && e.value.userwant){
				_this.loadInfo();
			}
		});

		this.updateState('url-part', '/catalog/' + this.app.encodeURLPart(this.artist));
	},
	showTopTacks: function(track_name) {
		var start_song;
		if (track_name){
			start_song = {
				artist: this.artist,
				track: track_name
			};
		}

		var pl = this.getTopTracks(start_song);
		pl.showOnMap();
		if (start_song){
			pl.showTrack(start_song);
		}
		return pl;
	},


	showSimilarArtists: function(opts) {
		var artl = this.getSimilarArtists();
		artl.showOnMap();
		return artl;
	},
	showAlbum: function(params, start_song) {
		if (!params.album_artist){
			params.album_artist = this.artist;
		}
		var pl = this.getAlbum(params, start_song);
		pl.showOnMap();
		return pl;
	},
	loadInfo: function(){
		if (this.info_loaded){
			return;
		} else {
			this.info_loaded = true;
		}
		var _this = this;
		this.addRequest(this.app.goog_sc.get(this.artist)
			.done(function(r){
				var url = getTargetField(r, 'responseData.results.0.url');
				var link_node = document.createElement('a');
				link_node.href = url;

				var url_parts = link_node.pathname.replace(/^\//,'').split('/');
				if (url_parts.length == 1){
					_this.updateState('soundcloud_profile', url_parts[0]);
				}
			})
		);
		this.top_songs.preloadStart();
		this.albums.preloadStart();
		
		this.loadBaseInfo();
		
		this.setPrio('highest');
		
	},
	loadBaseInfo: function(){
		var _this = this;

		this.updateState('loading-baseinfo', true);
		this.addRequest(this.app.lfm.get('artist.getInfo', {'artist': this.artist})
			.done(function(r){
				_this.updateState('loading-baseinfo', false);
				_this.updateState('profile-image', _this.app.art_images.getImageWrap(getTargetField(r, 'artist.image')));

				var psai = parseArtistInfo(r);
	
				if (psai.tags){
					_this.updateState('tags', psai.tags);
				}
				if (psai.bio){
					_this.updateState('bio', psai.bio);
				}

				
				if (psai.similars){
					var data_list = [];
					for (var i = 0; i < psai.similars.length; i++) {
						var cur = psai.similars[i];
						data_list.push({
							artist: cur.name,
							lfm_image: {
								array: cur.image
							}
						});
						
					}
					_this.similar_artists.setPreviewList(data_list);
				}
				
			})
			.fail(function(){
				_this.updateState('loading-baseinfo', false);
			}), {
				order: 2
			}
		);
	
	},
	getTopTracks: function(start_song) {
		if (this.top_songs){
			return this.top_songs;
		}


		var pl = new TopArtistSongs();
		pl.init({
			app: this.app,
			map_parent: this
		}, {
			artist: this.artist
		}, start_song);
		this.top_songs = pl;
		this.setChild('top_songs', pl, true);
		return pl;


		var pl = this.app.createSonglist(this, {
			title: localize('Top-tracks'),
			type: 'artist',
			data: {artist: this.artist}
		}, start_song);
		
		
		var artist = this.artist;
		pl.setLoader(function(paging_opts) {
			
			var request_info = {};
			request_info.request = this.app.lfm.get('artist.getTopTracks', {
				artist: artist,
				limit: paging_opts.page_limit,
				page: paging_opts.next_page
			})
				.done(function(r){
					
					var tracks = toRealArray(getTargetField(r, 'toptracks.track'));


					var track_list = [];
					if (tracks.length) {
						var l = Math.min(tracks.length, paging_opts.page_limit);
						for (var i=paging_opts.remainder; i < l; i++) {
							track_list.push({
								artist : artist ,
								track: tracks[i].name,
								lfm_image: {
									array: tracks[i].image
								}
								
							});
						}
						
					}
					pl.putRequestedData(request_info.request, track_list, r.error);
					
				})
				.fail(function() {
					pl.requestComplete(request_info.request, true);
				})
				.always(function() {
					request_info.done = true;
				});
			return request_info;
		});
		return pl;
	},
	getAlbum: function(params, start_song) {
		var kystring = stringifyParams({artist: params.album_artist, name: params.album_name}, false, '=', '&');
		if (this.albums_models[kystring]){
			return this.albums_models[kystring];
		}

		/*
		var pl = this.app.createSonglist(this, {
			title: '(' + params.album_artist + ') ' + params.album_name,
			type: 'album',
			data: {artist: this.artist || params.album_artist, album: params.album_name}
		}, start_song);*/

		var pl = new ArtistAlbumSongs();
		pl.init({
			map_parent: this,
			app: this.app
		}, {
			album_artist: params.album_artist,
			album_name: params.album_name,
			original_artist: this.artist
		}, start_song);

		this.albums_models[kystring] = pl;
		return pl;
	},
	getSimilarArtists: function() {


		if (this.similar_artists){
			return this.similar_artists;
		}
		var artl = new SimilarArtists();
		artl.init({
			app: this.app,
			map_parent: this
		}, {
			artist: this.artist
		});
		this.setChild('similar_artists', artl, true);
		this.similar_artists = artl;
		return artl;
	}
});




var ArtistInArtl = function() {};
ArtCard.extendTo(ArtistInArtl, {
	skip_map_init: true,
	showArtcard: function() {
		this.app.showArtcardPage(this.artist);
	}
});

var ArtistsListPlaylist = function() {};
songsList.extendTo(ArtistsListPlaylist, {
	init: function(opts, params) {
		this._super(opts);
		this.artists_list = params.artists_list;
		this.original_artist = params.artist;
		if (params.page_limit){
			this.page_limit = params.page_limit;
		}
		this.updateState('nav-title', params.title);
		this.updateState('url-part', '/~');
	},
	sendMoreDataRequest: function() {
		return this.artists_list.sendMoreDataRequest.apply(this, arguments);
	},
	getRqData: function() {
		return this.artists_list.getRqData.apply(this.artists_list, arguments);
	}
});


var ArtistsList = function() {}; 
window.ArtistsList = ArtistsList;
LoadableList.extendTo(ArtistsList, {
	model_name: 'artslist',
	main_list_name: 'artists_list',
	createRPlist: function() {
		if (!this.ran_playlist){
			var pl = new ArtistsListPlaylist();
			pl.init({
				app: this.app,
				map_parent: this
			}, {
				title: this.state('nav-title'),
				artists_list: this,
				page_limit: this.page_limit
			});
			this.ran_playlist = pl;
		}
		return this;
	},
	requestRandomPlaylist: function() {
		this.createRPlist();
		this.ran_playlist.showOnMap();
	},
	makeArtist: function(obj) {
		var artcard = new ArtistInArtl();
		artcard.init({
			app: this.app
		}, obj);
		return artcard;
	},
	addArtist: function(obj, silent) {
		var main_list = this[this.main_list_name];
		main_list.push(this.makeArtist(obj));

		if (!silent){
			this.setChild(this.main_list_name, main_list, true);
		}
	},
	addItemToDatalist: function(obj, silent) {
		this.addArtist(obj, silent);
	}
});

var SimilarArtists  = window.SimilarArtists = function() {};
ArtistsList.extendTo(SimilarArtists, {
	page_limit: 100,
	init: function(opts, params) {
		this._super(opts);
		this.original_artist = params.artist;


		this.updateState('nav-title', 'Similar to «' + this.original_artist + '» artists');
		this.updateState('url-part', '/+similar');

	},
	getRqData: function(paging_opts) {
		return {
			artist: this.original_artist,
			limit: paging_opts.page_limit,
			page: paging_opts.next_page
		};
	},
	sendMoreDataRequest: function(paging_opts){
		var request_info = {};
		var _this = this;
		request_info.request = this.app.lfm.get('artist.getSimilar',this.getRqData(paging_opts))
			.done(function(r){
				var artists = toRealArray(getTargetField(r, 'similarartists.artist'));
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
				_this.putRequestedData(request_info.request, data_list, !!r.error);
				if (!r.error){
					_this.setLoaderFinish();
				}
				//"artist.getSimilar" does not support paging
				
			})
			.fail(function() {
				_this.requestComplete(request_info.request, true);
			})
			.always(function() {
				request_info.done = true;
			});
		return request_info;
	},
	setPreviewList: function(raw_array) {
		var preview_list = this.getChild(this.preview_mlist_name);
		if (!preview_list || !preview_list.length){
			preview_list = [];
			for (var i = 0; i < raw_array.length; i++) {
				preview_list.push(this.makeArtist(raw_array[i]));
				
			}
			this.setChild(this.preview_mlist_name, preview_list, true);
		}
	}
});


})();