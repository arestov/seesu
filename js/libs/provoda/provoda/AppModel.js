define(function(require) {
'use strict';
var pv = require('../provoda');
var spv = require('spv');
var BrowseMap = require('./BrowseMap');
var joinNavURL = require('../bwlev/joinNavURL');


var AppModelBase = spv.inh(pv.Model, {
  init: function(target) {
    target.app = target

    target.all_queues = target.all_queues || []

    target.binded_models = {};
    // target.navigation = [];
    // target.map = ;
    target.current_mp_md = null;
    target.on('child_change-current_mp_md', function(e) {
      if (e.target){
        this.resortQueue();
      }

    });
    target.views_strucs = {};
    if (!target['chi-start__page']) {
      console.warn('add chi-start__page to AppModelBase')
      return
    }
    target.start_page = target.start_page || target.initChi('start__page') // eslint-disable-line
  }
}, {
  checkActingRequestsPriority: function() {
    console.warn('add checkActingRequestsPriority')
  },
  model_name: 'app_model',
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
          self.trackPage(bwlev.getNesting("pioneer").model_name);
        },

        require: "doc_title"
      }
    }
  },

  "+states": {
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
    ]
  },
  changeNavTree: function(nav_tree) {
    // this.nav_tree = spv.filter(nav_tree, 'resident');
    this.nav_tree = nav_tree;
    if (this.matchNav){
      this.matchNav();
    }

  },

  showStartPage: function(){
    var bwlev = BrowseMap.showInterest(this.map, []);
    BrowseMap.changeBridge(bwlev);
  },

  animationMark: function(models, mark) {
    for (var i = 0; i < models.length; i++) {
      pv.update(models[i].getMD(), 'map_animating', mark);
    }
  },

  resortQueue: function(queue) {
    if (queue){
      queue.removePrioMarks();
    } else {
      for (var i = 0; i < this.all_queues.length; i++) {
        this.all_queues[i].removePrioMarks();
      }
    }
    var md = this.getNesting('current_mp_md');
    if (md){
      if (md.checkRequestsPriority){
        md.checkRequestsPriority();
      } else if (md.setPrio){
        md.setPrio();
      }
    }

    this.checkActingRequestsPriority();
  },

  routePathByModels: function(pth_string, start_md, need_constr, strict, options) {
    return BrowseMap.routePathByModels(start_md || this.start_page, pth_string, need_constr, strict, options);
  },

  knowViewingDataStructure: function(constr_id, used_data_structure) {
    if (!this.used_data_structure) {
      this.used_data_structure = used_data_structure;
      pv.update(this.map, 'used_data_structure', used_data_structure);
      pv.update(this, 'used_data_structure', used_data_structure);
    }
    //console.log(1313)
  }
});


return AppModelBase;
});
