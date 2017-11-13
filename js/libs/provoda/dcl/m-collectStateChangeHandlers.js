define(function (require) {
'use strict';
var spv = require('spv');
var NestWatch = require('../nest-watch/NestWatch');

var collectStateChangeHandlers = require('./collectStateChangeHandlers');

var getParsedStateChange = spv.memorize(function getParsedStateChange(string) {
  if (string.indexOf('@') == -1) {
    return false;
  }
  var parts = string.split('@');
  return {
    state: parts[0],
    selector: parts[1].split('.')
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

    self.st_nest_matches.push(
      new NestWatch({selector: nw_draft2.selector}, nw_draft2.state, null, null, index[stname])
    );
  }
};
});
