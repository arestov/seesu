define(function(require) {
'use strict';
var BrowseMap = require('./BrowseMap');
var spv = require('spv');
var pv = require('../provoda');
var cloneObj = spv.cloneObj

var initDeclaredNestings = require('js/libs/provoda/initDeclaredNestings');
var getSPByPathTemplateAndData = initDeclaredNestings.getSPByPathTemplateAndData;

var pvUpdate = pv.update;
var getPath = pv.pathExecutor(function(chunkName, app, data) {
  return data && data[chunkName];
});

var getRelativeRequestsGroups = BrowseMap.Model.prototype.getRelativeRequestsGroups;

var LoadableListBase = spv.inh(BrowseMap.Model, {
  strict: true,
  naming: function(fn) {
    return function LoadableListBase(opts, data, params, more, states) {
      fn(this, opts, data, params, more, states);
    };
  },
  init: function initLoadableListBase(self) {
    self.excess_data_items = null;
    self.loaded_nestings_items = null;
    self.loadable_lists = null;

    //self.loadable_lists[ self.main_list_name ] = [];
    pv.updateNesting(self,  self.main_list_name, []);

    var has_loader = !!(self._nest_reqs && self._nest_reqs[self.main_list_name]);
    if (has_loader){
      pv.update(self, "has_data_loader", true);
    }

    self.bindStaCons();
  }
}, {
  handling_v2_init: true,
  "+states": {
    "$needs_load": [
      "compx",
      ['more_load_available', 'mp_has_focus'],
      function (can_more, focus) {
        return Boolean(focus && can_more);
      }
    ],

    "list_loading": [
      "compx",
      ['main_list_loading', 'preview_loading', 'id_searching'],
      function(main_list_loading, prevw_loading, id_searching) {
        return main_list_loading || prevw_loading || id_searching;
      }
    ],

    "can_load_data": [
      "compx",
      ['has_data_loader', 'loader_disallowed', 'has_no_access'],
      function(has_data_loader, loader_disallowed, has_no_access) {
        return has_data_loader && !loader_disallowed  && !has_no_access;
      }
    ],

    "can_load_more": [
      "compx",
      ['can_load_data', 'all_data_loaded'],
      function(can_load_data, all_data_loaded) {
        return can_load_data && !all_data_loaded;
      }
    ],

    "more_load_available": [
      "compx",
      ['can_load_more', "list_loading"],
      function(can_load_more, list_loading) {
        return can_load_more && !list_loading;
      }
    ]
  },

  hndCheckPreviews: function(e) {
    if (!e.skip_report){
      pv.updateNesting(this, this.preview_mlist_name, e.value);
    }
  },

  'stch-$needs_load': function (target, state) {
    if (state) {
      target.preloadStart();
    }
  },

  bindStaCons: function() {
    if (!this.manual_previews){
      this.on('child_change-' + this.main_list_name, this.hndCheckPreviews);
    }
  },

  handleNetworkSideData: function(target, source_name, ns, data) {
    target.app.handleNetworkSideData(source_name, ns, data, target);
  },

  main_list_name: 'lists_list',
  preview_mlist_name: 'preview_list',
  preview_nesting_source: null,
  getMainListChangeOpts: function() {},
  page_limit: 30,

  getPagingInfo: function(nesting_name, limit) {
    var page_limit = limit || this.page_limit || this.map_parent.page_limit;
    var length = this.getLength(nesting_name);
    var has_pages = Math.floor(length/page_limit);
    var remainder = length % page_limit;
    var next_page = has_pages + 1;

    return {
      current_length: length,
      has_pages: has_pages,
      page_limit: page_limit,
      remainder: remainder,
      next_page: next_page
    };
  },

  preloadStart: function() {
    this.loadStart();
  },

  getLength: function(nesting_name) {
    if (!nesting_name) {
      throw new Error('provide nesting_name');
    }
    return (this.loaded_nestings_items && this.loaded_nestings_items[ nesting_name ]) || 0;
  },

  loadStart: function() {
    if (this.state('more_load_available') && !this.getLength(this.main_list_name)){
      this.requestMoreData();
    }
  },

  requestMoreData: function(nesting_name) {
    nesting_name = nesting_name || this.main_list_name;
    if (this._nest_reqs && this._nest_reqs[nesting_name]) {
      this.requestNesting( this._nest_reqs[nesting_name], nesting_name );
    }
  },

  insertDataAsSubitems: function(target, nesting_name, data_list, opts, source_name) {
    if (!data_list || !data_list.length) {
      return
    }
    var items_list = [];

    var mlc_opts = target.getMainListChangeOpts();

    var splitItemData = target['nest_rq_split-' + nesting_name];

    for (var i = 0; i < data_list.length; i++) {
      var splited_data = splitItemData && splitItemData(data_list[i], target.getNestingSource(nesting_name, target.app));
      var cur_data = splited_data ? splited_data[0] : data_list[i],
        cur_params = splited_data && splited_data[1];

      if (target.isDataItemValid && !target.isDataItemValid(cur_data)) {
        continue;
      }
      var item = target.addItemToDatalist(cur_data, true, cur_params, nesting_name);
      if (source_name && item && item._network_source === null) {
        item._network_source = source_name;
      }
      items_list.push(item);
    }

    target.dataListChange(mlc_opts, items_list, nesting_name);
    return items_list
  },

  getRelativeRequestsGroups: function(space) {
    var main_models = this.getNesting(this.main_list_name);
    if (!main_models || !main_models.length){
      return;
    } else {
      main_models = main_models.slice();
      var more_models = getRelativeRequestsGroups.call(this, space, true);
      if (more_models){
        main_models = main_models.concat(more_models);
      }
      var clean_array = spv.getArrayNoDubs(main_models);
      var groups = [];
      for (var i = 0; i < clean_array.length; i++) {
        var reqs = clean_array[i].getModelImmediateRequests(space);
        if (reqs && reqs.length){
          groups.push(reqs);
        }
      }
      return groups;
    }
  },

  dataListChange: function(mlc_opts, items, nesting_name) {
    nesting_name = nesting_name || this.main_list_name;
    var array = this.loadable_lists && this.loadable_lists[nesting_name];
    if (this.beforeReportChange){

      array = this.beforeReportChange(array, items);
      if (!this.loadable_lists) {
        this.loadable_lists = {};
      }
      this.loadable_lists[nesting_name] = array;
    }
    pv.updateNesting(this, nesting_name, array, mlc_opts);
  },

  compareItemWithObj: function(item, data) {
    if (!this.items_comparing_props) {
      return;
    }
    for (var i = 0; i < this.items_comparing_props.length; i++) {
      var cur = this.items_comparing_props[i];
      var item_value = spv.getTargetField(item, cur[0]);
      var data_value = spv.getTargetField(data, cur[1]);
      if (item_value !== data_value) {
        return false;
      }
    }
    return true;
  },

  compareItemsWithObj: function(array, omo, soft) {
    for (var i = 0; i < array.length; i++) {
      if (this.compareItemWithObj(array[i], omo, soft)){
        return array[i];
      }
    }
  },

  addItemToDatalist: function(obj, silent, item_params, nesting_name) {
    return this.addDataItem(obj, silent, nesting_name, item_params);
  },

  addDataItem: function(obj, skip_changes, nesting_name, item_params) {
    nesting_name = nesting_name || this.main_list_name;
    if (!this.loadable_lists) {
      this.loadable_lists = {};
    }
    if (!this.loadable_lists[ nesting_name ]) {
      this.loadable_lists[ nesting_name ] = [];
    }
    var
      item,
      work_array = this.loadable_lists[ nesting_name ],
      ml_ch_opts = !skip_changes && this.getMainListChangeOpts();

    var excess_items = this.excess_data_items && this.excess_data_items[ nesting_name ];

    if (excess_items && excess_items.length){
      var matched = this.compareItemsWithObj(excess_items, obj);
      /*
      задача этого кода - сделать так, что бы при вставке новых данных всё что лежит в массиве
      "излишек" должно оставаться в конце массива
      */
      //excess_items = this.excess_data_items[ nesting_name ];
      if (matched){
        item = matched;
        /*если совпадает с предполагаемыми объектом, то ставим наш элемент в конец рабочего массива
        и удаляем из массива "излишков", а сами излишки в самый конец */
        work_array = spv.arrayExclude(work_array, excess_items);
        excess_items = spv.arrayExclude(excess_items, matched);
        work_array.push(matched);
        work_array = work_array.concat(excess_items);

      } else {
        /* если объект не совпадает ни с одним элементом, то извлекаем все излишки,
        вставляем объект, вставляем элементы обратно */
        work_array = spv.arrayExclude(work_array, excess_items);
        work_array.push(item = this.makeItemByData(obj, item_params, nesting_name));
        work_array = work_array.concat(excess_items);


      }
      this.excess_data_items[ nesting_name ] = excess_items;
    } else {
      work_array.push(item = this.makeItemByData(obj, item_params, nesting_name));
    }
    this.loadable_lists[ nesting_name ] = work_array;
    if (!skip_changes){
      if (this.beforeReportChange){
        work_array = this.beforeReportChange( work_array, [item] );
        this.loadable_lists[ nesting_name ] = work_array;
      }
      pv.updateNesting(this, nesting_name, work_array, ml_ch_opts );
    }
    return item;
  },

  getMainlist: function() {
    if (!this.loadable_lists) {
      this.loadable_lists = {};
    }
    if (!this.loadable_lists[ this.main_list_name ]) {
      this.loadable_lists[ this.main_list_name ] = [];
    }
    return this.loadable_lists[ this.main_list_name ];
  },

  makeItemByData: function(data, item_params, nesting_name) {
    var mentioned = this._nest_rqc[nesting_name];
    var md = this;
    if (!mentioned) {
      throw new Error('cant make item');
    }

    if (mentioned.type == 'route') {
      var app = this.app;
      var result = getSPByPathTemplateAndData(app, this, mentioned.value, false, data);

      this.useMotivator(result, function () {
        result.updateManyStates(data);
      });

      return result;
    }

    var best_constr = this._all_chi[mentioned.key];


    var network_data_as_states = best_constr.prototype.network_data_as_states;

    if (best_constr.prototype.handling_v2_init) {
      var v2_data = cloneObj({
        by: 'LoadableList',
        init_version: 2,
        states: data,
      }, convertToNestings(item_params))
      return this.initSi(best_constr, v2_data);
    }

    if (network_data_as_states) {
      return this.initSi(best_constr, {network_states: data}, item_params);
    } else {
      return this.initSi(best_constr, data, item_params);
    }
  },

  findMustBePresentDataItem: function(obj, nesting_name) {
    nesting_name = nesting_name || this.main_list_name;
    var list = this.getNesting( nesting_name )
    var matched = list && this.compareItemsWithObj(this.getNesting( nesting_name ), obj);
    return matched || this.injectExcessDataItem(obj, nesting_name);
  },

  injectExcessDataItem: function(obj, nesting_name) {
    nesting_name = nesting_name || this.main_list_name;
    if (this.isDataInjValid && !this.isDataInjValid(obj)){
      return;
    }
    var
      work_array = (this.loadable_lists && this.loadable_lists[ nesting_name ]) || [],
      ml_ch_opts = this.getMainListChangeOpts(),
      item = this.makeItemByData(obj, false, nesting_name);

    if (!this.cant_find_dli_pos){
      if (!this.excess_data_items){
        this.excess_data_items = {};
      }
      if (!this.excess_data_items[ nesting_name ]) {
        this.excess_data_items[ nesting_name ] = [];
      }
      this.excess_data_items[ nesting_name ].push(item);
      work_array.push(item);
    } else {
      work_array.unshift(item);
    }
    if (this.beforeReportChange){
      work_array = this.beforeReportChange(work_array, [item]);

    }
    if (!this.loadable_lists) {
      this.loadable_lists = {};
    }
    this.loadable_lists[ nesting_name ] = work_array;

    pv.updateNesting(this, nesting_name, work_array, ml_ch_opts);
    return item;
  },

  //auth things:

  authInit: function() {
    var _this = this;
    if (this.map_parent){
      this.switchPmd(false);
      this.map_parent.on('state_change-mp_has_focus', function(e) {
        if (!e.value){
          _this.switchPmd(false);
        }
      });
    }
  },

  // :auth things
  requestPage: function() {
    if (!this.state('has_no_access')){
      this.loadStart();
      this.showOnMap();
    } else {
      this.map_parent.zoomOut();
      this.switchPmd();
    }
  }
});

function convertToNestings(params) {
  if (!params || !params.subitems) {
    return null
  }

  var nestings = {}

  for (var nesting_name in params.subitems) {
    if (!params.subitems.hasOwnProperty(nesting_name)) {
        continue
    }

    var cur = params.subitems[nesting_name]

    var result = new Array(cur.length)
    for (var i = 0; i < cur.length; i++) {
      result[i] = {
        states: cur[i]
      }
    }

    nestings[nesting_name] = result
  }

  return {
    nestings: nestings,
    nestings_sources: params.subitems_source_name,
  }
}

var LoadableList = spv.inh(LoadableListBase, {
  init: function(self, opts, data, params) {
    var init_v2 = data && data.init_version === 2

    if (init_v2) {
      return
    }

    if (!params || !params.subitems || !params.subitems[self.main_list_name]) {
      return
    }

    self.nextTick(self.insertDataAsSubitems, [
      self,
      self.main_list_name,
      params.subitems[self.main_list_name],
      null,
      params.subitems_source_name && params.subitems_source_name[self.main_list_name]], true
    );
  }
}, {
  handling_v2_init: true,
})

LoadableList.LoadableListBase = LoadableListBase

return LoadableList
});
