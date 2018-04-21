define(function(require) {
'use strict';

var isBwConnectedView = require('./isBwConnectedView');

return function(self) {
  var views = self.getViews();

  for (var jj = 0; jj < views.length; jj++) {
    var cur = views[jj];
    if (isBwConnectedView(cur, 'detailed') || isBwConnectedView(cur, 'main')) {
      return cur;
    }
  }
}
});
