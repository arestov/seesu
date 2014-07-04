define(['provoda', 'spv', 'jquery','./modules/filters', 'app_serv', 'js/libs/PvTemplate'], function(provoda, spv, $, filters, app_serv, PvTemplate){
"use strict";
var transform_props = [app_serv.app_env.transform];
//['-webkit-transform', '-moz-transform', '-o-transform', 'transform'];
var empty_transform_props = {};
transform_props.forEach(function(el) {
	empty_transform_props[el] = '';
});
var can_animate = app_serv.app_env.transform && app_serv.app_env.transition;


provoda.setTplFilterGetFn(function(filter_name) {
	if (filters[filter_name]){
		return filters[filter_name];
	} else {
		throw new Error( 'no filter: ' + filter_name );
	}
});

var viewOnLevelP = function(md, view) {
	var lev_conj = this.getLevelContainer(md.map_level_num);
	view.wayp_scan_stop = true;
	return lev_conj.material;
};


var LevContainer = function(con, scroll_con, material, tpl, context) {
	this.c = con;
	this.scroll_con = scroll_con;
	this.material = material;
	this.tpl = tpl;
	this.context = context;
	this.callbacks = [];
	var _this = this;
	if (can_animate){
		spv.addEvent(this.c[0], can_animate, function(e) {
			//console.log(e);
			_this.completeAnimation();
		});
	}
};

LevContainer.prototype = {
	onTransitionEnd: function(cb) {
		this.callbacks.push(cb);
	},
	completeAnimation: function() {
		while (this.callbacks.length){
			var cb = this.callbacks.shift();
			this.context.nextTick(cb);
		}
	}
};


var BrowserAppRootView = function() {};
provoda.View.extendTo(BrowserAppRootView, {
	dom_rp: true,
	
	_getCallsFlow: function() {
		return this.calls_flow;
	},
	init: function(opts, vopts) {
		this.calls_flow = new provoda.CallbacksFlow(spv.getDefaultView(vopts.d), !vopts.usual_flow, 250);
		return this._super.apply(this, arguments);
	},
	createDetails: function() {
		this.root_view = this;
		this.d = this.opts.d;
		this.dom_related_props.push('calls_flow');

		var _this = this;
		if (this.opts.can_die && spv.getDefaultView(this.d)){
			this.can_die = true;
			this.checkLiveState = function() {
				if (!spv.getDefaultView(_this.d)){
					_this.reportDomDeath();
					return true;
				}
			};

			this.lst_interval = setInterval(this.checkLiveState, 1000);

		}

	},
	reportDomDeath: function() {
		if (this.can_die && !this.dead){
			this.dead = true;
			clearInterval(this.lst_interval);
		//	var d = this.d;
		//	delete this.d;
			this.die();
			console.log('DOM dead! ' + this.nums);

		}
	},
	isAlive: function(){
		if (this.dead){
			return false;
		}
		return !this.checkLiveState || !this.checkLiveState();
	}
});


var AppBaseView = function() {};
AppBaseView.BrowserAppRootView = BrowserAppRootView;
AppBaseView.viewOnLevelP = viewOnLevelP;
BrowserAppRootView.extendTo(AppBaseView, {
	location_name: 'root_view',
	createDetails: function() {
		this._super();

		this.tpls = [];
		this.struc_store = {};
		this.els = {};
		this.samples = {};
		this.lev_containers = {};
		this.max_level_num = -1;
		this.dom_related_props.push('samples', 'lev_containers', 'els', 'struc_store');
		this.completely_rendered_once = {};

	},
	completeDomBuilding: function() {
		this.connectStates();
		this.connectChildrenModels();
		this.requestAll();
	},
	getLevelContainer: function(num) {
		if (this.lev_containers[num]){
			return this.lev_containers[num];
		} else {
			/*
			if (!view){
				throw new Error('give me "view"');
			}*/
			if (num == -1){
				throw new Error('start_screen must exist');
			}

			var node = this.getSample('complex-page');

			var tpl = new this.PvTemplate({
				node: node,
				spec_states: {
					'$lev_num': num
				},
				struc_store: this.struc_store
			});

			this.tpls.push(tpl);
			tpl.setStates(this.states);
			



			var next_lev_con;
			for (var i = num; i <= this.max_level_num; i++) {
				if (this.lev_containers[i]) {
					next_lev_con = this.lev_containers[i];
					break;
				}
			}
			if (next_lev_con) {
				node.insertBefore(next_lev_con.c);
			} else {
				node.appendTo(this.els.app_map_con);
			}
			

			var lev_con = new LevContainer
					(node,
					tpl.ancs['scroll_con'],
					tpl.ancs['material'],
					tpl,
					this);
			this.lev_containers[num] = lev_con;

			this.max_level_num = Math.max(this.max_level_num, num);
			return lev_con;
		}
	},
	manual_states_connect: true,
	getLevByNum: function(num, exclude_start_lev) {
		if (num < -1){
			return false;
		} else if (exclude_start_lev){
			return num == -1 ? false : this.getLevelContainer(num);
		} else {
			return this.getLevelContainer(num);
		}

	},
	hideLevNum: function(num) {

		var levc = this.getLevByNum(num);
		if (levc){
			levc.c.addClass('inactive-page').removeClass('full-page');
		}

	},
	showLevNum: function(num) {
		var levc = this.getLevByNum(num);
		if (levc){
			levc.c.removeClass('inactive-page').addClass('full-page');
		}
	},
	removePageOverviewMark: function(num) {
		var levc = this.getLevByNum(num);
		if (levc){
			levc.c.removeClass('page-scheme');
		}
	},
	addPageOverviewMark: function(num) {
		var levc = this.getLevByNum(num);
		if (levc){
			levc.c.addClass('page-scheme');
		}
	},
	getScrollVP: function() {
		return this.els.scrolling_viewport;
	},
	scrollTo: function(jnode, view_port, opts) {
		if (!jnode){return false;}
	//	if (!this.view_port || !this.view_port.node){return false;}

		//var scrollingv_port = ;

		//var element = view.getC();

	//	var jnode = $(view.getC());
		if (!jnode[0]){
			return;
		}

		var view_port_limit = (opts && opts.vp_limit) || 1;

		var svp = view_port || this.getScrollVP(),
			scroll_c = svp.offset ? svp.node :  svp.node,
			scroll_top = scroll_c.scrollTop(), //top
			scrolling_viewport_height = svp.node.height(), //height
			padding = (scrolling_viewport_height * (1 - view_port_limit))/2,
			scroll_bottom = scroll_top + scrolling_viewport_height; //bottom

		var top_limit = scroll_top + padding,
			bottom_limit = scroll_bottom - padding;

		var node_position;
		var node_top_post =  jnode.offset().top;
		if (svp.offset){
			node_position = node_top_post;
		} else{
			//throw new Error('fix this!');
			var spv_top_pos = scroll_c.offset().top;
			node_position = scroll_top + (node_top_post - spv_top_pos);

			//node_position = jnode.position().top + scroll_top + this.c.parent().position().top;
		}
		/*

		var el_bottom = jnode.height() + node_position;

		var new_position;
		if ( el_bottom > bottom_limit || el_bottom < top_limit){
			new_position =  el_bottom - scrolling_viewport_height/2;
		}*/
		var new_position;
		if (node_position < top_limit || node_position > bottom_limit){
			var allowed_height = Math.min(jnode.height(), scrolling_viewport_height);
			new_position = node_position - allowed_height/2 - scrolling_viewport_height/2;
			//new_position =  node_position - scrolling_viewport_height/2;
		}
		if (new_position){
			if (opts && opts.animate){
				scroll_c
					.stop(false, true)
					.animate({
						scrollTop: new_position
					}, opts.animate);

			} else {
				scroll_c.scrollTop(new_position);
			}

		}
	},
	getSampler: function(sample_name) {
		var sampler = this.samples[sample_name], sample_node;
		if (!sampler){
			sample_node = this.els.ui_samples.children('.' + sample_name);
			sample_node = sample_node[0];
			if (sample_node){
				sampler = this.samples[sample_name] = new PvTemplate.SimplePVSampler(sample_node, this.struc_store);
			}
			
		}
		if (!sampler){
			sample_node = $(this.requirePart(sample_name));
			sample_node = sample_node[0];
			if (sample_node){
				sampler = this.samples[sample_name] = new PvTemplate.SimplePVSampler(sample_node, this.struc_store);
			}
			
		}
		if (!sampler){
			throw new Error('no such sample');
		}
		return sampler;
	},
	getSample: function(sample_name) {
		var sampler = this.getSampler(sample_name);
		
		if (sampler.getClone){
			return $(sampler.getClone());
		} else {
			return $(sampler).clone();
		}
	},
	
	markAnimationStart: function(models, changes_number) {
		for (var i = 0; i < models.length; i++) {
			this.getStoredMpx(models[i].getMD()).updateState('animation_started', changes_number);
			////MUST UPDATE VIEW, NOT MODEL!!!!!
		}
	},
	markAnimationEnd: function(models, changes_number) {
		for (var i = 0; i < models.length; i++) {
			//
			var mpx = this.getStoredMpx(models[i].getMD());

			if (mpx.state('animation_started') == changes_number){
				mpx.updateState('animation_completed', changes_number);
			}
			////MUST UPDATE VIEW, NOT MODEL!!!!!
		}
	},
	getMapSliceView: function(md) {
		var model_name = md.model_name;
		if (this['spec-vget-' + model_name]){
			return this['spec-vget-' + model_name](md);
		} else {
			return this.findMpxViewInChildren(this.getStoredMpx(md), false, 'map_slice');
		}
	},
	getMapSliceChildInParenView: function(md) {
		var parent_md = md.map_parent;


		var parent_view = this.getMapSliceView(parent_md);
		if (!parent_view){
			return;
		}
		var target_in_parent = parent_view.findMpxViewInChildren(this.getStoredMpx(md), false, 'map_slice');
		if (!target_in_parent){
			var view = parent_view.getChildViewsByMpx(this.getStoredMpx(md));
			target_in_parent = view && view[0];
		}
		return target_in_parent;
	},
	getNavOHeight: function() {
		return this.els.navs.outerHeight();
	},
	getAMCWidth: function() {
		return this.els.app_map_con.width();
	},
	getAMCOffset: function() {
		return this.els.app_map_con.offset();
	},
	readMapSliceAnimationData: function(transaction_data) {
		if (transaction_data && transaction_data.target){
			var target_md = transaction_data.target.getMD();
			var current_lev_num = target_md.map_level_num;
			var one_zoom_in = transaction_data.array.length == 1 && transaction_data.array[0].name == "zoom-in" && transaction_data.array[0].changes.length < 3;
			var lc;
			if (can_animate && current_lev_num != -1 && one_zoom_in){
				var target_in_parent = this.getMapSliceChildInParenView(target_md);
				if (target_in_parent){
					var targt_con = target_in_parent.getC();

					//var offset_parent_node = targt_con.offsetParent();
					var parent_offset = this.getBoxDemension(this.getAMCOffset, 'screens_offset');
					//или ни о чего не зависит или зависит от позиции скрола, если шапка не скролится
					var offset = targt_con.offset(); //domread

					var top = offset.top - parent_offset.top;
					var width = targt_con.outerWidth();  //domread
					var height = targt_con.outerHeight(); //domread


					//return ;

					var con_height = this.state('window_height') - this.getBoxDemension(this.getNavOHeight, 'navs_height'); //domread, can_be_cached
					var con_width = this.getBoxDemension(this.getAMCWidth, 'screens_width', this.state('window_width'));


					var scale_x = width/con_width;
					var scale_y = height/con_height;
					var min_scale = Math.min(scale_x, scale_y);


					var shift_x = width/2 - min_scale * con_width/2;
					var shift_y = height/2 - min_scale * con_height/2;


					lc = this.getLevelContainer(current_lev_num);


					var transform_values = {};
					var value = 'translate(' + (offset.left + shift_x) + 'px, ' + (top + shift_y) + 'px)  scale(' + min_scale + ')';
					transform_props.forEach(function(el) {
						transform_values[el] = value;
					});

					return {
						lc: lc,
						transform_values: transform_values
					};
				}
			}
		}
	},
	setVMpshow: function(target_mpx, value) {
		target_mpx.updateState('vmp_show', value);
	},
	'model-mapch': {
		'move-view': function(change) {
			var parent = change.target.getMD().getParentMapModel();
			if (parent){
			//	parent.updateState('mp_has_focus', false);
			}
			//mpx.updateState(prop, changes_number);
			this.setVMpshow(this.getStoredMpx(change.target.getMD()), change.value);
		},
		'zoom-out': function(change) {
			this.setVMpshow(this.getStoredMpx(change.target.getMD()), false);
		},
		'destroy': function(change) {
			var md = change.target.getMD();
		//	md.mlmDie();
			this.setVMpshow(this.getStoredMpx(md), false);
		}
	},
	animateMapSlice: function(transaction_data, animation_data) {
		var all_changhes = spv.filter(transaction_data.array, 'changes');
			all_changhes = [].concat.apply([], all_changhes);
		var models = spv.filter(all_changhes, 'target');
		var i, cur;

		this.markAnimationStart(models, transaction_data.changes_number);

		for (i = 0; i < all_changhes.length; i++) {
			cur = all_changhes[i];
			var target = cur.target.getMD();
			if (cur.type == 'destroy'){
				this.removeChildViewsByMd(this.getStoredMpx(target));
			}
		}

		for (i = 0; i < all_changhes.length; i++) {
			var change = all_changhes[i];
		//	change.changes_number = changes.changes_number;
			var handler = this['model-mapch'][change.type];
			if (handler){
				handler.call(this, change);
			}
		}

		if (transaction_data.target){
			var target_md = transaction_data.target.getMD();
			var current_lev_num = target_md.map_level_num;
			
			if (animation_data){
				this.updateState('disallow_animation', true);
				animation_data.lc.c.css(animation_data.transform_values);
				//lc.tpl.spec_states['disallow_animation'] = true;
				//lc.tpl.spec_states['disallow_animation'] = false;
				this.updateState('disallow_animation', false);
			}

			this.updateState('current_lev_num', current_lev_num);
			//сейчас анимация происходит в связи с сменой класса при изменении состояния current_lev_num


			if (animation_data && animation_data.lc){
				animation_data.lc.c.height(); //заставляем всё пересчитать
				animation_data.lc.c.css(empty_transform_props);
				/*this.nextTick(function() {
					
				});*/
				animation_data.lc.c.height(); //заставляем всё пересчитать
				
			}

		}
		var _this = this;
		var completeAnimation = function() {
			_this.markAnimationEnd(models, transaction_data.changes_number);
		};
		setTimeout(completeAnimation, 16*21*4);
		if (!animation_data){
			//
			this.markAnimationEnd(models, transaction_data.changes_number);
			/*this.nextTick(function() {
				
			});*/
		} else {
			animation_data.lc.onTransitionEnd(completeAnimation);

		}


		
	},
	'collch-$spec_common': {
		by_model_name: true,
		place: AppBaseView.viewOnLevelP
	},
	'coll-prio-map_slice': function(array) {
	
		/*for (var i = 0; i < array.length; i++) {
			if (array[i].mpx.states.mp_has_focus){
				return [[array[i]]];
			}
		}*/
		return array;

	},
	findBMapTarget: function(array) {
		var target_md, i;
		for (i = 0; i < array.length; i++) {
			if (this.getStoredMpx(array[i]).states.mp_has_focus) {
				target_md = array[i];
				break;
			}
			
		}
		return target_md;
	},
	'collch-map_slice': function(nesname, nesting_data, old_nesting_data){
		var target_md;
		var array = nesting_data.residents_struc && nesting_data.residents_struc.items;
		var transaction_data = nesting_data.transaction;
		array = this.getRendOrderedNesting(nesname, array) || array;
		var i, cur;


		var animation_data = this.readMapSliceAnimationData(transaction_data);


		for (i = array.length - 1; i >= 0; i--) {
			cur = array[i];
			var model_name = cur.model_name;
			if (this.dclrs_fpckgs.hasOwnProperty('$spec-' + model_name)){
				this.callCollectionChangeDeclaration(this.dclrs_fpckgs['$spec-' + model_name], nesname, cur);
			} else {
				this.callCollectionChangeDeclaration(this.dclrs_fpckgs['$spec_common'], nesname, cur);
			}
		}

		//avoid nextTick method!

		if (this.completely_rendered_once['map_slice'] && old_nesting_data && old_nesting_data.transaction.changes_number + 1 === nesting_data.transaction.changes_number){
			if (transaction_data){
				this.animateMapSlice(transaction_data, animation_data);
				if (!transaction_data.target){
					target_md = this.findBMapTarget(array);

					if (target_md){
						this.updateState('current_lev_num', target_md.map_level_num);
					}
					
				}
			}
		} else {
			var models = new Array(array.length);
			for (i = 0; i < array.length; i++) {
				models[i] = array[i].md_replacer;
			}
			target_md = this.findBMapTarget(array);
			if (!target_md){
				throw new Error('there is no model with focus!');
			}
			this.markAnimationStart(models, -1);
			for (i = 0; i < array.length; i++) {
				this.setVMpshow(this.getStoredMpx(array[i]), nesting_data.residents_struc.mp_show_states[i]);
			}
			this.updateState('current_lev_num', target_md.map_level_num);
			this.markAnimationEnd(models, -1);
			this.completely_rendered_once['map_slice'] = true;
		}
		


	},

	transform_props: transform_props,
	'stch-current_mp_md': function() {

		//map_level_num
		//md.map_level_num



		/*
		var oved_now_active = old_md && (old_md.map_level_num-1 ===  md.map_level_num);
		if (old_md){
			this.hideLevNum(old_md.map_level_num);
			if (!oved_now_active){
				this.removePageOverviewMark(old_md.map_level_num-1);
			}
		}
		if (md.map_level_num != -1 && (!old_md || old_md.map_level_num != -1)){
			this.hideLevNum(-1);
		}

		this.addPageOverviewMark(md.map_level_num - 1);
		this.showLevNum(md.map_level_num);
		if (oved_now_active){
			this.removePageOverviewMark(old_md.map_level_num-1);
		}

*/



		/*
		var highlight = md.state('mp-highlight');
		if (highlight && highlight.source_md){
			var source_md = highlight.source_md;

			var md_view = this.findMpxViewInChildren(md.mpx);
			if (md_view){
				var hl_view = md_view.findMpxViewInChildren(source_md.mpx);
				if (hl_view){
					//this.scrollTo(hl_view.getC());
				}
			}
		}*/
		/*

		var ov_md = md.getParentMapModel();
		var ov_highlight = ov_md && ov_md.state('mp-highlight');
		if (ov_highlight && ov_highlight.source_md){
			var source_md = ov_highlight.source_md;
			var mplev_item_view = source_md.getRooConPresentation(this);
			if (mplev_item_view){
				this.scrollTo(mplev_item_view.getC(), {
					node: this.getLevByNum(md.map_level_num - 1).scroll_con
				}, {vp_limit: 0.4, animate: 117});
			}

			
		}*/
		var md = this.getNesting('current_mp_md');

		var _this = this;
		setTimeout(function() {
			if (!_this.isAlive()){
				_this = null;
				return;
			}
			var parent_md = md.getParentMapModel();
			if (parent_md){
				var mplev_item_view = _this.getStoredMpx(md).getRooConPresentation(_this, false, false, true);
				var con = mplev_item_view && mplev_item_view.getC();
				if (con && con.height()){
					_this.scrollTo(mplev_item_view.getC(), {
						node: _this.getLevByNum(md.map_level_num - 1).scroll_con
					}, {vp_limit: 0.4, animate: 117});
				} else {
					_this.getLevByNum(md.map_level_num - 1).scroll_con.scrollTop(0);
				}
			}
		}, 150);

		



	}

});
return AppBaseView;
});