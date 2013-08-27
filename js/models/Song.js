define(['provoda', 'spv', 'app_serv', 'js/libs/BrowseMap', './MfCor', './SongActionsRow', './SongBase'],
function(provoda, spv, app_serv, BrowseMap, MfCor, SongActionsRow, sbase){
	"use strict";
	var app_env = app_serv.app_env;
	var Song;
	var SongBase = function() {};
	provoda.extendFromTo("SongBase", BrowseMap.Model, SongBase);

	Song = function(){};

	SongBase.extendTo(Song, {
		page_name: 'song page',

		init: function(opts) {
			var omo = opts.omo;
			var passed_artist = omo.artist;
			omo.artist = omo.artist || " ";

			this._super.apply(this, arguments);
			var _this = this;

			var spec_image_wrap;
			if (omo.image_url){
				this.init_states['image_url'] = {url: omo.image_url};
			}
			if (omo.lfm_image){
				spec_image_wrap = this.app.art_images.getImageWrap(omo.lfm_image.array || omo.lfm_image.item);
				//this.updateState('lfm_image', omo.lfm_image);
			}
			var images_pack;

			if (spec_image_wrap) {
				this.init_states['lfm_image'] = spec_image_wrap;

			} else if (passed_artist) {
				var still_init = true;
				if (this.init_states['track']){
					images_pack = this.app.art_images.getTrackImagesModel({
						artist: this.init_states['artist'],
						track:this.init_states['track']
					})
						.on('state-change.image-to-use', function(e) {
							_this.updateState('ext_lfm_image', e.value);
						});
				} else {
					images_pack = this.app.art_images.getArtistImagesModel(this.init_states['artist'])
						.on('state-change.image-to-use', function(e) {
							_this.updateState('ext_lfm_image', e.value);
						});
				}
				still_init = false;
			}
			this.initStates();
			this.initHeavyPart();
			this.on('state-change.can_load_baseinfo', function(e) {
				if (e.value){
					var artcard = _this.getNesting('artist');
					if (artcard){
						var req = artcard.loaDDD('base_info');
						if (req){
							this.addRequest(req);
						}
					} else {
						console.warn('no nested artcard');
					}
					
				}
			});
			this.on('state-change.can_load_images', function(e) {
				if (e.value){
					var artcard = _this.getNesting('artist');
					if (artcard){
						var req = artcard.loaDDD('images');
						if (req){
							this.addRequest(req);
						}
						
					} else {
						console.warn('no nested artcard');
					}
					
					//
					//_this.loaDDD('artist_images');
				}
			});
			this.on('state-change.can_load_songcard', function(e) {
				if (e.value){
					var songcard = _this.app.getSongcard(_this.artist, _this.track);
					if (songcard){
						songcard.initForSong();
						_this.updateNesting('songcard', songcard);
					}
				}
			});
		},
		'compx-has_full_title':{
			depends_on: ['artist', 'track'],
			fn: function(artist_name, track_name) {
				return artist_name && track_name;
			}
		},
		'compx-can_load_songcard':{
			depends_on:['can_expand', 'has_full_title'],
			fn: function(can_expand, has_full_title) {
				return can_expand && has_full_title;
			}
		},
		'compx-can_load_baseinfo': {
			depends_on: ['can_expand', 'has_nested_artist'],
			fn: function(can_expand, hna) {
				return can_expand && hna;
			}
		},
		'compx-can_load_images': {
			depends_on: ['artist', 'can_expand', 'has_nested_artist'],
			fn: function(artist, can_expand, hna) {
				return artist && can_expand && hna;
			}
		},

		initOnShow: provoda.getOCF('izonshow', function() {
			var actionsrow = new SongActionsRow(this);
			this.updateNesting('actionsrow', actionsrow);
		}),

		initHeavyPart: provoda.getOCF('izheavy', function() {
			var _this = this;
			var omo = this.omo;

			this.mf_cor = new MfCor();
			this.mf_cor.init({
				mo: this,
				omo: this.omo
			}, omo.file);

			if (omo.file){
				this.updateState('playable', true);
				this.updateState('files_search', {
					search_complete: true,
					have_best_tracks: true,
					have_mp3_tracks: true
				});
			}
			this.updateNesting('mf_cor', this.mf_cor);
			this.mf_cor
				.on('before-mf-play', function(mopla) {
					_this.player.changeNowPlaying(_this, mopla.state('play'));
					_this.mopla = mopla;
					_this.updateState('play', mopla.state('play'));
				}, {immediately: true})
				.on("error", function(can_play) {
					_this.player.trigger("song-play-error", _this, can_play);
				})
				.on('state-change.mopla_to_use', function(e){
					_this.updateState('mf_cor_has_available_tracks', !!e.value);
				});

			
			this.watchStates(['files_search', 'marked_as', 'mp_show'], function(files_search, marked_as, mp_show) {
				if (marked_as && files_search && files_search.search_complete){
					this.updateState('can_expand', true);
				} else if (mp_show){
					this.updateState('can_expand', true);
				} else {
					this.updateState('can_expand', false);
				}
			});
			this.on('vip-state-change.mp_show', function(e) {
				var
					_this = this,
					oldCb = this.makePlayableOnNewSearch;

				if (e.value){
					if (!oldCb){
						this.makePlayableOnNewSearch = function() {
							_this.makeSongPlayalbe(true);
						};
						this.mp3_search.on('new-search', this.makePlayableOnNewSearch);
					}
					_this.initOnShow();
				} else {
					if (oldCb){
						this.mp3_search.off('new-search', oldCb);
						delete this.makePlayableOnNewSearch;
					}
				}
			});
			this.on('state-change.is_important', function(e) {
				if (e.value){
					this.initRelativeData();
				}
			});
			this.nextTick(function() {
				this.initRelativeData();
			});

		}),
		getShareUrl: function() {
			if (this.artist && this.track){
				return "http://seesu.me/o#/catalog/" + (this.app.encodeURLPart(this.artist) + "/_/" + this.app.encodeURLPart(this.track)).replace(/\'/gi, '%27');
			} else {
				return "";
			}
		},
		mlmDie: function() {
			this.hideOnMap();
		},
		getURL: function(){
			var url = '';
			if (this.map_parent.playlist_artist && this.map_parent.playlist_artist == this.artist){
				url += '/' + this.app.encodeURLPart(this.track);
			} else {
				url += '/' + this.app.encodeURLPart(this.artist) + ',' + this.app.encodeURLPart(this.track || '');
			}

			return url;
		},
		postToVKWall: function(uid){
			var
				data = {},
				file = this.mf_cor.getVKFile();
			if (uid){
				data.owner_id = uid;
			}
			if (file){
				data.attachments = "audio" + file._id;
			}
			data.message = this.state('nav_title') + " \n" + this.getShareUrl();
			if (data.attachments){
				//data.attachment = data.attachments;
			}

			if (window.VK){
				VK.api("wall.post", data, function() {

				});
			} else {
				for (var prop in data){
					data[prop] = encodeURIComponent(data[prop]);
				}
				app_env.openURL( "http://seesu.me/vk/share.html" +
					"?" +
					spv.stringifyParams({app_id: this.app.vkappid}, false, '=', '&') +
					"#?" +
					spv.stringifyParams(data, false, '=', '&'));
			}
			seesu.trackEvent('song actions', 'vk share');

			return; //su.vk_api.get("wall.post", data, {nocache: true});
			//console.log(uid);
		},
		submitPlayed: function(careful){
			var
				starttime = this.start_time,
				last_scrobble = this.last_scrobble,
				timestamp = ((new Date() * 1)/1000).toFixed(0),
				duration = Math.round(this.getCurrentMopla().getDuration()/1000) || '';


			if (
				(!duration && !careful) ||
				((timestamp - starttime)/duration > 0.2) ||
				(last_scrobble && ((timestamp - last_scrobble)/duration > 0.6)) ){

				this.start_time = false;
				this.last_scrobble = timestamp;
				delete this.start_time;


				if (this.app.settings['lfm-scrobbling']){
					this.app.lfm.submit({
						artist: this.artist,
						track: this.track
					}, duration, timestamp);
				}
				if (this.app.s.loggedIn()){
					this.app.s.api('track.scrobble', {
						client: this.app.env.app_type,
						status: 'finished',
						duration: duration,
						artist: this.artist,
						title: this.track,
						timestamp: timestamp
					});
				}
			} else {
			}
		},
		submitNowPlaying: spv.debounce(function(){
			var duration = Math.round(this.getCurrentMopla().getDuration()/1000) || '';
			if (this.app.settings['lfm-scrobbling']){
				this.app.lfm.nowplay({
					artist: this.artist,
					track: this.track
				}, duration);
			}
			if (this.app.s.loggedIn()){
				this.app.s.api('track.scrobble', {
					client: this.app.env.app_type,
					status: 'playing',
					duration: duration,
					artist: this.artist,
					title: this.track,
					timestamp: ((new Date()).getTime()/1000).toFixed(0)
				});
			}
		},200),
		initRelativeData: provoda.getOCF('izrelative', function() {
			if (this.artist){
				var artcard = this.app.getArtcard(this.artist);
				this.updateNesting('artist', artcard);
				this.updateState('has_nested_artist', true);
			}
			//this.loadSongListeners();
		})
	});
return Song;
});
