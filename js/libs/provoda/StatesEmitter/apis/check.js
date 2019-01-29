define(function (require) {
'use strict';

var spv = require('spv');
var checkPrefix = require('../checkPrefix');
var pvUpdate = require('../../updateProxy').update;
var indexByDepName = require('./utils/indexByDepName')
var wrapDeps = require('./utils/wrapDeps')

var toRealArray = spv.toRealArray;

var prefixArray = function (arr, prefix) {
  var result = new Array(arr.length);
  for (var i = 0; i < arr.length; i++) {
    result[i] = prefix + arr[i];
  }
  return result;
};

var ApiDeclr = function(name, data) {
  this.name = name;

  this.fn = null;
  this.triggering_deps = null;
  this.triggering_deps_name = null;

  this.needed_apis = null;
  this.needed_apis_dep = null;
  this.needed_apis_dep_name = null;

  this.deps = null;
  this.deps_name = null;

  this.compxes = null;

  if (typeof data == 'function') {
    this.fn = data;
  } else {
    switch (data.length) {
      case 2: {
        this.triggering_deps = wrapDeps(data[0]);
        this.triggering_deps_name = '_triggered_api_' + name;

        this.deps = this.triggering_deps;
        this.deps_name = this.triggering_deps_name;

        this.fn = data[1];
        this.compxes = [
          this.deps_name, this.deps,
        ];
      }
      break;
      case 3:{
        this.triggering_deps = wrapDeps(data[0]);
        this.triggering_deps_name = '_triggered_api_' + name;

        this.needed_apis = data[1];
        this.needed_apis_dep = wrapDeps(prefixArray(this.needed_apis, '_api_used_'));
        this.needed_apis_dep_name = '_apis_need_for_' + name;

        this.deps = wrapDeps([this.triggering_deps_name, this.needed_apis_dep_name]);
        this.deps_name = '_api_all_needs_' + name;

        this.compxes = [
          this.triggering_deps_name, this.triggering_deps,
          this.needed_apis_dep_name, this.needed_apis_dep,
          this.deps_name, this.deps
        ];

        this.fn = data[2];
      }
      break;
    }

  }
};


/*

'effect-': [
  [
    ['апи'], ['инвалидирующие состояния'],
    function (апи..., инвалидирующие состояния...) {

    },
    true || {state_name: 'response.field'}
  ],
  [['необходимые состояние'], ['необходимые эффекты']],
],
*/

var getHandler = function (schema) {
  var parse = typeof schema === 'object' && spv.mmap(schema);
  var is_one_field = typeof schema === 'string';

  if (is_one_field) {
    return function (self, result) {
      pvUpdate(self, schema, result);
    };
  }
  return function (self, result) {
    self.updateManyStates(parse(result));
  };
}

var ApiEffectDeclr = function(name, data) {

  this.name = name;
  this.apis = null;
  this.triggering_states = null;
  this.deps = null;
  this.deps_name = null;
  this.effects_deps = null;
  this.fn = null;
  this.result_schema = null;
  this.is_async = null;
  this.result_handler = null;

  this.compxes = null;

  if (!Array.isArray(data)) {
    this.apis = toRealArray(data.api);
    this.triggering_states = toRealArray(data.trigger);
    this.fn = data.fn;
    this.is_async = data.is_async;
    this.result_handler = data.parse && getHandler(this.is_async, data.parse);

    if (data.require) {
      this.deps = wrapDeps(data.require);
      this.deps_name = '_need_api_effect_' + name;

      this.compxes = [
        this.deps_name, this.deps
      ];
    }

    if (data.effects) {
      this.effects_deps = (data.effects && toRealArray(data.effects)) || null;
    }

    return
  }

  var execution = data[0];
  this.apis = toRealArray(execution[0]);
  this.triggering_states = toRealArray(execution[1]);
  this.fn = execution[2];
  this.result_schema = execution[3];
  this.is_async = !!execution[4];

  this.result_handler = this.result_schema && getHandler(this.is_async, this.result_schema);

  var condition = data[1];
  var deps = condition && condition[0];
  if (deps) {
    this.deps = wrapDeps(deps);
    this.deps_name = '_need_api_effect_' + name;

    this.compxes = [
      this.deps_name, this.deps
    ];
  }
  var effects_deps = condition && condition[1];
  this.effects_deps = (effects_deps && toRealArray(effects_deps)) || null;
};

var checkApi = checkPrefix('api-', ApiDeclr, '__apis');
var checkEffect = checkPrefix('effect-', ApiEffectDeclr, '__api_effects');

var indexByList = function (obj, list_name) {
  if (!obj) {
    return;
  }
  var result = {};

  for (var name in obj) {
    if (!obj.hasOwnProperty(name)) {
      continue;
    }
    var cur = obj[name];
    var list = cur[list_name];
    if (!list) {
      continue;
    }
    for (var i = 0; i < list.length; i++) {
      var state_name = list[i];
      if (!result[state_name]) {
        result[state_name] = [];
      }
      result[state_name].push(cur);
    }
  }

  return result;
};

var usualApis = function (obj) {
  if (!obj) {
    return;
  }

  var result = [];

  for (var name in obj) {
    if (!obj.hasOwnProperty(name)) {
      continue;
    }
    var cur = obj[name];
    if (cur.deps_name) {
      continue;
    }

    result.push(cur);
  }

  return result;
};

var doCopy = function (item, self, props, typed_state_dcls) {
  for (var i = 0; i < item.compxes.length; i+=2) {
    var name = item.compxes[ i ];
    var deps = item.compxes[ i + 1 ];
    typed_state_dcls['compx'] = typed_state_dcls['compx'] || {};
    typed_state_dcls['compx'][name] = deps;
  }
};

var getDepsToInsert = function (source, self, props, typed_state_dcls) {
  if (!source) {return;}

  for (var name in source) {
    if (!source.hasOwnProperty(name)) {continue;}

    var cur = source[name];
    if (!cur.compxes) {continue;}

    doCopy(cur, self, props, typed_state_dcls);
  }
};

function rootApis(obj) {
  if (!obj) {return;}

  var index = {};

  for (var name in obj) {
    var cur = obj[name];
    if (!cur) {continue;}

    for (var i = 0; i < cur.apis.length; i++) {
      if (!spv.startsWith(cur.apis[i], '#')) {continue;}
      index[cur.apis[i].slice(1)] = true;
    }
  }

  var result = Object.keys(index);

  return result.length ? result : null;
}

function handleApis(self, props, typed_state_dcls) {
  var apis = checkApi(self, props);

  if (!apis) {
    return
  }

  getDepsToInsert(apis, self, props, typed_state_dcls);

  self.__apis_$_index = indexByDepName(apis) || self.__apis_$_index;
  self.__apis_$_usual = usualApis(apis) || self.__apis_$_usual;
  return true
}

function buildEffects(self, props, typed_state_dcls) {
  var effects = checkEffect(self, props);
  if (!effects) {
    return
  }

  getDepsToInsert(effects, self, props, typed_state_dcls);

  self.__api_effects_$_index = indexByDepName(effects) || self.__api_effects_$_index;
  self.__api_effects_$_index_by_triggering = indexByList(effects, 'triggering_states') || self.__api_effects_$_index_by_triggering;
  self.__api_effects_$_index_by_apis = indexByList(effects, 'apis') || self.__api_effects_$_index_by_apis;

  self.__api_root_dep_apis = rootApis(effects) || self.__api_root_dep_apis || null;
  return true
}

return function checkApis(self, props, typed_state_dcls) {
  // var states = checkApiState(self, props);
  handleApis(self, props, typed_state_dcls)
  buildEffects(self, props, typed_state_dcls)
};

});
