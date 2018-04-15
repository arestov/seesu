define(function(require) {
'use strict';
var BrowseMap = require('../libs/BrowseMap');
var routePathByModels = require('pv/routePathByModels');

var SearchQueryModel = require('./SearchQueryModel');
var FakeSpyglass = require('./FakeSpyglass');

return {
  "+states": {
    "show_search_form": [
      "compx",
      ['@one:needs_search_from:selected__md'],
      function(needs_search_from) {
        return needs_search_from;
      }
    ]
  },
  'nest-search_criteria': [SearchQueryModel],
  'nest-fake_spyglass': [FakeSpyglass],
  showArtcardPage: function(artist_name){
    var md = getArtcard(this, artist_name);
    md.showOnMap();
    return md;
  },

  showArtistAlbum: function(params){
    var artcard = getArtcard(this, params.album_artist);

    var artist_name = params.album_artist || artcard.head.artist_name
    var pl = artcard.getSPI('albums_lfm', true).getSPI(artist_name + ',' + params.album_name, true);

    pl.showOnMap();
    return pl;
  },

  showNowPlaying: function(no_stat) {
    var resolved = this.app.p.resolved;
    var bwlev = resolved.getNesting('bwlev');
    var pl_bwlev = BrowseMap.getConnectedBwlev(bwlev, this.app.p.c_song.map_parent);
    pl_bwlev.followTo(this.app.p.c_song._provoda_id);
    // this.p.c_song.showOnMap();
    if (!no_stat){
      this.app.trackEvent('Navigation', 'now playing');
    }
  },

  showResultsPage: function(query){
    // если нет элемента или элемент не отображается
    // если элемента нет или в элемент детализировали
    var invstg = routePathByModels(this.app.start_page, 'search/', false, true, {reuse: true});
    invstg.changeQuery(query);
    invstg.showOnMap();
    return invstg;
  },

  showTag: function(tag){
    var md = routePathByModels(this.app.start_page, 'tags/' + tag );

    md.showOnMap();
    return md;
  },

  showTopTracks: function(artist, track_name) {
    var artcard = getArtcard(this, artist);
    var target = artcard.getTopTacks(track_name);
    target.showOnMap();
  },
};


function getArtcard(target, artist_name) {
  return routePathByModels(target.app.start_page, 'catalog/' + encodeURIComponent(artist_name), false, true);
}

});
