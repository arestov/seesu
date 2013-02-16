

var ArtCard = function(artist) {};
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
		this.updateState('nav-title', this.artist);
		this.updateState('artist-name', this.artist);


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

		this.loadTopTracks();
		this.loadAlbums();
		this.loadBaseInfo();
		
		this.setPrio('highest');
		
	},
	loadAlbums: function(){
		
		var _this = this;
		this.updateState('loading-albums', true);
		this.addRequest(lfm.get('artist.getTopAlbums', {artist: this.artist})
			.done(function(r){
				_this.updateState('loading-albums', false);
				if (r){
					var albums = toRealArray(r.topalbums.album);
					
					if (albums.length){
						albums = sortLfmAlbums(albums, _this.artist);
						if (albums.ordered){
							_this.updateState('sorted-albums', albums);
						}
					}
				}
			})
			.fail(function(){
				_this.updateState('loading-albums', false);
			}), {
				order: 1
			}
		);
	},
	loadTopTracks: function(){
		
		var _this = this;
		this.updateState('loading-toptracks', true);
		this.addRequest(
			lfm.get('artist.getTopTracks',{'artist': this.artist, limit: 30, page: 1 })
				.done(function(r){
					var tracks = toRealArray(getTargetField(r, 'toptracks.track'));

					if (tracks.length){
						var track_list = [];
					
						for (var i=0, l = Math.min(tracks.length, 30); i < l; i++) {
							track_list.push({'artist' : this.artist ,'track': tracks[i].name, images: tracks[i].image});
						}

						_this.updateState('toptracks', track_list);
					}
					
				})
				.always(function(){
					_this.updateState('loading-toptracks', false);
				}),
			{
				order: 3
			}
		);
		
	},
	loadBaseInfo: function(){
		var _this = this;

		this.updateState('loading-baseinfo', true);
		this.addRequest(lfm.get('artist.getInfo', {'artist': this.artist})
			.done(function(r){
				_this.updateState('loading-baseinfo', false);
				_this.updateState('profile-image', _this.app.art_images.getImageWrap(getTargetField(r, 'artist.image')));

				r = parseArtistInfo(r);
	
				if (r.tags){
					_this.updateState('tags', r.tags);
				}
				if (r.bio){
					_this.updateState('bio', r.bio);
				}
				if (r.similars){
					_this.updateState('similars', r.similars);
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
		if (this.top_artists_model){
			return this.top_artists_model;
		}

		var pl = this.app.createSonglist(this, {
			title: 'Top of ' + this.artist,
			type: 'artist',
			data: {artist: this.artist}
		}, start_song);
		this.top_artists_model = pl;

		
		var artist = this.artist;
		pl.setLoader(function(paging_opts) {
			
			var request_info = {};
			request_info.request = lfm.get('artist.getTopTracks', {
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

		var pl = this.app.createSonglist(this, {
			title: '(' + params.album_artist + ') ' + params.album_name,
			type: 'album',
			data: {artist: this.artist || params.album_artist, album: params.album_name}
		}, start_song);

		this.albums_models[kystring] = pl;

		/*
		var loadById = function() {
			if (album_id) {
				lfm.get('playlist.fetch',{
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
		
		pl.setLoader(function(paging_opts) {
			var request_info = {};
			var _this = this;
			request_info.request = lfm.get('album.getInfo',{'artist': params.album_artist, album : params.album_name})
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
		});
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
		return artl;








		/*
		if (this.similar_artists){
			return this.similar_artists;
		}

		var pl = this.app.createSonglist(this, {//can autoload
			title: 'Similar to «' + this.artist + '» artists',
			type: 'similar artists',
			data: {artist: this.artist}
		});

		this.similar_artists = pl;
		var artist = this.artist;

		pl.setLoader(function(paging_opts){
			var request_info = {};
			var _this = this;
			request_info.request = lfm.get('artist.getSimilar',{
				artist: artist, 
				limit: paging_opts.page_limit, 
				page: paging_opts.next_page
			})
				.done(function(r){
					var artists = toRealArray(getTargetField(r, 'similarartists.artist'));
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
					if (!r.error){
						_this.setLoaderFinish();
					}
					
				})
				.fail(function() {
					_this.requestComplete(request_info.request, true);
				})
				.always(function() {
					request_info.done = true;
				});
			return request_info;
		});

		return pl;*/
	}
});
