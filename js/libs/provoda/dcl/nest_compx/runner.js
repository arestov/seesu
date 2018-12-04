define(function(require) {
'use strict'
var addFrom = require('../../nest-watch/addFrom');
var LocalWatchRoot = require('../../nest-watch/LocalWatchRoot');
var prsStCon = require('../../prsStCon');
var handler = require('./handler')
var hstate = handler.hstate

var copyStates = function(md, target, state_name, full_name, runner) {
  md.lwch(target, state_name, function(value) {
    hstate(runner, full_name, value)
  });
}

var bindParent =  prsStCon.bind.parent(copyStates);
var bindRoot = prsStCon.bind.root(copyStates);

var NestCompxRunner = function(md, dcl) {
  this.dcl = dcl;
  this.md = md;
  this._runStates = null;
  // var nwbases = dcl.nwbases;
  // this.items = new Array(nwbases.length);


  // USIND conndst_nesting
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

  // USING conndst_root
  // USING conndst_parent
  bindRoot(this.md, this.dcl, this)
  bindParent(this.md, this.dcl, this)
}

return NestCompxRunner;
})
