var song;
(function(){
	"use strict";

	var baseSong = function() {};
	provoda.extendFromTo("baseSong", mapLevelModel, baseSong);

	song = function(omo, playlist, player, mp3_search){};

	baseSong.extendTo(song, {
		page_name: 'song page',
		getLevNum: function() {
			return this.map_level_num - 1;
		},
		'stch-lfm-image': function(state) {
			if (state){
				if (state.array){
					
					this.updateState('song-image', state.array[1]['#text'].replace('/64/', '/64s/'));
				} else if (state.item){
					this.updateState('song-image', state.item);
				}

			}
		},
		'stch-can-expand': function(state) {
			if (state && !this.expanded){
				this.expanded = true;
				var _this = this;
				var info_request = lfm.get('artist.getInfo',{'artist': this.artist })
					.done(function(r){
						su.art_images.checkLfmData('artist.getInfo', r);

						var ai = parseArtistInfo(r);


						_this.updateState('listeners', getTargetField(r, 'artist.stats.listeners'));
						_this.updateState('playcount', getTargetField(r, 'artist.stats.playcount'));
						_this.updateState('bio', ai.bio);
						_this.updateState('tags', ai.tags);
						_this.updateState('similars', ai.similars);
						_this.updateState('artist-image', ai.images && ai.images[2] || lfm_image_artist)
						/*
						similars
						tags
						bio

						similars = ai.similars;
			artist	 = ai.artist;
			tags	 = ai.tags;
			bio		 = ai.bio;
			image

						*/
						/*
						if (!_this.isAlive()){
							return
						}
						_this.show_artist_info(r, this.ainf, artist);
						*/

					});

				if (this.state("mp-show")){
					info_request.queued && info_request.queued.setPrio('highest');
				}
				
			}
		},
		init: function(omo, playlist, player, mp3_search) {
			this._super(omo, playlist, player, mp3_search);
			var _this = this;
			this.updateNavTexts();

			if (omo.lfm_image){
				this.updateState('lfm-image', omo.lfm_image);
			}

			this.on('view', function(no_navi, user_want){
				su.show_track_page(this, no_navi);
				if (user_want){
					//fixme - never true!
					if (_this.wasMarkedAsPrev()){
						su.trackEvent('Song click', 'previous song');
					} else if (_this.wasMarkedAsNext()){
						su.trackEvent('Song click', 'next song');
					} else if (_this.state('play')){
						su.trackEvent('Song click', 'zoom to itself');
					}
				}
				
			});
			var actionsrow = new TrackActionsRow(this);
			this.setChild('actionsrow', actionsrow);
			this.addChild(actionsrow);

			this.mf_cor = new mfCor();
			this.mf_cor.init(this, this.omo);
			this.setChild('mf_cor', this.mf_cor);
			this.addChild(this.mf_cor);
			this.mf_cor.on('before-mf-play', function(mopla) {

				_this.player.changeNowPlaying(_this);
				_this.mopla = mopla;
			});
			this.mf_cor.on("error", function(can_play) {
				_this.player.trigger("song-play-error", _this, can_play);
			});
			
			this.watchStates(['files_search', 'marked_as', 'mp-show'], function(files_search, marked_as, mp_show) {
				if (marked_as && files_search && files_search.complete){
					this.updateState('can-expand', true);
				} else if (mp_show){
					this.updateState('can-expand', true);
				} else {
					this.updateState('can-expand', false);
				}
			});
			this.on('state-change.mp-show', function(e) {
				
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
				} else {
					if (oldCb){
						this.mp3_search.off('new-search', oldCb);
						delete this.makePlayableOnNewSearch;
					}
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
		updateFilesSearchState: function(complete, get_next){
			this._super.apply(this, arguments);
			if (this.isHaveTracks('mp3')){
				this.plst_titl.markAsPlayable();
			}
		},
		mlmDie: function() {
			this.hide();
		},
		getURL: function(mopla){
			var url ="";
			if (mopla || this.raw()){
				var s = mopla || this.omo;
				url += "/" + su.encodeURLPart(s.from) + '/' + su.encodeURLPart(s._id);
			} else{
				if (this.plst_titl && this.plst_titl.playlist_type == 'artist'){
					if (this.track){
						url += '/' + su.encodeURLPart(this.track);
					}
				} else if (this.artist){
					url += '/' + su.encodeURLPart(this.artist) + '/' + su.encodeURLPart(this.track || '_');
				}
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
			
			data.message = this.state('full-title') + " " + encodeURI(this.getShareUrl());
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
		submitNowPlaying: function(){
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
		}
	});


	

})();
