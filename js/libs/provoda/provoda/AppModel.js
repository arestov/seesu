define(function(require) {
'use strict';
var pv = require('../provoda');
var spv = require('spv');
var BrowseMap = require('./BrowseMap');

var AppModelBase = spv.inh(pv.Model, {
  init: function(target) {
    target.app = target

    target.all_queues = target.all_queues || []

    target.views_strucs = {};
  },
  postInit: function(target) {
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
