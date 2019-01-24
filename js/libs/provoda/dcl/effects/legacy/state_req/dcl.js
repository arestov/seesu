define(function(require) {
'use strict';
var utils = require('../utils')

var SendDeclaration = utils.SendDeclaration
var toSchemaFn = utils.toSchemaFn


return function StateReqMap(req_item, num) {
  this.num = num;
  this.dependencies = null;
  this.send_declr = null;
  this.states_list = null;
  this.parse = null;

  if (!Array.isArray(req_item)) {
    this.parse = toSchemaFn(req_item.parse);
    this.states_list = req_item.states
    this.dependencies = req_item.fn[0]
    this.send_declr = new SendDeclaration([req_item.api, req_item.fn]);
    return
  }

  var relations = req_item[0];
  if (Array.isArray(relations[0])) {
    throw new Error('wrong');
  } else {
  }

  this.states_list = relations;

  this.parse = toSchemaFn(req_item[1]);
  var send_declr = req_item[2];

  if (!Array.isArray(send_declr[0])) {
    this.send_declr = new SendDeclaration(send_declr);
  } else {
    this.dependencies = send_declr[0];
    this.send_declr = new SendDeclaration(send_declr[1]);
  }
}
})
