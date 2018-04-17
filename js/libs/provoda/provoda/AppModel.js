define(function(require) {
'use strict';
var pv = require('../provoda');
var spv = require('spv');
var BrowseMap = require('./BrowseMap');

var AppModelBase = spv.inh(pv.Model, {
  init: function(target) {
    target.views_strucs = {};
  }
}, {
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
    var md = this.important_model;
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
});


return AppModelBase;
});
