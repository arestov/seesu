define(function(require) {
"use strict";
var pv = require('pv');
var spv = require('spv');
var BrowseMap = require('js/libs/BrowseMap');
var SongBaseModern = require('./SongBaseModern')
var PlayRequest = require('./../PlayRequest');
var isDepend = pv.utils.isDepend;

var playRelative = function(mo, result) {
  if (result === true) {
    mo.map_parent.setWaitingNextSong(mo.map_parent, mo);
  } else if (result) {
    result.play();
  }
};

var finup = function(callback) {
  callback.finup = true;
  return callback;
};


var SongBase = spv.inh(BrowseMap.Model, {
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

    self.mp3_search = opts.app.start_page.mp3_search;
    self.player = opts.app.player;

    if (omo.track){
      omo.track = omo.track.trim();
    }

    var artist_name = omo.artist || " ";

    self.artist = artist_name;
    self.track = omo.track;

    if (self.init_states) {
      delete self.init_states.artist_name;
      delete self.init_states.track_name;
    }

    if (self.head) {
      delete self.head.artist_name;
      delete self.head.track_name;
    }


    self.omo = omo;

    if (artist_name){
      self.initState('artist', artist_name && artist_name.trim());
    }
    if (omo.track){
      self.initState('track_name_provided', omo.track);
    }
    self.initState('playlist_type', self.map_parent.playlist_type);
    //self.updateManyStates(states);

    self.on('requests', self.hndRequestsPrio, self.getContextOptsI());
    self.states_was_twisted = false;

  }
}, {
  'stch-should_load_next': finup(function(self, value) {
    if (value) {
      self.map_parent.requestMoreData()
    }
  }),
  "+effects": {
    "consume": {
      0: {
        type: "state_request",
        states: ['random_lfm_track_name'],

        parse: function (r) {
          var tracks_list = spv.toRealArray(spv.getTargetField(r, 'toptracks.track'));
          var tracks_list_clean = [];
          for (var i = 0; i < tracks_list.length; i++) {
            var cur = tracks_list[i];
            tracks_list_clean.push({
              artist: cur.artist.name,
              track: cur.name
            });
          }

          return {
            random_lfm_track_name: tracks_list_clean[Math.floor(Math.random()*tracks_list_clean.length)].track
          };
        },

        api: '#lfm',

        fn: [
          ['artist', 'can_load_random_lfm_track_name'],
          function(api, opts, artist_name) {
            return api.get('artist.getTopTracks', {
              artist: artist_name,
              limit: 30,
              page: 1
            });
          }
        ]
      },

      1: {
        type: "state_request",
        states: ['album_name', 'album_image', 'listeners', 'playcount', 'duration', 'top_tags'],

        parse: {
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

        api: '#lfm',

        fn: [
          ['artist', 'track'],
          function(api, opts, artist_name, track_name) {
            return api
              .get('track.getInfo', {
                artist: artist_name,
                track: track_name
              }, opts);
          }
        ]
      }
    }
  },

  "+states": {
    "track_name": ["compx", ['track']],
    "artist_name": ["compx", ['artist']],

    "track": [
      "compx",
      ['track_name_provided']
    ],

    "needs_states_connecting": ["compx", ['^active_use']],

    "mf_cor_current_mopla": [
      "compx",
      ['@one:current_mopla:mf_cor']
    ],

    "file_almost_loaded": [
      "compx",
      ['@every:almost_loaded:mf_cor']
    ],

    "one_artist_playlist": [
      "compx",
      ['playlist_type'],
      function(playlist_type) {
        return playlist_type == 'artist';
      }
    ],

    "selected_image": [
      "compx",
      ['lfm_image', 'ext_lfm_image', 'image_url', 'album_image'],
      function(lfm_i, ext_lfm, just_url, album_image) {
        return album_image || lfm_i || just_url || ext_lfm;
      }
    ],

    "song_title": [
      "compx",
      ['artist', 'track'],
      function(artist, track){
        return this.getFullName(artist, track);
      }
    ],

    "nav_short_title": [
      "compx",
      ['artist', 'track'],
      function(artist, track) {
        return this.getFullName(artist, track, true);
      }
    ],

    "nav_title": [
      "compx",
      ['artist', 'track'],
      function(artist, track){
        return this.getFullName(artist, track);
      }
    ],
    "should_load_next": [
      'compx',
      ['is_important', '@next_by_number'],
      function(important, next) {
        return !next && important
      }
    ],
    "is_important": [
      "compx",
      ['mp_show', 'player_song', 'want_to_play'],
      function(mp_show, player_song, wapl){
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
    ],
    'preffered_next_preload_song': [
      'compx',
      ['@modern_next_possible_preferred']
    ],

    "$relation:next_preload_song-for-loaded_player_song": [
      "compx",
      ['player_song', 'preffered_next_preload_song', 'file_almost_loaded'],
      function(player_song, related_next_preload_song, file_almost_loaded) {
        return player_song && file_almost_loaded && related_next_preload_song;
      }
    ],

    "$relation:next_preload_song-for-mp_show": [
      "compx",
      ['mp_show', 'preffered_next_preload_song'],
      function(mp_show, related_next_preload_song) {
        return mp_show && related_next_preload_song;
      }
    ],

    "$relation:next_preload_song-for-player_song": [
      "compx",
      ['player_song', 'preffered_next_preload_song'],
      function(player_song, related_next_preload_song) {
        return player_song && related_next_preload_song;
      }
    ],

    "$relation:next_preload_song-for-very_wanted_play": [
      "compx",
      ['want_to_play', 'preffered_next_preload_song', '^want_be_played', 'mf_cor_has_available_tracks'],
      function(want_to_play, related_next_preload_song, pl_want_be_played, mf_cor_has_available_tracks) {
        return !mf_cor_has_available_tracks && want_to_play && pl_want_be_played && related_next_preload_song;
      }
    ],

    "need_files": [
      "compx",
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

    "preload_current_file": [
      "compx",
      ['next_preload_song-for-loaded_player_song'],
      function(n_loaded_psong) {
        return isDepend(n_loaded_psong);
      }
    ],

    "load_current_file": [
      "compx",
      ['player_song'],
      function(player_song) {
        return !!player_song;
      }
    ],

    "rept-song": [
      "compx",
      ['#settings-rept-song']
    ],

    "can_load_random_lfm_track_name": [
      "compx",
      ['track_name_provided'],
      function (track_name_provided) {
        return !track_name_provided;
      }
    ],

    "track_name_not_found": [
      "compx",
      ['track', 'random_lfm_track_name', 'random_lfm_track_name__$complete'],
      function (track_name, random_trackname, complete) {
        return !track_name && complete && !random_trackname;
      }
    ],

    "track_name_loading": [
      "compx",
      ['random_lfm_track_name__loading']
    ],

    "can-use-as-neighbour": [
      "compx",
      ['has_none_files_to_play', 'forbidden_by_copyrh'],
      function(h_nftp, forbidden_by_copyrh) {
        if (forbidden_by_copyrh) {
          return false;
        }
        if (h_nftp){
          return false;
        } else {
          return true;
        }

      }
    ],

    "has_none_files_to_play": [
      "compx",
      ['mf_cor', 'search_complete', 'track_name_not_found', 'mf_cor_has_available_tracks'],
      function(mf_cor, scomt, track_name_not_found, mf_cor_tracks) {
        if (mf_cor && !mf_cor_tracks){
          if (!mf_cor.isSearchAllowed()){
            return true;
          } else if (scomt){
            return true;
          }
        }

        if (track_name_not_found){
          return true;
        }
        return false;
      }
    ],

    "search_complete": [
      "compx",
      ['@one:search_complete:investg']
    ],

    "mf_cor_has_available_tracks": [
      "compx",
      ['@some:has_available_tracks:mf_cor']
    ],

    "playable": [
      "compx",
      ['@one:has_mp3_files:investg', '@one:has_available_tracks:mf_cor'],
      function (has_mp3_files, has_available_tracks) {
        return has_mp3_files || has_available_tracks;
      }
    ],

    "files_search": [
      "compx",
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

    "searching_files": [
      "compx",
      ['@one:has_request:investg']
    ]
  },

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
    var bwlev = pv.getModelById(this, bwlev_id);

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
  },

  simplify: function() {
    return spv.cloneObj({}, this, false, ['track', 'artist']);
  },

  getFullName: function(artist, track, allow_short){
    var n = '';
    if (this.state('artist')){
      if (this.state('track')){
        if (allow_short && this.map_parent && (this.map_parent.info && this.map_parent.info.artist == this.artist)){
          n = this.state('track');
        } else {
          n = this.state('artist') + " - " + this.state('track');
        }
      } else {
        n = this.state('artist');
      }
    } else if (this.state('track')){
      n = this.state('track');
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
      pvUpdate(this, 'marked_as', neighbour);
    }
  },

  unmark: function(mo){
    if (this.neighbour_for == mo){
      this.neighbour_for = null;
      pvUpdate(this, 'marked_as', false);

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


  getRandomTrackName: function() {
    if (this.state('track')) {
      return;
    }
    this.requestState('random_lfm_track_name');
  },

  // prefindFiles: function(){
  // 	this.findFiles();
  // },
  // updateFilesSearchState: function(opts){
  // 	pvUpdate(this, 'files_search', opts);
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
  // 	pvUpdate(this, 'playable', e.value);
  // 	if (e.value){
  // 		this.map_parent.markAsPlayable();
  // 	}
  // },
  'stch-playable': function(target, state) {
    if (state) {
      target.map_parent.markAsPlayable();
    }
  },

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
    if (!this.state('track') && full_allowing){
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
    return (this.state('artist') ? this.state('artist') + ' - ' : '') + this.state('track');
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
      this.submitNowPlaying();
    }
  },

  getCurrentMopla: function(){
    return this.getMFCore().getCurrentMopla();
  }
});

return spv.inh(SongBase, {}, SongBaseModern)
});
