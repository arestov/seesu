define(['spv'], function(spv) {
'use strict';


function itself(item) {return item;}


var NestWatch = function(selector, state_name, zin_func, full_name, handler) {
	this.selector = selector;
	this.state_name = state_name;
	this.full_name = full_name;
	this.zin_func = zin_func;
	this.handler = handler;
};

var encoded_states = {};
var enc_states = {
	parent: (function(){
		var parent_count_regexp = /^\^+/gi;

		return function(string) {
			//example: '^visible'

			if (!encoded_states[string]){
				var state_name = string.replace(parent_count_regexp, '');
				var count = string.length - state_name.length;
				encoded_states[string] = {
					rel_type: 'parent',
					full_name: string,
					ancestors: count,
					state_name: state_name
				};
			}

			return encoded_states[string];
		};
	})(),
	nesting: function(string) {
		//example:  '@some:complete:list'
		if (!encoded_states[string]){
			var nesting_and_state_name = string.slice(1);
			var parts = nesting_and_state_name.split(':');

			var nesting_name = parts.pop();
			var state_name = parts.pop();
			var zin_func = parts.pop();

			encoded_states[string] = {
				rel_type: 'nesting',
				full_name: string,
				nesting_name: nesting_name,
				state_name: state_name,
				zin_func: zin_func || itself,
				nwatch: new NestWatch(nesting_name.split('.'), state_name, zin_func, string)
			};
		}

		return encoded_states[string];
	},
	root: function(string) {
		//example: '#vk_id'
		if (!encoded_states[string]){
			var state_name = string.slice(1);
			if (!state_name) {
				throw new Error('should be state_name');
			}
			encoded_states[string] = {
				rel_type: 'root',
				full_name: string,
				state_name: state_name
			};
		}

		return encoded_states[string];
	}
};
var emergency_opt = {
	emergency: true
};

function getBwlevView(view) {
	var bwlev_view;

	var cur = view;
	while (!bwlev_view && cur.parent_view) {
		if (cur.parent_view != view.root_view) {
			cur = cur.parent_view;
		} else {
			bwlev_view = cur;
			break;
		}
	}

	return bwlev_view;
}

function getBwlevId(view) {
	return getBwlevView(view).mpx._provoda_id;
}

return {
	NestWatch: NestWatch,
	getRDep: (function() {
		var getTargetName = spv.memorize(function getTargetName(state_name) {
			return state_name.split( ':' )[ 1 ];
		});

		return function(state_name) {
			var target_name = getTargetName(state_name);
			return function(target, state, oldstate) {
				if (oldstate) {
					oldstate.setStateDependence(target_name, target, false);
				}
				if (state) {
					state.setStateDependence(target_name, target, true);
				}
			};
		};

	})(),
	state: function(item, state_name) {
		if (item._lbr && item._lbr.undetailed_states) {
			return item._lbr.undetailed_states[state_name];
		}
		return item.states[state_name];
	},
	triggerDestroy: function(md) {
		var array = md.evcompanion.getMatchedCallbacks('die');
		if (array.length) {
			md.evcompanion.triggerCallbacks(array, false, emergency_opt, 'die');
		}
	},
	wipeObj: function (obj){
		for (var p in obj){
			if (obj.hasOwnProperty(p)){
				delete obj[p];
			}
		}
	},
	markFlowSteps: function(flow_steps, p_space, p_index_key) {
		for (var i = 0; i < flow_steps.length; i++) {
			flow_steps[i].p_space = p_space;
			flow_steps[i].p_index_key = p_index_key;
		}
	},
	getRightNestingName: function(md, nesting_name) {
		if (md.preview_nesting_source && nesting_name == 'preview_list') {
			nesting_name = md.preview_nesting_source;
		} else if (nesting_name == md.preview_mlist_name){
			nesting_name = md.main_list_name;
		}
		return nesting_name;
	},
	getEncodedState: function(state_name) {
		if (!encoded_states.hasOwnProperty(state_name)) {

			var start = state_name.charAt(0);
			if (start == '^'){
				enc_states.parent(state_name);
			} else if (start == '@') {
				enc_states.nesting(state_name);
			} else if (start == '#') {
				enc_states.root(state_name);
			} else {
				encoded_states[state_name] = null;
			}
		}
		return encoded_states[state_name];
	},
	getReqMapsForState: function(req_map, state_name) {
		if (!req_map) {
			return;
		}
		var maps_for_state= [];
		for (var i = 0; i < req_map.length; i++) {
			var states_list = req_map[i][0];
			if (states_list.indexOf(state_name) != -1) {
				maps_for_state.push(i, req_map[i]);
			}
		}
		return maps_for_state;
	},

	getNetApiByDeclr: function(send_declr, sputnik, app) {
		var network_api;
		var api_name = send_declr[0];
		if (typeof api_name == 'string') {
			network_api = spv.getTargetField(app || sputnik.app, api_name);
		} else if (typeof api_name == 'function') {
			network_api = api_name.call(sputnik);
		}

		return network_api;
	},
	getPropsPrefixChecker: function(check) {
		return function(props) {
			for (var prop_name in props) {
				if (props.hasOwnProperty( prop_name ) && check( prop_name )){
					return true;
				}
			}
		};
	},
	getSTEVNameVIP: spv.getPrefixingFunc('vip_state_change-'),
	getSTEVNameDefault: spv.getPrefixingFunc('state_change-'),
	getSTEVNameLight: spv.getPrefixingFunc('lgh_sch-'),
	getFullChilChEvName: spv.getPrefixingFunc('child_change-'),
	getRemovedNestingItems: function(array, old_value) {
		var removed;
		if (Array.isArray(old_value)){
			if (!array){
				removed = old_value.slice(0);
			} else {
				removed = [];
				for (var i = 0; i < old_value.length; i++) {
					var cur = old_value[i];
					if (array.indexOf(cur) == -1){
						removed.push(cur);
					}
				}
			}
			//console.log(removed);
		} else if (old_value && array != old_value) {
			removed = [old_value];
		}
		return removed;
	},
	oop_ext: {
		hndMotivationWrappper: function(motivator, fn, context, args, arg) {
			if (motivator.p_space) {
				this.zdsv.removeFlowStep(motivator.p_space, motivator.p_index_key, motivator);
			}

			if (this.isAliveFast && !this.isAliveFast()) {
				return;
			}

			//устанавливаем мотиватор конечному пользователю события
			var ov_c = context.current_motivator;
			context.current_motivator = motivator;

			var ov_t;

			if (this != context) {
				//устанавливаем мотиватор реальному владельцу события, чтобы его могли взять вручную
				//что-то вроде api
				ov_t = this.current_motivator;
				this.current_motivator = motivator;
			}

			if (args){
				fn.apply(context, args);
			} else {
				fn.call(context, arg);
			}

			if (context.current_motivator != motivator){
				throw new Error('wrong motivator'); //тот кто поменял current_motivator должен был вернуть его обратно
			}
			context.current_motivator = ov_c;

			if (this != context) {
				if (this.current_motivator != motivator){
					throw new Error('wrong motivator'); //тот кто поменял current_motivator должен был вернуть его обратно
				}
				this.current_motivator = ov_t;
			}
		}
	},
	$v: {
		getBwlevView: getBwlevView,
		getBwlevId: getBwlevId,
		getViewLocationId: function(parent_view, nesting_name, nesting_space) {
			if (!nesting_name) {
				throw new Error('no nesting_name');
			}
			/*
			помогает определить есть ли у модели вьюха, ассоциированная с локацией - с родительской вьюхой (а также с гнездом внутри родительской вьюхи)

			*/
			return parent_view.view_id + ':' +  nesting_space + ':' + nesting_name;
		},
		createTemplate: function(view, con) {
			if (!view._lbr.hndTriggerTPLevents) {
				view._lbr.hndTriggerTPLevents = function(e) {
					var cb_data = e.callback_data;

					for (var i = 0; i < cb_data.length; i++) {
						var cur = cb_data[i];
						if (typeof cur == 'function') {
							cb_data[i] = cur(e.scope || view.states);
						}
					}

					if (!cb_data[0] && cb_data[1]){
						var target_view;
						//var view =

						if (spv.startsWith(cb_data[1], '#')) {
							target_view = view.root_view;
							cb_data[1] = cb_data[1].slice(1);
						} else {
							target_view = view;
						}
						if (cb_data[2]) {
							var stringed_variable = cb_data[2].match(/\%(.*?)\%/);
							if (stringed_variable) {
								cb_data[2] = spv.getTargetField(e.node, stringed_variable[1]);
							}
						}

						cb_data.shift();
						target_view.handleTemplateRPC.apply(target_view, cb_data);

					} else {
						if (!e.pv_repeat_context){
							view.tpl_events[e.callback_name].call(view, e.event, e.node, cb_data);
						} else {
							view.tpl_r_events[e.pv_repeat_context][e.callback_name].call(view, e.event, e.node, e.scope);
						}
					}

				};
			}

			if (!view._lbr.hndPvTypeChange) {
				view._lbr.hndPvTypeChange = function(arr_arr) {
					//pvTypesChange
					//this == template
					//this != provoda.View
					var old_waypoints = this.waypoints;
					var total = [];
					var i = 0;
					for (i = 0; i < arr_arr.length; i++) {
						if (!arr_arr[i]) {
							continue;
						}
						total.push.apply(total, arr_arr[i]);
					}
					var matched = [];
					for (i = 0; i < total.length; i++) {
						var cur = total[i];
						if (!cur.marks){
							continue;
						}
						if (cur.marks['hard-way-point'] || cur.marks['way-point']){
							matched.push(cur);
						}
					}
					var to_remove = old_waypoints && spv.arrayExclude(old_waypoints, matched);
					this.waypoints = matched;
					view.updateTemplatedWaypoints(matched, to_remove);
				};
			}

			if (!view._lbr.hndPvTreeChange) {
				view._lbr.hndPvTreeChange = function() {
					view.checkTplTreeChange();
				};
			}


			return view.getTemplate(con, view._lbr.hndTriggerTPLevents, view._lbr.hndPvTypeChange, view._lbr.hndPvTreeChange);
		},
		matchByParent: function(views, parent_view) {
			for (var i = 0; i < views.length; i++) {
				var cur = views[i];
				var item = cur;
				while (item.parent_view && item.parent_bwlev != item.root_view) {
					if (item.parent_view == parent_view) {
						return cur;
					}
					item = item.parent_view;
				}
			}
		},
		selecPoineertDeclr: (function(){
			var sel_match_builders = [
				function(model_name, parent_space_name) {
					return model_name + '/' + parent_space_name;
				},
				function(model_name) {
					return model_name;
				},
				function(model_name, parent_space_name) {
					return '/' + parent_space_name;
				},
				function() {
					return '';
				},
			];
			return function(dclrs_fpckgs, dclrs_selectors, nesting_name, model_name, parent_space_name, soft) {
				for (var i = 0; i < sel_match_builders.length; i++) {
					var key = sel_match_builders[i](model_name, parent_space_name);
					if (dclrs_selectors[nesting_name] && dclrs_selectors[nesting_name][key]) {
						var link = dclrs_selectors[nesting_name][key];
						if (link) {
							var dclr = dclrs_fpckgs[link];
							if (!soft && !dclr) {
								throw new Error('reffered dclr does not exist');
							}
							return dclr;
						}

					}
				}
			};
		})()
	}

};

});
