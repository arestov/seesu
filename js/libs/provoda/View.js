define(function(require) {
'use strict';
var spv = require('spv');
var CoreView = require('./CoreView')
var PvTemplate = require('./PvTemplate');
var hp = require('./helpers');

var $v = hp.$v;
var way_points_counter = 0;

var DomView = spv.inh(CoreView, {}, {
  addWayPoint: function(point, opts) {
    var obj = {
      node: point,
      canUse: opts && opts.canUse,
      simple_check: opts && opts.simple_check,
      view: this,
      wpid: ++way_points_counter
    };
    if (!opts || (!opts.simple_check && !opts.canUse)){
      //throw new Error('give me check tool!');
    }
    if (!this.way_points) {
      this.way_points = [];
    }
    this.way_points.push(obj);
    return obj;
  },
  hasWaypoint: function(point) {
    if (!this.way_points) {return;}
    var arr = spv.filter(this.way_points, 'node');
    return arr.indexOf(point) != -1;
  },
  removeWaypoint: function(point) {
    if (!this.way_points) {return;}
    var stay = [];
    for (var i = 0; i < this.way_points.length; i++) {
      var cur = this.way_points[i];
      if (cur.node != point){
        stay.push(cur);
      } else {
        cur.removed = true;
      }
    }
    this.way_points = stay;
  },
  parseAppendedTPLPart: function(node) {
    this.tpl.parseAppended(node);
    this.tpl.setStates(this.states);
  },
  handleTemplateRPC: function(method) {
    if (arguments.length === 1) {
      var bwlev_view = $v.getBwlevView(this);
      var bwlev_id = bwlev_view && bwlev_view.mpx._provoda_id;
      this.RPCLegacy(method, bwlev_id);
    } else {
      this.RPCLegacy.apply(this, arguments);
    }
  },
  getTemplate: function(node, callCallbacks, pvTypesChange, pvTreeChange) {
    return this.root_view.pvtemplate(node, callCallbacks, pvTypesChange, false, pvTreeChange);
  },
  createTemplate: function(ext_node) {
    var con = ext_node || this.c;
    if (!con){
      throw new Error('cant create template');
    }

    var tpl = $v.createTemplate(this, con);

    if (!ext_node) {
      this.tpl = tpl;
    }

    tpl.root_node_raw._provoda_view = this;

    return tpl;
  },
  addTemplatedWaypoint: function(wp_wrap) {
    if (!this.hasWaypoint(wp_wrap.node)){
      //может быть баг! fixme!?
      //не учитывается возможность при которой wp изменил свой mark
      //он должен быть удалён и добавлен заново с новыми параметрами
      var type;
      if (wp_wrap.marks['hard-way-point']){
        type = 'hard-way-point';
      } else if (wp_wrap.marks['way-point']){
        type = 'way-point';
      }
      this.addWayPoint(wp_wrap.node, {
        canUse: function() {
          return !!(wp_wrap.marks && wp_wrap.marks[type]);
        },
        simple_check: type == 'hard-way-point'
      });
    }
  },
  updateTemplatedWaypoints: function(add, remove) {
    if (!this.isAlive()) {
      return;
    }
    var i = 0;
    if (remove){
      var nodes_to_remove = spv.filter(remove, 'node');
      for (i = 0; i < nodes_to_remove.length; i++) {
        this.removeWaypoint(nodes_to_remove[i]);
      }
    }
    for (i = 0; i < add.length; i++) {
      this.addTemplatedWaypoint(add[i]);
    }
    if (add.length){
      //console.log(add);
    }
  },
})
DomView._PvTemplate = PvTemplate;

return DomView

})
