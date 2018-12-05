define(function (require) {
'use strict';
var spv = require('spv');
var splitByDot = spv.splitByDot;
var NestWatch = require('../nest-watch/NestWatch');
var toMultiPath = require('../utils/NestingSourceDr/toMultiPath')

var collectStateChangeHandlers = require('./collectStateChangeHandlers');
var standart = require('../nest-watch/standartNWH');

var wrapper = standart(function wrapper(md, items, lnwatch) {
  var callback = lnwatch.nwatch.handler.stch_fn;
  callback(md, null, null, {
    items: items,
    item: null
  });
});

var stateHandler = standart(function baseStateHandler(md, items, lnwatch, args) {
  if (!args.length) {return;}
  var callback = lnwatch.nwatch.handler.stch_fn;
  callback(md, args[1], args[2], {
    items: items,
    item: args[3]
  });
});


var getParsedStateChange = spv.memorize(function getParsedStateChange(string) {
  if (string.indexOf('@') == -1) {
    return false;
  }
  var parts = string.split('@');
  return {
    state: parts[0],
    selector: splitByDot(parts[1])
  };
});

return function(self, props) {
  var index = collectStateChangeHandlers(self, props);
  if (!index) {return;}

  self._has_stchs = true;

  self.st_nest_matches = [];

  for (var stname in index) {
    if (!index[stname]) {continue;}

    var nw_draft2 = getParsedStateChange(stname);
    if (!nw_draft2) { continue; }

    var callback =  index[stname];

    self.st_nest_matches.push(
      new NestWatch(toMultiPath({selector: nw_draft2.selector}), nw_draft2.state, {
        onchd_state: stateHandler,
        onchd_count: wrapper,
        stch_fn: callback,
      })
    );
  }
};
});
