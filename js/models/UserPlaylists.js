define(function(require) {
'use strict';
var BrowseMap = require('js/libs/BrowseMap');
var spv = require('spv');
var SongsList = require('./SongsList');
var pv = require('pv');

var ManualPlaylist = spv.inh(SongsList, {}, {});

var UserPlaylists = spv.inh(BrowseMap.Model, {
  init: function(target) {
    target.playlists = [];
    pv.updateNesting(target, 'lists_list', target.playlists);
  },
}, {
  model_name: 'user_playlists',
  sub_pager: {
    item: [
      ManualPlaylist,
      [['search_name']],
      {
        search_name: 'decoded_name'
      }
    ]
  },
  getSPC: function() {
    return ManualPlaylist;
  },
  subPager: function(name) {
    return this.matchTitleStrictly(name);
  },
  savePlaylists: function(){
    var _this = this;
    if (this.save_timeout){clearTimeout(this.save_timeout);}

    this.save_timeout = setTimeout(function(){
      var plsts = [];
      var playlists = _this.playlists;
      for (var i=0; i < playlists.length; i++) {
        plsts.push(playlists[i].simplify());
      }
      _this.saveToStore(plsts);

    },10);

  },
  matchTitleStrictly: function(title) {
    var matched;
    for (var i = 0; i < this.playlists.length; i++) {
      var cur = this.playlists[i];

      if (cur.state('nav_title') == title){
        matched = cur;
        break;
      }
    }
    return matched;
  },
  findAddPlaylist: function(title, mo) {
    var matched = this.matchTitleStrictly(title);
    matched = matched || this.createUserPlaylist(title);
    matched.add(mo);
  },
  createUserPlaylist: function(title){
    var pl_r = this.getSPI(title);

    this.watchOwnPlaylist(pl_r);
    this.playlists.push(pl_r);
    pv.updateNesting(this, 'lists_list', this.playlists);
    this.trigger('playlists-change', this.playlists);
    return pl_r;
  },
  watchOwnPlaylist: function(pl) {
    var _this = this;
    pl.on('child_change-songs-list', function() {
      this.trigger('each-playlist-change');
      _this.savePlaylists();
    }, {
      skip_reg: true
    });
  },
  removePlaylist: function(pl) {
    var length = this.playlists.length;
    this.playlists = spv.arrayExclude(this.playlists, pl);
    if (this.playlists.length != length){
      this.trigger('playlists-change', this.playlists);
      pv.updateNesting(this, 'lists_list', this.playlists);
      this.savePlaylists();
    }

  },
  rebuildPlaylist: function(saved_pl){
    var pl_r = this.getSPI(saved_pl.playlist_title);

    var params = {
        subitems: {
          'songs-list': saved_pl
        }
    }

    pl_r.nextTick(pl_r.insertDataAsSubitems, [
      pl_r,
      pl_r.main_list_name,
      params.subitems[pl_r.main_list_name],
      null,
      params.subitems_source_name && params.subitems_source_name[pl_r.main_list_name]], true
    );


    this.watchOwnPlaylist(pl_r);
    return pl_r;
  },
  setSavedPlaylists: function(spls) {
    var recovered = [];

    if (spls){
      for (var i=0; i < spls.length; i++) {
        recovered[i] = this.rebuildPlaylist(spls[i]);
      }
    }

    this.playlists = recovered;
    this.trigger('playlists-change', this.playlists);
    pv.updateNesting(this, 'lists_list', this.playlists);
  }
});
return UserPlaylists;
});
