define(function(require) {
'use strict'
var declarationConstructor = require('../../structure/constr_mention').declarationConstructor;

var NestDcl = function (name, data) {
  this.nesting_name = name;
  this.subpages_names_list = declarationConstructor(data[0], 'nest-' + name);

  this.ask_for = null;
  this.idle_until = null;
  this.preload_on = null;

  if (!data[1] && !data[2]) {
    return;
  }

  if (data[1] && typeof data[1] == 'object' && !data[2] ) {
    this.ask_for = data[1].ask_for || null;
    this.idle_until = data[1].idle_until || this.ask_for || null;
    this.preload_on = data[1].preload_on || null;
  } else {
    console.warn('fix legacy `nest-` dcl', data[1], data[2]);
    var preload = data[1];
    this.preload_on = (preload === true ? 'mp_has_focus' : preload) || null;
    this.idle_until = data[2] || null;
  }
  /*
  ask_for
  idle_until
  load_on
  */
};

return NestDcl;
})
