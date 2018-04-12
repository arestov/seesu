define(function(require) {
'use strict';
var View = require('View');
var spv = require('spv');
var view_serv = require('view_serv');
var pv = require('pv');
var pvState = require('pv/state');
var pvUpdate = require('pv/update');
var $ = require('jquery');
var wrapInputCall = require('pv/wrapInputCall')

var BrowseLevNavView = require('./BrowseLevNavView');
var BrowseLevView = require('./BrowseLevView');
var readMapSliceAnimationData = require('./map_slice/readMapSliceAnimationData');
var animateMapSlice = require('./map_slice/animateMapSlice');

var can_animate = view_serv.css.transform && view_serv.css.transition;

var sync_opt = {sync_tpl: true};

var SearchCriteriaView = spv.inh(View, {}, {
  "+states": {
    "startpage_autofocus": [
      "compx",
      ['^startpage_autofocus']
    ]
  },

  tpl_events: {
    preventSubmit: function (e) {
      e.preventDefault();
    }
  },

  'stch-startpage_autofocus': function(target, value) {
    if (!value) {
      return;
    }

    target.nextLocalTick(target.tickCheckFocus);
  },

  tickCheckFocus: function() {
    this.tpl.ancs['search_face'][0].focus();
  }
});


var LevContainer = function(con, scroll_con, material, tpl, context) {
  this.c = con;
  this.scroll_con = scroll_con;
  this.material = material;
  this.tpl = tpl;
  this.context = context;
  this.callbacks = [];
  var _this = this;
  if (can_animate){
    spv.addEvent(this.c[0], can_animate, function() {
      //console.log(e);
      _this.completeAnimation();
    });
  }
};

var viewOnLevelP = function(md, view) {
  var map_level_num = pvState(md, 'map_level_num');
  if (view.nesting_space == 'detailed') {
    ++map_level_num;
  }

  var lev_conj = this.getLevelContainer(map_level_num);
  view.wayp_scan_stop = true;
  return lev_conj.material;
};

LevContainer.prototype = {
  onTransitionEnd: function(cb) {
    this.callbacks.push(cb);
  },
  completeAnimation: function() {
    while (this.callbacks.length){
      var cb = this.callbacks.shift();
      this.context.nextLocalTick(cb);
    }
  }
};


return spv.inh(View, {}, {
  dom_rp: true,
  'sel-coll-map_slice/song': '$spec_det-map_slice',
  'nest_borrow-search_criteria': [
    '^^search_criteria',
    SearchCriteriaView
  ],
  children_views: {
    map_slice: {
      main: BrowseLevView,
      detailed: BrowseLevView
    },
    navigation: BrowseLevNavView,
    // search_criteria: SearchCriteriaView,
  },
  tpl_events: {
    showFullNavHelper: function() {
      pv.update(this, 'nav_helper_full', true);
    },
    showArtcardPage: function (e, node, artist_name) {
      this.RPCLegacy('showArtcardPage', artist_name);
    }
  },
  'collch-current_mp_md': function(name, value) {
    pv.update(this, 'current_mp_md', value._provoda_id);
  },
  'collch-current_mp_bwlev': function(name, value) {
    pv.update(this, 'current_mp_bwlev', value._provoda_id);
  },
  'collch-navigation': {
    place: 'nav.daddy'
  },

  'stch-full_page_need': function(target, state) {
    target.root_view.els.screens.toggleClass('full_page_need', !!state);
  },
  handleSearchForm: function(form_node) {
    var tpl = this.createTemplate(form_node);
    this.tpls.push(tpl);
  },
  buildNavHelper: function() {
    this.tpls.push( pv.$v.createTemplate(
      this, this.root_view.els.nav_helper
    ) );
  },
  buildNowPlayingButton: function() {
    var _this = this;
    var np_button = this.nav.justhead.find('.np-button').detach();
    _this.tpls.push( pv.$v.createTemplate( this, np_button ) );
    this.nav.daddy.append(np_button);
  },
  'stch-nav_helper_is_needed': function(target, state) {
    if (!state) {
      pv.update(target, 'nav_helper_full', false);
    }
  },

  buildNav: function() {
    var justhead = this.root_view.els.navs;
    var daddy = justhead.find('.daddy');

    this.nav = {
      justhead: justhead,
      daddy: daddy
    };
    this.dom_related_props.push('nav');

    this.nav.daddy.empty().removeClass('not-inited');

    return this.nav;
  },
  createDetails: function() {
    this._super();

    this.tpls = [];

    this.lev_containers = {};
    this.max_level_num = -1;
    this.dom_related_props.push('lev_containers');
    this.completely_rendered_once = {};

    this.wrapStartScreen(this.root_view.els.start_screen);
    this.buildNav();
    this.handleSearchForm($('#search', this.d).parent().parent());
    this.buildNowPlayingButton();
    this.buildNavHelper();

    this.on('die', function() {
      this.RPCLegacy('detachUI', this.root_view.root_view_uid);
    });

    this.RPCLegacy('attachUI', this.root_view.root_view_uid);
  },
  getLevByNum: function(num, exclude_start_lev) {
    if (num < -1){
      return false;
    } else if (exclude_start_lev){
      return num == -1 ? false : this.getLevelContainer(num);
    } else {
      return this.getLevelContainer(num);
    }

  },
  getLevelContainer: function(num) {
    if (this.lev_containers[num]){
      return this.lev_containers[num];
    } else {
      /*
      if (!view){
        throw new Error('give me "view"');
      }*/
      if (num == -1){
        throw new Error('start_screen must exist');
      }

      var node = this.root_view.getSample('complex-page');

      var tpl = this.parent_view.pvtemplate(node, false, false, {
        '$lev_num': num
      });

      this.tpls.push(tpl);
      tpl.setStates(this.states);

      var next_lev_con;
      for (var i = num; i <= this.max_level_num; i++) {
        if (this.lev_containers[i]) {
          next_lev_con = this.lev_containers[i];
          break;
        }
      }
      if (next_lev_con) {
        node.insertBefore(next_lev_con.c);
      } else {
        node.appendTo(this.root_view.els.app_map_con);
      }

      var lev_con = new LevContainer
          (node,
          tpl.ancs['scroll_con'],
          tpl.ancs['material'],
          tpl,
          this);
      this.lev_containers[num] = lev_con;

      this.max_level_num = Math.max(this.max_level_num, num);
      return lev_con;
    }
  },
  wrapStartScreen: function(start_screen) {
    var st_scr_scrl_con = start_screen.parent();
    var start_page_wrap = st_scr_scrl_con.parent();

    var tpl = this.parent_view.pvtemplate(start_page_wrap, false, false, {
      '$lev_num': -1
    });


    this.tpls.push(tpl);

    this.lev_containers[-1] = {
      c: start_page_wrap,
      material: start_screen,
      scroll_con: st_scr_scrl_con
    };
  },
  setVMpshow: function(target_mpx, value) {
    pv.mpx.update(target_mpx, 'vmp_show', value, sync_opt);
  },

  'model-mapch': {
    'move-view': function(change) {
      var parent = change.bwlev.getMD().getParentMapModel();
      if (parent){
      //	parent.updateState('mp_has_focus', false);
      }
      this.setVMpshow(this.getStoredMpx(change.bwlev.getMD()), change.value);
    },
    'zoom-out': function(change) {
      this.setVMpshow(this.getStoredMpx(change.bwlev.getMD()), false);
    },
    'destroy': function(change) {
      var md = change.bwlev.getMD();
      this.setVMpshow(this.getStoredMpx(md), false);
    }
  },

  'collch-$spec_det-map_slice': {
    is_wrapper_parent: '^',
    space: 'detailed',
    place: viewOnLevelP
  },

  'collch-$spec_common-map_slice': {
    place: viewOnLevelP
  },

  'sel-coll-map_slice': '$spec_common-map_slice',

  'coll-prio-map_slice': function(array) {

    /*for (var i = 0; i < array.length; i++) {
      if (array[i].mpx.states.mp_has_focus){
        return [[array[i]]];
      }
    }*/
    return array;

  },

  findBMapTarget: function(array) {
    var target_md, i;
    for (i = 0; i < array.length; i++) {
      if (this.getStoredMpx(array[i]).states.mp_has_focus) {
        target_md = array[i];
        break;
      }
    }
    return target_md;
  },

  'collch-map_slice': function(nesname, nesting_data, old_nesting_data){
    var mp_show_states = nesting_data.residents_struc.mp_show_states;
    var transaction = nesting_data.transaction;
    var old_transaction = old_nesting_data && old_nesting_data.transaction;

    var diff = pv.hp.probeDiff(nesting_data.transaction.bwlev, old_nesting_data && old_nesting_data.transaction.bwlev);

    var bwlevs = nesting_data.residents_struc && nesting_data.residents_struc.bwlevs;
    var mds = nesting_data.residents_struc.items;
    var target_md;


    var array = this.getRendOrderedNesting(nesname, bwlevs) || bwlevs;
    var i, cur;

    var animation_data = readMapSliceAnimationData(this, diff);

    for (i = array.length - 1; i >= 0; i--) {
      var cur_md = mds[i];
      cur = array[i];

      var dclr = pv.$v.selecPoineertDeclr(this.dclrs_fpckgs, this.dclrs_selectors,
              nesname, cur_md.model_name, this.nesting_space);

      this.callCollectionChangeDeclaration(dclr, nesname, cur);
    }

    //avoid nextTick method!
    if (this.completely_rendered_once['map_slice']){
      if (transaction){
        animateMapSlice(this, transaction, animation_data);
        if (!transaction.bwlev){
          target_md = this.findBMapTarget(array);

          if (target_md){
            pvUpdate(this, 'current_lev_num', pvState(target_md, 'map_level_num'), sync_opt);
          }

        }
      }
    } else {
      var models = new Array(array.length);
      for (i = 0; i < array.length; i++) {
        models[i] = array[i].md_replacer;
      }
      target_md = this.findBMapTarget(array);
      if (!target_md){
        throw new Error('there is no model with focus!');
      }
      this.markAnimationStart(models, -1);
      for (i = 0; i < array.length; i++) {
        this.setVMpshow(this.getStoredMpx(array[i]), mp_show_states[i]);
      }
      pvUpdate(this, 'current_lev_num', pvState(target_md, 'map_level_num'), sync_opt);
      this.markAnimationEnd(models, -1);
      this.completely_rendered_once['map_slice'] = true;
    }
  },

  'stch-current_mp_bwlev': function(target) {

    //map_level_num
    //md.map_level_num

    /*
    var highlight = md.state('mp-highlight');
    if (highlight && highlight.source_md){
      var source_md = highlight.source_md;

      var md_view = target.findMpxViewInChildren(md.mpx);
      if (md_view){
        var hl_view = md_view.findMpxViewInChildren(source_md.mpx);
        if (hl_view){
          //target.scrollTo(hl_view.getC());
        }
      }
    }*/
    /*

    var ov_md = md.getParentMapModel();
    var ov_highlight = ov_md && ov_md.state('mp-highlight');
    if (ov_highlight && ov_highlight.source_md){
      var source_md = ov_highlight.source_md;
      var mplev_item_view = source_md.getRooConPresentation(target);
      if (mplev_item_view){
        target.scrollTo(mplev_item_view.getC(), {
          node: target.getLevByNum(md.map_level_num - 1).scroll_con
        }, {vp_limit: 0.4, animate: 117});
      }


    }*/

    var bwlev = target.getNesting('current_mp_bwlev');
    var parent_bwlev = bwlev.getParentMapModel();
    var md = target.getNesting('current_mp_md');



    setTimeout(function() {
      if (!target.isAlive()){
        target = null;
        return;
      }

      //

      var parent_md = md.getParentMapModel();
      if (parent_md){
        // var mplev_item_view = target.getStoredMpx(md).getRooConPresentation(target, false, false, true);
        var mplev_item_view = target.getMapSliceChildInParenView(bwlev, md);
        var con = mplev_item_view && mplev_item_view.getC();
        var map_level_num = pvState(bwlev, 'map_level_num') - 1;
        if (con && con.height()){
          target.root_view.scrollTo(mplev_item_view.getC(), {
            node: target.getLevByNum(map_level_num).scroll_con
          }, {vp_limit: 0.4, animate: 117});
        } else {
          target.getLevByNum(map_level_num).scroll_con.scrollTop(0);
        }
      }
    }, 150);

  },
  getMapSliceView: function(bwlev, md) {
    var dclr = pv.$v.selecPoineertDeclr(this.dclrs_fpckgs, this.dclrs_selectors,
      'map_slice', md.model_name, this.nesting_space);
    var target_bwlev = dclr.is_wrapper_parent ? bwlev.map_parent: bwlev;
    return this.findMpxViewInChildren( this.getStoredMpx(target_bwlev), dclr.space, 'map_slice' );
  },

  getMapSliceChildInParenView: function(bwlev, md) {
    var parent_bwlev = bwlev.map_parent;
    // md of parent view could differ from md.map_parent
    var parent_md = bwlev.getParentMapModel().getNesting('pioneer');

    var parent_bwlev_view = this.getMapSliceView(parent_bwlev, parent_md);
    var parent_view = parent_bwlev_view && parent_bwlev_view.findMpxViewInChildren(this.getStoredMpx(parent_md));
    if (!parent_view){
      return;
    }
    var target_in_parent = parent_view.findMpxViewInChildren(this.getStoredMpx(md));
    if (!target_in_parent){
      var view = parent_view.getChildViewsByMpx(this.getStoredMpx(md));
      target_in_parent = view && view[0];
    }
    return target_in_parent;
  },
  markAnimationStart: function(models, changes_number) {
    pv.update(this, 'map_animation_num_started', changes_number, sync_opt);
    for (var i = 0; i < models.length; i++) {

      pv.mpx.update(this.getStoredMpx(models[i].getMD()), 'animation_started', changes_number, sync_opt);
      ////MUST UPDATE VIEW, NOT MODEL!!!!!
    }
  },

  markAnimationEnd: wrapInputCall(function(models, changes_number) {
    if (this.state('map_animation_num_started') == changes_number) {
      pv.update(this, 'map_animation_num_completed', changes_number, sync_opt);
    }


    for (var i = 0; i < models.length; i++) {
      //
      var mpx = this.getStoredMpx(models[i].getMD());

      if (mpx.state('animation_started') == changes_number){
        pv.mpx.update(mpx, 'animation_completed', changes_number, sync_opt);
      }
      ////MUST UPDATE VIEW, NOT MODEL!!!!!
    }
  }),
  "+states": {
    "map_animating": [
      "compx",
      ['map_animation_num_started', 'map_animation_num_completed'],
      function (started_num, completed_num) {
        return typeof started_num == 'number' && started_num != completed_num;
      }
    ]
  },
})
});
