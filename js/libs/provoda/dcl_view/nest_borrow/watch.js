define(function() {
'use strict';

return function(self) {
  if (self._nest_borrow) {
    if (!self.hasOwnProperty('_nest_borrow_watch')) {
      self._nest_borrow_watch = {};
    }

		for (var nest_name in self._nest_borrow) {
			self._nest_borrow_watch[nest_name] = self._nest_borrow_watch[nest_name] || [];
			self._nest_borrow_watch[nest_name].push({
				nest_name: nest_name,
				path: [],
				view_constr: self._nest_borrow[nest_name].view_constr,
			});
		}
	}

	for (var name in self.children_views) {
		var cur = self.children_views[name] && self.children_views[name]['main'];
    // TODO: handle not only `main` space

		var _nest_borrow_watch = cur && cur.prototype._nest_borrow_watch;
		if (!_nest_borrow_watch) {
			continue;
		}

    if (!self.hasOwnProperty('_nest_borrow_watch')) {
      self._nest_borrow_watch = {};
    }

		for (var nest_name in _nest_borrow_watch) {
			if (!_nest_borrow_watch.hasOwnProperty(nest_name)) {
				continue;
			}

			var list = _nest_borrow_watch[nest_name];
			for (var i = 0; i < list.length; i++) {
				var cc = list[i];
				self._nest_borrow_watch[nest_name] = self._nest_borrow_watch[nest_name] || [];
				self._nest_borrow_watch[nest_name].push({
					nest_name: cc.nest_name,
					path: [name].concat(cc.path),
					view_constr: cc.view_constr,
				});
			}
		}
	}
};
});
