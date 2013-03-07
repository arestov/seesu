var ArtCard;
var AlbumsList;

(function(){
"use strict";
var ArtistAlbumSongs;
var ArtistTagsList = function() {};
TagsList.extendTo(ArtistTagsList, {
	init: function(opts, params) {
		this._super(opts);
		this.artist_name = params.artist;
		this.updateManyStates({
			'nav_title': localize('Tags'),
			'url_part': '/tags'
		});
	},
	sendMoreDataRequest: function() {
		var _this = this;
		var request_info = {};
		request_info.request = this.app.lfm.get('artist.getTopTags', {
			artist: this.artist_name
		})
			.done(function(r){
				var res_list = toRealArray(getTargetField(r, 'toptags.tag'));
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
var DiscogsAlbumSongs = function() {};
songsList.extendTo(DiscogsAlbumSongs, {
	init: function(opts, params, start_song) {
		this._super(opts, false, start_song);
		this.playlist_artist = this.album_artist = params.artist;
		this.album_name = params.title;
		this.album_id = params.id;

		this.release_type = params.type;

		//this.original_artist = params.original_artist;


		this.updateManyStates({
			'album_artist': this.playlist_artist,
			'album_name': this.album_name,
		//	'original_artist': this.original_artist,
			'nav_title': '(' + this.album_artist + ') ' + this.album_name,
			'image_url': params.thumb && {url: params.thumb},
			'url_part': '/' + this.album_id
		});
	},
	'compx-can-hide-artist_name': {
		depends_on: ['album_artist', 'original_artist'],
		fn: function(alb_artist, orgn_artist) {
			return alb_artist == orgn_artist;
		}
	},
	'compx-selected_image': {
		depends_on: ['lfm_image', 'profile-image', 'image_url'],
		fn: function(lfmi_wrap, pi_wrap, image_url) {
			return pi_wrap || lfmi_wrap || image_url;
		}
	},
	getAlbumURL: function() {
		return '';
	},
	sendMoreDataRequest: function(paging_opts) {
		var request_info = {};
		var _this = this;


		var compileArtistsArray = function(array) {
			var result = '';
			if (!array){
				return result;
			}
			for (var i = 0; i < array.length; i++) {
				result += (array[i].name || '');
				if (array[i].join){
					result += (" " + array[i].join + " ");
				}
				
			}
			return result;
		};

		var discogs_url;
		if (this.release_type == 'master'){
			discogs_url = '/masters/';
		} else {
			discogs_url = '/releases/';
		}



		request_info.request = this.app.discogs.get(discogs_url + this.album_id,{})
			.done(function(r){
				var tracks = toRealArray(getTargetField(r, 'tracklist'));
				var track_list = [];
				var release_artist = compileArtistsArray(r.artists);
				var image_url = _this.state('image_url');
				image_url = image_url && image_url.url;
				//var imgs = getTargetField(r, 'album.image');
				for (var i = 0; i < tracks.length; i++) {
					var cur = tracks[i];
					var song_obj = {
						artist: compileArtistsArray(cur.artists) || release_artist,
						track: cur.title,
						image_url: image_url
					};
					track_list.push(song_obj);
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

var DiscogsAlbums = function() {};
AlbumsList.extendTo(DiscogsAlbums, {
	init: function(opts, params) {
		this._super(opts);
		this.artist_name = params.artist;
		this.updateManyStates({
			'artist_id': false,
			'possible_loader_disallowing': localize('no-dgs-id'),
			'nav_title': 'Albums from Discogs',
			'url_part': '/albums'
		});

		var _this = this;
		this.map_parent.on('state-change.discogs_id_searching', function(e) {
			_this.updateState('profile_searching', e.value);
		});
		this.map_parent.on('state-change.discogs_id', function(e) {
			_this.updateState('artist_id', e.value);
		});
	},
	'compx-loader_disallowing_desc': {
		depends_on: ['profile_searching', 'loader_disallowed', 'possible_loader_disallowing'],
		fn: function(searching, disallowed, desc) {
			if (disallowed && !searching){
				return desc;
			}
		}
	},
	'compx-loader_disallowed': {
		depends_on: ['artist_id'],
		fn: function(artist_id) {
			return !artist_id;
		}
	},
	page_limit: 50,
	makeAlbum: function(obj, start_song) {
		var pl = new DiscogsAlbumSongs();
		pl.init({
			map_parent: this,
			app: this.app
		}, obj, start_song);
		return pl;
	},
	manual_previews: false,
	sendMoreDataRequest: function(paging_opts) {
		var _this = this;
		var request_info = {};
		var artist_id = this.state('artist_id');
		//http://api.discogs.com?page=1&per_page=50
		request_info.request = this.app.discogs.get('/artists/' + artist_id + '/releases', {
			per_page: paging_opts.page_limit,
			page: paging_opts.next_page
		})
			.done(function(r){
				
				var albums_data = toRealArray(getTargetField(r, 'releases'));

				
				var data_list = albums_data;

				/*
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
					
				}*/
				_this.putRequestedData(request_info.request, data_list);
				
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

var ArtistAlbums = function() {};
AlbumsList.extendTo(ArtistAlbums, {
	init: function(opts, params) {
		this._super(opts);
		this.artist = params.artist;
		this.updateManyStates({
			'nav_title': 'Albums of ' + this.artist + ' from last.fm',
			'url_part': '/albums_lfm'
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
			'nav_title': '(' + params.album_artist + ') ' + params.album_name,
			'url_part': '/' + this.getAlbumURL()
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
			
			this.updateState('lfm_image', this.app.art_images.getImageWrap(params.lfm_image.array));
		}

	},
	'compx-can-hide-artist_name': {
		depends_on: ['album_artist', 'original_artist'],
		fn: function(alb_artist, orgn_artist) {
			return alb_artist == orgn_artist;
		}
	},
	'compx-selected_image': {
		depends_on: ['lfm_image', 'profile-image'],
		fn: function(lfmi_wrap, pi_wrap) {
			return pi_wrap || lfmi_wrap;
		}
	},
	getAlbumURL: function() {
		if (this.playlist_artist == this.original_artist){
			return this.app.encodeURLPart(this.album_name);
		} else {
			return this.app.encodeURLPart(this.playlist_artist) + ',' + this.app.encodeURLPart(this.album_name);
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


var HypemArtistSeFreshSongs = function() {};
HypemPlaylist.extendTo(HypemArtistSeFreshSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.artist = params.artist;
		this.updateManyStates({
			'nav_title': 'Fresh songs',
			'url_part': '/fresh'
		});
	},
	send_params: {},
	sendMoreDataRequest: function(paging_opts) {
		return this.makePlaylistRequest(paging_opts, '/playlist/search/' + this.artist + '/json/' + paging_opts.next_page +'/data.js');
	}
});
var HypemArtistSeUFavSongs = function() {};
HypemPlaylist.extendTo(HypemArtistSeUFavSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.artist = params.artist;
		this.updateManyStates({
			'nav_title': 'Most Favorites',
			'url_part': '/most_favorites'
		});
	},
	send_params: {
		sortby:'fav'
	},
	sendMoreDataRequest: function(paging_opts) {
		return this.makePlaylistRequest(paging_opts, '/playlist/search/' + this.artist + '/json/' + paging_opts.next_page +'/data.js');
	}
});
var HypemArtistSeBlogged = function() {};
HypemPlaylist.extendTo(HypemArtistSeBlogged, {
	init: function(opts, params) {
		this._super(opts);
		this.artist = params.artist;
		this.updateManyStates({
			'nav_title': 'Most Reblogged',
			'url_part': '/blogged'
		});
	},
	send_params: {
		sortby:'blogged'
	},
	sendMoreDataRequest: function(paging_opts) {
		return this.makePlaylistRequest(paging_opts, '/playlist/search/' + this.artist + '/json/' + paging_opts.next_page +'/data.js');
	}
});



var SoundcloudArtcardSongs = function() {};
songsList.extendTo(SoundcloudArtcardSongs, {
	init: function() {
		this._super.apply(this, arguments);
		var _this = this;
		this.map_parent.on('state-change.sc_profile_searching', function(e) {
			_this.updateState('profile_searching', e.value);
		});
		this.map_parent.on('state-change.soundcloud_profile', function(e) {
			_this.updateState('artist_id', e.value);
		});
	},
	'compx-loader_disallowing_desc': {
		depends_on: ['profile_searching', 'loader_disallowed', 'possible_loader_disallowing'],
		fn: function(searching, disallowed, desc) {
			if (disallowed && !searching){
				return desc;
			}
		}
	},
	'compx-loader_disallowed': {
		depends_on: ['artist_id'],
		fn: function(artist_id) {
			return !artist_id;
		}
	},
	getSomeScList: function(paging_opts, path) {

		var artcard_artist = this.artcard_artist;
		var _this = this;
		var request_info = {};
		request_info.request = this.app.sc_api.get(path, {
			limit: paging_opts.page_limit,
			offset: paging_opts.next_page -1
		})
			.done(function(tracks){

				var track_list = [];
				if (tracks.length) {
					var l = Math.min(tracks.length, paging_opts.page_limit);
					for (var i=paging_opts.remainder; i < l; i++) {
						var cur = tracks[i];
						var song_data = guessArtist(cur.title, artcard_artist);
						if (!song_data || !song_data.artist){
							if (_this.allow_artist_guessing){
								song_data = {
									artist: artcard_artist,
									track: cur.title
								};
							} else {
								song_data = {
									artist: cur.user.username,
									track: cur.title
								};
							}

							
						}
						song_data.track = HTMLDecode(song_data.track);
						song_data.image_url = cur.artwork_url;
						song_data.file = _this.app.mp3_search.getSearchByName('soundcloud').makeSongFile(cur);
						track_list.push(song_data);
					}
					
				}
				_this.putRequestedData(request_info.request, track_list);
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
var SoundcloudArtistLikes = function() {};
SoundcloudArtcardSongs.extendTo(SoundcloudArtistLikes, {
	init: function(opts, params) {
		this._super(opts);
		this.artcard_artist = params.artist;
		this.updateManyStates({
			'artist_id': '',
			'nav_title': localize('Art-sc-likes'),
			'url_part': '/soundcloud_likes',
			'possible_loader_disallowing': localize('Sc-profile-not-found')
		});
	},
	sendMoreDataRequest: function(paging_opts) {
		var artist_id = this.state('artist_id');
		return this.getSomeScList(paging_opts, 'users/' + artist_id + '/favorites');
	}
});
var SoundcloudArtistSongs = function() {};
SoundcloudArtcardSongs.extendTo(SoundcloudArtistSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.artcard_artist = params.artist;
		this.updateManyStates({
			'artist_id': '',
			'nav_title': localize('Art-sc-songs'),
			'url_part': '/soundcloud',
			'possible_loader_disallowing': localize('Sc-profile-not-found')
		});
		
	},
	allow_artist_guessing: true,
	sendMoreDataRequest: function(paging_opts) {
		var artist_id = this.state('artist_id');
		return this.getSomeScList(paging_opts, 'users/' + artist_id + '/tracks');
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
			'nav_title': localize('Top-tracks'),
			'url_part': '/_'
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
		'selected_image': {
			depends_on: ['lfm_image', 'profile-image'],
			fn: function(lfmi_wrap, pi_wrap) {
				return pi_wrap || lfmi_wrap;
			}
		}
	},
	init: function(opts, params) {
		this._super(opts);
		this.app = opts.app;
		
		this.artist = params.artist;
		
		this.updateState('nav_title', this.artist);
		this.updateState('artist_name', this.artist);



		this.updateState('lfm_image', params.lfm_image &&
			this.app.art_images.getImageWrap(params.lfm_image.array));

		this.heavyInit();
	},
	heavyInit: function() {
		this.albums_models = {};
		this.getTopTracks();
		this.getSimilarArtists();
		var children_lists = [];

		this.tags_list = new ArtistTagsList();
		this.dgs_albums = new DiscogsAlbums();
		this.albums = new ArtistAlbums();
		this.soundc_prof = new SoundcloudArtistSongs();
		this.soundc_likes = new SoundcloudArtistLikes();
		this.hypem_new = new HypemArtistSeFreshSongs();
		this.hypem_fav = new HypemArtistSeUFavSongs();
		this.hypem_reblog = new HypemArtistSeBlogged();

		children_lists.push(this.tags_list, this.dgs_albums, this.albums, this.soundc_prof, this.soundc_likes, this.hypem_new, this.hypem_fav, this.hypem_reblog);




		for (var i = 0; i < children_lists.length; i++) {
			children_lists[i].init({
				map_parent: this,
				app: this.app
			}, {artist: this.artist});
		}

		this.setChild('tags_list', this.tags_list);
		this.setChild('albums_list', this.albums);
		this.setChild('dgs_albums', this.dgs_albums);
		this.setChild('soundc_prof', this.soundc_prof);
		this.setChild('soundc_likes', this.soundc_likes);
		this.setChild('hypem_new', this.hypem_new);
		this.setChild('hypem_fav', this.hypem_fav);
		this.setChild('hypem_reblog', this.hypem_reblog);

		var _this = this;
		this.on('state-change.mp_show', function(e) {
			if (e.value && e.value.userwant){
				_this.loadInfo();
			}
		});

		this.updateState('url_part', '/catalog/' + this.app.encodeURLPart(this.artist));
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
	preloadChildren: function(array) {
		var list = (array && array.length && array) || [this.top_songs, this.hypem_new, this.hypem_fav, this.hypem_reblog, this.albums, this.soundc_prof, this.soundc_likes, this.dgs_albums];
		for (var i = 0; i < list.length; i++) {
			list[i].preloadStart();
		}
	},
	loadInfo: function(){
		if (this.info_loaded){
			return;
		} else {
			this.info_loaded = true;
		}
		var _this = this;
		this.updateState('sc_profile_searching', true);

		var scid_search_stack = new funcsStack();
		scid_search_stack
		.next(function() {
			var stack_atom = this;
			_this.addRequest(_this.app.goog_sc.get('soundcloud ' + _this.artist)
				.done(function(r){
					var artist_nickname;

					var sresults = toRealArray(getTargetField(r, 'responseData.results'));
					for (var i = 0; i < sresults.length; i++) {
						var url = sresults[i].url;
						var link_node = document.createElement('a');
						link_node.href = url;
						var url_parts = link_node.pathname.replace(/^\//,'').split('/');
						if (url_parts.length == 1){
							artist_nickname = url_parts[0];

							
							break;
						}

						break;
					}
					if (artist_nickname){
						stack_atom.done(artist_nickname);
					} else {
						//stack_atom.reset();
					}
					
					

					
				})
				.fail(function() {
					_this.updateState('sc_profile_searching', false);
				})
			);
		})
		.next(function(nick_name) {
			_this.addRequest(_this.app.sc_api.get('resolve', {
					'_status_code_map[302]': 200,
					'_status_format': 'json',
					url: 'http://soundcloud.com/' + nick_name
				})
				.done(function(r) {
					if (r.location){
						

						var matched = r.location.match(/users\/(\d+)/);
						var artist_scid = matched[1];


						if (artist_scid){
							_this.updateState('soundcloud_profile', artist_scid);
							_this.preloadChildren([_this.soundc_prof, _this.soundc_likes]);
						}
					}
				})
				.always(function() {
					_this.updateState('sc_profile_searching', false);
					
				})
			);
			//this.reset();
		})
		.start();

		this.updateState('discogs_id_searching', true);

		var simplifyArtistName = function(name) {
			return name.replace(/\([\s\S]*?\)/, '').split(/\s|,/).sort().join('').toLowerCase();
		};
		var artist_name = this.artist;
		_this.addRequest(this.app.discogs.get('/database/search', {q: artist_name, type:"artist"})
			.done(function(r) {
				var artists_list = r && r.results;
				var artist_info;
				var simplified_artist = simplifyArtistName(artist_name);
				for (var i = 0; i < artists_list.length; i++) {
					var cur = artists_list[i];
					if (simplified_artist == simplifyArtistName(cur.title)){
						if (cur.thumb && cur.thumb.indexOf('images/record90') == -1){
							artist_info = {
								artist_name: cur.title,
								image_url: cur.thumb,
								id: cur.id
							};
							break;
						}
					}
				}
				if (artist_info){
					_this.updateState('discogs_id', artist_info.id);
					_this.dgs_albums.preloadStart();
				}
			})
			.always(function() {
				_this.updateState('discogs_id_searching', false);
			})
		);



		this.preloadChildren();
		
		this.loadBaseInfo();
		
		this.setPrio('highest');
		
	},
	loadBaseInfo: function(){
		var _this = this;

		this.updateState('loading_baseinfo', true);
		_this.tags_list.updateState('preview_loading', true);
		this.addRequest(this.app.lfm.get('artist.getInfo', {'artist': this.artist})
			.done(function(r){
				_this.updateState('loading_baseinfo', false);
				_this.updateState('profile-image', _this.app.art_images.getImageWrap(getTargetField(r, 'artist.image')));

				var psai = parseArtistInfo(r);



				_this.tags_list.updateState('preview_loading', false);
				_this.tags_list.setPreview(spv.filter(psai.tags, 'name'));
	
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
				_this.updateState('loading_baseinfo', false);
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
	heavyInit: function() {},
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
		this.updateState('nav_title', params.title);
		this.updateState('url_part', '/~');
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
				title: this.state('nav_title'),
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


		this.updateState('nav_title', 'Similar to «' + this.original_artist + '» artists');
		this.updateState('url_part', '/+similar');

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