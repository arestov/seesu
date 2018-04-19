define(function(require) {
'use strict';
var BrowseMap = require('../libs/BrowseMap');
var routePathByModels = require('pv/routePathByModels');
var changeBridge = require('js/libs/provoda/bwlev/changeBridge');
var showMOnMap = require('js/libs/provoda/bwlev/showMOnMap');
var BrowseLevel = require('js/libs/provoda/bwlev/BrowseLevel');

var FakeSpyglass = require('./FakeSpyglass');

var showOnMapWrap = function(bwroot, md) {
  var bwlev = showMOnMap(BrowseLevel, bwroot.getNesting('fake_spyglass'), md);
  changeBridge(bwlev);
}


return {
  sub_page: {
    'navigation': {
      constr: FakeSpyglass,
      title: [['nav_title_nothing']],
    },
  },
  // sub_pager: {
  //   by_type: {
  //     navigation: [
  //       FakeSpyglass, [['nav_title_nothing']], {
  //         key: 'simple_name'
  //       }
  //     ],
  //   },
  //   type: {
  //     navigation: 'navigation',
  //   },
  // },
  'nest-fake_spyglass': ['navigation'],
  showStartPage: function(){
    var bwlev = BrowseMap.showInterest(this.getNesting('fake_spyglass'), []);
    BrowseMap.changeBridge(bwlev);
  },
  showArtcardPage: function(artist_name){
    var md = getArtcard(this.app, artist_name);
    showOnMapWrap(this, md);
    return md;
  },

  showArtistAlbum: function(params){
    var artcard = getArtcard(this.app, params.album_artist);

    var artist_name = params.album_artist || artcard.head.artist_name
    var pl = artcard.getSPI('albums_lfm', true).getSPI(artist_name + ',' + params.album_name, true);
    showOnMapWrap(this, pl);
    return pl;
  },

  showNowPlaying: function(no_stat) {
    var resolved = this.app.p.resolved;
    var bwlev = resolved.getNesting('bwlev');
    var pl_bwlev = BrowseMap.getConnectedBwlev(bwlev, this.app.p.c_song.map_parent);
    var md_bwlev = pl_bwlev.followTo(this.app.p.c_song._provoda_id);
    // this.p.c_song.showOnMap();
    if (!no_stat){
      this.app.trackEvent('Navigation', 'now playing');
    }

    return md_bwlev;
  },

  showResultsPage: function(query){
    // если нет элемента или элемент не отображается
    // если элемента нет или в элемент детализировали
    var invstg = routePathByModels(this.app.start_page, 'search/', false, true, {reuse: true});
    invstg.changeQuery(query);
    showOnMapWrap(this, invstg);
    return invstg;
  },

  showTag: function(tag){
    var md = routePathByModels(this.app.start_page, 'tags/' + tag );

    showOnMapWrap(this, md);
    return md;
  },

  showTopTracks: function(artist, track_name) {
    var artcard = getArtcard(this.app, artist);
    var target = artcard.getTopTacks(track_name);
    showOnMapWrap(this, target)
  },
};


function getArtcard(app, artist_name) {
  return routePathByModels(app.start_page, 'catalog/' + encodeURIComponent(artist_name), false, true);
}

});
