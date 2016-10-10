define(function() {
'use strict';
	return {
		toList: function(obj) {
			var result = [];
			for (var p in obj){
				if (obj.hasOwnProperty(p)){
					result.push(obj[p]);
				}
			}
			return result;
		},
		connect: {
			parent: function(md) {
				var list = md.conndst_parent;
				if (!list){
					return;
				}
				for (var i = 0; i < list.length; i++) {
					var cur = list[i];
					var count = cur.ancestors;
					var target = md;
					while (count){
						count--;
						target = target.getStrucParent();
					}
					if (!target){
						throw new Error();
					}
					md.wlch(target, cur.state_name, cur.full_name);
				}

			},
			nesting: function() {},
			root: function(md) {
				var list = md.conndst_root;
				if (!list){
					return;
				}
				for (var i = 0; i < list.length; i++) {
					var cur = list[i];
					var target = md.getStrucRoot();
					if (!target){
						throw new Error();
					}
					md.wlch(target, cur.state_name, cur.full_name);
				}

			}
		}
	};
});
