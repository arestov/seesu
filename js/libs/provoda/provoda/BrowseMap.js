define(function(require) {
"use strict";
var pv = require('pv');
var spv = require('spv');
var changeBridge = require('../bwlev/changeBridge');
var createLevel = require('../bwlev/createLevel');
var BrowseLevel = require('../bwlev/BrowseLevel');
var showMOnMap = require('../bwlev/showMOnMap');
var showInterest = require('../bwlev/showInterest');
var getBwlevFromParentBwlev = require('../bwlev/getBwlevFromParentBwlev');
var get_constr = require('../structure/get_constr');
var prepare = require('../structure/prepare');
var RootLev = require('../bwlev/RootLev');
var getSPByPathTemplate = require('../initDeclaredNestings').getSPByPathTemplate;

var routePathByModels = require('../routePathByModels');

var getSPIConstr = routePathByModels.getSPIConstr;
var getSPI= routePathByModels.getSPI;

var cloneObj = spv.cloneObj;

var getDeclrConstr = get_constr.getDeclrConstr;

/*
поправить навигацию
проверить работу истории
поправить остатки wantSong

генерируемые плейлисты

*/

function setStartBwlev(probe_name, self, mainLevelResident) {
  self.mainLevelResident = mainLevelResident;
  self.start_bwlev = createLevel(BrowseLevel, probe_name, -1, false, self.mainLevelResident, self);
}

var BrowseMap = {};

var getCommonBwlevParent = function(bwlev, md) {
  var cur_bwlev = bwlev;
  while (cur_bwlev) {
    var pioneer = cur_bwlev.getNesting('pioneer');

    var cur_md = md;
    while (cur_md) {
      if (pioneer == cur_md) {
        return cur_bwlev;
      }
      cur_md = cur_md.map_parent;
    }

    cur_bwlev = cur_bwlev.map_parent;
  }
};

var getPathToBwlevParent = function(bwlev, md) {
  var pioneer = bwlev.getNesting('pioneer');
  var matched;
  var result = [];
  var cur = md;
  while (cur) {

    if (pioneer == cur) {
      matched = true;
      break;
    }

    result.push(cur);

    cur = cur.map_parent;
  }

  if (!matched) {
    throw new Error('trying to get path for unconnected parts');
  }
  return result.reverse();

};


BrowseMap.getConnectedBwlev = function(bwlev, md) {
  var common_bwlev = getCommonBwlevParent(bwlev, md);
  var path = getPathToBwlevParent(common_bwlev, md);
  var cur = common_bwlev;
  for (var i = 0; i < path.length; i++) {
    cur = getBwlevFromParentBwlev(common_bwlev, md);
  }
  return cur;
};

BrowseMap.getBwlevFromParentBwlev = getBwlevFromParentBwlev;

BrowseMap.showInterest = showInterest;

var interest_part = /(\#(?:\d*\:)?)/gi;
BrowseMap.getUserInterest = function(pth_string, start_md) {
  /*
    /users/me/lfm:neighbours#3:/users/lfm:kolczyk0
  */
  var parts = pth_string.split(interest_part);

  var interest = [];

  while (parts.length) {
    var path = parts.pop();
    var distance_part = parts.pop();
    var distance = distance_part && distance_part.slice(1, distance_part.length - 1 );
    interest.push({
      md: BrowseMap.routePathByModels(start_md, path),
      // path: path,
      distance: distance || 1
    });
  }

  return interest.reverse();
};

BrowseMap.routePathByModels = routePathByModels;

BrowseMap.getDeclrConstr = getDeclrConstr;

BrowseMap.Model = spv.inh(pv.HModel, {
  strict: true,
  naming: function(fn) {
    return function BrowseMapModel(opts, data, params, more, states) {
      fn(this, opts, data, params, more, states);
    };
  },
  init: function (self, opts, data) {
    var init_v2 = data && data.init_version === 2

    if (!self.skip_map_init){
      if (data && !init_v2) {
        if (data['url_part'] && !self.hasComplexStateFn('url_part')){
          self.initState('url_part', data['url_part']);
        }
        if (data['nav_title']){
          self.initState('nav_title', data['nav_title']);
        }
      }
    }

    self.lists_list = null;
    // self.map_level_num = null;

    /*
      результат работы этого кода - это
      2) состояния url_part и nav_title

    */

    opts = opts || {};

    if (self.allow_data_init && !init_v2) {
      self.updateManyStates(data);
    }

    if (self.preview_nesting_source) {
      self.on('child_change-' + self.preview_nesting_source, function(e) {
        pv.updateNesting(this, 'preview_list', e.value);
      });
    }
  }
}, {
  handling_v2_init: true,
  network_data_as_states: true,
  '__required-nav_title': true,
  preview_nesting_source: 'lists_list',
  /*

  */
  getSPIConstr: function(sp_name) {
    return getSPIConstr(this, sp_name);
  },
  getSPI: function(sp_name) {
    return getSPI(this, sp_name);
  },
  preloadNestings: function(array) {
    //var full_list = [];
    for (var i = 0; i < array.length; i++) {
      var md = this.getNesting(array[i]);
      if (md) {
        md.preloadStart();
      }

    }
  },
  getParentMapModel: function() {
    return this.map_parent;
  },
  setFullUrl: function(url) {
    pv.update(this, 'mp_full_url ', url);
  },
  getTitle: function() {
    return this.state('nav_title');
  },
  getURL: function() {
    return '';
  }
});

function hookRoot(rootmd, start_page) {
  var CurBrowseLevel = rootmd.BWLev ? prepare(spv.inh(RootLev, {}, rootmd.BWLev)) : RootLev;
  var bwlev_root = createLevel(CurBrowseLevel, '', -2, null, rootmd, null);

  if (!start_page) {
    return bwlev_root;
  }

  bwlev_root.mainLevelResident = start_page;

  bwlev_root.nextTick(function() {
    setStartBwlev('map_slice', getSPByPathTemplate(bwlev_root.app, bwlev_root, 'navigation'), start_page);
  });

  return bwlev_root;
}

BrowseMap.hookRoot = hookRoot;
BrowseMap.changeBridge = changeBridge;
return BrowseMap;
});
