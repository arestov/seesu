define(function(require) {
'use strict';
var spv = require('spv');
var $ = require('jquery');
var CoreView = require('./CoreView')
var PvTemplate = require('./PvTemplate');
var appending = require('./View/appending')
var hp = require('./helpers');

var $v = hp.$v;
var way_points_counter = 0;

var stackEmergency = function(fn, eventor, args) {
  return eventor._calls_flow.pushToFlow(fn, eventor, args);
};


var DomView
var props = {}
spv.cloneObj(props, appending)
spv.cloneObj(props, {
  DOMView: function() {
    return DomView
  },
  parts_builder: {},
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
  requirePart: function(part_name) {
    if (!this.isAlive()){
      return $();
    }
    if (this.view_parts && this.view_parts[part_name]){
      return this.view_parts[part_name];
    } else {
      if (!this.view_parts){
        this.view_parts = {};
      }

      var parts_builder = this.parts_builder[part_name];
      if (!parts_builder) {
        throw new Error('cant build part ' + part_name)
      }

      var part = typeof parts_builder == 'string' ? this.root_view.getSample(parts_builder) : parts_builder.call(this);


      this.view_parts[part_name] = part;
      if (!this.view_parts[part_name]){
        throw new Error('"return" me some build result please');
      }

      for (var i = 0; i < this.stch_hs.length; i++) {
        var cur = this.stch_hs[i];
        if (this.states.hasOwnProperty(cur.name) && typeof cur.item != 'function'){
          if (this.checkDepVP(cur.item, part_name)){
            cur.item.fn.call(this, this.state(cur.name));
          }
        }

      }
      return this.view_parts[part_name];
    }
  },
  checkDepVP: function(state_changer, builded_vp_name) {
    var has_all_dependings;
    if (builded_vp_name && state_changer.dep_vp.indexOf(builded_vp_name) == -1){
      return false;
    }
    for (var i = 0; i < state_changer.dep_vp.length; i++) {
      var cur = state_changer.dep_vp[i];
      if (!this.view_parts || !this.view_parts[cur]){
        has_all_dependings = false;
        break;
      } else {
        has_all_dependings = true;
      }
    }
    return has_all_dependings;
  },
  getT: function(){
    return this.c || this.pv_view_node || $(this.getA());
  },
  getC: function(){
    return this.c;
  },
  getA: function(){
    return this._lbr._anchor || (this._lbr._anchor = window.document.createComment(''));

    //document.createTextNode('')
  },
  getWindow: function() {
    return spv.getDefaultView(this.d || this.getC()[0].ownerDocument);
  },
  getCNode: function(c) {
    return (c = this.getC()) && (typeof c.length != 'undefined' ? c[0] : c);
  },
  isAlive: function(dead_doc) {
    if (this.dead){
      return false;
    } else {
      if (this.getC()){
        var c = this.getCNode();
        if (!c || (dead_doc && dead_doc === c.ownerDocument) || !spv.getDefaultView(c.ownerDocument)){
          this.markAsDead();
          return false;
        } else {
          return true;
        }
      } else {
        return true;
      }
    }
  },
  remove: function(con, anchor) {
    if (!con){
      con = this.getC();
    }
    if (con){
      con.remove();
    }
    if (!anchor){
      anchor = this._lbr._anchor;
    }
    if (anchor){
      $(anchor).remove();
    }

  },
  domDie: function() {
    $(this.getC()).remove();
  },
  markDomDead: function() {
    stackEmergency(this.remove, this, [this.getC(), this._lbr._anchor]);

    this.c = null;

    if (this.base_skeleton) {
      for (var i = 0; i < this.base_skeleton.length; i++) {
        $(this.base_skeleton[i].node);
      }
      this.base_skeleton = null;
    }


    this._lbr._anchor = null;
    if (this.tpl) {
      this.tpl.destroy();
      this.tpl = null;
    }

    if (this.tpls){
      for (var i = 0; i < this.tpls.length; i++) {
        this.tpls[i].destroy();
      }
      this.tpls = null;
    }
    this.way_points = null;

    if (this.wp_box){
      this.wp_box = null;
    }
    if (this.pv_view_node){
      this.pv_view_node = null;
    }



    if (this.dom_related_props){
      for (i = 0; i < this.dom_related_props.length; i++) {
        this[this.dom_related_props[i]] = null;
      }
    }
  },
  appendCon: function(){
    if (this.skip_anchor_appending){
      return;
    }
    var con = this.getC();
    var anchor = this._lbr._anchor;
    if (con && anchor && anchor.parentNode){
      $(anchor).after(con);
      //anchor.parentNode.insertBefore(con[0], anchor.nextSibling);
      this._lbr._anchor = null;
      $(anchor).detach();
      this.setVisState('con_appended', true);
    } else if (con && con.parent()[0]){
      this.setVisState('con_appended', true);

    }
  },
  checkExpandableTree: function() {
    var i, cur, cur_config, has_changes = true, append_list = [];
    while (this.base_skeleton && has_changes) {
      has_changes = false;
      for (i = 0; i < this.base_skeleton.length; i++) {
        cur = this.base_skeleton[i];
        cur_config = this.base_tree_list[ cur.chunk_num ];
        if (cur.handled) {
          continue;
        }
        if (!cur.parent || cur.parent.handled) {
          if (!cur_config.needs_expand_state){
            cur.handled = true;
            if (cur_config.sample_name) {
              cur.node = this.root_view.getSample( cur_config.sample_name );
            } else if (cur_config.part_name) {
              cur.node = this.requirePart( cur_config.part_name );
            } else {
              throw new Error('how to get node for this?!');
            }
            has_changes = true;
            append_list.push(cur);

            //sample_name
            //part_name
          }
        }

        //chunk_num
      }
      while (append_list.length) {
        cur = append_list.pop();
        if (cur.parent && cur.parent.node) {
          cur_config = this.base_tree_list[ cur.chunk_num ];
          var target_node = cur_config.selector ? $(cur.parent.node).find(cur_config.selector) : $(cur.parent.node);

          if (!cur_config.prepend) {
            target_node.append(cur.node);
          } else {
            target_node.prepend(cur.node);
          }

          if (cur_config.needs_expand_state && cur_config.parse_as_tplpart) {
            this.parseAppendedTPLPart(cur.node);
          }
        } else if (cur.parent){
          console.log('cant append');
        } else {
          this.c = cur.node;
        }
      }

    }
    if (!this.c && this.base_skeleton[0].node) {
      this.c = this.base_skeleton[0].node;
    }

    //если есть прикреплённый родитель и пришло время прикреплять (если оно должно было прийти)
    //

    /*
    прикрепление родителя
    парсинг детей
    прикрепление детей

    прикрепление детей привязаных к якорю



    */

  },
})
DomView = spv.inh(CoreView, {}, props)
DomView._PvTemplate = PvTemplate;

return DomView

})
