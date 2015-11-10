define(['pv', 'spv', 'jquery', 'js/libs/BrowseMap', './../PlayRequest'], function(pv, spv, $, BrowseMap, PlayRequest) {
"use strict";
var isDepend = pv.utils.isDepend;

var playRelative = function(mo, result) {
	if (result === true) {
		mo.map_parent.setWaitingNextSong(mo.map_parent, mo);
	} else if (result) {
		result.play();
	}
};

return spv.inh(BrowseMap.Model, {
	strict: true,
	naming: function(fn) {
		return function SongBase(opts, data, params, more, states) {
			fn(this, opts, data, params, more, states);
		};
	},
	init: function(self, opts, omo){
		self.neighbour_for = null;
		self.marked_prev_song = null;
		self.marked_next_song = null;
		self.ready_to_preload = null;
		self.track = null;
		self.rtn_request = null;
		self.playable_info = null;

		self.mp3_search = opts.app.mp3_search;
		self.player = opts.app.player;

		if (omo.track){
			omo.track = omo.track.trim();
		}

		var artist_name = omo.artist || " ";

		self.artist = artist_name;
		self.track = omo.track;

		self.omo = omo;

		self.initState('no_track_title', false);
		if (artist_name){
			self.initState('artist', artist_name && artist_name.trim());
		}
		if (omo.track){
			self.initState('track', omo.track);
		}
		self.initState('playlist_type', self.map_parent.playlist_type);
		self.initState('url_part', self.getURL());
		//self.updateManyStates(states);

		self.on('requests', self.hndRequestsPrio, self.getContextOptsI());
		self.states_was_twisted = false;

	}
}, {
	model_name: "song",
	network_data_as_states: false,
	manual_states_init: true,
	hndRequestsPrio: function() {
		this.map_parent.checkRequestsPriority();

	},
	'stch-needs_states_connecting': function(target) {
		if (!target.states_was_twisted) {

			if (target.twistStates) {
				target.twistStates();
				target.states_was_twisted = true;

			}
		}
	},
	'stch-mf_cor_current_mopla': function(target, state) {
		target.updateNesting('current_mopla', state);
	},
	complex_states: {
		'needs_states_connecting': [
			['^active_use']
		],
		'mf_cor_current_mopla': [
			['@one:current_mopla:mf_cor']
		],
		'file_almost_loaded': [
			['@every:almost_loaded:mf_cor']
		],
		'one_artist_playlist': {
			depends_on: ['playlist_type'],
			fn: function(playlist_type) {
				return playlist_type == 'artist';
			}
		},
		'selected_image': {
			depends_on: ['lfm_image', 'ext_lfm_image', 'image_url', 'album_image'],
			fn: function(lfm_i, ext_lfm, just_url, album_image) {
				return album_image || lfm_i || just_url || ext_lfm;
			}
		},
		'song_title': {
			depends_on: ['artist', 'track'],
			fn: function(artist, track){
				return this.getFullName(artist, track);
			}
		},
		'nav_short_title': {
			depends_on: ['artist', 'track'],
			fn: function(artist, track) {
				return this.getFullName(artist, track, true);
			}
		},
		'nav_title': {
			depends_on: ['artist', 'track'],
			fn: function(artist, track){
				return this.getFullName(artist, track);
			}
		},
		is_important: {
			depends_on: ['mp_show', 'player_song', 'want_to_play'],
			fn: function(mp_show, player_song, wapl){
				if (mp_show){
					return 'mp_show';
				}
				if (player_song){
					return 'player_song';
				}
				if (wapl){
					return 'want_to_play';
				}
			}
		},
		'can-use-as-neighbour':{
			depends_on: ['has_none_files_to_play', 'forbidden_by_copyrh'],
			fn: function(h_nftp, forbidden_by_copyrh) {
				if (forbidden_by_copyrh) {
					return false;
				}
				if (h_nftp){
					return false;
				} else {
					return true;
				}

			}
		},
		'has_none_files_to_play': {
			depends_on: ['mf_cor', 'search_complete', 'no_track_title', 'mf_cor_has_available_tracks'],
			fn: function(mf_cor, scomt, ntt, mf_cor_tracks) {
				if (mf_cor && !mf_cor_tracks){
					if (!mf_cor.isSearchAllowed()){
						return true;
					} else if (scomt){
						return true;
					}
				}

				if (ntt){
					return true;
				}
				return false;
			}
		},
		'$relation:next_preload_song-for-loaded_player_song': [
			['player_song', 'related_next_preload_song', 'file_almost_loaded'],
			function(player_song, related_next_preload_song, file_almost_loaded) {
				return player_song && file_almost_loaded && related_next_preload_song;
			}
		],
		'$relation:next_preload_song-for-mp_show': [
			['mp_show', 'related_next_preload_song'],
			function(mp_show, related_next_preload_song) {
				return mp_show && related_next_preload_song;
			}
		],
		'$relation:next_preload_song-for-player_song': [
			['player_song', 'related_next_preload_song'],
			function(player_song, related_next_preload_song) {
				return player_song && related_next_preload_song;
			}
		],
		'$relation:next_preload_song-for-very_wanted_play': [
			['want_to_play', 'related_next_preload_song', '^want_be_played', 'mf_cor_has_available_tracks'],
			function(want_to_play, related_next_preload_song, pl_want_be_played, mf_cor_has_available_tracks) {
				return !mf_cor_has_available_tracks && want_to_play && pl_want_be_played && related_next_preload_song;
			}
		],
		'need_files': [
			[ 'mp_show', 'want_to_play', 'next_preload_song-for-mp_show', 'next_preload_song-for-player_song', 'next_preload_song-for-very_wanted_play'],
			function(mp_show, want_to_play, n_show, n_player_song, n_vvsong) {
				return mp_show || want_to_play || isDepend(n_show) || isDepend(n_player_song) || isDepend(n_vvsong);
			}
			/*

			необходимо искать файлы для композиций в следующих состояниях:

				показываемая
				желанная для воспроизведения

				следующая по порядку воспроизведения (но не визуальному порядку)
					для воспроизводимой
					отображаемой
					для желанной, но недоступной в %желанном% плейлисте

			*/
		],
		'preload_current_file': [
			['next_preload_song-for-loaded_player_song'],
			function(n_loaded_psong) {
				return isDepend(n_loaded_psong);
			}
		],
		'load_current_file': [
			['player_song'],
			function(player_song) {
				return !!player_song;
			}
		]
	},
	'stch-$relation:next_preload_song-for-mp_show': pv.getRDep('$relation:next_preload_song-for-mp_show'),
	'stch-$relation:next_preload_song-for-player_song': pv.getRDep('$relation:next_preload_song-for-player_song'),
	'stch-$relation:next_preload_song-for-very_wanted_play': pv.getRDep('$relation:next_preload_song-for-very_wanted_play'),
	'stch-$relation:next_preload_song-for-loaded_player_song': pv.getRDep('$relation:next_preload_song-for-loaded_player_song'),

	canUseAsNeighbour: function(){
		return this.state('can-use-as-neighbour');
	},
	state_change: {
		"mp_show": function(target, state) {
			if (state){
				target.prepareForPlaying();
				target.requestState('album_name');

			} else {
				target.removeMarksFromNeighbours();
			}
		}
	},
	requestPlay: function(bwlev_id) {
		var bwlev = pv.getModelById(bwlev_id);

		var play_request = pv.create(PlayRequest, null, {
			nestings: {
				song: this,
				wanted_song: this,
				bwlev: bwlev
			}
		}, bwlev, this.app);

		if (this.player) {
		 	this.player.requestPlay(play_request);
		}

		this.makeSongPlayalbe(true);
	},
	wantSong: function() {

		if (this.player){
			this.player.wantSong(this);
		}

		this.makeSongPlayalbe(true);
	},
	prepareForPlaying: function() {

		this.makeSongPlayalbe(true);

		// this.mp3_search.on("new-search.viewing-song", this.findFiles, {exlusive: true, context: this});
	},
	simplify: function() {
		return spv.cloneObj({}, this, false, ['track', 'artist']);
	},

	mlmDie: function() {

	},
	getFullName: function(artist, track, allow_short){
		var n = '';
		if (this.artist){
			if (this.track){
				if (allow_short && this.map_parent && (this.map_parent.info && this.map_parent.info.artist == this.artist)){
					n = this.track;
				} else {
					n = this.artist + " - " + this.track;
				}
			} else {
				n = this.artist;
			}
		} else if (this.track){
			n = this.track;
		}
		return n || 'no title';
	},
	playNext: function(auto) {
		if (this.state('rept-song')){
			this.play();
		} else {
			playRelative(this, this.map_parent.switchTo(this, true, auto));
		}

	},
	playPrev: function() {
		playRelative(this, this.map_parent.switchTo(this));
	},
	/*
	downloadLazy: spv.debounce(function(){
		var song = spv.getTargetField(this.mf_cor.songs(), "0.t.0");
		if (song){
			downloadFile(song.link);
		}
	}, 200),*/
	canPlay: function() {
		return this.getMFCore().canPlay();
	},

	setVolume: function(vol, fac){
		this.getMFCore().setVolume(vol, fac);
	},
	stop: function(){
		this.getMFCore().stop();
	},
	switchPlay: function(){
		this.getMFCore().switchPlay();
	},
	pause: function(){
		this.getMFCore().pause();
	},
	play: function(mopla){
		if (this.state('forbidden_by_copyrh')) {
			return;
		}
		this.getMFCore().play(mopla);

	},
	markAs: function(neighbour, mo){
		if (!this.neighbour_for){
			this.neighbour_for = mo;
			pv.update(this, 'marked_as', neighbour);
		}
	},
	unmark: function(mo){
		if (this.neighbour_for == mo){
			this.neighbour_for = null;
			pv.update(this, 'marked_as', false);

		}
	},
	wasMarkedAsPrev: function() {
		return this.state('marked_as') && this.state('marked_as') == 'prev';
	},
	wasMarkedAsNext: function() {
		return this.state('marked_as') && this.state('marked_as') == 'next';
	},
	addMarksToNeighbours: function(){

		if (!this.marked_prev_song || this.marked_prev_song != this.prev_song){
			if (this.marked_prev_song){
			//	this.marked_prev_song.unmark(this);
			}
			if (this.prev_song){
				(this.marked_prev_song = this.prev_song);//.markAs('prev', this);
			}
		}
		if (!this.marked_next_song || this.marked_next_song != this.next_song){
			if (this.marked_next_song){
				//this.marked_next_song.unmark(this);
			}
			if (this.next_song){
				(this.marked_next_song = this.next_song);//.markAs('next', this);
			}
		}
		this.map_parent.checkShowedNeighboursMarks();

	},
	removeMarksFromNeighbours: function(){
		if (this.marked_prev_song){
			//this.marked_prev_song.unmark(this);
			this.marked_prev_song = null;
		}
		if (this.marked_next_song){
			//this.marked_next_song.unmark(this);
			this.marked_next_song = null;
		}
		this.map_parent.checkShowedNeighboursMarks();
	},

	isImportant: function() {
		return this.state('is_important');
	},

	hasNextSong: function(){
		return !!this.next_song;
	},
	setSongName: function(song_name, full_allowing, from_collection, last_in_collection) {
		song_name = song_name && song_name.trim();
		this.track = song_name;
		this.updateManyStates({
			'track': song_name,
			'url_part': this.getURL()
		});

		// this.findFiles({
		// 	only_cache: !full_allowing,
		// 	collect_for: from_collection,
		// 	last_in_collection: last_in_collection
		// });
	},
	req_map: [
		[
			['album_name', 'album_image', 'listeners', 'playcount', 'duration', 'top_tags'],
			{
				source: 'track',
				props_map: {
					album_name: 'album.title',
					album_image: ['lfm_image', 'album.image'],
					listeners: ['num', 'listeners'],
					playcount: ['num', 'playcount'],
					duration: ['num', 'duration'],
				},
				parts_map: {
					top_tags: {
						is_array: true,
						source: 'toptags.tag',
						props_map: 'name'
					}
				}
			},
			['lfm', 'get', function() {
				return ['track.getInfo', {
					artist: this.state('artist'),
					track: this.state('track')
				}];
			}]
		]
	],
	getRandomTrackName: function(full_allowing, from_collection, last_in_collection){
		pv.update(this, 'track_name_loading', true);
		var _this = this;

		/*
		инфа из лфм +

		треки ex.fm  +
		треки в sc +
		треки lfm +

		есть ли профиль в sc
		*/

		if (!this.track && !this.rtn_request){
			var all_requests = [];
			var can_search_wide = !!this.mp3_search.getSearchByName('vk');

			var def_top_tracks = $.Deferred();

			var
				def_podcast,
				def_soundcloud,
				def_exfm;

			all_requests.push(def_top_tracks);
			this.addRequest(this.app.lfm.get('artist.getTopTracks',{'artist': this.artist, limit: 30, page: 1 })
				.done(function(r){
					var tracks_list = spv.toRealArray(spv.getTargetField(r, 'toptracks.track'));
					var tracks_list_clean = [];
					for (var i = 0; i < tracks_list.length; i++) {
						var cur = tracks_list[i];
						tracks_list_clean.push({
							artist: cur.artist.name,
							track: cur.name
						});
					}

					def_top_tracks.resolve(tracks_list_clean);

				})
				.fail(function() {
					def_top_tracks.resolve();
				}), {space: 'acting'});


			if (!can_search_wide){
				def_podcast = $.Deferred();
				def_soundcloud = $.Deferred();
				def_exfm = $.Deferred();

				all_requests.push(def_podcast);
				this.addRequest(this.app.lfm.get('artist.getPodcast', {artist: this.artist})
					.done(function(r) {
						var tracks_list = spv.toRealArray(spv.getTargetField(r, 'rss.channel.item'));
						var tracks_list_clean = [];
						var files_list = [];

						for (var i = 0; i < tracks_list.length; i++) {
							var cur = tracks_list[i];
							var link = decodeURI(cur.link);
							var parts = link.split('/');
							var track_name = parts[parts.length-1];
							tracks_list_clean.push({
								artist: _this.artist,
								track: track_name
							});
							files_list.push(_this.app.createLFMFile(_this.artist, track_name, link));

						}
						_this.mp3_search.pushSomeResults(files_list);
						def_podcast.resolve(tracks_list_clean);
					})
					.fail(function() {
						def_podcast.resolve();
					}), {space: 'acting'});

				var pushMusicList = function(music_list, deferred_obj) {
					var filtered = [];

					for (var i = 0; i < music_list.length; i++) {
						var cur = music_list[i];
						var qmi = _this.mp3_search.getFileQMI(cur, {artist: _this.artist});
						if (qmi != -1){
							if (cur.artist && cur.artist.toLowerCase() == _this.artist.toLowerCase()){
								if (qmi < 20){
									filtered.push(cur);
								}
							}
						}
					}
					_this.mp3_search.pushSomeResults(music_list);

					deferred_obj.resolve(filtered);
				};

				all_requests.push(def_soundcloud);
				var sc_search = this.mp3_search.getSearchByName('soundcloud');
				if (!sc_search){
					def_soundcloud.resolve();
				} else {
					this.addRequest( sc_search.findAudio({artist: this.artist})
						.done(function(music_list) {
							pushMusicList(music_list, def_soundcloud);
							//var music_list_filtered =
						})
						.fail(function() {
							def_soundcloud.resolve();
						}),
					{space: 'acting'}
					);
				}


				all_requests.push(def_exfm);
				var exfm_search = this.mp3_search.getSearchByName('exfm');
				if (!exfm_search){
					def_exfm.resolve();
				} else {
					this.addRequest(   exfm_search.findAudio({artist: this.artist})
						.done(function(music_list) {
							pushMusicList(music_list, def_exfm);
						})
						.fail(function() {
							def_exfm.resolve();
						}),
					{space: 'acting'}
					);
				}
			}

			var any_track_with_file = Math.round(Math.random());


			var big_request = this.rtn_request = $.when.apply($.when, all_requests)
				.done(function(top_tracks, podcast, sc_list, exfm_list) {
					if (_this.track){
						return;
					}
					top_tracks = top_tracks && top_tracks.length && top_tracks;

					var selectRandomTrack = function(tracks_list) {
						if (tracks_list && tracks_list.length){
							var some_track = tracks_list[Math.floor(Math.random()*tracks_list.length)];
							_this.setSongName(some_track.track, full_allowing, from_collection, last_in_collection);
						} else {
							pv.update(_this, "no_track_title", true);

						}
					};

					if (!can_search_wide){
						var all_with_files = [];

						if (podcast && podcast.length){
							all_with_files = all_with_files.concat(podcast);
						}
						if (sc_list && sc_list.length){
							all_with_files = all_with_files.concat(sc_list);
						}
						if (exfm_list && exfm_list.length){
							all_with_files = all_with_files.concat(exfm_list);
						}

						var single_files_store = spv.makeIndexByField(all_with_files, 'track');
						var single_tracks_list = [];
						var track_name;
						for (track_name in single_files_store){
							single_tracks_list.push({
								artist: _this.artist,
								track: track_name
							});
						}

						if (any_track_with_file){
							if (single_tracks_list.length){
								selectRandomTrack(single_tracks_list);
							} else {
								selectRandomTrack(top_tracks);
							}

						} else {

							var top_index = spv.makeIndexByField(top_tracks, 'track');
							var both_match_tracks_list = [];
							for (track_name in top_index){
								if (single_files_store[track_name]){
									both_match_tracks_list.push({
										artist: _this.artist,
										track: track_name
									});
								}
							}
							if (both_match_tracks_list.length){
								selectRandomTrack(both_match_tracks_list);
							} else if (single_tracks_list.length) {
								selectRandomTrack(single_tracks_list);
							} else {
								selectRandomTrack(top_tracks);
							}
						}
					} else {
						selectRandomTrack(top_tracks);
					}

				})
				.always(function() {
					pv.update(_this, 'track_name_loading', false);
					if (_this.rtn_request == big_request){
						delete _this.rtn_request;
					}
					_this.checkChangesSinceFS();
				});
		}

	},
	// prefindFiles: function(){
	// 	this.findFiles();
	// },
	// updateFilesSearchState: function(opts){
	// 	pv.update(this, 'files_search', opts);
	// 	this.checkChangesSinceFS(opts);
	// },
	investg_rq_opts: {
		depend: true,
		space: 'acting'
	},
	hndInvestgReqs: function(array) {
		this.addRequests(array, this.investg_rq_opts);
	},
	// hndLegacyFSearch: function(e) {
	// 	this.updateFilesSearchState(e.value);
	// },
	// hndHasMp3Files: function(e) {
	// 	pv.update(this, 'playable', e.value);
	// 	if (e.value){
	// 		this.map_parent.markAsPlayable();
	// 	}
	// },
	'stch-playable': function(target, state) {
		if (state) {
			target.map_parent.markAsPlayable();
		}
	},
	'compx-search_complete': [
		['@one:search_complete:investg']
	],
	'compx-playable': [
		['@one:has_mp3_files:investg', '@one:has_available_tracks:mf_cor'],
		function (has_mp3_files, has_available_tracks) {
			return has_mp3_files || has_available_tracks;
		}
	],
	'compx-files_search': [
		['@one:legacy-files-search:investg', '@one:has_available_tracks:mf_cor'],
		function(files_search, has_available_tracks){
			return files_search || (has_available_tracks && {
				search_complete: true,
				have_best_tracks: true,
				have_mp3_tracks: true,
				have_tracks: true
			});
		}
	],
	'compx-searching_files': [
		['@one:has_request:investg']
	],
	'stch-files_search': function(target, state) {
		target.checkChangesSinceFS(state);
	},
	bindFilesSearchChanges: function(investg) {
		this.updateNesting('investg', investg);
		investg
			.on('requests', this.hndInvestgReqs, this.getContextOptsI());
	},
	isSearchAllowed: function() {
		return this.getMFCore() && this.getMFCore().isSearchAllowed();
	},
	// findFiles: function(opts){
	// 	return;

	// 	if (!this.artist || !this.track || !this.isSearchAllowed()){
	// 		return false;
	// 	}

	// 	if (this.mp3_search){
	// 		opts = opts || {};
	// 		opts.only_cache = opts.only_cache && !this.state('want_to_play') && (!this.player.c_song || this.player.c_song.next_preload_song != this);

	// 		this.getMFCore().startSearch(opts);
	// 	}
	// },
	makeSongPlayalbe: function(full_allowing,  from_collection, last_in_collection){
		if (!this.track && full_allowing){
			if (this.getRandomTrackName){
				this.getRandomTrackName(full_allowing, from_collection, last_in_collection);
			}
		}
	},
	checkRequestsPriority: function() {
		this.map_parent.checkRequestsPriority();
	},
	getActingPriorityModels: function() {
		var result = [];
		if (this.next_song){
			result.push(this.next_song);
		} else if (this.map_parent.state('has_data_loader')){
			result.push( this.map_parent );
		} else if ( this.next_preload_song ){
			result.push( this.next_preload_song );

		}
		result.push( this );
		return result;
	},
	checkChangesSinceFS: function(opts){
		this.map_parent.checkChangesSinceFS(this, opts);
	},
	view: function(no_navi, userwant){
		if (!this.state('mp_show')){
			this.trigger('view', no_navi, userwant);
		}
	},
	valueOf:function(){
		return (this.artist ? this.artist + ' - ' : '') + this.track;
	},
	isPossibleNeighbour: function(mo) {
		return this.isNeighbour(mo) || mo == this.next_preload_song;
	},
	isNeighbour: function(mo){
		return (mo == this.prev_song) || (mo == this.next_song);
	},
	setPlayableInfo: function(info){
		this.playable_info = info;
		return this;
	},
	posistionChangeInMopla: function(mopla){
		if (this.getCurrentMopla() == mopla){
			this.submitPlayed(true);
			this.submitNowPlaying();

			if (!this.start_time){
				this.start_time = (Date.now()/1000).toFixed(0);
			}
		}
	},
	getCurrentMopla: function(){
		return this.getMFCore().getCurrentMopla();
	},
	showArtcardPage: function(artist_name) {
		this.app.showArtcardPage(artist_name || this.artist);
		this.app.trackEvent('Artist navigation', 'art card', artist_name || this.artist);
	},
	showArtistSimilarArtists: function() {
		this.app.showArtistSimilarArtists(this.artist);
		this.app.trackEvent('Artist navigation', 'similar artists to', this.artist);
	}

});
});
