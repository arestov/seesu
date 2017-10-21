define(function() {
'use strict';

return function(self) {
  if (self._probe) {
    if (!self.hasOwnProperty('_probe_watch')) {
      self._probe_watch = {};
    }

		for (var probe_name in self._probe) {
			self._probe_watch[probe_name] = self._probe_watch[probe_name] || [];
			self._probe_watch[probe_name].push({
				probe_name: probe_name,
				path: [],
				probe_view: self._probe[probe_name].probe_view,
			});
		}
	}

	for (var name in self.children_views) {
		var cur = self.children_views[name] && self.children_views[name]['main'];
    // TODO: handle not only `main` space

		var _probe_watch = cur && cur.prototype._probe_watch;
		if (!_probe_watch) {
			continue;
		}

    if (!self.hasOwnProperty('_probe_watch')) {
      self._probe_watch = {};
    }

		for (var probe_name in _probe_watch) {
			if (!_probe_watch.hasOwnProperty(probe_name)) {
				continue;
			}

			var list = _probe_watch[probe_name];
			for (var i = 0; i < list.length; i++) {
				var cc = list[i];
				self._probe_watch[probe_name] = self._probe_watch[probe_name] || [];
				self._probe_watch[probe_name].push({
					probe_name: cc.probe_name,
					path: [name].concat(cc.path),
					probe_view: cc.probe_view,
				});
			}
		}
	}
};
});
