define(['pv', 'spv', 'app_serv', 'js/libs/BrowseMap', './MfCor', './song/SongActionsRow', './song/SongBase'],
function(pv, spv, app_serv, BrowseMap, MfCorUsual, SongActionsRow, SongBase){
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

var pvUpdate = pv.update;

function handleFile(self, file) {
  if (!file || !file.link) {
    return null;
  }

  self.mp3_search.addFile(file, file);
  return file;
}

	var app_env = app_serv.app_env;

	return spv.inh(SongBase, {
		naming: function(fn) {
			return function Song(opts, data, params, more, states) {
				fn(this, opts, data, params, more, states);
			};
		},
		init: function(self, opts, omo) {
			var passed_artist = omo.artist;

			self.mf_cor = null;
			self.mopla = null;

			var spec_image_wrap;
			if (omo.image_url){
				self.initState('image_url', {url: omo.image_url});
			}
			if (omo.lfm_img) {
				spec_image_wrap = omo.lfm_img;
			} else if (omo.lfm_image){
				spec_image_wrap = self.app.art_images.getImageWrap(omo.lfm_image.array || omo.lfm_image.item);
				//pv.update(this, 'lfm_image', omo.lfm_image);
			}
			var images_pack;

			if (omo.album_image) {
				self.initState('album_image', omo.album_image);
			}
			if (omo.album_name) {
				self.initState('album_name', omo.album_name);
			}

			if (spec_image_wrap) {
				self.initState('lfm_image', spec_image_wrap);

			} else if (passed_artist) {
				var still_init = true;
				if (self.init_states['track']){
					images_pack = self.app.art_images.getTrackImagesModel({
						artist: self.init_states['artist'],
						track: self.init_states['track']
					});
				} else {
					images_pack = self.app.art_images.getArtistImagesModel(self.init_states['artist']);
				}
				self.wlch(images_pack, 'image-to-use', 'ext_lfm_image');
				still_init = false;
			}

      omo.file = handleFile(self, omo.file);
      omo.side_file = handleFile(self, omo.side_file);
		}
	}, {
		network_data_as_states: false,
		manual_states_init: true,
		'nest-songcard': ['#tracks/[:artist],[:track]', {
			ask_for: 'can_load_songcard',
		}],
		'compx-$relation:songcard-for-active_song': [
			['can_load_songcard', '@songcard'],
			function(can_load_songcard, songcard) {
				return can_load_songcard && songcard;
			}
		],
		'stch-$relation:songcard-for-active_song': pv.getRDep('$relation:songcard-for-active_song'),

		'stch-can_load_baseinfo': function(target, state) {
			if (state){
				var artcard = target.getNesting('artist');
				if (artcard){
					pvUpdate(artcard, 'init_ext', true);
					var req = artcard.requestState('bio');
					if (req){
						target.addRequest(req);
					}
				} else {
					console.warn('no nested artcard');
				}

			}
		},
		'stch-can_load_images':function(target, state) {
			if (state){
				var artcard = target.getNesting('artist');
				if (artcard){

					var req = artcard.requestState('profile_image');
					//artcard.requestState('images');
					if (req){
						target.addRequest(req);
					}

				} else {
					console.warn('no nested artcard');
				}

			}
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
		'nest-actionsrow': [SongActionsRow, {
			idle_until: 'mp_show'
		}],
		getMFCore: function(){
			this.initHeavyPart();
			return this.mf_cor;
		},
		'chi-mf__cor_usual': MfCorUsual,
		'chi-mf__cor_single': MfCorUsual.Single,
		initHeavyPart: pv.getOCF('izheavy', function() {
			var omo = this.omo;

			var chi = omo.file ? 'mf__cor_single' : 'mf__cor_usual';
			this.mf_cor = this.initChi(chi, null, omo);

			this.mf_cor
				.on('before-mf-play', this.hndMfcBeforePlay, this.getContextOptsI())
				.on("error", this.hndMfcError, this.getContextOpts());

			pv.updateNesting(this, 'mf_cor', this.mf_cor);
			pv.update(this, 'mf_cor', this.mf_cor);

		}),

		'compx-play': [
			['@one:play:current_mopla']
		],

		hndMfcBeforePlay: function(mopla) {
			this.player.changeNowPlaying(this, mopla.state('play'));
			this.mopla = mopla;
			// pv.updateNesting(this, 'current_mopla', mopla);
			// pv.update(this, 'play', mopla.state('play'));
		},
		hndMfcError: function(can_play) {
			this.player.trigger("song-play-error", this, can_play);
		},
		getShareUrl: function() {
			if (this.state('artist') && this.state('track')){
				return "http://seesu.me/o#/catalog/" + (this.app.encodeURLPart(this.state('artist')) + "/_/" + this.app.encodeURLPart(this.state('track'))).replace(/\'/gi, '%27');
			} else {
				return "";
			}
		},
		mlmDie: function() {
			this.hideOnMap();
		},
		'compx-url_part': [
			['^playlist_artist', 'artist', 'track'],
			function (playlist_artist, artist, track) {
				if (!artist) {
					return;
				}
				var url = '';
				if (playlist_artist && playlist_artist == artist){
					url += '/' + this.app.encodeURLPart(track);
				} else {
					url += '/' + this.app.encodeURLPart(artist) + ',' + this.app.encodeURLPart(track || '');
				}

				return url;
			}
		],
		'compx-share_url': [
			['artist', 'track'],
			function (artist, track) {
				if (!artist || !track) {return '';}
				return "http://seesu.me/o#/catalog/" +
					(this.app.encodeURLPart(artist) + "/_/" + this.app.encodeURLPart(track))
					.replace(/\'/gi, '%27');
			}
		],
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
			var data = {};
			var file = this.getMFCore().getVKFile();
      var file_id = file && pv.state(file, '_id')
			if (uid){
				data.owner_id = uid;
			}
			if (file_id){
				data.attachments = "audio" + file_id;
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
		'compx-to_scrobble': [
			[
				'to_scrobble', '@one:current_scrobbles:current_mopla', '@one:duration:current_mopla',
				'artist', 'track', 'album_name'
			],
			function(to_scrobble, current_scrobbles, duration, artist, track, album_name) {
				if (!current_scrobbles || !duration || !artist || !track) {return;}

				var timestamp = current_scrobbles[ current_scrobbles.length - 1 ];
				if (!timestamp) {return;}

				var new_ts = Math.round(timestamp/1000);
				if (to_scrobble && to_scrobble.timestamp === new_ts) {
					return to_scrobble;
				}
				return {
					timestamp: new_ts,
					duration: duration,
					artist: artist,
					track: track,
					album_name: album_name
				};
			}
		],
		'effect-lfm-scrobble': [
			[
				'#lfm', 'to_scrobble',
				function(lfm, to_scrobble) {
					return lfm.submit({
						artist: to_scrobble.artist,
						track: to_scrobble.track,
						album: to_scrobble.album_name,
					}, to_scrobble.duration, to_scrobble.timestamp);

				}
			],
			[['to_scrobble', '#settings-lfm-scrobbling']]
		],
		'effect-sus-scrobble': [
			[
				'#sus', ['to_scrobble', '#env.app_type'], // #env.app_type is not watcheable
				function(sus, to_scrobble, app_type) {
					if (!sus.loggedIn()){return;}

					sus.api('track.scrobble', {
						client: app_type,
						status: 'finished',
						duration: to_scrobble.duration,
						artist: to_scrobble.artist,
						title: to_scrobble.track,
						timestamp: to_scrobble.timestamp.toFixed(0)
					});
				}
			],
			[['to_scrobble', '#su_userid', '#env.app_type']] // remove #env.app_type from here
		],
		submitNowPlaying: spv.debounce(function(){
			var mopla = this.getCurrentMopla();
			if (!mopla) {
				return;
			}
			var duration = Math.round(mopla.getDuration()/1000) || '';
			if (this.app.settings['lfm-scrobbling'] && this.app.lfm.sk){
				this.app.lfm.nowplay({
					artist: this.state('artist'),
					track: this.state('track'),
					album: this.state('album_name')
				}, duration).then(function(){}, function(){
					console.log('problem with scrobbling');
				});
			}
			if (this.app.s.loggedIn()){
				this.app.s.api('track.scrobble', {
					client: this.app.env.app_type,
					status: 'playing',
					duration: duration,
					artist: this.state('artist'),
					title: this.state('track'),
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
		'nest-artist': ['#catalog/[:artist]', {
			ask_for: 'load_artcard',
		}]
	});
});
