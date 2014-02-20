define(['provoda', 'spv', 'app_serv', 'js/libs/BrowseMap', './MfCor', './song/SongActionsRow', './song/SongBase'],
function(provoda, spv, app_serv, BrowseMap, MfCor, SongActionsRow, sbase){
	"use strict";
var lfm_share_url_replacers = ['[',']','(',')'];
lfm_share_url_replacers.forEach(function(el, i) {
	lfm_share_url_replacers[i] = {
		regexp: new RegExp(spv.escapeRegExp(el), 'gi'),
		str: window.escape(el)
	};
});



	var app_env = app_serv.app_env;
	var Song;
	var SongBase = function() {};
	provoda.extendFromTo("SongBase", BrowseMap.Model, SongBase);

	Song = function(){};

	SongBase.extendTo(Song, {
		page_name: 'song page',
		hndMpshowImp: function(e) {
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
		},
		hndLoadSongcard: function(e) {
			if (e.value){
				var songcard = this.app.getSongcard(this.artist, this.track);
				if (songcard){
					songcard.initForSong();
					this.updateNesting('songcard', songcard);
				}
			}
		},
		hndLoadBaseArtInfo: function(e) {
			if (e.value){
				var artcard = this.getNesting('artist');
				if (artcard){
					var req = artcard.requestState('bio');
					if (req){
						this.addRequest(req);
					}
				} else {
					console.warn('no nested artcard');
				}
				
			}
		},
		hndLoadArtImages: function(e) {
			if (e.value){
				var artcard = this.getNesting('artist');
				if (artcard){
					
					var req = artcard.requestState('profile_image');
					//artcard.requestState('images');
					if (req){
						this.addRequest(req);
					}
					
				} else {
					console.warn('no nested artcard');
				}
				
			}
		},
		init: function(opts) {
			var omo = opts.omo;
			var passed_artist = omo.artist;
			omo.artist = omo.artist || " ";


			this._super.apply(this, arguments);

			this.mf_cor = null;
			this.mopla = null;
			this.start_time = null;
			this.last_scrobble = null;
			this.makePlayableOnNewSearch = null;


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

			if (omo.album_image) {
				this.init_states['album_image'] = omo.album_image;
			}
			if (omo.album_name) {
				this.init_states['album_name'] = omo.album_name;
			}

			if (spec_image_wrap) {
				this.init_states['lfm_image'] = spec_image_wrap;

			} else if (passed_artist) {
				var still_init = true;
				if (this.init_states['track']){
					images_pack = this.app.art_images.getTrackImagesModel({
						artist: this.init_states['artist'],
						track:this.init_states['track']
					});
				} else {
					images_pack = this.app.art_images.getArtistImagesModel(this.init_states['artist']);
				}
				this.wch(images_pack, 'image-to-use', 'ext_lfm_image');
				still_init = false;
			}
			this.initStates();
			this.nextTick(this.initHeavyPart);
			this.on('state_change-can_load_baseinfo', this.hndLoadBaseArtInfo);
			this.on('state_change-can_load_images', this.hndLoadArtImages);
			this.on('state_change-can_load_songcard', this.hndLoadSongcard);
		},
		'compx-has_full_title':{
			depends_on: ['artist', 'track'],
			fn: function(artist_name, track_name) {
				return artist_name && track_name;
			}
		},
		'compx-available_images': [
			['artist_images', 'album_image'],
			function (artist_images, album_image) {

				var arr = [ ];
				if (album_image) {
					arr.push(album_image);
				} else {

					arr.push({
						url: 'i/album_placeholder.png'
					});
				}
				if (artist_images) {
					arr.push.apply(arr, artist_images);
				}
				
				return arr;
			}
		],
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
		'compx-can_expand': [
			['files_search', 'marked_as', 'mp_show'],
			function(files_search, marked_as, mp_show) {
				if (marked_as && files_search && files_search.search_complete){
					return true;
				} else if (mp_show){
					return true;
				} else {
					return false;
				}
			}
		],

		initOnShow: provoda.getOCF('izonshow', function() {
			var actionsrow = new SongActionsRow(this);
			this.updateNesting('actionsrow', actionsrow);
		}),
		getMFCore: function(){
			this.initHeavyPart();
			return this.mf_cor;
		},
		initHeavyPart: provoda.getOCF('izheavy', function() {
			var omo = this.omo;

			this.mf_cor = new MfCor();
			this.useMotivator(this.mf_cor, function() {
				this.mf_cor.init({
					mo: this,
					omo: this.omo
				}, omo.file);
			});
			

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
				.on('before-mf-play', this.hndMfcBeforePlay, this.getContextOptsI())
				.on("error", this.hndMfcError, this.getContextOpts());

			this.wch(this.mf_cor, 'has_available_tracks', 'mf_cor_has_available_tracks');

			
			this.on('vip_state_change-mp_show', this.hndMpshowImp, this.getContextOptsI());
			this.on('state_change-is_important', this.hndImportant);
			this.nextTick(this.initRelativeData);

		}),
		hndImportant: function(e) {
			if (e.value){
				this.initRelativeData();
			}
		},
		hndMfcBeforePlay: function(mopla) {
			this.player.changeNowPlaying(this, mopla.state('play'));
			this.mopla = mopla;
			this.updateState('play', mopla.state('play'));
		},
		hndMfcError: function(can_play) {
			this.player.trigger("song-play-error", this, can_play);
		},
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
		shareWithLFMUser: function(userid) {
			var artist = this.state('artist');
			var track = this.state('track');
			if (!artist || !track){
				return;
			}

			var url = this.getShareUrl();
			lfm_share_url_replacers.forEach(function(el) {
				url = url.replace(el.regexp, el.str);
			});

			var req = this.app.lfm.post('track.share', {
				sk: this.app.lfm.sk,

				artist: artist,
				track: track,

				recipient: userid,
				message: url
				//message: '[url]' + this.getShareUrl() + '[/url]'//.replace(/\(/gi, '%28').replace(/\)/gi, '%29')
			});
			this.addRequest(req);
			return req;
			
		},
		postToVKWall: function(uid){
			var
				data = {},
				file = this.getMFCore().getVKFile();
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
				timestamp = (Date.now()/1000).toFixed(0),
				duration = Math.round(this.getCurrentMopla().getDuration()/1000) || '';


			if (
				(!duration && !careful) ||
				(
					((timestamp - starttime)/duration > 0.33) && !last_scrobble ||
					((timestamp - last_scrobble)/duration > 0.6)
				) ){

				this.start_time = false;
				this.last_scrobble = timestamp;
				delete this.start_time;


				if (this.app.settings['lfm-scrobbling']){
					this.app.lfm.submit({
						artist: this.artist,
						track: this.track,
						album: this.state('album_name')
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
					track: this.track,
					album: this.state('album_name')
				}, duration);
			}
			if (this.app.s.loggedIn()){
				this.app.s.api('track.scrobble', {
					client: this.app.env.app_type,
					status: 'playing',
					duration: duration,
					artist: this.artist,
					title: this.track,
					timestamp: (Date.now()/1000).toFixed(0)
				});
			}
		},200),
		initRelativeData: provoda.getOCF('izrelative', function() {
			if (this.artist){
				var artcard = this.app.getArtcard(this.artist);
				this.updateNesting('artist', artcard);
				this.updateState('has_nested_artist', true);
				if (artcard) {
					this.wch(artcard, 'available_images', 'artist_images');
				}
				//this.wch()
			}
			//this.loadSongListeners();
		})
	});
return Song;
});
