define(function(require) {
'use strict';

var wrapDeps = require('./utils/wrapDeps')

var prefixArray = function (arr, prefix) {
  var result = new Array(arr.length);
  for (var i = 0; i < arr.length; i++) {
    result[i] = prefix + arr[i];
  }
  return result;
};

return function ApiDeclr(name, data) {
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
})
