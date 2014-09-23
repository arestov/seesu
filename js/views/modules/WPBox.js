define(['spv', 'jquery'], function(spv, $){
"use strict";
var WPBox = function() {};
spv.Class.extendTo(WPBox, {
	init: function(root_view, getStartModel, select, press, getRelativeWP, removeWP) {
		this.root_view = root_view;

		this.getStartModel = getStartModel;
		this.press = press;
		this.select = select;
		this.getRelativeWP = getRelativeWP;

		this.removeWP = removeWP;

	},
	wp_dirs: {
		all: {
			'Up': true,
			'Down': true,
			'Left': true,
			'Right': true
		},
		horizontal: {
			'Left': true,
			'Right': true
		},
		backward: {
			'Up': true,
			'Left': true
		},
		forward: {
			'Down': true,
			'Right': true
		}
	},
	wayPointsNav: function(nav_type, e) {
		//var _this = this;

		var cur_mp_md = this.getStartModel();
		var roocon_view =  (cur_mp_md && this.root_view.getStoredMpx(cur_mp_md).getRooConPresentation(this.root_view, true)) || this.root_view;
		if (roocon_view){
			

			var cwp = this.getRelativeWP();
			if (nav_type == 'Enter'){

				if (cwp){
					this.press(cwp);
					
				}

			} else if (this.wp_dirs.all[nav_type]){
				var dems_storage = {};
				if (cwp) {
					var passes = false;
					while (cwp && !passes) {

						if (!this.getWPDemsForStorage(cwp, dems_storage)) {
							this.removeWP(cwp);
							var ncwp = this.getRelativeWP();
							if (ncwp != cwp) {
								cwp = ncwp;
							} else {
								cwp = null;
							}
						} else {
							passes = true;
						}
					}
				}

				if (!cwp){
					var cur_view = roocon_view;
					var wayp_pack =[];

					while (!wayp_pack.length && cur_view){
						wayp_pack = this.getWPPack(cur_view, dems_storage);
						cur_view = cur_view.parent_view;
					}
					this.select(wayp_pack[0], e);


				} else {
					var target_dems = cwp && dems_storage[cwp.wpid];
					if (!target_dems){
						throw new Error('there is no demensions!');
					}
					var corridor = this.getAnyPossibleWaypoints(cwp, nav_type, dems_storage);

					var new_wpoint = corridor[0];
					if (new_wpoint ){
						this.select(new_wpoint, e);
					}

				}
			}

		}
	},
	getAnyPossibleWaypoints: function(cwp, nav_type, dems_storage) {
		var corridor = [];
		var angle = 0;

		while (!corridor.length && angle < 90){
			var inner_corr = [];
			var cur_view = cwp.view;
			while (!inner_corr.length && cur_view){
				//getting parent views until find some usable waypoints;
				var wayp_pack = this.getWPPack(cur_view, dems_storage);
				inner_corr = this.getWPCorridor(cwp, nav_type, wayp_pack, dems_storage, Math.min(angle, 89));
				cur_view = cur_view.parent_view;
			}
			corridor = inner_corr;
			angle += 5;

		}


		return corridor;
	},
	isWPAvailable: function(cwp) {
		return this.getWPDemsForStorage(cwp) && cwp;
	},
	getWPEndPoint: function(cur_wayp, nav_type, dems_storage) {
		var cur_dems = dems_storage[cur_wayp.wpid];
		var end_point = {};
		if (this.wp_dirs.horizontal[nav_type]){
			end_point.top = cur_dems.offset.top;
			if (this.wp_dirs.forward[nav_type]){
				end_point.left = cur_dems.offset.left;
			} else {
				end_point.left = cur_dems.offset.left + cur_dems.width;
			}
		} else {
			end_point.left = cur_dems.offset.left;
			if (this.wp_dirs.forward[nav_type]){
				end_point.top = cur_dems.offset.top;
			} else {
				end_point.top = cur_dems.offset.top + cur_dems.height;
			}
		}
		return end_point;
	},
	getWPDemsForStorage: function(cur_wayp, dems_storage) {
		if (!cur_wayp.wpid){
			throw new Error('waypoint must have ID (".wpid")');
		}
		var dems = this.getWPDems(cur_wayp);
		if (dems_storage) {
			dems_storage[cur_wayp.wpid] = dems || {disabled: true};
		}
		
		return dems;
	},
	getWPDems: function(cur_wayp) {

		if (cur_wayp.canUse && !cur_wayp.canUse()){
			return;
		}
		var cur = $(cur_wayp.node);
		var height = cur.height();
		if (!height){
			return;
		}
		var width = cur.width();
		if (!width){
			return;
		}

		var offset = cur.offset();
		if (!offset.top && !offset.left){
			return;
		}

		var dems = {
			height: height,
			width: width,
			offset: offset
		};


		if (cur_wayp.simple_check){
			return this.canUseWaypoint(cur_wayp, dems);
		} else {
			return dems;
		}
	},
	canUseWaypoint: function(cur_wayp, dems) {
		var cur = $(cur_wayp.node);

		if (cur.css('display') == 'none'){
			return;
		}

		var height = dems.height;
		var width = dems.width;

		var pos = cur.position();
		if ((pos.top + height) <= 0){
			return;
		}
		if ((pos.left + width) <= 0){
			return;
		}


		var parents = [];
		var p_cur = cur.parent();
		while (p_cur[0]){
			if (p_cur[0].ownerDocument) {
				
				parents.push(p_cur);
				p_cur = p_cur.parent();
			} else {
				break;
			}
			
		}

		var break_of_disnone = false;
		var ii;
		for (ii = 0; ii < parents.length; ii++) {
			if (parents[ii].css('display') == 'none'){
				break_of_disnone = true;
				break;
			}

		}
		if (break_of_disnone){
			return;
		}

		var stop_parents = [];
		var view_cur = cur_wayp.view;
		while (view_cur){
			if (view_cur.wayp_scan_stop){
				var con = view_cur.getC();
				if (con){
					stop_parents.push(con[0] || con);
				}
			}
			view_cur = view_cur.parent_view;
		}


		var ovh_parent = false;
		for (ii = 0; ii < parents.length; ii++) {
			if (parents[ii].css('overflow') == 'hidden'){
				ovh_parent = parents[ii];
				break;
			}
			if (stop_parents.indexOf(parents[ii][0]) != -1){
				break;
			}
		}
		var offset = cur.offset();

		if (ovh_parent){
			var parent_offset = ovh_parent.offset();
			if ((offset.top + height) < parent_offset.top){
				return;
			}
			if ((offset.left + width) < parent_offset.left){
				return;
			}
			if (offset.top > (parent_offset.top + ovh_parent.height())){
				return;
			}
			if (offset.left > (parent_offset.left + ovh_parent.width())){
				return;
			}

		}

		return {
			height: height,
			width: width,
			offset: offset
		};
	},
	getWPPack: function(view, dems_storage) {
		var all_waypoints = view.getAllWaypoints();
		var wayp_pack = [];

		for (var i = 0; i < all_waypoints.length; i++) {
			var cur_wayp = all_waypoints[i];
			if (!cur_wayp){
				continue;
			}
			var cur_id = cur_wayp.wpid;
			if (!dems_storage[cur_id]){
				var dems = this.getWPDemsForStorage(cur_wayp, dems_storage);
				if (!dems){
					continue;
				}
			}
			/*
			if (!dems){
				cur.data('dems', null);
				cloneObj(cur_wayp, {
					height: null,
					width: null,
					offset: null
				});
				continue;
			} else {
				cloneObj(cur_wayp, dems);
			}

			cur.data('dems', cur_wayp);
			*/
			if (!dems_storage[cur_id].disabled){
				wayp_pack.push(cur_wayp);
			}
		}
		var _this = this;

		wayp_pack.sort(function(a, b) {
			return spv.sortByRules(a,b, [function(el) {
				var cur_dems = dems_storage[el.wpid];
				return _this.getLenthBtwPoints({left:0, top:0}, cur_dems.offset);
			}]);
		});

		return wayp_pack;
	},
	sortWPCorridor: function(target_dems, corridor, nav_type, dems_storage) {
		var start_point = {};
		if (this.wp_dirs.horizontal[nav_type]){
			start_point.top = target_dems.offset.top;
			if (this.wp_dirs.forward[nav_type]){
				//when moving to Right - start from left edge
				start_point.left = target_dems.offset.left;
			} else {
				//when moving to Left - start from right edge
				start_point.left = target_dems.offset.left + target_dems.width;
			}
		} else {
			start_point.left = target_dems.offset.left;
			if (this.wp_dirs.forward[nav_type]){
				//when moving to Bottom - start from top edge
				start_point.top = target_dems.offset.top;
			} else {
				//when moving to Top - start from bottom edge
				start_point.top = target_dems.offset.top + target_dems.height;
			}

		}
		var _this = this;
		corridor.sort(function(a, b) {
			return spv.sortByRules(a, b, [
				function(el) {
					//var cur_dems = dems_storage[el.wpid];
					var end_point = _this.getWPEndPoint(el, nav_type, dems_storage);

					var cathetus1 = Math.abs(end_point.top - start_point.top);
					var cathetus2 = Math.abs(end_point.left - start_point.left);
					var hypotenuse = Math.sqrt(Math.pow(cathetus1, 2) + Math.pow(cathetus2, 2));

					var path = _this.wp_dirs.horizontal[nav_type] ? cathetus2 : cathetus1;

					return (hypotenuse + path)/2;


				}
			]);
		});
	},
	getLenthBtwPoints: function(start_point, end_point) {
		var cathetus1 = Math.abs(end_point.top - start_point.top);
		var cathetus2 = Math.abs(end_point.left - start_point.left);
		var hypotenuse = Math.sqrt(Math.pow(cathetus1, 2) + Math.pow(cathetus2, 2));
		return hypotenuse;
	},
	matchWPForTriangles: function(dems_storage, nav_type, cur_wayp, target_wp, angle) {
		var curwp_dems = dems_storage[cur_wayp.wpid];
		//var tagwp_dems = dems_storage[cur_wayp.wpid];

		var point_a = {},
			point_t = {},
			point_c = {},
			shift_length;

		point_t = this.getWPEndPoint(target_wp, nav_type, dems_storage);

		if (this.wp_dirs.horizontal[nav_type]){
			point_a.top = curwp_dems.offset.top + curwp_dems.height;
			shift_length = curwp_dems.height;


			point_c = {
				left: point_t.left,
				top: point_a.top
			};

			if (this.wp_dirs.forward[nav_type]){
				point_a.left  = curwp_dems.offset.left + curwp_dems.width;
				if (point_c.left < point_a.left){
					return false;
					//throw new Error('bad left position');
				}

			} else {
				point_a.left = curwp_dems.offset.left;
				if (point_c.left > point_a.left){
					return false;
					//throw new Error('bad left position');
				}
			}
		} else {
			point_a.left = curwp_dems.offset.left + curwp_dems.width;
			shift_length = curwp_dems.width;


			point_c = {
				left: point_a.left,
				top: point_t.top
			};

			if (this.wp_dirs.forward[nav_type]){
				point_a.top  = curwp_dems.offset.top + curwp_dems.height;
				if (point_c.top < point_a.top){
					return false;
					//throw new Error('bad top position');
				}

			} else {
				point_a.top = curwp_dems.offset.top;
				if (point_c.top > point_a.top){
					return false;
					//throw new Error('bad top position');
				}
			}
		}

		var a_length = this.getALength(spv.cloneObj({},point_a), spv.cloneObj({}, point_c), angle);

		var matched = this.matchTrianglesByPoints(point_a, point_c, nav_type, a_length, false, point_t);
		if (!matched){
			matched = this.matchTrianglesByPoints(point_a, point_c, nav_type, a_length, shift_length, point_t);
		}
		return matched;

	},
	matchTriaPoArray: function(arr) {
		for (var i = 0; i < arr.length ; i++) {

			if (arr[i] === 0){
				return true;
			} else {
				if (arr[i + 1] && (arr[i + 1] * arr[i] <= 0)){
					return false;
				}
			}
		}
		return true;
	},
	matchTrianglesByPoints: function(point_a, point_c, nav_type, a_length, shift_length, point_t) {
		var point_b = {};

		var dyn_field;
		var stat_field;
		if (this.wp_dirs.horizontal[nav_type]){
			stat_field = 'left';
			dyn_field = 'top';
		} else {
			stat_field = 'top';
			dyn_field = 'left';

		}

		point_b[stat_field] = point_c[stat_field];
		if (typeof shift_length == 'number'){
			point_c[dyn_field] -= shift_length;
			point_a[dyn_field] -= shift_length;
			point_b[dyn_field] = point_c[dyn_field] - a_length;
		} else {
			point_b[dyn_field] = point_c[dyn_field] + a_length;
		}

		var arr = this.triangleHasPoint(point_a, point_b, point_c, point_t);

		return this.matchTriaPoArray(arr);
	},
	triangleHasPoint: function(point_a, point_b, point_c, point_t) {
		var line1 = (point_a.left - point_t.left) * (point_b.top - point_a.top) - (point_b.left - point_a.left) * (point_a.top - point_t.top);
		var line2 = (point_b.left - point_t.left) * (point_c.top - point_b.top) - (point_c.left - point_b.left) * (point_b.top - point_t.top);
		var line3 = (point_c.left - point_t.left) * (point_a.top - point_c.top) - (point_a.left - point_c.left) * (point_c.top - point_t.top);
		return [line1, line2, line3];
		/*
		считаются произведения (1, 2, 3 - вершины треугольника, 0 - точка):
		(x1 - x0) * (y2 - y1) - (x2 - x1) * (y1 - y0)
		(x2 - x0) * (y3 - y2) - (x3 - x2) * (y2 - y0)
		(x3 - x0) * (y1 - y3) - (x1 - x3) * (y3 - y0)
		Если они одинакового знака, то точка внутри треугольника, если что-то из этого - ноль, то точка лежит на стороне, иначе точка вне треугольника.
		*/
	},
	getALength: function(point_a, point_c, angle_alpha) {
		//var b_point_arg = point_j.left + a_length;
		//var sign;

		var toRad = function(angle){
			return angle * (Math.PI/180);
		};

		var angle_gamma = 90;
		var angle_beta = 180 - angle_gamma - angle_alpha;
		var a_length = (this.getLenthBtwPoints(point_a, point_c) * Math.sin(toRad(angle_alpha)) )/ Math.sin(toRad(angle_beta));

		return a_length;
	},
	getWPCorridor: function(cwp, nav_type, wayp_pack, dems_storage, angle) {
		var corridor = [];
		var i, cur, pret_dems;
		var target_dems = dems_storage[cwp.wpid];
		if (this.wp_dirs.horizontal[nav_type]){

			//var cenp_top;
			//var cenp_left;

			for (i = 0; i < wayp_pack.length; i++) {
				cur = wayp_pack[i];


				if (!cur){
					continue;
				}
				pret_dems = dems_storage[cur.wpid];
				if (cur == cwp || cur.node == cwp.node){
					continue;
				}
				if (this.wp_dirs.forward[nav_type]){
					if (pret_dems.offset.left + pret_dems.width <= target_dems.offset.left + target_dems.width){
						//when move to Right - comparing Right edges
						continue;
					}
				} else {
					if (pret_dems.offset.left >= target_dems.offset.left){
						//when move to Left - comparing left edges
						continue;
					}
				}
				if (!angle){
					if ((pret_dems.offset.top + pret_dems.height) <= target_dems.offset.top){
						continue;
					}

					if (pret_dems.offset.top >= (target_dems.offset.top + target_dems.height)){
						continue;
					}
				} else {
					if (!this.matchWPForTriangles(dems_storage, nav_type, cwp, cur, angle)){
						continue;
					}
				}




				corridor.push(cur);
			}
		} else {
			for (i = 0; i < wayp_pack.length; i++) {
				cur = wayp_pack[i];
				if (!cur){
					continue;
				}
				pret_dems = dems_storage[cur.wpid];
				if (cur == cwp || cur.node == cwp.node){
					continue;
				}

				if (this.wp_dirs.forward[nav_type]){
					if (pret_dems.offset.top + pret_dems.height <= target_dems.offset.top + target_dems.height){
						//when move to Bottom - comparing Bottom edges
						continue;
					}
				} else {
					if (pret_dems.offset.top >= target_dems.offset.top){
						//when move to Top - comparing Top edges
						continue;
					}
				}
				if (!angle){
					if ((pret_dems.offset.left + pret_dems.width ) <= target_dems.offset.left){
					continue;
					}
					if (pret_dems.offset.left >= (target_dems.offset.left + target_dems.width)){
						continue;
					}
				} else {
					if (!this.matchWPForTriangles(dems_storage, nav_type, cwp, cur, angle)){
						continue;
					}
				}
				corridor.push(cur);
			}
		}
		this.sortWPCorridor(target_dems, corridor, nav_type, dems_storage);

		return corridor;
	}
});
return WPBox;
});