define(function(require) {
'use strict';

var $ = require('jquery');
var spv = require('spv');
var hp = require('./helpers');
var updateProxy = require('./updateProxy');
var prsStCon =  require('./prsStCon');
var StatesEmitter = require('./StatesEmitter');
var onPropsExtend = require('./View/onExtend');
var selectCollectionChange = require('./View/selectCollectionChange');
var nestBorrowInit = require('./dcl_view/nest_borrow/init');
var nestBorrowDestroy = require('./dcl_view/nest_borrow/destroy');
var nestBorrowCheckChange = require('./dcl_view/nest_borrow/check-change');

var initSpyglasses = require('./dcl_view/spyglass/init');
var getRootBwlevView = require('./dcl_view/spyglass/getRootBwlevView');
var getBwlevView = require('./dcl_view/getBwlevView');

// var spyglassDestroy = require('./dcl_view/spyglass/destroy');

var cloneObj = spv.cloneObj;
var $v = hp.$v;
var push = Array.prototype.push;

var getBaseTreeSkeleton = function(array) {
  var result = new Array(array.length);
  for (var i = 0; i < array.length; i++) {
    result[i] = {
      handled: false,
      node: null,
      parent: array[i].parent && result[ array[i].parent.chunk_num ] || null,
      chunk_num: array[i].chunk_num
    };
  }
  return result;
};


var ViewLabour = function() {
  this.has_details = null;
  this._detailed = null;
  this.dettree_incomplete = null;
  this.detltree_depth = null;
  this._states_set_processing = null;
  this._collections_set_processing = null;
  this.innesting_pos_current = null;
  this.innest_prev_view = null;
  this.innest_next_view = null;

  this.demensions_key_start = null;

  this._anchor = null;
  //this.innesting_pos_old = null;

  this.detached = null;

  this.hndTriggerTPLevents = null;
  this.hndPvTypeChange = null;
  this.hndPvTreeChange = null;

  this.marked_as_dead = null;


  this.undetailed_states = {};
  this.undetailed_children_models = {};
};

var stackEmergency = function(fn, eventor, args) {
  return eventor._calls_flow.pushToFlow(fn, eventor, args);
};

var initView = function(target, view_otps, opts){
  target._lbr = new ViewLabour();

  target.used_data_structure = view_otps.used_data_structure || target.used_data_structure;

  target.req_order_field = null;
  target.tpl = null;
  target.c = null;

  target.dead = null;
  target.pv_view_node = null;
  target.dclrs_fpckgs = target.dclrs_fpckgs;
  // target.dclrs_selectors = null;
  target.base_skeleton = null;

  target.nesting_space = view_otps.nesting_space;
  target.nesting_name = view_otps.nesting_name;
  target.by_model_name = Boolean(view_otps.by_model_name);

  if (target.base_tree_list) {
    target.base_skeleton = getBaseTreeSkeleton(target.base_tree_list);
  }

  target.parent_view = null;
  if (view_otps.parent_view){
    target.parent_view = view_otps.parent_view;
  }
  target.root_view = null;
  if (view_otps.root_view){
    target.root_view = view_otps.root_view;
  }

  target._highway = view_otps._highway || target.parent_view._highway || target.root_view._highway;
  target.view_id = target._highway.views_counter++;
  target._calls_flow = target._highway.calls_flow;
  target._local_calls_flow = target._highway.local_calls_flow;

  target.opts = null;
  if (opts){
    target.opts = opts;
  }

  target.children = [];
  target.children_models = {};
  target.view_parts = null;

  if (target.parent_view && !view_otps.location_name){
    throw new Error('give me location name!');
    //используется для идентификации использования одной и тойже view внутри разнородных родительских view или разных пространств внутри одного view
  }
  target.location_name = view_otps.location_name;
  if (!view_otps.mpx){
    throw new Error('give me model!');
  }

  target.mpx = view_otps.mpx;
  target.proxies_space = (target.parent_view && target.parent_view.proxies_space) || view_otps.proxies_space || null;

  target.way_points = null;

  target.dom_related_props = null;
  if (target.dom_rp){
    target.dom_related_props = [];
  }

  cloneObj(target._lbr.undetailed_states, target.mpx.states);
  cloneObj(target._lbr.undetailed_states, target.mpx.vstates);
  cloneObj(target._lbr.undetailed_children_models, target.mpx.nestings);

  prsStCon.connect.parent(target, target);
  prsStCon.connect.root(target, target);

  nestBorrowInit(target);
  initSpyglasses(target)

  if (target.__connectAdapter) {
    target.__connectAdapter.call(null, target)
  }
};


var changeSpyglassUniversal = function (method) {
  return function () {
    var bwlev_view = this.root_view.parent_view;
    var parent_bwlev_view = getBwlevView(this);
    var event_data = Array.prototype.slice.call(arguments, 2);
    var data = {
      context_md: parent_bwlev_view.children_models.pioneer._provoda_id,
      bwlev: parent_bwlev_view.mpx.md._provoda_id,
      target_id: this.mpx._provoda_id,
      probe_name: event_data[0],
      value: event_data[1],
      probe_container_uri: null,
    };

    bwlev_view.RPCLegacy.apply(
      bwlev_view, [method, data]
    );
  }
}

var selectParent = function (view) {
  return view.parent_view
}

var getStrucParent = function(item, _count) {
  var count = _count || 1

  var target = item;
  while (count){
    count--;
    target = selectParent(target);

    if (!target) {
      throw new Error('no parent for step ' + count)
    }
  }
  return target
}

var View = spv.inh(StatesEmitter, {
  naming: function(fn) {
    return function View(view_otps, opts) {
      fn(this, view_otps, opts);
    };
  },
  init: initView,
  onExtend: onPropsExtend
}, {
  ___stateToSync: function() {
    if (this._lbr.undetailed_states) {
      return this._lbr.undetailed_states
    }

    return this.states;
  },
  requestPageById: function(_provoda_id) {
    this.root_view.parent_view.RPCLegacy('requestPage', _provoda_id);
  },
  requestPage: function() {
    var md_id = this.mpx._provoda_id;

    this.root_view.parent_view.RPCLegacy('requestPage', md_id);
  },
  tpl_events: {
    requestPage: function() {
      this.requestPage();
    },
    requestPageById: function(e, node, _provoda_id) {
      this.requestPageById(_provoda_id);
    },
    followTo: function() {
      var md_id = this.mpx._provoda_id;
      var bwlev_view = $v.getBwlevView(this);
      this.root_view.parent_view.RPCLegacy('followTo', bwlev_view.mpx._provoda_id, md_id);
    },
    followURL: function(e, node, url) {
      var bwlev_view = $v.getBwlevView(this);
      this.root_view.parent_view.RPCLegacy('followURL', bwlev_view.mpx._provoda_id, url);
    },
    toggleSpyglass: changeSpyglassUniversal('toggleSpyglass'),
    updateSpyglass: changeSpyglassUniversal('updateSpyglass'),
  },
  onExtend: spv.precall(StatesEmitter.prototype.onExtend, function (md, props, original, params) {
    return onPropsExtend(md, props, original, params);
  }),
  getStrucRoot: function() {
    return this.root_view;
  },
  getStrucParent: function(count) {
    return getStrucParent(this, count)
  },
  getNesting: function(collection_name) {
    return this.children_models[collection_name];
  },
  getWindow: function() {
    return spv.getDefaultView(this.d || this.getC()[0].ownerDocument);
  },
  demensions_cache: {},
  checkDemensionsKeyStart: function() {
    if (!this._lbr.demensions_key_start){
      var arr = [];
      var cur = this;
      while (cur.parent_view) {
        arr.push(cur.location_name);

        cur = cur.parent_view;
      }
      arr.reverse();
      this._lbr.demensions_key_start = arr.join(' ');

      //this._lbr.demensions_key_start = this.location_name + '-' + (this.parent_view && this.parent_view.location_name + '-');
    }
  },
  getBoxDemensionKey: function() {
    var args = new Array(arguments.length); //optimization
    for (var i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];

    }
    this.checkDemensionsKeyStart();
    return this._lbr.demensions_key_start.concat(args.join('-'));

  },
  getBoxDemensionByKey: function(cb, key) {
    if (typeof this.demensions_cache[key] == 'undefined'){
      this.demensions_cache[key] = cb.call(this);
    }
    return this.demensions_cache[key];
  },
  getBoxDemension: function(cb) {
    var args = new Array(arguments.length - 1);
    for (var i = 1; i < arguments.length; i++) {
      args[i-1] = arguments[i];
    }


    var key = this.getBoxDemensionKey.apply(this, args);
    return this.getBoxDemensionByKey(cb, key);
  },
  getReqsOrderField: function() {
    if (!this.req_order_field){
      this.req_order_field = ['mdata', 'v', this.view_id, 'order'];
    }
    return this.req_order_field;
  },
  getStoredMpx: function(md) {
    if (md.stream) {
      return md.mpx;
    } else {
      // getModel
      var space = this.proxies_space || this.root_view.proxies_space;
      return this._highway.views_proxies.getMPX(space, md);
    }
    //

  },
  RPCLegacy: function() {
    this.mpx.RPCLegacy.apply(this.mpx, arguments);
  },
  children_views: {},
  canUseWaypoints: function() {
    return true;
  },
  canUseDeepWaypoints: function() {
    return true;
  },
  getWaypoints: function(result_array) {
    if (!result_array) {
      throw new Error('you must apply result array');
    }
    if (this.canUseWaypoints()) {
      if (this.way_points) {
        push.apply(result_array, this.way_points);
      }

    }
    //return this.canUseWaypoints() ? this.way_points : [];
  },
  getAllWaypoints: function(result_array) {
    if (!result_array) {
      throw new Error('you must apply result array');
    }
    this.getWaypoints(result_array);
    this.getDeepWaypoints(result_array);

  },
  getDeepWaypoints: function(result_array) {
    if (!result_array) {
      throw new Error('you must apply result array');
    }
    if (this.canUseWaypoints() && this.canUseDeepWaypoints()){
      //var views = this.getDeepChildren(exept);
      for (var i = 0; i < this.children.length; i++) {
        var cur = this.children[i];
        cur.getAllWaypoints(result_array);
      }
    }

  },
  connectChildrenModels: hp._groupMotive(function() {
    var udchm = this._lbr.undetailed_children_models;
    this._lbr.undetailed_children_models = null;
    this.setMdChildren(udchm);

  }),
  connectStates: function() {
    var states = this._lbr.undetailed_states;
    this._lbr.undetailed_states = null;
    this._setStates(states);

  },
  useBase: function(node) {
    this.c = node;
    this.createTemplate();
    if (this.bindBase){
      this.bindBase();
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
  createDetails: function() {
    if (this.pv_view_node){
      this.useBase(this.pv_view_node);
    } else {
      if (this.base_skeleton) {
        this.checkExpandableTree();
        if (this.c) {
          this.useBase(this.c);
        }
        if (this.expandBase) {
          this.expandBase();
        }
      } else if (this.createBase){
        this.createBase();
      }
    }

    if (this.c) {
      this.c._provoda_view = this;
    }
  },
  requestDetailesCreating: function() {
    if (!this._lbr.has_details){
      this._lbr.has_details = true;
      this.createDetails();
    }
  },
  requestDetailes: function(){
    this.requestDetailesCreating();
    this._lbr._detailed = true;
    if (!this.manual_states_connect){
      this.connectChildrenModels();
      this.connectStates();
    }
    this.appendCon();
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

  getFreeCV: function(child_name, view_space, opts) {
    var md = this.getMdChild(child_name);
    if (md){
      var view = this.getFreeChildView({
        by_model_name: false,
        nesting_name: child_name,
        nesting_space: view_space
      }, md, opts);
      return view;
    } else {
      throw new Error('there is no ' + child_name + ' child model');
    }
  },
  getAFreeCV: function(child_name, view_space, opts) {
    var view = this.getFreeCV(child_name, view_space, opts);
    if (view){
      var anchor = view.getA();
      if (anchor){
        return anchor;
      } else {
        throw new Error('there is no anchor for view of ' + child_name + ' child model');
      }
    }

  },
  getFreeChildView: function(address_opts, md, opts) {
    var mpx = this.getStoredMpx(md);
    var
      child_name = address_opts.nesting_name,
      view_space = address_opts.nesting_space || 'main',
      location_id = $v.getViewLocationId(this, address_opts.nesting_name, view_space),
      view = mpx.getView(location_id);

    if (view){
      return false;
    } else {

      var ConstrObj;
      var controller_name = address_opts.controller_name;
      if (controller_name) {
        ConstrObj = this.root_view.controllers && this.root_view.controllers[controller_name];
        if (!ConstrObj) {
          throw new Error('controller `' + controller_name +
            '` should be defined in root_view.controllers');
        }
      } else if (address_opts.by_model_name) {

        ConstrObj = this.children_views_by_mn &&
          (this.children_views_by_mn[address_opts.nesting_name][md.model_name] ||
          this.children_views_by_mn[address_opts.nesting_name]['$default']);

      } else {
        ConstrObj = this.children_views[address_opts.nesting_name];
      }


      var Constr;
      if (typeof ConstrObj == 'function' && view_space == 'main'){
        Constr = ConstrObj;
      } else if (ConstrObj) {
        Constr = ConstrObj[view_space];
      }
      if (!Constr && address_opts.sampleController){
        Constr = address_opts.sampleController;
      }
      if (!Constr) {
        throw new Error('there is no View for ' + address_opts.nesting_name);
      }

      var used_data_structure;

      if (this.used_data_structure) {

        var field_path = address_opts.by_model_name ? ['children_by_mn', child_name, md.model_name, view_space] : ['children', child_name, view_space];
        //$default must be used too
        var sub_tree = this.used_data_structure.constr_children && spv.getTargetField(this.used_data_structure.constr_children, field_path);

        if (!sub_tree) {
          sub_tree = this.used_data_structure.tree_children && spv.getTargetField(this.used_data_structure.tree_children, field_path);
        }
        if (!sub_tree) {
          //debugger;
        }

        used_data_structure = sub_tree;
      }

      var view_otps = {
        mpx: mpx,
        parent_view: this,
        root_view: this.root_view,
        location_name: child_name + '-' + view_space,
        nesting_space: view_space,
        nesting_name: child_name,
        by_model_name: address_opts.by_model_name,
        used_data_structure: used_data_structure
      };

      view = new Constr(view_otps, opts);
      if (view.init) {
        view.init(view_otps, opts);
      }

      mpx.addView(view, location_id);
      this.addChildView(view, child_name);
      return view;
    }
  },
  getRelativeRequestsGroups: function(space) {
    var all_views = [];
    var all_requests = [];
    var iterating = [this];
    var i = 0, cur = null;
    while (iterating.length){
      cur = iterating.shift();
      for (i = 0; i < cur.children.length; i++) {
        iterating.push(cur.children[i]);
        all_views.push(cur.children[i]);
      }
    }

    for (i = 0; i < all_views.length; i++) {
      var reqs = all_views[i].getModelImmediateRequests(space);
      if (reqs && reqs.length){
        all_requests.push(reqs);
      }
    }
    return all_requests;
  },
  addChildView: function(view) {
    this.children.push.call(this.children, view);
    //fixme - possible memory leak when child is dead (this.children)
  },
  getChildViewsByMpx: function(mpx, nesting_name) {
    var result = [];
    var views = mpx.getViews();
    var i = 0;
    for (i = 0; i < this.children.length; i++) {
      var cur = this.children[i];
      if (views.indexOf(cur) != -1 && (!nesting_name || (cur.nesting_name == nesting_name))){
        result.push(cur);
      }

    }
    return result;
  },
  removeChildViewsByMd: function(mpx, nesting_name) {
    var views_to_remove = this.getChildViewsByMpx(mpx, nesting_name);
    var i = 0;
    for (i = 0; i < views_to_remove.length; i++) {
      views_to_remove[i].die();
    }
    this.children = spv.arrayExclude(this.children, views_to_remove);

  },
  getDeepChildren: function(exept) {
    var all = [];
    var big_tree = [];
    exept = spv.toRealArray(exept);

    big_tree.push(this);
    //var cursor = this;
    while (big_tree.length){
      var cursor = big_tree.shift();

      for (var i = 0; i < cursor.children.length; i++) {
        var cur = cursor.children[i];
        if (all.indexOf(cur) == -1 && exept.indexOf(cur) == -1){
          big_tree.push(cur);
          all.push(cur);
        }
      }

    }
    return all;
  },

  checkDeadChildren: function() {
    var i = 0, alive = [];
    for (i = 0; i < this.children.length; i++) {
      if (this.children[i].dead){
        //dead.push(this.children[i]);
      } else {
        alive.push(this.children[i]);
      }
    }
    if (alive.length != this.children.length){
      this.children = alive;
    }

  },
  markAsDead: function(skip_md_call) {
    var i = 0;
    if (!this.parent_view && this.proxies_space) {
      this._highway.views_proxies.removeSpaceById(this.proxies_space);
    }
    stackEmergency(this.remove, this, [this.getC(), this._lbr._anchor]);
    this.dead = true; //new DeathMarker();
    this.stopRequests();

    hp.triggerDestroy(this);
    if (!skip_md_call){
      this.mpx.removeDeadViews();
    }

    this.c = null;

    if (this.base_skeleton) {
      for (i = 0; i < this.base_skeleton.length; i++) {
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
      for (i = 0; i < this.tpls.length; i++) {
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
    var children = this.children;
    this.children = [];
    for (i = 0; i < children.length; i++) {
      children[i].markAsDead();
    }
    //debugger?
    this.view_parts = null;



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
  die: function(opts){
    if (this.__disconnectAdapter) {
      this.__disconnectAdapter.call(null, this)
    }
    if (!this._lbr.marked_as_dead){
      $(this.getC()).remove();
      this.markAsDead(opts && opts.skip_md_call);
      nestBorrowDestroy(this);
      this._lbr.marked_as_dead = true;
      // spyglassDestroy(this)
    }
    return this;
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
  requestView: function() {
    this.requestAll();
  },
  requestAll: hp._groupMotive(function(){
    return this.requestDeepDetLevels();
  }),
  __tickDetRequest: function() {
    if (!this.isAlive()){
      return;
    }
    this._lbr.dettree_incomplete = this.requestDetalizationLevel(this._lbr.detltree_depth);
    this._lbr.detltree_depth++;
    if (this._lbr.dettree_incomplete){
      this.nextLocalTick(this.__tickDetRequest);
    }
  },
  requestDeepDetLevels: function(){
    if (!this.current_motivator) {
      // throw new Error('should be current_motivator');
    }
    if (this._lbr._states_set_processing || this._lbr._collections_set_processing){
      return this;
    }
    //iterate TREE
    this._lbr.detltree_depth = 1;
    this._lbr.dettree_incomplete = true;



    this.nextLocalTick(this.__tickDetRequest);

    return this;
  },
  softRequestChildrenDetLev: function(rel_depth) {
    if (this._lbr._states_set_processing || this._lbr._collections_set_processing){
      return this;
    }
    this.requestChildrenDetLev(rel_depth);
  },
  requestChildrenDetLev: function(rel_depth){
    var incomplete = false;
    if (this.children.length && rel_depth === 0){
      return true;
    } else {
      for (var i = 0; i < this.children.length; i++) {
        var cur = this.children[i];
        cur.current_motivator = this.current_motivator;
        var cur_incomplete = cur.requestDetalizationLevel(rel_depth);
        cur.current_motivator = null;
        incomplete = incomplete || cur_incomplete;
      }
      return incomplete;
    }
  },
  requestDetalizationLevel: function(rel_depth){
    if (!this._lbr._detailed){
      this.requestDetailes();
    }
    return this.requestChildrenDetLev(rel_depth - 1);
  },
  getCNode: function(c) {
    return (c = this.getC()) && (typeof c.length != 'undefined' ? c[0] : c);
  },
  isAliveFast: function() {
    return !this.dead;
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
  _setStates: hp._groupMotive(function(states){
    this._lbr._states_set_processing = true;
    //disallow chilren request untill all states will be setted

    this.states = {};
    //var _this = this;


    //var complex_states = [];


    var states_list = [];

    for (var name in states){
      states_list.push(true, name, states[name]);
    }

    this._updateProxy(states_list);
    this._lbr._states_set_processing = null;
    return this;
  }),
  updateTemplatesStates: function(total_ch, sync_tpl) {
    var i = 0;
    //var states = this.states;
    if (this.tpl){
      this.tpl.checkChanges(total_ch, this.states, !sync_tpl, !sync_tpl && this.current_motivator);
    }
    if (this.tpls){
      for (i = 0; i < this.tpls.length; i++) {
        this.tpls[i].checkChanges(total_ch, this.states, !sync_tpl, !sync_tpl && this.current_motivator);
      }
    }
    if (this.__syncStatesChanges) {
      this.__syncStatesChanges.call(null, this, total_ch, this.states);
    }

  },
  requireAllParts: function() {
    for (var a in this.parts_builder){
      this.requirePart(a);
    }
    return this;
  },
  getPart: function(part_name) {
    return this.view_parts && this.view_parts[part_name];
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
  stackReceivedChanges: (function() {
    return function() {
      if (!this.isAlive()){
        return;
      }

      var args = new Array(arguments.length);
      for (var i = 0; i < arguments.length; i++) {
        args[i] = arguments[i];
      }
      args.unshift(this);

      this.nextTick(updateProxy, args);

      if (this.__syncStates) {
        this.nextTick(this.__syncStates, args);
      }
    };
  })(),
  receiveStatesChanges: hp._groupMotive(function(changes_list, opts) {
    if (!this.isAlive()){
      return;
    }
    updateProxy(this, changes_list, opts);
  }),
  overrideStateSilently: function(name, value) {
    updateProxy(this, [true, name, value], {skip_handler: true});
  },
  promiseStateUpdate: function(name, value) {
    updateProxy(this, [true, name, value]);
  },
  setVisState: function(name, value) {
    updateProxy(this, [true, 'vis_' + name, value]);
  },
  checkChildrenModelsRendering: function() {
    var obj = cloneObj(false, this.children_models);
    this.setMdChildren(obj);
  },
  setMdChildren: function(collections) {
    this._lbr._collections_set_processing = true;
    //вью только что создана, присоединяем подчинённые views без деталей (детали создаются позже)
    for (var i in collections) {
      this.collectionChange(this, i, collections[i]);
    }
    this._lbr._collections_set_processing = null;
  },
  getMdChild: function(name) {
    return this.children_models[name];
  },
  pvserv: {
    simple: {

    },
    bymodel: {

    }
  },
  appendFVAncorByVN: function(opts) {
    var view = this.getFreeChildView({
      by_model_name: opts.by_model_name,
      nesting_name: opts.name,
      nesting_space: opts.space
    }, opts.md, opts.opts);

  },
  stackCollectionChange: function() {
    var args = new Array(arguments.length);
    for (var i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }
    args.unshift(this);

    this.nextTick(this.collectionChange, args);
  },
  checkTplTreeChange: function(current_motivator) {
    var old_mt = this.current_motivator;
    this.current_motivator = current_motivator;
    var total_ch = [];

    for (var state_name in this.states) {
      total_ch.push(true, state_name, this.states[total_ch]);
    }

    this.updateTemplatesStates(total_ch);

    for (var nesname in this.children_models) {

      this.pvCollectionChange(nesname, this.children_models[nesname]);
    }
    this.current_motivator = old_mt;
  },
  pvCollectionChange: function(nesname, items, removed) {
    var pv_views_complex_index = spv.getTargetField(this, this.tpl_children_prefix + nesname);
    if (!pv_views_complex_index && this.tpls) {
      for (var i = 0; i < this.tpls.length; i++) {
        pv_views_complex_index = spv.getTargetField(this.tpls[i], ['children_templates', nesname]);
        if (pv_views_complex_index) {
          break;
        }
      }
    }
    var cur;
    if (pv_views_complex_index){
      var space_name;
      var array = spv.toRealArray(items);
      if (removed && removed.length) {
        for (space_name in pv_views_complex_index.usual){
          this.removeViewsByMds(removed, nesname, space_name);
        }
        for (space_name in pv_views_complex_index.by_model_name){
          this.removeViewsByMds(removed, nesname, space_name);
        }
      }


      for (space_name in pv_views_complex_index.usual){
        cur = pv_views_complex_index.usual[space_name];
        if (!cur) {continue;}
        this.checkCollchItemAgainstPvView(nesname, array, space_name, pv_views_complex_index.usual[space_name]);
      }
      for (space_name in pv_views_complex_index.by_model_name){
        cur = pv_views_complex_index.by_model_name[space_name];
        if (!cur) {continue;}
        this.checkCollchItemAgainstPvViewByModelName(nesname, array, space_name, cur);
      }
      /*
      for (var
        i = 0; i < space.length; i++) {
        space[i]
      };*/


      this.requestAll();
    }
  },
  collectionChange: function(target, nesname, items, rold_value, removed) {
    if (!target.isAlive()){
      return;
    }
    if (target._lbr.undetailed_children_models){
      target._lbr.undetailed_children_models[nesname] = items;
      return target;
    }

    var old_value = target.children_models[nesname];
    target.children_models[nesname] = items;

    selectCollectionChange(target, nesname, items, removed, old_value);

    target.checkDeadChildren();
    nestBorrowCheckChange(target, nesname, items, rold_value, removed);
    return target;
  },
  removeViewsByMds: function(array, nesname, space) {
    if (!array){
      return;
    }
    var location_id = $v.getViewLocationId(this, nesname, space || 'main');
    for (var i = 0; i < array.length; i++) {

      var view = this.getStoredMpx(array[i]).getView(location_id);
      if (view){
        view.die();
      } else {
        //throw 'wrong';
      }
    }
  },
  callCollectionChangeDeclaration: function(dclr_fpckg, nesname, array, old_value, removed) {
    debugger
    if (typeof dclr_fpckg == 'function'){
      dclr_fpckg.call(this, nesname, array, old_value, removed);
    } else {

      var real_array = spv.toRealArray(array);
      var array_limit;
      if (dclr_fpckg.limit){
        array_limit = Math.min(dclr_fpckg.limit, real_array.length);
      } else {
        array_limit = real_array.length;
      }
      var min_array = real_array.slice(0, array_limit);
      var declr = dclr_fpckg;
      if (typeof declr.place == 'string'){
        var place = spv.getTargetField(this, declr.place);
        if (!place){
          throw new Error('wrong place declaration: "' + declr.place + '"');
        }
      }
      var opts = declr.opts;
      this.removeViewsByMds(removed, nesname, declr.space);
      if (typeof declr.place == 'function' || !declr.place){
        this.simpleAppendNestingViews(declr, opts, nesname, min_array);
        if (!dclr_fpckg.not_request){
          this.requestAll();
        }
      } else {
        this.appendNestingViews(declr, opts, nesname, min_array, dclr_fpckg.not_request);
      }
    }
  },

  simpleAppendNestingViews: function(declr, opts, nesname, array) {
    for (var bb = 0; bb < array.length; bb++) {
      var cur = array[bb];
      var original_md;
      if (declr.is_wrapper_parent) {
        original_md = cur;
        for (var i = 0; i < declr.is_wrapper_parent; i++) {
          cur = cur.getParentMapModel();
        }
      }


      this.appendFVAncorByVN({
        md: cur,
        original_md: original_md,
        by_model_name: declr.by_model_name,
        name: nesname,
        opts: (typeof opts == 'function' ? opts.call(this, cur, original_md) : opts),
        place: declr.place,
        space: declr.space,
        strict: declr.strict
      });
    }

  },
  appen_ne_vws: {
    appendDirectly: function(fragt) {
      this.place.append(fragt);
    },
    getFreeView: function(cur) {
      return this.view.getFreeChildView({
        by_model_name: this.by_model_name,
        nesting_name: this.nesname,
        nesting_space: this.space
      }, cur, (typeof this.view_opts == 'function' ? this.view_opts.call(this.view, cur) : this.view_opts));
    }
  },
  coll_r_prio_prefix: 'coll-prio-',
  getRendOrderedNesting: function(nesname, array) {
    var getCollPriority = this[this.coll_r_prio_prefix + nesname];
    return getCollPriority && getCollPriority.call(this, array);
  },
});

return View;
});
