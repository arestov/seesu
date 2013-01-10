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


			this.changed();
			
			var _this = this;
			
			var doNotReptPl = function(state) {
				_this.updateState('dont-rept-pl', state);
			};
			if (su.settings['dont-rept-pl']){
				doNotReptPl(true);
			}
			su.on('settings.dont-rept-pl', doNotReptPl);
			this.updateState('url-part', this.getURL());
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
					omo: omo, 
					plst_titl: this,
					player: this.player,
					mp3_search: this.mp3_search
				}, {
					file: omo.file
				})
				return mo;
			} else{
				return omo;
			}
		},
		makeExternalPlaylist: function() {
			if (!this.palist.length){return false;}
			var simple_playlist = [];
			for (var i=0; i < this.palist.length; i++) {
				var song = this.palist[i].song();
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
		row_name: 'pl-settings'
	});




	var MultiAtcsRow = function(actionsrow){
		this.init(actionsrow);
	};
	BaseCRow.extendTo(MultiAtcsRow, {
		init: function(actionsrow){
			this.actionsrow = actionsrow;
			this._super();
		},
		row_name: 'multiatcs'
	});



	
})();



var LfmReccomsLogin = function(){};
LfmLogin.extendTo(LfmReccomsLogin, {
	init: function(opts){
		this._super(opts);
		this.setRequestDesc(localize('lastfm-reccoms-access'));
	},
	beforeRequest: function() {
		this.bindAuthCallback();
		
	},
	bindAuthCallback: function(){
		var _this = this;
		this.auth.once("session.input_click", function() {
			_this.pmd.loadPlStart();
			_this.pmd.showPlPage();
		}, {exlusive: true});
	}
});


var EnhancedSongslist = function() {};
songsList.extendTo(EnhancedSongslist, {
	preloadStart: function() {
		this.loadPlStart();
	},
	loadPlStart: function() {
		if (this.state('more_load_available') && !this.getLength()){
			this.loadMoreSongs();
		}
	},
	showPlPage: function() {
		this.app.show_playlist_page(this, {
			page_md: this.pmd,
			source_md: this
		});
	},
	switchPmd: function(toggle) {
		var new_state;
		if (typeof toggle == 'boolean')	{
			new_state = toggle;
		} else {
			new_state = !this.state('pmd-vswitched');
		}
		if (new_state){
			if (!this.state('pmd-vswitched')){
				this.pmd.updateState('vswitched', this.provoda_id);
			}
		} else {
			if (this.state('pmd-vswitched')){
				this.pmd.updateState('vswitched', false);
			}
		}
		
		
	},
	checkPMDSwiched: function(value) {
		this.updateState('pmd-vswitched', value == this.provoda_id);
	},
	requestPlaylist: function() {
		if (this.state('has-access')){
			this.loadPlStart();
			this.showPlPage();
		} else {
			this.switchPmd();
		}
	}
});

var MyVkAudioList = function() {};
EnhancedSongslist.extendTo(MyVkAudioList, {
	init: function(opts, user_id) {
		this._super(opts);

		this.user_id = user_id;

		if (!user_id){
			this.permanent_md = true;
		}
		this.setBaseInfo({
			title: 'vk audio',
			type: 'vk-audio'
		});

		this.updateState('url-part', '/vk-audio');

		this.updateState('has-access', true);




		this.setLoader(function(paging_opts) {
			
			var request_info = {};
			var _this = this;

			request_info.request = this.app.vk_api.get('audio.get', {
				sk: lfm.sk,
				count: paging_opts.page_limit,
				offset: (paging_opts.next_page - 1) * paging_opts.page_limit
			}, {nocache: true})
				.done(function(r){
					var vk_search = _this.app.mp3_search.getSearchByName('vk');
				
					var track_list = [];

					for (var i = 0; i < r.response.length; i++) {
						var cur = r.response[i];
						track_list.push({
							artist: cur.artist,
							track: cur.title,
							file: vk_search.makeSongFile(cur)
						});
						
					}

					_this.injectExpectedSongs(track_list);

					if (track_list.length < paging_opts.page_limit){
						_this.setLoaderFinish();
					}
				})
				.fail(function(){
					_this.loadComplete(true);
				}).always(function() {
					request_info.done = true;
				});
			return request_info;
		});
	}
});

var artistsRecommsList = function() {};
EnhancedSongslist.extendTo(artistsRecommsList, {
	
	authSwitching: function(auth_rqb) {
		
		auth_rqb.init({auth: this.app.lfm_auth, pmd: this});


		this.updateState('has-access', auth_rqb.state('has-session'));


		auth_rqb.on('state-change.has-session', function() {
			_this.updateState('has-access', true);
			_this.switchPmd(false);
		});

		this.setChild('auth_part', auth_rqb);

		

		var _this = this;

		this.pmd.on('state-change.vswitched', function(e) {
			_this.checkPMDSwiched(e.value);
		});

	},
	init: function(opts, username) {
		this._super(opts);
		var title  = 'Recommendations for ' +  (username || 'you');

		this.setBaseInfo({
			title: title,
			type: 'artists by recommendations'
		});
		var lfm_recml = new LfmReccomsLogin();
		
		this.authSwitching(lfm_recml);
		if (this.state('has-access')){
			//this.loadPlStart();
		}
		this.updateState('url-part', '/recommendations');
		var _this = this;
		if (!username){
			this.permanent_md = true;
		}

		if (username){
			if (this.app.env.cross_domain_allowed){
				_this.setLoader(function() {
					var request_info = {};
					request_info.request = $.ajax({
						url: 'http://ws.audioscrobbler.com/1.0/user/' + username + '/systemrecs.rss',
						type: "GET",
						dataType: "xml"
					})
						.done(function(xml) {
							var artists = $(xml).find('channel item title');
							if (artists && artists.length) {
								var artist_list = [];
								for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
									var artist = $(artists[i]).text();
									artist_list.push(artist);
								}
								var track_list_without_tracks = [];
								if (artist_list){
									for (var i=0; i < artist_list.length; i++) {
										track_list_without_tracks.push({"artist" :artist_list[i]});
									}
								}
								pl_r.injectExpectedSongs(track_list_without_tracks);
								_this.setLoaderFinish();
							}
						})
						.fail(function() {
							_this.loadComplete(true);
						})
						.always(function() {
							request_info.done = true;
						});
					return request_info;

				});
			}
		} else {
			_this.setLoader(function(paging_opts) {
			
				var request_info = {};

				request_info.request = lfm.get('user.getRecommendedArtists', {
					sk: lfm.sk,
					limit: paging_opts.page_limit,
					page: paging_opts.next_page
				}, {nocache: true})
					.done(function(r){
						var artists = toRealArray(getTargetField(r, 'recommendations.artist'));
						var track_list = [];
						if (artists && artists.length) {
							
							for (var i=0, l = Math.min(artists.length, paging_opts.page_limit); i < l; i++) {
								track_list.push({
									artist: artists[i].name,
									lfm_image: {
										array: artists[i].image
									}
								});
							}
						}
						_this.injectExpectedSongs(track_list);

						if (track_list.length < paging_opts.page_limit){
							_this.setLoaderFinish();
						}
					})
					.fail(function(){
						_this.loadComplete(true);
					}).always(function() {
						request_info.done = true;
					});
				return request_info;
			});
			
		}
		

	}
});