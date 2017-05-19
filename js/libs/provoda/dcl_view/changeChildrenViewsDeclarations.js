define(function () {
'use strict';
return function (self, props) {
  var nesting_name, cur;
  if (props.children_views) {
    for (nesting_name in self.children_views) {
      cur = self.children_views[nesting_name];
      if (typeof cur == 'function') {
        self.children_views[nesting_name] = {
          main: cur
        };
      }
    }
  }
  if (props.children_views_by_mn) {
    for (nesting_name in self.children_views_by_mn) {
      for (var model_name in self.children_views_by_mn[nesting_name]) {
        cur = self.children_views_by_mn[nesting_name][model_name];
        if (typeof cur == 'function') {
          self.children_views_by_mn[nesting_name][model_name] = {
            main: cur
          };
        }
      }
    }
  }
};
});
