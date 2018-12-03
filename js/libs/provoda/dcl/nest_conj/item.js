define(function(require) {
'use strict'
var parse = require('../../utils/NestingSourceDr/parse');
var NestWatch = require('../../nest-watch/NestWatch');

var NestCntDeclr = function(name, data) {
  this.dest_name = name;

  this.nwbases = new Array(data.length);

  for (var i = 0; i < data.length; i++) {
    this.nwbases[i] = new NestWatch(parse(data[i]), null, {
      onchd_count: handleChdCount,
    });
  }
};

function handleChdCount(motivator, _, lnwatch, __, items) {
  var cnt = lnwatch.data.cnt;
  cnt.items[lnwatch.data.index] = items;
  runConcat(motivator, cnt);
}

function runConcat(motivator, cnt) {
  var result = concatItems(cnt);

  var md = cnt.md;
  var old_motivator = md.current_motivator;
  md.current_motivator = motivator;
  md.updateNesting(cnt.dcl.dest_name, result);
  md.current_motivator = old_motivator;

  return result;
}


function concatItems(cnt) {
  var items = [];
  var index_added = {};

  for (var i = 0; i < cnt.items.length; i++) {
    if (!cnt.items[i]) {
      continue;
    }
    for (var jj = 0; jj < cnt.items[i].length; jj++) {
      var cur = cnt.items[i][jj];

      var _provoda_id = cur._provoda_id;
      if (index_added[_provoda_id] === true) {continue;}
      index_added[_provoda_id] = true;
      items.push(cur);
    }
  }

  return items;
}

return NestCntDeclr;
})
