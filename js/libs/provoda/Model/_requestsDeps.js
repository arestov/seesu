define(function(require){
'use strict';

var hp = require('../helpers');
var LocalWatchRoot = require('../nest-watch/LocalWatchRoot');
var addRootNestWatch = require('../nest-watch/add-remove').addRootNestWatch;
var removeRootNestWatch = require('../nest-watch/add-remove').removeRootNestWatch;
var NestWatch = require('../nest-watch/NestWatch');
var spv = require('spv');

var count = 1;
var ReqDep = function(dep_key, dep, target, supervision) {
	this.id = count++;
	this.supervision = supervision;
	this.dep_key = dep_key;
	this.dep = dep;
	this.target = target;
	this.needy = supervision.needy;
	this.anchor = null;
};

var sourceKey = function(req_dep, suffix) {
	return req_dep.target._provoda_id + '-' + suffix;
};



var noop = function() {};

/*
loading random tracks based on artists list
vs
loading of soundcloud art songslist
*/

var getNestWatch = spv.memorize(function(dep, supervision) {
	var requesting_limit;
	if (supervision.greedy) {
		requesting_limit = Infinity;
	} else {
		for (var i = 0; i < dep.nesting_path.length; i++) {
			var cur = dep.nesting_path[i];
			if (cur.type == 'countless') {
				break;
			}
			cur = null;
		}
		requesting_limit = i;
	}

	if (!requesting_limit) {
		return;
	}

	var complete = dep.related ? function(target, req_dep) {
		for (var i = 0; i < dep.related.length; i++) {
			watchDependence(req_dep.supervision, target, dep.related[i], sourceKey(req_dep, 'end'));
		}
	} : noop;

	var addHandler = function addHandler(target, local_nest_watch, skip) {
		var req_dep = local_nest_watch.data;
		if (local_nest_watch.nwatch.selector.length == skip) {
			complete(target, req_dep);
		} else {
			if (skip > requesting_limit) {
			  return;
			}

			var cur = dep.nesting_path[skip];

			if (cur && cur.type == 'countless' && cur.related) {
				watchDependence(req_dep.supervision, target, cur.related, sourceKey(req_dep, skip));
 			}
		}
	};

	var uncomplete = dep.related ? function(target, req_dep) {
		for (var i = 0; i < dep.related.length; i++) {
			unwatchDependence(req_dep.supervision, target, dep.related[i], sourceKey(req_dep, 'end'));
		}
	} : noop;

	var removeHandler = function removeHandler(target, local_nest_watch, skip) {

		var req_dep = local_nest_watch.data;
		if (local_nest_watch.nwatch.selector.length == skip) {
			uncomplete(target, req_dep);
		} else {
			if (skip > requesting_limit) {
				return;
			}
			var cur = dep.nesting_path[skip];

			if (cur && cur.type == 'countless' && cur.related) {
				unwatchDependence(req_dep.supervision, target, cur.related, sourceKey(req_dep, skip));
 			}
		}
	};

	return new NestWatch({selector: dep.value}, null, null, null, null, addHandler, removeHandler);
}, function(dep) {
	return dep.dep_id;
});

var watchRelated = function(self, dep, req_dep) {
	for (var i = 0; i < dep.related.length; i++) {
		watchDependence(req_dep.supervision, self, dep.related[i],  sourceKey(req_dep, 'related'));
	}
};

var unwatchRelated = function(self, dep, req_dep) {
	for (var i = 0; i < dep.related.length; i++) {
		unwatchDependence(req_dep.supervision, self, dep.related[i],  sourceKey(req_dep, 'related'));
	}
};

var handleNesting = function(dep, req_dep, self) {
	if (dep.value.length) {
		if (!dep.nesting_path || !dep.nesting_path.length) {
			return;
		}
		var ne_wa = getNestWatch(dep, req_dep.supervision);
		if (!ne_wa) {
			// see:
			// !requesting_limit
			return;
		}

		var lo_ne_wa = new LocalWatchRoot(self, ne_wa, req_dep);

		addRootNestWatch(self, lo_ne_wa);
		req_dep.anchor = lo_ne_wa;
	} else {
		watchRelated(self, dep, req_dep);
	}
};

var unhandleNesting = function(dep, req_dep, self) {
	if (dep.value.length) {
		if (!dep.nesting_path || !dep.nesting_path.length) {
			return;
		}

		if (!req_dep.anchor) {
			// see:
			// !ne_wa
			// !requesting_limit
			return;
		}

		removeRootNestWatch(self, req_dep.anchor);
	} else {
		unwatchRelated(self, dep, req_dep);
	}
};

var handleState = function(dep, req_dep, self) {
	if (dep.can_request) {
		var short_name = hp.getShortStateName(dep.value);
		self.requestState(short_name);
	}

	if (dep.related) {
		watchRelated(self, dep, req_dep);
	}
};

var unhandleState = function(dep, req_dep, self) {
	if (dep.related) {
		unwatchRelated(self, dep, req_dep);
	}
};

function requestNesting(md, declr, dep) {
	md.requestNesting(declr, dep.value, dep.limit);
}

var handleCountlessNesting = function(dep, req_dep, self) {
	var declr = self[ 'nest_req-' + dep.value ];
	if (dep.state) {
		req_dep.anchor = function(state) {
			if (state) {
				requestNesting(self, declr, dep);
			}
		};
		self.lwch(self, dep.state, req_dep.anchor);
		watchDependence(req_dep.supervision, self, dep.related, req_dep.id + 'countless_nesting');

	} else {
		requestNesting(self, declr, dep);
	}
};

var unhandleCountlessNesting = function(dep, req_dep, self) {
	if (dep.state) {
		var event_name = hp.getSTEVNameLight(dep.state);

		self.off(event_name, req_dep.anchor, false, self);
		unwatchDependence(req_dep.supervision, self, dep.related, req_dep.id + 'countless_nesting');

	}
};

var handleRoot = function(dep, req_dep, self) {
	watchRelated(self.getStrucRoot(), dep, req_dep);
};

var unhandleRoot = function(dep, req_dep, self) {
	unwatchRelated(self.getStrucRoot(), dep, req_dep);
};

var getParent = function(self, dep) {
	var cur = self;
	for (var i = 0; i < dep.value; i++) {
		cur = cur.getStrucParent();
	}
	return cur;
};

var handleParent = function(dep, req_dep, self) {
	var parent = getParent(self, dep);
	if (!parent) {
		console.log('should be parent');
		return;
	}
	watchRelated(parent, dep, req_dep);
};

var unhandleParent = function(dep, req_dep, self) {
	var parent = getParent(self, dep);
	if (!parent) {
		return;
	}
	unwatchRelated(parent, dep, req_dep);
};

var unhandleDep = function(dep, req_dep, self) {
	switch (dep.type) {
		case 'nesting': {
			unhandleNesting(dep, req_dep, self);
			break;
		}

		case 'state': {
			unhandleState(dep, req_dep, self);
			break;
		}

		case 'precise_nesting': {
			break;
		}

		case 'countless_nesting': {
			unhandleCountlessNesting(dep, req_dep, self);
			break;
		}

		case 'root': {
			unhandleRoot(dep, req_dep, self);
			break;
		}

		case 'parent': {
			unhandleParent(dep, req_dep, self);
			break;
		}
	}
};

var handleDep = function(dep, req_dep, self) {
	switch (dep.type) {
		case 'nesting': {
			handleNesting(dep, req_dep, self);
			break;
		}

		case 'state': {
			handleState(dep, req_dep, self);
			break;
		}

		case 'precise_nesting': {
			break;
		}

		case 'countless_nesting': {
			handleCountlessNesting(dep, req_dep, self);
			break;
		}

		case 'root': {
			handleRoot(dep, req_dep, self);
			break;
		}

		case 'parent': {
			handleParent(dep, req_dep, self);
			break;
		}
	}
};

var reqKey = function(self, dep) {
	return self._provoda_id + '-' + dep.dep_id;
};

var checkWhy = function(supervision, self, dep) {
	var sub_path = [self._provoda_id, dep.dep_id];
	var tree = supervision.store;
	var was_active = spv.getTargetField(supervision.is_active, sub_path);


	var keys = spv.getTargetField(tree, sub_path);
	var keys_count = spv.countKeys(keys, true);

	var is_active = !!keys_count;

	spv.setTargetField(supervision.is_active, sub_path, is_active);

	if (is_active == was_active) {
		return;
	}

	var req_dep = supervision.reqs[reqKey(self, dep)];
	if (is_active) {
		handleDep(dep, req_dep, self);
	} else {
		unhandleDep(dep, req_dep, self);
	}

};

var changeDependence = function(mark) {
	return function(supervision, self, dep, why) {
		if (dep.type == 'state' && !dep.can_request && !dep.related) {
			return;
		}

		if (!why) {
			throw new Error('should be');
		}

		var dep_key = dep.dep_id;

		var path = [self._provoda_id, dep.dep_id, why];
		var tree = supervision.store;

		var reqs = supervision.reqs;
		var kkkey = reqKey(self, dep);
		if (!reqs[ kkkey ]) {
			reqs[ kkkey ] = new ReqDep(dep_key, dep, self, supervision);
		}

		spv.setTargetField(tree, path, mark);

		checkWhy(supervision, self, dep);

		return;
	};
};

var watchDependence = changeDependence(true);
var unwatchDependence = changeDependence(false);

return {
	addReqDependence: function(supervision, dep) {
		watchDependence(supervision, this, dep, supervision.needy._provoda_id);
	},
	removeReqDependence: function(supervision, dep) {
		unwatchDependence(supervision, this, dep, supervision.needy._provoda_id);
	}
};
});
