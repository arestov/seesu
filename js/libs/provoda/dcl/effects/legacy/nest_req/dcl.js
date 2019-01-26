define(function(require) {
'use strict';

var spv = require('spv');
var utils = require('../utils')

var SendDeclaration = utils.SendDeclaration
var toSchemaFn = utils.toSchemaFn
var stateName = utils.stateName

return function NestReqMap(name, dclt) {
  this.original = this;
  this.nest_name = name;
  this.parse_items = null;
  this.parse_serv = null;
  this.side_data_parsers = null;
  this.send_declr = null;
  this.dependencies = null;
  this.state_dep = null;


  if (!Array.isArray(dclt)) {
    var parse = dclt.parse
    this.parse_items = toSchemaFn(parse[0]);
    this.parse_serv = parse[1] === true
      ? true
      : toSchemaFn(parse[1]);
    this.side_data_parsers = toSchemaFn(parse[2]);
    this.send_declr = new SendDeclaration([dclt.api, dclt.fn]);
    this.dependencies = dclt.fn[0] || null

    if (this.dependencies) {
      this.state_dep = stateName(this.nest_name);
    }

    return
  }

  if (typeof dclt[0][0] != 'function') {
    dclt[0][0] = toSchemaFn(dclt[0][0]);
  }
  if (dclt[0][1] && dclt[0][1] !== true && typeof dclt[0][1] != 'function') {
    dclt[0][1] = toSchemaFn(dclt[0][1]);
  }
  var array = dclt[0][2];
  if (array) {
    for (var i = 0; i < array.length; i++) {
      var spec_cur = array[i];
      if (typeof spec_cur[1] != 'function') {
        spec_cur[1] = spv.mmap(spec_cur[1]);
      }
    }
  }
  this.parse_items = dclt[0][0];
  this.parse_serv = dclt[0][1];
  this.side_data_parsers = dclt[0][2];

  var send_declr = dclt[1];
  if (!Array.isArray(send_declr[0])) {
    this.send_declr = new SendDeclaration(send_declr);
  } else {
    this.dependencies = send_declr[0];
    this.send_declr = new SendDeclaration(send_declr[1]);
  }


  if (this.dependencies) {
    this.state_dep = stateName(this.nest_name);
  }

}
})
