define(['pv', 'spv', 'app_serv', 'js/libs/BrowseMap', './MfCor', './song/SongActionsRow', './song/SongBase'],
function(pv, spv, app_serv, BrowseMap, MfCor, SongActionsRow, sbase){
"use strict";
var lfm_share_url_replacers = ['[',']','(',')'];
lfm_share_url_replacers.forEach(function(el, i) {
	lfm_share_url_replacers[i] = {
		regexp: new RegExp(spv.escapeRegExp(el), 'gi'),
		str: window.escape(el)
	};
});
var album_placeholder = {
	url: 'i/album_placeholder.png'
};


	var app_env = app_serv.app_env;
	var Song;
	var SongBase = function() {};
	pv.extendFromTo("SongBase", BrowseMap.Model, SongBase);

	Song = function(){};

	SongBase.extendTo(Song, {

		'nest-songcard': ['#tracks/[:artist],[:track]', false, 'can_load_songcard'],
		'compx-$relation:songcard-for-active_song': [
			['can_load_songcard', '@songcard'],
			function(can_load_songcard, songcard) {
				return can_load_songcard && songcard;
			}
		],
		'stch-$relation:songcard-for-active_song': pv.Model.prototype.hndRDep,

		'stch-can_load_baseinfo': function(state) {
			if (state){
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
		'stch-can_load_images':function(state) {
			if (state){
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
		init: function(opts, omo) {
			var passed_artist = omo.artist;
			omo.artist = omo.artist || " ";


			this._super.apply(this, arguments);

			this.mf_cor = null;
			this.mopla = null;
			this.start_time = null;
			this.last_scrobble = null;


			var spec_image_wrap;
			if (omo.image_url){
				this.init_states['image_url'] = {url: omo.image_url};
			}
			if (omo.lfm_img) {
				spec_image_wrap = omo.lfm_img;
			} else if (omo.lfm_image){
				spec_image_wrap = this.app.art_images.getImageWrap(omo.lfm_image.array || omo.lfm_image.item);
				//pv.update(this, 'lfm_image', omo.lfm_image);
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
			//this.nextTick(this.initHeavyPart);
		},
		twistStates: function() {
			this.initHeavyPart();
		},
		'compx-forbidden_by_copyrh': [
			['#forbidden_by_copyrh', '#white_of_copyrh', 'artist', 'track'],
			function ( index, white_index, artist, track ) {
				if (artist) {
					var artist_lc = (white_index || index) && artist.toLowerCase();
					if (white_index) {
						return !white_index[ artist_lc ];
					} else if (index) {
						if (track) {
							if (index[artist_lc] === true) {
								return true;
							} else {
								return index[artist_lc] && index[artist_lc][ track.toLowerCase() ];
							}
						} else {
							return index[artist_lc] === true;
						}
					}
					
				}


			}
		],
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

					arr.push(album_placeholder);
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
		'nest-actionsrow': [SongActionsRow, false, 'mp_show'],
		getMFCore: function(){
			this.initHeavyPart();
			return this.mf_cor;
		},
		initHeavyPart: pv.getOCF('izheavy', function() {
			var omo = this.omo;

			if (omo.side_file && !omo.side_file.link) {
				omo.side_file = null;
			}
			if (omo.side_file) {
				this.mp3_search.addFileToInvestg(omo.side_file, omo.side_file);
				omo.side_file = null;
			}
			if (omo.file && !omo.file.link) {
				omo.file = null;
			}

			this.mf_cor = this.initSi(MfCor, null, omo);

			

			if (omo.file){
				pv.update(this, 'playable', true);
				pv.update(this, 'files_search', {
					search_complete: true,
					have_best_tracks: true,
					have_mp3_tracks: true
				});
			}
			
			this.mf_cor
				.on('before-mf-play', this.hndMfcBeforePlay, this.getContextOptsI())
				.on("error", this.hndMfcError, this.getContextOpts());

			//this.wch(this.mf_cor, 'has_available_tracks', 'mf_cor_has_available_tracks');

			
			pv.updateNesting(this, 'mf_cor', this.mf_cor);
			pv.update(this, 'mf_cor', this.mf_cor);

		}),
		'compx-mf_cor_has_available_tracks': [
			['@some:has_available_tracks:mf_cor'],
			function(state) {
				return state;
			}
		],

		hndMfcBeforePlay: function(mopla) {
			this.player.changeNowPlaying(this, mopla.state('play'));
			this.mopla = mopla;
			pv.updateNesting(this, 'current_mopla', mopla);
			pv.update(this, 'play', mopla.state('play'));
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
			var mopla = this.getCurrentMopla();
			if (!mopla) {
				return;
			}
			var duration = Math.round(mopla.getDuration()/1000) || '';
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
		'compx-artist_images': [
			['@available_images:artist'],
			function (available_images) {
				return available_images && available_images[0];
			}
		],
		'compx-has_nested_artist': [
			['@artist'],
			function(artist) {
				return !!artist;
			}
		],
		'compx-load_artcard': [
			['needs_states_connecting', 'artist', 'is_important'],
			function (artist, needs_states_connecting, is_important) {
				return artist && (needs_states_connecting || is_important);
			}
		],
		'nest-artist': ['#catalog/[:artist]', false, 'load_artcard']
	});
return Song;
});
