

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
		this._super();
		this.app = opts.app;
		this.artist = params.artist;
		this.updateState('nav-title', params.artist);


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
	showTopTacks: function(opts, track_name) {
		var start_song;
		if (track_name){
			start_song = {
				artist: this.artist,
				track: track_name
			};
		}
		return this.app.showTopTacks(this.artist, {
			no_navi: opts.no_navi,
			from_artcard: true,
			source_info: {
				page_md: this,
				source_name: 'top-tracks'
			}
		}, start_song);
	},
	showSimilarArtists: function(opts) {
		return this.app.showSimilarArtists(this.artist, {
			no_navi: opts.no_navi,
			from_artcard: true,
			source_info: {
				page_md: this,
				source_name: 'similar-artists'
			}
		});
	},
	showAlbum: function(album_name, opts, start_song) {
		return this.app.showAlbum({
			album_name: album_name,
			artist: this.artist
		}, {
			no_navi: opts.no_navi,
			from_artcard: true,
			source_info: {
				page_md: this,
				source_name: 'artist-albums'
			}
		}, start_song);
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
	
	}
});
