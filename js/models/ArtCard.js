define(['spv', 'pv', 'app_serv', 'js/libs/FuncsStack', 'js/libs/BrowseMap','./LoadableList', './SongsList', 'js/common-libs/htmlencoding', 'js/libs/Mp3Search', 'js/modules/declr_parsers'],
function(spv, pv, app_serv, FuncsStack, BrowseMap, LoadableList, SongsList, htmlencoding, Mp3Search, declr_parsers){
"use strict";
var localize = app_serv.localize;

var SimilarArtists = function() {};//must be here

var ArtCard;
var pvUpdate = pv.update;

var ArtistAlbumSongs = spv.inh(SongsList, {
	init: function(target, opts, params) {
		target.playlist_artist = target.album_artist = params.album_artist;
		target.album_name = params.album_name;
		target.original_artist = params.original_artist;

		target.updateManyStates({
			'album_artist': target.playlist_artist,
			'album_name': target.album_name,
			'original_artist': target.original_artist,
			'nav_title': '(' + params.album_artist + ') ' + params.album_name,
			'url_part': '/' + target.getAlbumURL()
		});

		target.playlist_type = 'album';
		if (params.lfm_image){

			pvUpdate(target, 'lfm_image', target.app.art_images.getImageWrap(params.lfm_image.array));
		}
		if (params.lfm_img) {
			pvUpdate(target, 'lfm_img', params.lfm_img);
		}
	}
}, {
	network_data_as_states: false,
	'compx-can_hide_artist_name': {
		depends_on: ['album_artist', 'original_artist'],
		fn: function(alb_artist, orgn_artist) {
			return alb_artist == orgn_artist;
		}
	},
	'compx-selected_image': {
		depends_on: ['lfm_img', 'lfm_image', 'profile_image'],
		fn: function(lfm_img, lfmi_wrap, pi_wrap) {
			return pi_wrap || lfm_img || lfmi_wrap;
		}
	},
	getURLPart: function(params, app){
		if (params.album_artist == params.original_artist){
			return app.encodeURLPart(params.album_name);
		} else {
			return app.encodeURLPart(params.album_artist) + ',' + app.encodeURLPart(params.album_name);
		}
	},
	getAlbumURL: function() {
		return this.getURLPart({
			original_artist: this.original_artist,
			album_artist: this.playlist_artist,
			album_name: this.album_name
		}, this.app);
	},
	'nest_req-songs-list': [
		[
			{
				is_array: true,
				source: 'album.tracks.track',
				props_map: {
					artist: 'artist.name',
					track: 'name',
					album_image: ['lfm_image', '^album.image'],
					album_name: '^album.name'
				}
			}
		],
		['lfm', 'get', function() {
			return ['album.getInfo', {'artist': this.playlist_artist, album : this.album_name}];
		}]
	]
});
var ArtistTagsList = function() {};
LoadableList.TagsList.extendTo(ArtistTagsList, {
	// init: function(opts, params) {
	// 	this._super.apply(this, arguments);
	// 	this.artist_name = params.artist;
	// },
	'compx-preview_loading': [
		['^tags_list__loading'],
		function(state) {
			return state;
		}
	],
	'compx-preview_list': [
		['^tags_list'],
		function(state) {
			return state;
		}
	],
	'nest_req-tags_list': [
		[{
			is_array: true,
			source: 'toptags.tag',
			props_map: {
				count: null,
				name: null
			}
		}],
		['lfm', 'get', function() {
			return ['artist.getTopTags', {
				artist: this.head.artist_name
			}];
		}]
	]
});

var AlbumsList = spv.inh(LoadableList, {}, {
	model_name: 'albslist',
	main_list_name: 'albums_list',
	'nest_rqc-albums_list': ArtistAlbumSongs,
	items_comparing_props: [
		['album_artist', 'album_artist'],
		['album_name', 'album_name'],
		['original_artist', 'original_artist']]
});

var DiscogsAlbumSongs = function() {};
SongsList.extendTo(DiscogsAlbumSongs, {
	init: function(opts, params) {
		this._super(opts, false);
		this.playlist_artist = this.album_artist = params.artist;
		this.album_name = params.title;
		this.album_id = params.id;

		this.release_type = params.type;

		//this.original_artist = params.original_artist;

		var image_url = params.thumb && params.thumb.replace('api.discogs.com', 's.pixogs.com').replace('s.pixogs.com/images/', 's.pixogs.com/image/');


		this.updateManyStates({
			'album_artist': this.playlist_artist,
			'album_name': this.album_name,
			'album_year': params.year,
		//	'original_artist': this.original_artist,
			'image_url': image_url && {url: image_url},
			'nav_title': '(' + this.album_artist + ') ' + this.album_name,
			'url_part': '/' + this.album_id
		});
	},
	'compx-can_hide_artist_name': {
		depends_on: ['album_artist', 'original_artist'],
		fn: function(alb_artist, orgn_artist) {
			return alb_artist == orgn_artist;
		}
	},
	'compx-selected_image': {
		depends_on: ['lfm_image', 'profile_image', 'image_url'],
		fn: function(lfmi_wrap, pi_wrap, image_url) {
			return pi_wrap || lfmi_wrap || image_url;
		}
	},
	getAlbumURL: function() {
		return '';
	},
	'nest_req-songs-list': [
		[function(r) {
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

			var tracks = spv.toRealArray(spv.getTargetField(r, 'tracklist'));
			var track_list = [];
			var release_artist = compileArtistsArray(r.artists);
			var image_url = _this.state('image_url');
			image_url = image_url && image_url.url;
			//var imgs = spv.getTargetField(r, 'album.image');
			for (var i = 0; i < tracks.length; i++) {
				var cur = tracks[i];
				var song_obj = {
					artist: compileArtistsArray(cur.artists) || release_artist,
					track: cur.title,
					album_image: image_url && {url: image_url},
					album_name: _this.album_name
				};
				track_list.push(song_obj);
			}
			return track_list;

		}],
		['discogs', 'get', function() {
			var discogs_url;
			if (this.release_type == 'master'){
				discogs_url = '/masters/';
			} else {
				discogs_url = '/releases/';
			}

			return [discogs_url + this.album_id,{}];
		}]
	]
});

var DiscogsAlbums = function() {};
AlbumsList.extendTo(DiscogsAlbums, {
	// init: function(opts, params) {
	// 	this._super.apply(this, arguments);
	// 	// this.artist_name = params.artist;

	// 	this.initStates({
	// 		'artist_id': false,
	// 		'possible_loader_disallowing': localize('no-dgs-id')
	// 	});

	// 	// this.wch(this.map_parent, 'discogs_id_searching', 'profile_searching', true);
	// 	// this.wch(this.map_parent, 'discogs_id', 'artist_id', true);

	// },
	'stch-should_load': function(target, state) {
		if (state) {
			target.preloadStart();
		}
	},
	'stch-mp_show': function(target, state) {
		if (state) {
			target.map_parent.requestState('discogs_id');
		}
	},
	'compx-should_load': [
		['^mp_has_focus', 'mp_show', 'artist_id'],
		function(pfocus, mp_show, artist_id) {
			return artist_id && (mp_show || pfocus);
		}
	],
	'compx-possible_loader_disallowing': [['possible_loader_disallowing'],
	function() {
		return localize('no-dgs-id');
	}],
	'compx-profile_searching': [['^discogs_id_searching']],
	'compx-artist_id':[['^discogs_id']],
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
	manual_previews: false,
	'nest_rqc-albums_list': DiscogsAlbumSongs,
	'nest_req-albums_list': [
		[function(r) {
			return spv.toRealArray(spv.getTargetField(r, 'releases'));
		}, {
			source: 'pagination',
			props_map: {
				page_num: ['num', 'page'],
				items_per_page: ['num', 'per_page'],
				total_pages_num: ['num', 'pages'],
				total: ['num', 'items']
			}
		}],
		['discogs', 'get', function() {
			var artist_id = this.state('artist_id');
			return ['/artists/' + artist_id + '/releases', null];
		}]
	]

});

var ArtistAlbums = function() {};
AlbumsList.extendTo(ArtistAlbums, {
	page_limit: 50,
	'nest_req-albums_list': [
		declr_parsers.lfm.getAlbums('topalbums'),
		['lfm', 'get', function() {
			return ['artist.getTopAlbums', {
				artist: this.head.artist_name
			}];
		}]
	],
	getSPC: true,
	subPager: function(pstr, string) {
		var parts = this.app.getCommaParts(string);
		var artist = parts[1] ? parts[0] : this.head.artist_name;

		return this.findMustBePresentDataItem({
			original_artist: this.head.artist_name,
			album_artist: artist,
			album_name: parts[1] ? parts[1] : parts[0]
		});
	}
});




var HypemArtistSeFreshSongs = function() {};
SongsList.HypemPlaylist.extendTo(HypemArtistSeFreshSongs, {
	send_params: {},
	'nest_req-songs-list': [
		declr_parsers.hypem.tracks,
		['hypem', 'get', function(opts) {
			var path = '/playlist/search/' + this.head.artist_name + '/json/' + opts.paging.next_page +'/data.js';
			return [path, this.send_params];
		}]
	]
});
var HypemArtistSeUFavSongs = function() {};
SongsList.HypemPlaylist.extendTo(HypemArtistSeUFavSongs, {

	send_params: {
		sortby:'favorite'
	},
	'nest_req-songs-list': [
		declr_parsers.hypem.tracks,
		['hypem', 'get', function(opts) {
			var path = '/playlist/search/' + this.head.artist_name + '/json/' + opts.paging.next_page +'/data.js';
			return [path, this.send_params];
		}]
	]
});
var HypemArtistSeBlogged = function() {};
SongsList.HypemPlaylist.extendTo(HypemArtistSeBlogged, {
	send_params: {
		sortby:'blogged'
	},
	'nest_req-songs-list': [
		declr_parsers.hypem.tracks,
		['hypem', 'get', function(opts) {
			var path = '/playlist/search/' + this.head.artist_name + '/json/' + opts.paging.next_page +'/data.js';
			return [path, this.send_params];
		}]
	]
});



var SoundcloudArtcardSongs = function() {};
SongsList.extendTo(SoundcloudArtcardSongs, {
	init: function() {
		this._super.apply(this, arguments);
		this.wch(this.map_parent, 'sc_profile_searching', 'profile_searching', true);
		this.wch(this.map_parent, 'soundcloud_profile', 'artist_id', true);

	},
	'compx-id_searching': [
		['profile_searching'],
		function(profile_searching) {
			return profile_searching;
		}
	],
	'compx-possible_loader_disallowing': [
		['^no_soundcloud_profile', 'artist_id', '^soundcloud_profile'],
		function(no_soundcloud_profile, artist_id) {
			if (no_soundcloud_profile) {
				return localize('no-soundcloud-profile');
			}
			if (!artist_id) {
				return localize('Sc-profile-not-found');
			}
		}
	],
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
	}
});
var SoundcloudArtistLikes = function() {};
SoundcloudArtcardSongs.extendTo(SoundcloudArtistLikes, {
	'nest_req-songs-list': [
		[declr_parsers.soundcloud.tracksFn, true],
		['sc_api', 'get', function() {
			var artist_id = this.state('artist_id');
			return ['users/' + artist_id + '/favorites', null];
		}]

	]
});
var SoundcloudArtistSongs = function() {};
SoundcloudArtcardSongs.extendTo(SoundcloudArtistSongs, {
	'nest_req-songs-list': [
		[declr_parsers.soundcloud.tracksFn, true],
		['sc_api', 'get', function() {
			var artist_id = this.state('artist_id');
			return ['users/' + artist_id + '/tracks', null];
		}]

	],
	allow_artist_guessing: true
});

var TopArtistSongs = function() {};
SongsList.extendTo(TopArtistSongs, {
	init: function(opts, params) {
		this._super(opts, params);

		this.playlist_type = 'artist';
		this.playlist_artist = this.map_parent.head.artist;
	},
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('toptracks'),
		['lfm', 'get', function() {
				return ['artist.getTopTracks', {
				artist: this.head.artist_name
			}];
		}]
	]
});

var FreeArtistTracks = function() {};
SongsList.extendTo(FreeArtistTracks, {
	'nest_req-songs-list': [
		[
			function(r) {
				var tracks = spv.toRealArray(spv.getTargetField(r, 'rss.channel.item'));

				var track_list = [];
				//var files_list = [];
				if (tracks) {

					for (var i = 0; i < tracks.length; i++) {
						var cur = tracks[i];

						var link = spv.getTargetField(cur, 'enclosure.url');
						if (link){
							continue;
						}

						var track_obj = Mp3Search.guessArtist(cur.title, cur['itunes:author']);
						if (!track_obj.track){
							//continue;
						}
						if (!track_obj.artist){
							//track_obj.artist = artist_name;
						}

						track_list.push(track_obj);
						//files_list.push(_this.app.createLFMFile(track_obj.artist, track_obj.track, link));

					}

				}
				return track_list;
			}
		],
		['lfm', 'get', function() {
			return ['artist.getPodcast', {artist: this.playlist_artist}];
		}]
	]
});

var ArtCardBase = function() {};
BrowseMap.Model.extendTo(ArtCardBase, {
	model_name: 'artcard',
	getURL: function() {
		return '/catalog/' + this.app.encodeURLPart(this.head.artist_name);
	},
	complex_states: {

		nav_title: [['artist_name']],
		url_part: [['artist_name'], function(artist_name) {
			return artist_name && '/catalog/' + this.app.encodeURLPart(artist_name);
		}],
		'selected_image': {
			depends_on: ['lfm_image', 'lfm_img', 'profile_image'],
			fn: function(lfmi_wrap, lfm_img, pi_wrap) {
				return pi_wrap || lfm_img || lfmi_wrap;
			}
		}
	},
	'compx-available_images': [
		['selected_image', 'images'],
		function (selected_image, images) {
			return images || (selected_image && [selected_image]);
		}
	],

	sub_pa: {
		'_': {
			constr: TopArtistSongs,
			title:  localize('Top-tracks')
		},
		'+similar': {
			constr: SimilarArtists,
			getTitle: function() {
				return localize("Similar to «%artist%» artists").replace('%artist%', this.head.artist_name);
			}
		},
		'tags': {
			constr: ArtistTagsList,
			title: localize('Tags')
		},
		'albums': {
			constr: DiscogsAlbums,
			title: localize('Albums from Discogs')
		},
		'albums_lfm': {
			constr: ArtistAlbums,
			getTitle: function() {
				return localize('Albums of %artist% from last.fm').replace('%artist%', this.head.artist_name);
			}
		},
		'soundcloud': {
			constr: SoundcloudArtistSongs,
			title: localize('Art-sc-songs')
		},
		'soundcloud_likes': {
			constr: SoundcloudArtistLikes,
			title: localize('Art-sc-likes')
		},
		'fresh': {
			constr: HypemArtistSeFreshSongs,
			title: localize('Fresh songs')
		},
		'most_favorites': {
			constr: HypemArtistSeUFavSongs,
			title: localize('Most Favorites')
		},
		'blogged': {
			constr: HypemArtistSeBlogged,
			title: localize('Most Reblogged')
		}
	},
	'nest-tags_list': ['tags', false, 'init_ext'],
	'nest-similar_artists': ['+similar', false, 'init_ext'],



	'nest-top_songs': ['_', true, 'init_heavy'],
	'nest-dgs_albums': ['albums', true, 'init_heavy'],
	'nest-albums_list': ['albums_lfm', true, 'init_heavy'],
	'nest-soundc_prof': ['soundcloud', true, 'init_heavy'],
	'nest-soundc_likes': ['soundcloud_likes', true, 'init_heavy'],
	'nest-hypem_new': ['fresh', true, 'init_heavy'],
	'nest-hypem_fav': ['most_favorites', true, 'init_heavy'],
	'nest-hypem_reblog': ['blogged', true, 'init_heavy'],


	initHeavy: pv.getOCF('heavy_oi', function() {
		this.albums_models = {};
		pvUpdate(this, 'init_heavy', true);
	}),

	getTagsModel: function() {
		return this.getSPI('tags', true);
	},
	showTopTacks: function(track_name) {
		var start_song;
		if (track_name){
			start_song = {
				artist: this.head.artist_name,
				track: track_name
			};
		}

		var pl = this.getTopTracks();
		pl.showOnMap();
		if (start_song){
			var song = pl.findMustBePresentDataItem(start_song);
			song.showOnMap();
			pl.preloadStart();
		}
		return pl;
	},


	showSimilarArtists: function(opts) {
		var artl = this.getSimilarArtists();
		artl.showOnMap();
		return artl;
	},
	showAlbum: function(params) {

		if (!params.album_artist){
			params.album_artist = this.head.artist_name;
		}

		var pl = this.getSPI('albums_lfm', true).getSPI(params.album_artist + ',' + params.album_name, true);

		pl.showOnMap();
		return pl;
	},
	preloadChildren: function(array) {
		var list = (array && array.length && array) || [this.top_songs, this.hypem_new, this.hypem_fav, this.hypem_reblog, this.albums, this.soundc_prof, this.soundc_likes, this.dgs_albums];
		for (var i = 0; i < list.length; i++) {
			list[i].preloadStart();
		}
	},
	//soundcloud_nickname
	loadInfo: function(){
		if (this.info_loaded){
			return;
		} else {
			this.info_loaded = true;
		}
		var _this = this;
		pvUpdate(this, 'sc_profile_searching', true);
		FuncsStack.chain([
			function() {
				var stack_atom = this;
				_this.addRequest(_this.app.goog_sc.get('soundcloud ' + _this.head.artist_name)
					.done(function(r){
						var artist_nickname;
						var sresults = spv.toRealArray(spv.getTargetField(r, 'responseData.results'));
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
							_this.updateManyStates({
								'no_soundcloud_profile': true,
								'sc_profile_searching': false
							});
						}
					})
					.fail(function() {
						pvUpdate(_this, 'sc_profile_searching', false);
					})
				);
			},
			function(nick_name) {
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
								pvUpdate(_this, 'sc_profile_searching', false);
								pvUpdate(_this, 'soundcloud_profile', artist_scid);
								_this.preloadNestings(['soundc_prof', 'soundc_likes']);
							} else {
								pvUpdate(_this, 'no_soundcloud_profile', true);
							}
						}
					})
					.always(function() {
						pvUpdate(_this, 'sc_profile_searching', false);
					})
				);
			}
		]);

		//this.preloadChildren();
		this.requestState('bio');
		this.requestState('discogs_id');
		//  /*,'profile_image', 'listeners', 'playcount', 'similar_artists_list', 'tags_list'*/);

	},
	req_map: [
		[
			['images'],
			function(r) {
				var images = spv.toRealArray(spv.getTargetField(r, 'images.image'));
				return [images];
			},
			['lfm', 'get', function() {
				return ['artist.getImages', {'artist': this.head.artist_name }];
			}]
		],
		[
			['profile_image', 'bio', 'listeners', 'playcount', 'similar_artists_list', 'tags_list'],
			function(r) {
				var psai = app_serv.parseArtistInfo(r);
				var profile_image = this.app.art_images.getImageWrap(spv.getTargetField(r, 'artist.image'));

				//_this.tags_list.setPreview();
				var artists_list;

				if (psai.similars){
					var data_list = [];
					for (var i = 0; i < psai.similars.length; i++) {
						var cur = psai.similars[i];
						data_list.push({
							artist_name: cur.name,
							lfm_image: this.app.art_images.getImageWrap(cur.image)
						});

					}
					artists_list = data_list;
					//_this.similar_artists.setPreviewList(data_list);
				}

				return [
					profile_image,
					psai.bio,
					spv.getTargetField(r, 'artist.stats.listeners'),
					spv.getTargetField(r, 'artist.stats.playcount'),
					artists_list, psai.tags
				];
			},
			['lfm', 'get', function() {
				return ['artist.getInfo', {'artist': this.head.artist_name}];
			}]
		],
		[
			['discogs_id'],
			function(r) {
				var artist_name = this.head.artist_name;
				var simplifyArtistName = function(name) {
					return name.replace(/\([\s\S]*?\)/, '').split(/\s|,/).sort().join('').toLowerCase();
				};

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

				return {
					discogs_id: artist_info && artist_info.id
				};

				// return {
				// 	discogs_id: ''
				// };
				//this.app.discogs.get('/database/search', {q: artist_name, type:"artist"}
			},
			['discogs', 'get', function() {
				return ['/database/search', {q: this.head.artist_name, type:"artist" }];
			}]

		]
	],
	getTopTracks: function() {
		if (this.top_songs){
			return this.top_songs;
		}
		var pl = this.getSPI('_', true);
		this.top_songs = pl;
		pv.updateNesting(this, 'top_songs', pl);
		return pl;
	},
	getAlbum: function(params) {
		var kystring = spv.stringifyParams({artist: params.album_artist, name: params.album_name}, false, '=', '&');
		if (this.albums_models[kystring]){
			return this.albums_models[kystring];
		}

		var pl = this.initSi(ArtistAlbumSongs, {
			album_artist: params.album_artist,
			album_name: params.album_name,
			original_artist: this.head.artist_name
		});

		this.albums_models[kystring] = pl;
		return pl;
	},
	getSimilarArtists: function() {


		/*if (this.similar_artists){
			return this.similar_artists;
		}

		var artl =
		pv.updateNesting(this, 'similar_artists', artl);
		this.similar_artists = artl;*/
		return this.getSPI('+similar', true);
	}
});


ArtCard = function() {};
ArtCardBase.extendTo(ArtCard, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		pvUpdate(this, 'init_ext', true);

		this.wch(this, 'mp_has_focus', function(e) {
			if (e.value){
				this.initHeavy();
				this.loadInfo();
			}
		}, true);
	}
});




var ArtistInArtl = function() {};
ArtCardBase.extendTo(ArtistInArtl, {
	net_head: ['artist_name'],
	skip_map_init: true,
	// extendedInit: function() {},
	showArtcard: function() {
		this.app.showArtcardPage(this.head.artist_name);
	}
});

var ArtistsListPlaylist = spv.inh(SongsList, {}, {
	page_limit: null,
	items_comparing_props: [['artist_name', 'artist_name']],
	'compx-has_data_loader': [
		['^has_data_loader'],
		function(state) {
			return state;
		}
	],

	requestMoreData: function() {
		var declr = this.map_parent[ 'nest_req-' + this.map_parent.main_list_name ];
		if (declr) {
			this.requestNesting( declr, this.main_list_name );
		} else {
			this._super();
		}
	},
	getRqData: function() {
		return this.map_parent.getRqData.apply(this.map_parent, arguments);
	}
});


var ArtistsList = spv.inh(LoadableList, {}, {
	model_name: 'artslist',
	main_list_name: 'artists_list',
	createRPlist: function() {
		if (!this.ran_playlist){
			var pl = this.getSPI('~', true);
			this.ran_playlist = pl;
		}
		return this.ran_playlist;
	},
	sub_pa: {
		'~': {
			constr: ArtistsListPlaylist,
			getTitle: function() {
				return this.state('nav_title');
			}
		}
	},
	requestRandomPlaylist: function(bwlev_id) {
		var bwlev = pv.getModelById(bwlev_id);
		bwlev.followTo(this.createRPlist()._provoda_id);
		// .showOnMap();
	},
	'nest_rqc-artists_list': ArtistInArtl,
	makeDataItem: function(obj) {
		return this.initSi(ArtistInArtl, obj);
	}
});


ArtistsList.extendTo(SimilarArtists, {
	page_limit: 100,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		// this.original_artist = params.artist;

		this.wch(this, 'preview_list', function(e) {
			if (e.value) {
				this.setPreviewList(e.value);
			}
		});

	},
	'compx-preview_loading': [
		['^similar_artists_list__loading'],
		function(state) {
			return state;
		}
	],
	'compx-preview_list': [
		['^similar_artists_list'],
		function(state) {
			return state;
		}
	],
	getRqData: function(paging_opts) {
		return {
			artist: this.head.artist_name,
			limit: paging_opts.page_limit
		};
	},
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('similarartists', true),
		['lfm', 'get', function(opts) {
			return ['artist.getSimilar', this.getRqData(opts.paging)];
		}]
	],
	setPreviewList: function(raw_array) {
		var preview_list = this.getNesting(this.preview_mlist_name);
		if (!preview_list || !preview_list.length){
			preview_list = [];
			for (var i = 0; i < raw_array.length; i++) {
				preview_list.push(this.initSi(ArtistInArtl, {
					network_states: raw_array[i]
				}));

			}
			pv.updateNesting(this, this.preview_mlist_name, preview_list);
		}
	}
});

ArtCard.AlbumsList = AlbumsList;
ArtCard.ArtistsList = ArtistsList;
return ArtCard;
});
