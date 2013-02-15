var songsList;
(function(){
	"use strict";

	var songsListBase = function() {};
	provoda.extendFromTo("songsListBase", mapLevelModel, songsListBase);
	

	songsList = function(){};
	songsListBase.extendTo(songsList, {
		init: function(opts, params, first_song) {
			//playlist_title, playlist_type, info
			//params.title, params.type, params.data
			
			this._super.apply(this, arguments);
			if (params){
				this.setBaseInfo(params);
			}
			
			
			this.findSongOwnPosition(first_song);

			var plarow = new PlARow();
			plarow.init(this);

			this.setChild('plarow', plarow);
			
			var _this = this;
			
			var doNotReptPl = function(state) {
				_this.updateState('dont-rept-pl', state);
			};
			if (su.settings['dont-rept-pl']){
				doNotReptPl(true);
			}
			su.on('settings.dont-rept-pl', doNotReptPl);
			this.updateState('url-part', this.getURL());
			this.on('state-change.mp-show', function(e) {
				if (e.value && e.value.userwant){
					this.preloadStart();
				}
				
			}, {skip_reg: true});
		},
		page_name: 'playlist',
		setBaseInfo: function(params) {
			this.info = params.data || {};
			if (params.title){
				this.playlist_title = params.title;
			}
			if (params.type){
				this.playlist_type = params.type;
				this.updateState('nav-title', this.playlist_title);
			}
		},
		getURL: function(){
			var url ='';
			if (this.playlist_type == 'artist'){
				url += '/_';
			} else if (this.playlist_type == 'album'){
				url += '/' + su.encodeURLPart(this.info.album);
			} else if (this.playlist_type == 'similar artists'){
				url += '/+similar';
			} else if (this.playlist_type == 'artists by tag'){
				url += '/tags/' + su.encodeURLPart(this.info.tag);
			} else if (this.playlist_type == 'tracks'){
				url += '/ds';
			} else if (this.playlist_type == 'artists by recommendations'){
				url += '/recommendations';
			} else if (this.playlist_type == 'artists by loved'){
				url += '/loved';
			} else if (this.playlist_type == 'cplaylist'){
				url += '/playlist/' + su.encodeURLPart(this.info.name);
			} else if (this.playlist_type == 'chart'){
				url += '/chart/' +  su.encodeURLPart(this.info.country) + '/' + su.encodeURLPart(this.info.metro);
			}
			return url;
		},
		extendSong: function(omo){
			if (!(omo instanceof song)){
				var mo = new song();
				mo.init({
					map_parent: this,
					app: this.app,
					omo: omo,
					plst_titl: this,
					player: this.player,
					mp3_search: this.mp3_search
				}, {
					file: omo.file
				});
				return mo;
			} else{
				return omo;
			}
		},
		makeExternalPlaylist: function() {
			var songs_list = this.getMainList();
			if (!songs_list.length){return false;}
			var simple_playlist = [];
			for (var i=0; i < songs_list.length; i++) {
				var files = songs_list[i].mf_cor.getFilteredFiles();
				var song = files && files[0];
				if (song){
					simple_playlist.push({
						track_title: song.track,
						artist_name: song.artist,
						duration: song.duration,
						mp3link: song.link
					});
				}
					
				
			}
			
			if (simple_playlist.length){
				this.current_external_playlist = new external_playlist(simple_playlist);
				//su.ui.els.export_playlist.attr('href', su.p.current_external_playlist.data_uri);
				if (this.current_external_playlist.result) {
					app_env.openURL(
						'http://seesu.me/generated_files/seesu_playlist.m3u?mime=m3u&content=' + escape(this.current_external_playlist.result)
					);
				}
					
			}
		}
	});
	

	var PlARow = function(){};

	PartsSwitcher.extendTo(PlARow, {
		init: function(pl) {
			this._super();
			this.pl = pl;
			this.updateState('active_part', false);
			this.addPart(new MultiAtcsRow(this, pl));
			this.addPart(new PlaylistSettingsRow(this, pl));
		}
	});


	var PlaylistSettingsRow = function(actionsrow){
		this.init(actionsrow);
	};
	BaseCRow.extendTo(PlaylistSettingsRow, {
		init: function(actionsrow){
			this.actionsrow = actionsrow;
			this._super();

			var _this = this;

			var doNotReptPl = function(state) {
				_this.updateState('dont-rept-pl', state);
			};
			if (su.settings['dont-rept-pl']){
				doNotReptPl(true);
			}
			su.on('settings.dont-rept-pl', doNotReptPl);


		},
		setDnRp: function(state) {
			this.updateState('dont-rept-pl', state);
			su.setSetting('dont-rept-pl', state);
		},
		model_name: 'row-pl-settings'
	});




	var MultiAtcsRow = function(actionsrow){
		this.init(actionsrow);
	};
	BaseCRow.extendTo(MultiAtcsRow, {
		init: function(actionsrow){
			this.actionsrow = actionsrow;
			this._super();
		},
		model_name: 'row-multiatcs'
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
		this.updateState('nav-title', params.title);
		this.updateState('url-part', '/~');
	},
	sendMoreDataRequest: function() {
		return this.artists_list.sendMoreDataRequest.apply(this, arguments);
	}
});

var ArtistsList = function() {}; 
window.ArtistsList = ArtistsList;
mapLevelModel.extendTo(ArtistsList, {
	init: function(opts, params) {
		this._super(opts);
		this[this.main_list_name] = [];
		if (this.sendMoreDataRequest){
			this.updateState("has-loader", true);
		}
		this.on('state-change.mp-show', function(e) {
			if (e.value && e.value.userwant){
				this.preloadStart();
			}
			
		}, {skip_reg: true});
	},
	model_name: 'artslist',
	main_list_name: 'artists_list',

	complex_states: {
		'more_load_available': {
			depends_on: ["has-loader", "loading"],
			fn: function(can_load_more, loading) {
				if (can_load_more){
					return !loading;
				} else {

				}
			}
		}
	},
	requestArtists: function() {

	},
	createRPlist: function() {
		if (!this.ran_playlist){
			var pl = new ArtistsListPlaylist();
			pl.init({
				app: this.app,
				map_parent: this
			}, {
				title: this.state('nav-title'),
				artists_list: this,
				artist: this.original_artist
			});
			this.ran_playlist = pl;
		}
		return this;
	},
	requestRandomPlaylist: function() {
		
		this.createRPlist();
		this.ran_playlist.showOnMap();
	},
	getMainListChangeOpts: function() {},
	addArtist: function(obj, silent) {
		var main_list = this[this.main_list_name];
		var artcard = new ArtistInArtl();
		artcard.init({
			app: this.app
		}, obj);
		main_list.push(artcard);

		if (!silent){
			this.setChild(this.main_list_name, main_list, true);
		}
	},

	page_limit: 30,
	getPagingInfo: function() {
		var length = this.getLength();
		var has_pages = Math.floor(length/this.page_limit);
		var remainder = length % this.page_limit;
		var next_page = has_pages + 1;

		return {
			current_length: length,
			has_pages: has_pages,
			page_limit: this.page_limit,
			remainder: remainder,
			next_page: next_page
		};
	},
	
	preloadStart: function() {
		this.loadStart();
	},
	getLength: function() {
		var main_list = this[this.main_list_name];
		return main_list.length;
	},
	loadStart: function() {
		if (this.state('more_load_available') && !this.getLength()){
			this.requestMoreData();
		}
	},
	addItemToDatalist: function(obj, silent) {
		this.addArtist(obj, silent);
	},
	
	setLoader: function(cb, trigger) {
		this.updateState("has-loader", true);
		this.sendMoreDataRequest = cb;

		if (trigger){
			this.requestMoreData();
		}

	},
	requestMoreData: function(force) {
		if (this.state("has-loader") && this.sendMoreDataRequest){
			if (!this.request_info || this.request_info.done){
				this.markLoading();
				this.request_info = this.sendMoreDataRequest.call(this, this.getPagingInfo());
				if (!this.request_info.request){
					throw new Error('give me request');
				} else {
					this.addRequest(this.request_info.request);
				}
			}
			//this.trigger("load-more");
		}
		
	},
	setLoaderFinish: function() {
		this.updateState("has-loader", false);
	},
	markLoading: function(){
		this.updateState('loading', true);
		return this;
	},
	putRequestedData: function(request, data_list, error) {
		if (!this.request_info || this.request_info.request == request){
			this.requestComplete(request, error);

			if (!error && data_list && data_list.length){
				var mlc_opts = this.getMainListChangeOpts();
				for (var i = 0; i < data_list.length; i++) {
					this.addItemToDatalist(data_list[i], true);
				}
				
				this.setChild(this.main_list_name, this[this.main_list_name], mlc_opts || true);
			}
			if (!error && request && data_list.length < this.page_limit){
				this.setLoaderFinish();
			}
		}
		return this;
	},
	requestComplete: function(request, error) {
		if (!this.request_info || this.request_info.request == request){
			var main_list = this[this.main_list_name];

			this.updateState('loading', false);
			if (error && !main_list.length) {
				this.updateState('error', true);
			} else {
				this.updateState('error', false);
			}
			delete this.request_info;
		}
		return this;
	}
});

var SimilarArtists  = window.SimilarArtists = function() {};
ArtistsList.extendTo(SimilarArtists, {
	init: function(opts, params) {
		this._super(opts);
		this.original_artist = params.artist;


		this.updateState('nav-title', 'Similar to «' + this.original_artist + '» artists');
		this.updateState('url-part', '/+similar');

	},
	sendMoreDataRequest: function(paging_opts){
		var request_info = {};
		var _this = this;
		request_info.request = lfm.get('artist.getSimilar',{
			artist: this.original_artist,
			limit: paging_opts.page_limit,
			page: paging_opts.next_page
		})
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
	}
});

})();

