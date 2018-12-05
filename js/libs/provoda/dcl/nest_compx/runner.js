define(function(require) {
'use strict'
var addFrom = require('../../nest-watch/addFrom');
var LocalWatchRoot = require('../../nest-watch/LocalWatchRoot');
var handler = require('./handler')
var hstate = handler.hstate
var subscribing = require('../../utils/multiPath/subscribing')

var copyStates = function(md, target, state_name, full_name, runner) {
  md.lwch(target, state_name, function(value) {
    hstate(runner, full_name, value)
  });
}

var subscribe = subscribing(copyStates)

var runNestWatches = function(self, md, list) {
  if (!list || !list.length) {
    return
  }

  var lnwatches = new Array(list.length);

  for (var i = 0; i < list.length; i++) {
    var lnwatch = new LocalWatchRoot(md, list[i].nwatch, {
      runner: self,
      dep: list[i],
      num: i,
      // index: i,
    });

    addFrom(md, lnwatch);
    lnwatches[i] = lnwatch
  }

  self.lnwatches = lnwatches
}

var runUsual = function(self, md, list) {
  if (!list || !list.length) {
    return
  }
  for (var i = 0; i < list.length; i++) {
    var cur = list[i]
    subscribe(md, cur, self)
  }
}

var NestCompxRunner = function(md, dcl) {
  this.dcl = dcl;
  this.md = md;
  this._runStates = null;

  var parsed_deps = this.dcl.parsed_deps

  runNestWatches(this, md, parsed_deps.nest_watch)
  runUsual(this, md, parsed_deps.usual)
}

return NestCompxRunner;
})
