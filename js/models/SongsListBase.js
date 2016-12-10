define(['pv', 'spv', './LoadableList'], function(pv, spv, LoadableList){
	"use strict";



return spv.inh(LoadableList, {
	init: function(target, opts){
		target.idx_wplay_song = null;
		target.idx_show_song = null;
		target.idx_player_song = null;

		target.vis_neig_next = null;
		target.vis_neig_prev= null;

		target.app = opts.app;
		target.player = target.app.p;
		target.mp3_search = target.app.start_page.mp3_search;
	},
}, spv.coe(function(add) {


	var nesting_name_dir_cache = {};
	var getNeighbDir = function(nesting_name) {
		if (!nesting_name_dir_cache[nesting_name]) {
			nesting_name_dir_cache[nesting_name] = nesting_name.replace('vis_neig_', '');
		}
		return nesting_name_dir_cache[nesting_name];
	};

	var hndNeighboursRemarks = function(e) {
		var direction =  getNeighbDir(e.nesting_name);
		var key_name = 'cur_' + e.nesting_name;
		if (e.value != this[key_name]) {
			if (this[key_name]) {
				pv.update(this[key_name], 'marked_as', false);
			}

			this[key_name] = e.value;

			if (e.value) {
				pv.update(e.value, 'marked_as', direction);
			}
		}
		//console.log(e.value, e.nesting_name);
	};

	var markTracksForFilesPrefinding = function(mdpl){
		var from_collection = + (new Date());
		for (var i=0; i < mdpl.getMainlist().length; i++) {
			mdpl.getMainlist()[i]
				.setPlayableInfo({
					packsearch: from_collection,
					last_in_collection: i == mdpl.getMainlist().length-1
				});

		}
		return mdpl;
	};


	var hndTickListChanges = function(target, last_usable_song) {
		if (last_usable_song && last_usable_song.isImportant()){
			//target.checkNeighboursChanges(last_usable_song);
		}
		var w_song = getWantedSong(target);
		var v_song = getViewingSong(target, w_song);
		var p_song = getPlayerSong(target, v_song);

		if (w_song && !w_song.hasNextSong()){
			checkNeighboursChanges(target, w_song, false, false);
		}

		if (v_song && !v_song.hasNextSong()) {
			checkNeighboursChanges(target, v_song, false, false);
		}

		if (p_song && v_song != p_song && !p_song.hasNextSong()){
			checkNeighboursChanges(target, p_song, false, false);
		}

		if (target.state('want_be_played')) {
			if (target.getMainlist()) {
				target.getMainlist()[0].wantSong();
			}
		}
	};

	var hndChangedPlaylist = function(e) {
		if (!e.skip_report){
			markTracksForFilesPrefinding(this);
			this.makePlayable();
			this.nextTick(hndTickListChanges, [this, e.last_usable_song]);

		}
	};
	var getFindSomeFunc = function(check) {
		return function(array) {
			for (var i = 0; i < array.length; i++) {
				if (check(array[i])) {
					return array[i];
				}
			}
		};
	};

	var findWTPS = getFindSomeFunc(function(item) {
		return item && item.state('want_to_play');
	});

	var findMPSS = getFindSomeFunc(function(item) {
		return item && item.state('mp_show');
	});


	var findPS = getFindSomeFunc(function(item) {
		return item && item.state('player_song');
	});

	var checkNeighboursStatesCh = function(md, target_song) {

		var v_song = getViewingSong(md, target_song);
		var p_song = getPlayerSong(md, target_song);
		var w_song = getWantedSong(md, target_song);
		if (v_song) {
			checkNeighboursChanges(md, v_song, target_song);
		}
		if (p_song && v_song != p_song){
			checkNeighboursChanges(md, p_song, target_song);
		}
		if (w_song && w_song != p_song && w_song != v_song){
			checkNeighboursChanges(md, w_song, target_song);
		}

	};

	var findImportantSongs = (function() {
		var check = function(value) {
			return value;
		};
		return function(array) {
			return array && spv.filter(array, 'is_important', check);
		};

	})();


	var checkImportant = function(pl, md) {
		if (pl.state('pl-shuffle')) {
			applySongRolesChanges(md, {
				next_preload_song: null
			});
		}

		checkNeighboursChanges(pl, md);
	};

	var setWaitingNextSong = function(mdpl, mo) {
		mdpl.waiting_next = mo;
		mdpl.player.setWaitingPlaylist(mdpl);

	};

	var getNeighbours = function(mdpl, mo, neitypes){
		var obj = {},i;
		if (neitypes){
			for (var song_type in neitypes){
				if (neitypes[song_type]){
					obj[song_type] = null;
				}
			}
		}
		var c_num = mdpl.getMainlist().indexOf(mo);

		if (!neitypes || neitypes.prev_song){
			//ищем пред. композицию если нет ограничений
			//или ограничения не касаются пред. композиции
			for (i = c_num - 1; i >= 0; i--) {
				if (mdpl.getMainlist()[i].canUseAsNeighbour()){
					obj.prev_song = mdpl.getMainlist()[i];
					break;
				}
			}
		}

		var shuffle = mdpl.state('pl-shuffle');

		if (!neitypes || neitypes.next_song){
			//ищем след. композицию если нет ограничений
			//или ограничения не касаются след. композиции

			for (i = c_num + 1; i < mdpl.getMainlist().length; i++) {
				if (mdpl.getMainlist()[i].canUseAsNeighbour()){
					obj.next_song = mdpl.getMainlist()[i];
					if (!shuffle) {
						obj.next_preload_song = obj.next_song;
					}

					break;
				}
			}
		}
		if (shuffle && !mo.next_preload_song && (!neitypes || neitypes.next_preload_song)){
			//использование mo.next_preload_song - неправильно!!!! fixme
			//нужные связанные композиции должны запраживаться через neitypes
			var array = mdpl.getMainlist();
			var allowed = [];
			for (i = 0; i < array.length; i++) {
				if (array[i].canUseAsNeighbour()) {
					allowed.push(array[i]);
				}
			}
			obj.next_preload_song = allowed[ Math.round( (Math.random() * allowed.length) ) ];
		}




		if ((!neitypes || neitypes.next_preload_song) && !obj.next_preload_song){
			//ищем композицю для предзагрузки если нет ограничений
			//или ограничения не касаются композиции для предзагрузки

			//и при этого такая композиция ещё не была найдена
			for (i = 0; i < c_num; i++) {
				if (mdpl.getMainlist()[i].canUseAsNeighbour()){
					obj.next_preload_song = mdpl.getMainlist()[i];
					break;
				}
			}
		}
		return obj;

	};

	var getNeighboursChanges = function(target_song, changed_song) {
		var
			i,
			check_list = {},
			o_ste = {
				next_song: target_song.next_song,
				prev_song: target_song.prev_song,
				next_preload_song: target_song.next_preload_song
			};


		var neighbours_changes;
		var changed_song_roles;


		if (changed_song){
			/*
			если знаем состояние какой именно композиции изменилось ("changed_song"),
			то проверяем какое значение оно имеет для целевой песни,
			если играет роль то проверяем их ухудшение иначе ищем все роли (улучшение состояние отвергнутых)
			*/
			for (i in o_ste){
				check_list[i] = o_ste[i] == changed_song;
				if (o_ste[i] == changed_song){
					changed_song_roles = changed_song_roles || true;
				}
			}
			if (changed_song_roles){
				if (changed_song.canUseAsNeighbour()){
					//throw new Error('this means that previously wrong song was selected!');
				}
				if (!changed_song.canUseAsNeighbour()){
					neighbours_changes = getNeighbours(this, target_song, check_list);
				}
			} else {
				/*
				если ("changed_song") не играет никакой роли, и её состояние ухудшилось, то можно ничего не делать
				*/
				if (changed_song.canUseAsNeighbour()){
					neighbours_changes = getNeighbours(this, target_song);
				}

			}
		} else {
			/*
			если не знаем состояние каких ухудшилось, то проверяем ухудшились ли текущие роли
			если нет, то ищем все (улучшение состояние отвергнутых)
			*/

			for (i in o_ste){
				if (o_ste[i] && !o_ste[i].canUseAsNeighbour()){
					check_list[i] = true;
					changed_song_roles = changed_song_roles || true;
				}
			}
			if (changed_song_roles){
				neighbours_changes = getNeighbours(this, target_song, check_list);
			} else {
				neighbours_changes = getNeighbours(this, target_song);
			}


		}


		var original_clone = spv.cloneObj({}, o_ste);
		if (neighbours_changes){
			spv.cloneObj(original_clone, neighbours_changes);
		}




		return spv.getDiffObj(o_ste, original_clone);
	};

	var applySongRolesChanges = function(target_song, changes) {
		spv.cloneObj(target_song, changes);
		var result = {};
		for (var prop in changes) {
			result[ 'related_' + prop] = changes[prop];
		}
		target_song.updateManyStates(result);


	};


	var checkNeighboursChanges = function(md, target_song, changed_neighbour, viewing) {
		var changes = getNeighboursChanges.call(md, target_song, changed_neighbour);
		//console.log("changes");
		//console.log(); isImportant
		applySongRolesChanges(target_song, changes);



		viewing = viewing || !!target_song.state("mp_show");
		var playing = !!target_song.state("player_song");
		var wanted = target_song.state('want_to_play');

		if (viewing){
			target_song.addMarksToNeighbours();
			if (target_song.prev_song && !target_song.prev_song.state('track')){
				target_song.prev_song.getRandomTrackName();
			}
		}

		if ((viewing || playing) && target_song.next_preload_song){
			target_song.next_preload_song.makeSongPlayalbe(true);
		}

		if (md.state('want_be_played') && wanted) {
			if (!target_song.canPlay() && target_song.next_preload_song) {
				setWaitingNextSong(md, target_song);
				target_song.next_preload_song.makeSongPlayalbe(true);
			}
		}

		if (viewing || playing || wanted){
			if (!target_song.hasNextSong()){
				md.requestMoreData();
			}
		}

	};

	var getLastUsableSong = function(mdpl){
		for (var i = mdpl.getMainlist().length - 1; i >= 0; i--) {
			var cur = mdpl.getMainlist()[i];
			if (cur.canUseAsNeighbour()){
				return cur;
			}

		}
	};


	var getWantedSong= function(mdpl, exept) {

		//return spv.filter(mdpl.getMainlist(), 'states.want_to_play', function(v) {return !!v;})[0];
		return mdpl.idx_wplay_song != exept && mdpl.idx_wplay_song;
	};
	var getViewingSong=function(mdpl, exept) {
		//var song = spv.filter(mdpl.getMainlist(), 'states.mp_show', function(v) {return !!v;})[0];
		return mdpl.idx_show_song != exept && mdpl.idx_show_song;
	};
	var getPlayerSong= function(mdpl, exept) {
		//var song = spv.filter(mdpl.getMainlist(), "states.player_song", true)[0];
		return mdpl.idx_player_song != exept && mdpl.idx_player_song;
	};


	var bindStaCons = LoadableList.prototype.bindStaCons;



	add({
		model_name: "playlist",
		'compx-active_use': [
			['mp_show', 'want_be_played'],
			function (mp_show, want_be_played) {
				return mp_show || want_be_played;
			}
		],
		'stch-pl-shuffle': function(target) {
			checkNeighboursStatesCh(target);
		},
		'stch-want_to_play@songs-list': function(target, new_state, old, source) {
			if (!source.item) {
				var item = findWTPS(source.items);
				target.idx_wplay_song = item;
			} else {
				if (new_state){
					target.idx_wplay_song = source.item;
				} else if (target.idx_wplay_song == source.item) {
					target.idx_wplay_song = null;
				}
			}
		},
		// 'compx-idx_player_song': [
		// 	['songs-list']
		// ],
		'stch-player_song@songs-list': function(target, new_state, old, source) {
			if (!source.item) {
				var item = findPS(source.items);
				target.idx_player_song = item;
			} else {
				if (new_state){
					target.idx_player_song = source.item;
				} else if (target.idx_player_song == source.item) {
					target.idx_player_song = null;
				}
			}
			pv.updateNesting(target, 'last_played_song', target.idx_player_song || target.getNesting('last_played_song'));
			pv.update(target, 'last_played_song_start', Date.now());
		},
		'stch-can-use-as-neighbour@songs-list': function(target, new_state, old, source) {
			if (!source.item) {
				return;
			}
			checkNeighboursStatesCh(target, source.item);
		},
		'stch-is_important@songs-list': function(target, new_state, old, source) {
			if (!source.item) {
				var array = findImportantSongs(source.items);
				if (array) {
					for (var i = 0; i < array.length; i++) {
						checkImportant(target, array[i]);

					}
				}
			} else if (source.item.isImportant()) {
				checkImportant(target, source.item);
			}
		},
		'stch-mp_show@songs-list': function(target, new_state, old, source) {
			if (!source.item) {
				var item = findMPSS(source.items);
				target.idx_show_song = item;
			} else {
				if (new_state){
					target.idx_show_song = source.item;
				} else if (target.idx_show_song == source.item) {
					target.idx_show_song = null;
				}
			}

			target.checkShowedNeighboursMarks();
		},
		bindStaCons: function() {
			bindStaCons.call(this);
			this.on('child_change-' + this.main_list_name, hndChangedPlaylist);
			this.on('child_change-' + 'vis_neig_prev', hndNeighboursRemarks);
			this.on('child_change-' + 'vis_neig_next', hndNeighboursRemarks);
		},
		checkShowedNeighboursMarks: function() {
			pv.updateNesting(this, 'vis_neig_prev', this.idx_show_song && this.idx_show_song.marked_prev_song || null);
			pv.updateNesting(this, 'vis_neig_next', this.idx_show_song && this.idx_show_song.marked_next_song || null);
		},

		main_list_name: 'songs-list',
		add: function(omo){
			var mo = spv.cloneObj({}, omo, false, ['track', 'artist', 'file']);
			return this.addDataItem(mo);
		},

		isDataItemValid: function(data_item) {
			return !!data_item.artist && !!data_item.artist.trim();
		},
		isDataInjValid: function(obj) {
			if (!obj.track && !obj.artist){
				return;
			} else {
				return true;
			}
		},
		items_comparing_props: [['artist', 'artist'], ['track', 'track']],

		getMainListChangeOpts: function() {
			return {
				last_usable_song: getLastUsableSong(this)
			};
		},
		die: function(){
			this.hideOnMap();
			this._super();
			for (var i = this.getMainlist().length - 1; i >= 0; i--){
				this.getMainlist()[i].die();
			}

		},
		simplify: function(){
			var list = this.getMainlist();
			var npl = new Array(list && list.length);

			for (var i=0; i < list.length; i++) {
				npl[i] = list[i].simplify();
			}

			return spv.cloneObj({
				length: npl.length,
				playlist_title: this.state('nav_title') || ''
			}, npl);
		},
		markAsPlayable: function() {
			pv.update(this, 'can_play', true);
		},
		makePlayable: function(full_allowing) {
			for (var i = 0; i < this.getMainlist().length; i++) {
				var mo = this.getMainlist()[i];
				var pi = mo.playable_info || {};
				mo.makeSongPlayalbe(pi.full_allowing || full_allowing, pi.packsearch, pi.last_in_collection);
			}
		},
		checkChangesSinceFS: function() {
			if (this.player.waiting_playlist && this == this.player.waiting_playlist) {
				if (this.waiting_next){
					if (!this.waiting_next.next_preload_song){
						this.waiting_next = null;
						this.player.waiting_playlist = null;
					} else if (this.waiting_next.next_preload_song.canPlay()){
						this.waiting_next.next_preload_song.wantSong();
					}
				}
			} else {
				this.waiting_next = null;
			}
		},
		wantListPlaying: function() {
			this.player.removeCurrentWantedSong();
			pv.update(this, 'want_be_played', true);

			if (!this.getMainlist()[0]) {
				this.requestMoreData();
			} else {
				this.getMainlist()[0].wantSong();
			}

			var _this = this;
			this.player.once('now_playing-signal', function() {
				pv.update(_this, 'want_be_played', false);
			});
		},
		setWaitingNextSong: setWaitingNextSong,
		switchTo: function(mo, direction) {

			var playlist = [];
			for (var i=0; i < this.getMainlist().length; i++) {
				var ts = this.getMainlist()[i].canPlay();
				if (ts){
					playlist.push(this.getMainlist()[i]);
				}
			}
			var current_number  = playlist.indexOf(mo),
				total			= playlist.length || 0;

			if (playlist.length > 1) {
				var s = false;
				if (direction) {
					var possible = mo.next_preload_song;
					var can_repeat = !this.state('dont_rept_pl');
					var shuffle = this.state('pl-shuffle');
					if (possible){
						var real_cur_pos = this.getMainlist().indexOf(mo);
						var nps_pos = this.getMainlist().indexOf(possible);
						if (shuffle || can_repeat || nps_pos > real_cur_pos){
							if (!possible.canPlay()) {
								possible.makeSongPlayalbe(true);
							}

							if (possible.canPlay()){
								s = possible;
							} else {
								return true;
								// setWaitingNextSong(this, mo);
							}
						}

					} else if (this.state('can_load_more')){
						return true;
						// setWaitingNextSong(this, mo);

					} else {
						if (current_number == (total-1)) {
							if (can_repeat){
								s = playlist[0];
							}

						} else {
							s = playlist[current_number+1];
						}
					}


				} else {
					if ( current_number === 0 ) {
						s = playlist[total-1];
					} else {
						s = playlist[current_number-1];
					}
				}
				return s;
				// if (s){
				// 	s.play();
				// }
			} else if (playlist[0]){
				return playlist[0];
				// playlist[0].play();
			}

		},


		checkNavRequestsPriority: function() {
			var i;

			var demonstration = [];

			var waiting_next = this.waiting_next;
			var v_song = getViewingSong(this);
			var p_song = getPlayerSong(this);


			var addToArray = function(arr, item) {
				if (arr.indexOf(item) == -1){
					arr.push(item);
					return true;
				}
			};


			if (v_song){
				addToArray(demonstration, v_song);
				if (v_song.next_song){
					addToArray(demonstration, v_song.next_song);
				} else if (this.state('can_load_more')){
					addToArray(demonstration, this);
				}
				if (v_song.prev_song){
					addToArray(demonstration, v_song.prev_song);
				}
			}
			if (p_song){
				addToArray(demonstration, p_song);

				if (p_song.next_song){
					addToArray(demonstration, p_song.next_song);
				}
			}
			if (waiting_next){
				addToArray(demonstration, waiting_next);
				if (waiting_next.next_song){
					addToArray(demonstration, waiting_next.next_song);
				}
			}

			addToArray(demonstration, this);

			demonstration.reverse();
			for (i = 0; i < demonstration.length; i++) {
				demonstration[i].setPrio();
			}

		},
		checkRequestsPriority: function() {
			this.checkNavRequestsPriority();
		},
		getSPC: true,
		subPager: function(pstr, string) {
			var parts = this.app.getCommaParts(string);
			var artist = parts[1] ? parts[0] : this.playlist_artist;

			return this.findMustBePresentDataItem({
				artist: artist,
				track: parts[1] ? parts[1] : parts[0]
			});
		},
		requestLastPlayedSong: function() {
			this.getNesting('last_played_song').requestPage();
		}

	});
}));
});
