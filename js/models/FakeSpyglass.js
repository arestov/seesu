define(function(require) {
'use strict';
var Model = require('pv/Model');
var spv = require('spv');
var routePathByModels = require('pv/routePathByModels');
var pvUpdate = require('pv/update');
var pvState = require('pv/state');
var updateNesting = require('pv/updateNesting');
var joinNavURL = require('pv/joinNavURL');
var navi = require('../libs/navi');
var changeBridge = require('js/libs/provoda/bwlev/changeBridge');
var showMOnMap = require('js/libs/provoda/bwlev/showMOnMap');
var BrowseLevel = require('js/libs/provoda/bwlev/BrowseLevel');
var getNesting = require('pv/getNesting');
var createLevel = require('js/libs/provoda/bwlev/createLevel');

var BrowseMap = require('../libs/BrowseMap');
var animateMapChanges = require('js/libs/provoda/dcl/probe/animateMapChanges');
var SearchQueryModel = require('./SearchQueryModel');

var app_serv = require('app_serv');
var app_env = app_serv.app_env;

var showOnMapWrap = function(map, md) {
  var bwlev = showMOnMap(BrowseLevel, map, md);
  changeBridge(bwlev);
}

return spv.inh(Model, {
  init: function(self) {
    self.binded_models = {};
    // target.navigation = [];
    // target.map = ;
    self.current_mp_md = null;

    var spyglass_name = 'navigation';

    self.mainLevelResident = self.app.start_page;
    self.start_bwlev = createLevel(
      BrowseLevel,
      spyglass_name,
      -1,
      false,
      self.mainLevelResident,
      self
    );

    initMapTree(self, self.app.start_page, app_env.needs_url_history, navi);
    self.nextTick(function() {
      initNav(self, navi, self.app)
    })
  }
}, {
  BWL: BrowseLevel,
  'nest_sel-player': {
    from: '#>player',
  },
  "+states": {
    "used_data_structure": [
      'compx',
      ['^used_data_structure'],
    ],
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
    "full_url": [
      "compx",
      ['@url_part:navigation.pioneer', '@navigation'],
      function (nil, list) {
        return list && joinNavURL(list);
      }
    ],
    "doc_title": [
      "compx",
      ['@nav_title:navigation.pioneer'],
      function (list) {
        if (!list) {
          return 'Seesu';
        }
        var as_first = list[list.length - 1];
        var as_second = list[list.length - 2];
        if (!as_second) {
          return as_first;
        }
        return as_first + ' ← ' + as_second;
      }
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
  "+effects": {
    "produce": {
      "browser-location": {
        api: ["navi", "self"],
        trigger: "full_url",

        fn: function(navi, self, url) {
          if (url == null) {
            return;
          }
          var bwlev = self.getNesting("current_mp_bwlev");
          navi.update(url, bwlev);
          self.app.trackPage(bwlev.getNesting("pioneer").model_name);
        },

        require: "doc_title"
      }
    }
  },
  'nest-search_criteria': [SearchQueryModel],
  'nest_sel-played_playlists': {
    from: '#>played_playlists',
  },
  'stch-@current_mp_bwlev': function(self, _, __, c) {
    var bwlev = c && c.items;
    if (!bwlev) {
      return;
    }

    self.closeNavHelper(bwlev._provoda_id);


    self.app.important_model = getNesting(bwlev, 'pioneer');
    self.app.resortQueue();
  },
  'stch-has_no_access@wanted_bwlev_chain.pioneer': function(target, state, old_state, source) {
    var map = target;

    var list = getNesting(map, 'wanted_bwlev_chain');
    if (!list) {
      return;
    }

    // start_page/level/i===0 can't have `Boolean(has_no_access) === true`. so ok_bwlev = 0
    var ok_bwlev = 0;

    for (var i = 0; i < list.length; i++) {
      var cur_bwlev = list[i];
      var md = getNesting(cur_bwlev, 'pioneer');
      var has_no_access = pvState(md, 'has_no_access');
      if (has_no_access) {
        break;
      }
      ok_bwlev = i;
    }

    var bwlev = list[ok_bwlev];

    map.trigger('bridge-changed', bwlev);
    map.updateNesting('selected__bwlev', bwlev);
    map.updateNesting('selected__md', bwlev.getNesting('pioneer'));
    map.updateState('selected__name', bwlev.model_name);

    askAuth(list[ok_bwlev + 1]);
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

function initMapTree(target, start_page, needs_url_history, navi) {
  target.useInterface('navi', needs_url_history && navi);
  updateNesting(target, 'navigation', []);
  updateNesting(target, 'start_page', start_page);

  target
    .on('bridge-changed', function(bwlev) {
      animateMapChanges(target, bwlev);
    }, target.app.getContextOptsI());
};

function handleQuery(map, md) {
  if (!md || md.model_name !== 'invstg') {return;}

  var search_criteria = map.getNesting('search_criteria');
  pvUpdate(search_criteria, 'query_face', md.state('query'));
}

function initNav(map, navi, app) {
  if (app_env.needs_url_history){
    navi.init(function(e){
      var url = e.newURL;
      var state_from_history = navi.findHistory(e.newURL);
      if (state_from_history){
        changeBridge(state_from_history.data);
        handleQuery(map, state_from_history.data.getNesting('pioneer'));
      } else{
        var interest = BrowseMap.getUserInterest(url.replace(/\ ?\$...$/, ''), app.start_page);
        var bwlev = BrowseMap.showInterest(map, interest);
        BrowseMap.changeBridge(bwlev);
        handleQuery(map, bwlev.getNesting('pioneer'));
      }
    });
    (function() {
      var url = window.location && window.location.hash.replace(/^\#/,'');
      if (url){
        app.on('handle-location', function() {
          navi.hashchangeHandler({
            newURL: url
          }, true);

        });
      } else {
        var bwlev = BrowseMap.showInterest(map, []);
        BrowseMap.changeBridge(bwlev);
      }
    })();
  } else {
    var bwlev = BrowseMap.showInterest(map, []);
    BrowseMap.changeBridge(bwlev);
  }
}

function askAuth(bwlev) {
  if (!bwlev) {return;}

  getNesting(bwlev, 'pioneer').switchPmd();
}


});
