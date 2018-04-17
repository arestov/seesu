define(function(require) {
'use strict';
var pv = require('../provoda');
var spv = require('spv');
var BrowseMap = require('./BrowseMap');

var AppModelBase = spv.inh(pv.Model, {
  init: function(target) {
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
  }
}, {
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

  routePathByModels: function(pth_string, start_md, need_constr) {
    return BrowseMap.routePathByModels(start_md || this.start_page, pth_string, need_constr);

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
