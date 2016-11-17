define(function (require) {
'use strict';
var LocalWatchRoot = require('../../nest-watch/LocalWatchRoot');

var NestConcat = function(md, dcl) {
  this.dcl = dcl;
  this.md = md;
  var nwbases = dcl.nwbases;
  this.items = new Array(nwbases.length);

  this.lnwatches = new Array(nwbases.length);
  for (var i = 0; i < nwbases.length; i++) {
    this.lnwatches[i] = new LocalWatchRoot(md, nwbases[i], {
      cnt: this,
      index: i,
    });
  }
};

return NestConcat;
});
