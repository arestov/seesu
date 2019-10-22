define(function(require) {
'use strict';
var Model = require('pv/Model');
var spv = require('spv');
var pvState = require('pv/state');
var updateNesting = require('pv/updateNesting');
var joinNavURL = require('pv/joinNavURL');
var navi = require('js/libs/navi');
var changeBridge = require('js/libs/provoda/bwlev/changeBridge');
var BrowseLevel = require('js/libs/provoda/bwlev/BrowseLevel');
var getNesting = require('pv/getNesting');
var createLevel = require('js/libs/provoda/bwlev/createLevel');

var BrowseMap = require('js/libs/BrowseMap');
var animateMapChanges = require('js/libs/provoda/dcl/probe/animateMapChanges');

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

    initMapTree(self, self.app.start_page, self.needs_url_history, navi);
    self.nextTick(function() {
      initNav(self, navi, self.app)
    })
  }
}, {
  BWL: BrowseLevel,
  "+states": {
    "used_data_structure": [
      'compx',
      ['^used_data_structure'],
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
  'stch-@current_mp_bwlev': function(self, _, __, c) {
    var bwlev = c && c.items;
    if (!bwlev) {
      return;
    }

    if (self.onCurrentChange) {
      self.onCurrentChange(self, bwlev);
    }

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
});


function initMapTree(target, start_page, needs_url_history, navi) {
  target.useInterface('navi', needs_url_history && navi);
  updateNesting(target, 'navigation', []);
  updateNesting(target, 'start_page', start_page);

  target
    .on('bridge-changed', function(bwlev) {
      animateMapChanges(target, bwlev);
    }, target.app.getContextOptsI());
};

function initNav(map, navi, app) {
  if (map.needs_url_history){
    navi.init(app.inputFn(function(e){
      var url = e.newURL;
      var state_from_history = navi.findHistory(e.newURL);
      var handleQuery = map.handleQuery;
      if (state_from_history){
        changeBridge(state_from_history.data);
        handleQuery(map, state_from_history.data.getNesting('pioneer'));
      } else{
        var interest = BrowseMap.getUserInterest(url.replace(/\ ?\$...$/, ''), app.start_page);
        var bwlev = BrowseMap.showInterest(map, interest);
        BrowseMap.changeBridge(bwlev);
        handleQuery(map, bwlev.getNesting('pioneer'));
      }
    }));
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
