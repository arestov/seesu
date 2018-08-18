define(function(require) {
'use strict'
var addFrom = require('../../nest-watch/addFrom');
var LocalWatchRoot = require('../../nest-watch/LocalWatchRoot');

var NestCompxRunner = function(md, dcl) {
  this.dcl = dcl;
  this.md = md;
  this._runStates = null;
  // var nwbases = dcl.nwbases;
  // this.items = new Array(nwbases.length);


  var list = this.dcl.conndst_nesting
  var lnwatches = new Array(list.length);

  for (var i = 0; i < list.length; i++) {
    var lnwatch = new LocalWatchRoot(md, list[i].nwatch, {
      runner: this,
      dep: list[i],
      num: i,
      // index: i,
    });

    addFrom(md, lnwatch);
    lnwatches[i] = lnwatch
  }

  this.lnwatches = lnwatches
}

return NestCompxRunner;
})
