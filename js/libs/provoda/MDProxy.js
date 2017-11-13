define(function(require) {
'use strict';

var spv = require('spv');
var hp = require('./helpers');

var MDProxy = function(_provoda_id, states, children_models, md) {
  this._provoda_id = _provoda_id;
  this.views = null;
  this.views_index = null;
  this.states = states;
  this.vstates = null;
  //this.children_models = children_models;
  this.md = md;
  this.nestings = spv.cloneObj({}, children_models);
};

MDProxy.prototype = {
  RPCLegacy: function() {
    this.md.RPCLegacy.apply(this.md, arguments);

  },
  setStates: function() {},
  updateStates: function() {},
  updateNesting: function() {},
  updateManyStates: function(obj) {
    if (!this.vstates) {
      this.vstates = {};
    }
    var changes_list = [];
    for (var name in obj) {
      this.vstates[name] = obj[name];
      changes_list.push(true, name, obj[name]);
    }
    this.sendStatesToViews(changes_list);
    return this;
  },
  updateState: function(name, value, opts){
    //fixme если вьюха ещё не создана у неё не будет этого состояния
    //эклюзивные состояния для вьюх не хранятся и не передаются при создании

    /*if (name.indexOf('-') != -1 && console.warn){
      console.warn('fix prop name: ' + name);
    }*/
    if (!this.vstates) {
      this.vstates = {};
    }
    this.vstates[name] = value;
    this.sendStatesToViews([true, name, value], opts);
    return this;
  },
  state: function(state_name) {
    return this.vstates && this.vstates[state_name];
  },
  removeView: function(view){
    if (!this.views) {
      return;
    }
    var views = [];
    for (var i = 0; i < this.views.length; i++) {
      if (views[i] !== view){
        views.push(views[i]);
      }
    }
    if (views.length != this.views.length){
      this.views = views;
    }
  },
  sendCollectionChange: function(collection_name, array) {
    var old_value = this.nestings[collection_name];
    this.nestings[collection_name] = array;

    if (!this.views) {
      return;
    }
    var removed = hp.getRemovedNestingItems(array, old_value);

    for (var i = 0; i < this.views.length; i++) {
      this.views[i].stackCollectionChange(collection_name, array, old_value, removed);
    }
  },

  stackReceivedStates: function(states_list) {
    if (!this.views) {
      return;
    }
    for (var i = 0; i < this.views.length; i++) {
      this.views[i].stackReceivedChanges(states_list);
    }
  },
  sendStatesToViews: function(states_list, opts) {
    if (!this.views) {
      return;
    }
    for (var i = 0; i < this.views.length; i++) {
      this.views[i].receiveStatesChanges(states_list, opts);
    }
  },
  removeDeadViews: function(hard_deads_check, complex_id){
    var i = 0;
    if (hard_deads_check){
      var target_view = complex_id && this.views_index && this.views_index[complex_id];
      var checklist = complex_id ? (target_view && [target_view]) : this.views;
      if (checklist){
        for (i = 0; i < checklist.length; i++) {
          if (checklist[i].isAlive){
            checklist[i].isAlive();
          }
        }
      }

    }
    if (this.views) {
      var dead = [], alive = [];
      for (i = 0; i < this.views.length; i++) {
        if (this.views[i].dead){
          dead.push(this.views[i]);
        } else {
          alive.push(this.views[i]);
        }
      }

      if (alive.length != this.views.length){
        this.views = alive;
      }
      if (dead.length){
        for (var a in this.views_index){
          var cur = this.views_index[a];
          if (dead.indexOf(cur) != -1) {
            this.views_index[a] = null;
          }
          // = spv.arrayExclude(this.views_index[a], dead);
        }
      }
    }


    return this;
  },
  die: function() {
    this.killViews();
  },
  killViews: function() {
    //this.views[i] can be changed in proccess, so cache it!
    var views = this.views;
    if (!views) {
      return;
    }
    for (var i = 0; i < views.length; i++) {
      views[i].die({skip_md_call: true});
    }
    this.removeDeadViews();
    return this;
  },
  collectViewsGarbadge: function() {
    if (!this.views){
      return;
    }
    for (var i = 0; i < this.views.length; i++) {
      this.views[i].checkDeadChildren();
    }
  },
  getViews: function(complex_id, hard_deads_check) {
    this.removeDeadViews(hard_deads_check);
    if (complex_id){
      return [this.views_index && this.views_index[complex_id]];
    } else {
      return this.views || [];
    }
  },
  getView: function(complex_id){
    this.removeDeadViews(true, complex_id);
    if (!complex_id) {
      throw new Error('complex_id');
    }
    //complex_id = complex_id || 'main';
    return this.views_index && this.views_index[complex_id];// && this.views_index[complex_id][0];
  },
  addView: function(v, complex_id) {
    this.removeDeadViews(true, complex_id);
    if (!this.views) {
      this.views = [];
    }
    this.views.push( v );
    if (!this.views_index) {
      this.views_index = {};
    }
    this.views_index[complex_id] = v;
    //(= this.views_index[complex_id] || []).push(v);
    return this;
  },
  getRooConPresentation: function(app_view, mplev_view, get_ancestor, only_by_ancestor) {
    var views = this.getViews();
    var cur;
    if (!only_by_ancestor){
      for (var i = 0; i < views.length; i++) {
        cur = views[i];
        if (app_view.matchCildrenView( cur, false, 'map_slice' ) ) {
          return cur;
        }


      }
    }
    for (var jj = 0; jj < views.length; jj++) {
      cur = views[jj];
      var ancestor = false;
      if (mplev_view){
        ancestor = cur.getAncestorByRooViCon('all-sufficient-details', only_by_ancestor);
      } else {
        ancestor = cur.getAncestorByRooViCon('main', only_by_ancestor);
      }
      if (ancestor){
        if (get_ancestor){
          return ancestor;
        } else {
          return cur;
        }
      }
    }
  }
};
return MDProxy;
});
