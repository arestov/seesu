define(function(require) {
'use strict';
var spv = require('spv');
var routePathByModels = require('pv/routePathByModels');
var pvUpdate = require('pv/update');
var pvState = require('pv/state');
var changeBridge = require('js/libs/provoda/bwlev/changeBridge');
var showMOnMap = require('js/libs/provoda/bwlev/showMOnMap');
var BrowseLevel = require('js/libs/provoda/bwlev/BrowseLevel');

var BrowseMap = require('js/libs/BrowseMap');
var SearchQueryModel = require('./SearchQueryModel');
var FakeSpyglassCore = require('./FakeSpyglassCore')

var app_serv = require('app_serv');
var app_env = app_serv.app_env;

var showOnMapWrap = function(map, md) {
  var bwlev = showMOnMap(BrowseLevel, map, md);
  changeBridge(bwlev);
}

return spv.inh(FakeSpyglassCore, {
}, {
  needs_url_history: app_env.needs_url_history,
  handleQuery: handleQuery,
  'nest_sel-player': {
    from: '#>player',
  },
  "+states": {
    "now_playing": [
      "compx",
      ['#now_playing'],
    ],
    "now_playing_text": [
      "compx",
      ['#now_playing_text'],
    ],
    "playing": [
      "compx",
      ['#playing'],
    ],
    "viewing_playing": [
      "compx",
      ['#viewing_playing'],
    ],
    "show_search_form": [
      "compx",
      ['@one:needs_search_from:current_mp_md'],
      function(needs_search_from) {
        return needs_search_from;
      }
    ],
    'current_song': [
      'compx',
      ['@one:current_song:player'],
    ]
  },
  'nest-search_criteria': [SearchQueryModel],
  'nest_sel-played_playlists': {
    from: '#>played_playlists',
  },
  closeNavHelper: function(_provoda_id) {
    if (!_provoda_id) {
      pvUpdate(this, 'nav_helper_is_needed', false);
    }

    var old_value = pvState(this, 'nav_helper_is_needed');
    if (!old_value !== _provoda_id) {
      pvUpdate(this, 'nav_helper_is_needed', false);
    }
  },
  suggestNavHelper: function() {
    var mo_bwlev = this.map_parent.showNowPlaying();
    if (this.state('played_playlists$length') > 1) {
      // should work!
      pvUpdate(this, 'nav_helper_is_needed', mo_bwlev._provoda_id);
    }
  },
  showNowPlaying: function(no_stat) {
    this.map_parent.showNowPlaying(no_stat);
  },
  onCurrentChange: function(self, bwlev) {
    self.closeNavHelper(bwlev._provoda_id)
  },
  showResultsPage: function(query){
    // если нет элемента или элемент не отображается
    // если элемента нет или в элемент детализировали
    var invstg = routePathByModels(this.app.start_page, 'search/', false, true, {reuse: true});
    invstg.changeQuery(query);
    showOnMapWrap(this, invstg);
    return invstg;
  },
  attachUI: function(app_view_id) {
    this.app.app_view_id = app_view_id;
    checkPageTracking(this.app);
  },
  detachUI: function(app_view_id) {
    if (this.app.p && this.app.p.c_song){
      this.showNowPlaying(true);
    }
    if (this.app.app_view_id === app_view_id){
      this.app.app_view_id = null;
    }
  },
  checkUserInput: function(opts) {
    if (opts.ext_search_query) {
      this.search(opts.ext_search_query);
    }

    var state_recovered;
    if (this.app.p && this.app.p.c_song){
      this.showNowPlaying(true);
      state_recovered = true;
    }

    if (state_recovered){
      opts.state_recovered = true;
    }
    if (!state_recovered && !opts.ext_search_query){
      this.app.trigger('handle-location');
    }

    pvUpdate(this.app.start_page, 'can_expand', true);

  },
  'stch-current_song': function(target, mo, last_mo) {
    if (!mo || !last_mo) {
      return;
    }

    var resolved = target.app.player.resolved;
    if (!resolved) {
      return;
    }

    var bwlev = resolved.getNesting('bwlev');
    if (!bwlev) {
      console.warn(new Error('play request should have bwlev'))
      return
    }
    var pl_bwlev = BrowseMap.getConnectedBwlev(bwlev, last_mo.map_parent);
    var last_bwlev = pl_bwlev && BrowseMap.getBwlevFromParentBwlev(pl_bwlev, last_mo);
    if (last_bwlev && last_bwlev.state('mp_show')) {
      pl_bwlev.followTo(mo._provoda_id);
    }
  }
});


function checkPageTracking(app) {
  if (app.app_view_id && app.last_page_tracking_data){
    app.trackStat.call(this, app.last_page_tracking_data);
    app.last_page_tracking_data = null;
  }
}

function handleQuery(map, md) {
  if (!md || md.model_name !== 'invstg') {return;}

  var search_criteria = map.getNesting('search_criteria');
  pvUpdate(search_criteria, 'query_face', md.state('query'));
}



});
