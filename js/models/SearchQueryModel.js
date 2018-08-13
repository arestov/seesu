define(function(require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
// var morph_helpers = require('js/libs/morph_helpers');
// var BrowseMap = require('../libs/BrowseMap');
var pvUpdate = require('pv/update');

var popular_artists = ["The Beatles", "Radiohead", "Muse", "Lady Gaga", "Eminem", "Coldplay", "Red Hot Chili Peppers", "Arcade Fire", "Metallica", "Katy Perry", "Linkin Park" ];


return spv.inh(pv.Model, {
  init: function(self) {
    pvUpdate(self, 'nice_artist_hint', popular_artists[(Math.random()*10).toFixed(0)]);
  }
}, {
  "+states": {
    "is_start": [
      "compx",
      ['^selected__name'],
      function (selected__name) {
        return selected__name === 'start_page';
      }
    ],

    "show_search_form": [
      "compx",
      ['#show_search_form']
    ]
  },

  'stch-query_value': function(target, value) {
    target.updateState('query_face', value);

    if (!value) {
      target.app.showStartPage();
    } else {
      target.app.showResultsPage(value);
    }
  },

  rpc_legacy: {
    requestSearchHint: function() {
      var artist = this.state('nice_artist_hint');
      pvUpdate(this, 'query_value', artist);
      pvUpdate(this, 'nice_artist_hint', popular_artists[(Math.random()*10).toFixed(0)]);
      this.app.trackEvent('Navigation', 'hint artist');
    },
    changeSearchHint: function() {
      pvUpdate(this, 'nice_artist_hint', popular_artists[(Math.random()*10).toFixed(0)]);
    }
  }
});
});
