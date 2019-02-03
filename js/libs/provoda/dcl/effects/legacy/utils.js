define(function(require) {
'use strict';

var spv = require('spv');
var splitByDot = spv.splitByDot

var apiDeclr = spv.memorize(function(name) {
  var parts = splitByDot(name);
  return {
    name: parts[0],
    resource_path: parts.length > 1 ? parts.slice(1) : null
  };
});

var counter = 1;

function SendDeclaration(declr) {
  this.id = counter++;
  this.api_name = null;
  this.api_resource_path = null;

  if (typeof declr[0] == 'function') {
    this.api_name = declr[0];
  } else {
    var api_declr = apiDeclr(declr[0]);
    this.api_name = api_declr.name;
    this.api_resource_path = api_declr.resource_path;
  }

  this.api_method_name = null;
  this.manual = null;
  this.ids_declr = null;

  if (typeof declr[1] =='string') {
    this.api_method_name = declr[1];
  } else if (Array.isArray(declr[1])) {
    var manual = declr[1];
    this.manual = {
      dependencies: manual[0],
      fn: manual[1],
      fn_body: manual[1].toString()
    };
  } else if (declr[1].arrayof) {
    this.ids_declr = declr[1];
    this.ids_declr.fn_body = this.ids_declr.req.toString();
  }

  this.getArgs = declr[2];
  this.non_standart_api_opts = declr[3];
}


function stateName(name) {
  return '$__can_load_' + name;
}


function toSchemaFn(mmap) {
  if (!mmap) {
    return null
  }

  if (!mmap) {
    debugger
  }
  if (typeof mmap == 'function') {
    return mmap
  }

  return spv.mmap(mmap);
}


return {
  toSchemaFn: toSchemaFn,
  stateName: stateName,
  SendDeclaration: SendDeclaration,
}
})
