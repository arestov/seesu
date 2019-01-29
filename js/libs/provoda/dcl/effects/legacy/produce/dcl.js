define(function(require) {
'use strict'
var spv = require('spv');
var pvUpdate = require('../../../../updateProxy').update;
var wrapDeps = require('../../../api/utils/wrapDeps')
var toRealArray = spv.toRealArray;


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

return function ApiEffectDeclr(name, data) {

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
})
