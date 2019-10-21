define(function(require) {
'use strict'

var push = Array.prototype.push;
var spv = require('spv');
var getShortStateName = require('../../utils/getShortStateName');
var asMultiPath = require('../../utils/NestingSourceDr/asMultiPath');

var NestWatch = require('../../nest-watch/NestWatch');

var NestSelector = require('./NestSelector');
var getParsedPath = require('../../initDeclaredNestings').getParsedPath;
var handleChdDeepState = NestSelector.handleChdDeepState;
var handleChdCount = NestSelector.handleChdCount;
var handleAdding = NestSelector.handleAdding;
var handleRemoving = NestSelector.handleRemoving;
var rerun = NestSelector.rerun;

var startsWith = spv.startsWith;
var where = require('./where');

var types = ['sort', 'map', 'cond'];

var getMap = function(map_chunk) {
  if (typeof map_chunk != 'string') {
    return map_chunk
  }

  var from_distant_model = map_chunk.charAt(0) === '>'
  var path = from_distant_model ? map_chunk.slice(1) : map_chunk
  return {
    from_distant_model: from_distant_model,
    template: getParsedPath(path)
  }
}

var SelectNestingDeclaration = function(dest_name, data) {
  console.warn('sel does not follow source reorder')
  this.map = null;
  if (data.map) {
    this.map = getMap(data.map)
  }

  if (this.map && typeof this.map !== 'object') {
    throw new Error('unsupported map type');
  }
  var multi_path = asMultiPath(data.from);

  this.dest_name = dest_name;
  this.deps_dest = null;
  this.source_state_names = null;
  this.args_schema = null;
  this.selectFn = null;
  this.sortFn = null;

  where(this, data.where);

  if (data.sort) {
    this.sortFn = data.sort[1];
  }

  this.deps = getDeps(data, this.map, this.where_states);

  this.nwbase = new NestWatch(multi_path, this.deps.deep.all.shorts, {
    onchd_count: handleChdCount,
    onchd_state: this.selectFn ? handleChdDeepState : rerun
  }, this.selectFn && handleAdding, this.selectFn && handleRemoving);


};



function combineStates(obj) {
  var list = [];
  var shorts = [];

  for (var i = 0; i < types.length; i++) {
    var cur = types[i];
    if (obj[cur]) {
      push.apply(list, obj[cur].list);
      push.apply(shorts, obj[cur].shorts);
    }
  }

  return {
    list: list.length ? list : null,
    shorts: shorts.length ? shorts : null,
  };
}


function getDeps(data, map, where_states) {
  var base = {all: null};
  var deep = {all: null};

  getConditinal(base, deep, where_states);
  getMap2(base, deep, map);
  getSort(base, deep, data.sort);

  base.all = combineStates(base);
  deep.all = combineStates(deep);

  return {
    base: base,
    deep: deep,
  };
}

function getMap2(base, deep, map) {
  if (!map) {return;}

  deep.map = {
    list: map.states,
    shorts: map.states ? map.states.map(getShortStateName) : null
  };
}

function getSort(base, deep, sort) {
  if (!sort) {return;}

  var state_names = getStates(sort[0]);
  deep.sort = state_names.deep;
  base.sort = state_names.base;
}


function getConditinal(base, deep, list) {
  if (!list) {return;}

  var state_names = getStates(list, true);
  deep.cond = state_names.deep;
  base.cond = state_names.base;
}

function getIndex(list) {
  var index = {};
  for (var i = 0; i < list.length; i++) {
    index[list[i]] = true;
  }
  return index;
}

function getStates(list, with_index) {
  var base = [];
  var deep = [];
  for (var i = 0; i < list.length; i++) {
    var cur = list[i];
    var state_name = isForDeep(cur);
    if (state_name) {
      deep.push(state_name);
    } else {
      base.push(cur);
    }
  }
  return {
    base: getComplect(base, with_index),
    deep: getComplect(deep, with_index)
  };
}

function getComplect(list, with_index) {
  if (!list.length) {return;}
  var shorts = list.map(getShortStateName);
  return {
    list: list,
    shorts: shorts,
    index: with_index
      ? getIndex(shorts)
      : null
  };
}

function isForDeep(name) {
  return startsWith(name, ">") && name.slice(1);
}

return SelectNestingDeclaration;
})
