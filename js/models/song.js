var song;
(function(){
	"use strict";

	var baseSong = function() {};
	provoda.extendFromTo("baseSong", mapLevelModel, baseSong);

	song = function(){};

	baseSong.extendTo(song, {
		page_name: 'song page',
		'stch-can_expand': function(state) {
			if (state && !this.expanded){
				this.expanded = true;
				var _this = this;
				var info_request = lfm.get('artist.getInfo',{'artist': this.artist })
					.done(function(r){

						var ai = parseArtistInfo(r);
						_this.updateManyStates({
							listeners: spv.getTargetField(r, 'artist.stats.listeners'),
							playcount: spv.getTargetField(r, 'artist.stats.playcount'),
							bio: ai.bio,
							tags: ai.tags,
							similars: ai.similars,
							'artist_image': ai.images && ai.images[2] || lfm_image_artist
						});

						


					});

				this.addRequest(info_request, {
					space: 'demonstration'
				});
				
			}
		},
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
			_this.initHeavyPart();

			this.loadImages = spv.once(function() {
				var images_request = lfm.get('artist.getImages',{'artist': _this.artist })
					.done(function(r){
						var images = spv.toRealArray(spv.getTargetField(r, 'images.image'));
						_this.updateState('images', images);
					});
				this.addRequest(images_request, {
					space: 'demonstration'
				});
			});
			this.on('state-change.can_load_images', function(e) {
				if (e.value){
					_this.loadImages();
				}
			});
			
		},
		'compx-can_load_images': {
			depends_on: ['artist', 'can_expand'],
			fn: function(artist, can_expand) {
				return artist && can_expand;
			}
		},
		initOnShow: function() {
			if (!this.onshow_inited){
				this.onshow_inited = true;
				var actionsrow = new TrackActionsRow(this);
				this.updateNesting('actionsrow', actionsrow);
			}
		},
		initHeavyPart: function() {
			var _this = this;
			var omo = this.omo;
			

			this.mf_cor = new mfCor();
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

					_this.player.changeNowPlaying(_this);
					_this.mopla = mopla;
				})
				.on("error", function(can_play) {
					_this.player.trigger("song-play-error", _this, can_play);
				})
				.on('state-change.mopla_to_use', function(e){
					_this.updateState('mf_cor_has_available_tracks', !!e.value);
				});

			if (this.mf_cor.isSearchAllowed()){
				this.on('vip-state-change.track', function(e) {
					if (e.value){
						_this.bindFilesSearchChanges();
					}
				},{immediately: true});
				
				
			}




			
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
			this.on('vip-state-change.is_important', function(e) {
				if (e.value){
					this.loadSongListeners();
				}
			});
		},
		getShareUrl: function() {
			if (this.artist && this.track){
				return "http://seesu.me/o" + "#/catalog/" + su.encodeURLPart(this.artist) + "/_/" + su.encodeURLPart(this.track);
			} else {
				return "";
			}
		},
		mlmDie: function() {
			this.hideOnMap();
		},
		getURL: function(mopla){
			var url = '';
			if (this.plst_titl.playlist_artist && this.plst_titl.playlist_artist == this.artist){
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
			
			data.message = this.state('nav_title') + " " + encodeURI(this.getShareUrl());
			if (data.attachments){
				data.attachment = data.attachments;
			}

			if (window.VK){
				VK.api("wall.post", data, function() {

				});
			} else {
				

				app_env.openURL( "http://seesu.me/vk/share.html" +
					"?" + 
					stringifyParams({app_id: su.vkappid}, false, '=', '&') +
					"#?" + 
					stringifyParams(data, false, '=', '&'));
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


			if ((!duration && !careful) || ((timestamp - starttime)/duration > 0.2) || (last_scrobble && ((timestamp - last_scrobble)/duration > 0.6)) ){

				this.start_time = false;
				this.last_scrobble = timestamp;
				delete this.start_time;


				if (su.settings['lfm-scrobbling']){
					lfm.submit({
						artist: this.artist,
						track: this.track
					}, duration, timestamp);
				}
				if (su.s.loggedIn()){
					su.s.api('track.scrobble', {
						client: su.env.app_type,
						status: 'finished',
						duration: duration,
						artist: this.artist,
						title: this.track,
						timestamp: timestamp
					});
				}
			}
		},
		submitNowPlaying: spv.debounce(function(){
			var duration = Math.round(this.getCurrentMopla().getDuration()/1000) || '';
			if (su.settings['lfm-scrobbling']){
				lfm.nowplay({
					artist: this.artist,
					track: this.track
				}, duration);
			}
			if (su.s.loggedIn()){
				su.s.api('track.scrobble', {
					client: su.env.app_type,
					status: 'playing',
					duration: duration,
					artist: this.artist,
					title: this.track,
					timestamp: ((new Date()).getTime()/1000).toFixed(0)
				});
			}
		},200),
		loadSongListeners: function() {
			
		}
	});


	

})();
