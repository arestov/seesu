define(function(require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var $ = require('jquery');
var filters = require('./modules/filters');
var getUsageTree = require('./modules/getUsageTree');
var view_serv = require('view_serv');
var View = require('View');

var pvUpdate = pv.update;

var css_transform = view_serv.css.transform;
var transform_props = css_transform ? [css_transform] : [];
//['-webkit-transform', '-moz-transform', '-o-transform', 'transform'];
var empty_transform_props = {};
transform_props.forEach(function(el) {
	empty_transform_props[el] = '';
});
var can_animate = view_serv.css.transform && view_serv.css.transition;

pv.setTplFilterGetFn(function(filter_name) {
	if (filters[filter_name]){
		return filters[filter_name];
	} else {
		throw new Error( 'no filter: ' + filter_name );
	}
});

var viewOnLevelP = function(md, view) {
	var map_level_num = pv.state(md, 'map_level_num');
	if (view.nesting_space == 'detailed') {
		++map_level_num;
	}

	var lev_conj = this.getLevelContainer(map_level_num);
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
		spv.addEvent(this.c[0], can_animate, function() {
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
			this.context.nextLocalTick(cb);
		}
	}
};

var BrowserAppRootView = spv.inh(View, {}, {
	dom_rp: true,
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

var sync_opt = {sync_tpl: true};
var PvTemplate = View._PvTemplate;
var AppBaseView = spv.inh(BrowserAppRootView, {}, {
	location_name: 'root_view',
	createDetails: function() {
		this._super();

		var getSampleForTemplate = (function(_this) {
			return function(sample_name, simple, opts) {
				return _this.getSample(sample_name, simple, opts);
			};
		})(this);

		var templator = PvTemplate.templator(this._getCallsFlow(), getSampleForTemplate);
		this.pvtemplate = templator.template;
		this.pvsampler = templator.sampler;

		this.tpls = [];
		// this.struc_store = {};
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
		this.requestView();
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

			var tpl = this.pvtemplate(node, false, false, {
				'$lev_num': num
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
	scollNeeded: function() {
		return window.document.body.scrollHeight > window.document.body.clientHeight;
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

				sampler = this.samples[sample_name] = this.pvsampler(sample_node);
			}

		}
		if (!sampler){
			sample_node = $(this.requirePart(sample_name));
			sample_node = sample_node[0];
			if (sample_node){
				sampler = this.samples[sample_name] = this.pvsampler(sample_node);
			}

		}
		if (!sampler){
			throw new Error('no such sample');
		}
		return sampler;
	},
	getSample: function(sample_name, simple, options) {
		var sampler = this.getSampler(sample_name);

		if (sampler.getClone){
			if (simple) {
				return sampler.getClone(options);
			} else {
				return $(sampler.getClone(options));
			}
		} else {
			if (options) {
				throw new Error('not support options here');
			}
			return $(sampler).clone();
		}
	},
	'compx-map_animating': [
		['map_animation_num_started', 'map_animation_num_completed'],
		function (started_num, completed_num) {
			return typeof started_num == 'number' && started_num != completed_num;
		}
	],
	markAnimationStart: function(models, changes_number) {
		pv.update(this, 'map_animation_num_started', changes_number, sync_opt);
		for (var i = 0; i < models.length; i++) {

			pv.mpx.update(this.getStoredMpx(models[i].getMD()), 'animation_started', changes_number, sync_opt);
			////MUST UPDATE VIEW, NOT MODEL!!!!!
		}
	},
	markAnimationEnd: function(models, changes_number) {
		if (this.state('map_animation_num_started') == changes_number) {
			pv.update(this, 'map_animation_num_completed', changes_number, sync_opt);
		}


		for (var i = 0; i < models.length; i++) {
			//
			var mpx = this.getStoredMpx(models[i].getMD());

			if (mpx.state('animation_started') == changes_number){
				pv.mpx.update(mpx, 'animation_completed', changes_number, sync_opt);
			}
			////MUST UPDATE VIEW, NOT MODEL!!!!!
		}
	},

	getMapSliceView: function(bwlev, md) {
		var dclr = pv.$v.selecPoineertDeclr(this.dclrs_fpckgs, this.dclrs_selectors,
			'map_slice', md.model_name, this.nesting_space);
		var target_bwlev = dclr.is_wrapper_parent ? bwlev.map_parent: bwlev;
		return this.findMpxViewInChildren( this.getStoredMpx(target_bwlev), dclr.space, 'map_slice' );
	},
	getMapSliceChildInParenView: function(bwlev, md) {
		var parent_bwlev = bwlev.map_parent;
		// md of parent view could differ from md.map_parent
		var parent_md = bwlev.getParentMapModel().getNesting('pioneer');

		var parent_bwlev_view = this.getMapSliceView(parent_bwlev, parent_md);
		var parent_view = parent_bwlev_view && parent_bwlev_view.findMpxViewInChildren(this.getStoredMpx(parent_md));
		if (!parent_view){
			return;
		}
		var target_in_parent = parent_view.findMpxViewInChildren(this.getStoredMpx(md));
		if (!target_in_parent){
			var view = parent_view.getChildViewsByMpx(this.getStoredMpx(md));
			target_in_parent = view && view[0];
		}
		return target_in_parent;
	},
	getMapSliceChildInParenViewOLD: function(md) {
		var parent_md = md.map_parent;


		var parent_view = this.getMapSliceView(parent_md);
		if (!parent_view){
			return;
		}
		var target_in_parent = parent_view.findMpxViewInChildren(this.getStoredMpx(md));
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
		if (!transaction_data || !transaction_data.bwlev) {return;}

		var target_md = transaction_data.bwlev.getMD();
		var current_lev_num = pv.state(target_md, 'map_level_num');
		var one_zoom_in = transaction_data.array.length == 1 && transaction_data.array[0].name == "zoom-in" && transaction_data.array[0].changes.length < 3;

		if (!(can_animate && current_lev_num != -1 && one_zoom_in)) {return;}

		var target_in_parent = this.getMapSliceChildInParenView(target_md, transaction_data.target.getMD());
		if (!target_in_parent) {return;}

		var targt_con = target_in_parent.getC();

		// var offset_parent_node = targt_con.offsetParent();
		var parent_offset = this.getBoxDemension(this.getAMCOffset, 'screens_offset');
		// или ни о чего не зависит или зависит от позиции скрола, если шапка не скролится

		// var offset = targt_con.offset(); //domread
		var offset = target_in_parent.getBoxDemension(function() {
			return targt_con.offset();
		}, 'con_offset', target_in_parent._lbr.innesting_pos_current, this.state('window_height'), this.state('workarea_width'));

		var width = target_in_parent.getBoxDemension(function() {
			return targt_con.outerWidth();
		}, 'con_width', this.state('window_height'), this.state('workarea_width'));

		var height = target_in_parent.getBoxDemension(function() {
			return targt_con.outerHeight();
		}, 'con_height', this.state('window_height'), this.state('workarea_width'));


		// var width = targt_con.outerWidth();  //domread
		// var height = targt_con.outerHeight(); //domread

		var top = offset.top - parent_offset.top;

		var con_height = this.state('window_height') - this.getBoxDemension(this.getNavOHeight, 'navs_height'); //domread, can_be_cached
		var con_width = this.getBoxDemension(this.getAMCWidth, 'screens_width', this.state('workarea_width'));

		var scale_x = width/con_width;
		var scale_y = height/con_height;
		var min_scale = Math.min(scale_x, scale_y);

		var shift_x = width/2 - min_scale * con_width/2;
		var shift_y = height/2 - min_scale * con_height/2;

		var lc = this.getLevelContainer(current_lev_num);

		var transform_values = {};
		var value = 'translate(' + (offset.left + shift_x) + 'px, ' + (top + shift_y) + 'px)  scale(' + min_scale + ')';
		transform_props.forEach(function(el) {
			transform_values[el] = value;
		});

		// from small size (size of button) to size of viewport

		return {
			lc: lc,
			transform_values: transform_values
		};
	},
	setVMpshow: function(target_mpx, value) {
		pv.mpx.update(target_mpx, 'vmp_show', value, sync_opt);
	},
	'model-mapch': {
		'move-view': function(change) {
			var parent = change.bwlev.getMD().getParentMapModel();
			if (parent){
			//	parent.updateState('mp_has_focus', false);
			}
			this.setVMpshow(this.getStoredMpx(change.bwlev.getMD()), change.value);
		},
		'zoom-out': function(change) {
			this.setVMpshow(this.getStoredMpx(change.bwlev.getMD()), false);
		},
		'destroy': function(change) {
			var md = change.bwlev.getMD();
			this.setVMpshow(this.getStoredMpx(md), false);
		}
	},
	animateMapSlice: (function() {

		var arrProtp = Array.prototype;
		var concat = arrProtp.concat;
		var concatArray = function(array_of_arrays) {
			return concat.apply(arrProtp, array_of_arrays);
		};

		var inCache = function(cache, key) {
			return cache.hasOwnProperty(key) && cache[key] !== false;
		};

		var needsDestroing = function(all_changhes) {
			var destroy_insurance = {}, i, cur, target, pvid;
			var result = [];

			for (i = 0; i < all_changhes.length; i++) {
				cur = all_changhes[i];
				target = cur.bwlev.getMD();
				pvid = target._provoda_id;
				if (cur.type == 'destroy'){
					destroy_insurance[pvid] = target;
				} else {
					destroy_insurance[pvid] = false;
				}
			}

			for (i = all_changhes.length - 1; i >= 0; i--) {
				cur = all_changhes[i];
				target = cur.bwlev.getMD();
				pvid = target._provoda_id;
				if (cur.type == 'destroy'){
					if (inCache(destroy_insurance, pvid)) {
						destroy_insurance[pvid] = false;
						result.unshift(target);
					}
				}
			}

			return result;
		};


	return function(transaction_data, animation_data) {
		var all_changhes = spv.filter(transaction_data.array, 'changes');
			all_changhes = concatArray(all_changhes);
		var models = spv.filter(all_changhes, 'target');
		var i, cur;

		if (!this.changes_number) {
			this.changes_number = 0;
		}

		this.changes_number++;

		var changes_number = this.changes_number;

		this.markAnimationStart(models, changes_number);

		var doomed = needsDestroing(all_changhes);
		for (i = doomed.length - 1; i >= 0; i--) {
			this.removeChildViewsByMd(this.getStoredMpx(doomed[i]), 'map_slice');
		}

		for (i = 0; i < all_changhes.length; i++) {
			var change = all_changhes[i];
			var handler = this['model-mapch'][change.type];
			if (handler){
				handler.call(this, change);
			}
		}

		if (transaction_data.bwlev){
			var target_md = transaction_data.bwlev.getMD();
			var current_lev_num = pv.state(target_md, 'map_level_num');

			if (animation_data){
				pv.update(this, 'disallow_animation', true, sync_opt);
				animation_data.lc.c.css(animation_data.transform_values);
				pv.update(this, 'disallow_animation', false, sync_opt);
			}

			pv.update(this, 'current_lev_num', current_lev_num, sync_opt);
			//сейчас анимация происходит в связи с сменой класса при изменении состояния current_lev_num

			if (animation_data && animation_data.lc){
				animation_data.lc.c.height(); //заставляем всё пересчитать
				animation_data.lc.c.css(empty_transform_props);
				/*this.nextLocalTick(function() {

				});*/
				animation_data.lc.c.height(); //заставляем всё пересчитать
			}

		}
		var _this = this;
		var completeAnimation = function() {
			_this.markAnimationEnd(models, changes_number);
		};
		setTimeout(completeAnimation, 16*21*4);
		if (!animation_data){
			completeAnimation();
		} else {
			animation_data.lc.onTransitionEnd(completeAnimation);
		}
	};
	})(),
	'collch-$spec_det-map_slice': {
		is_wrapper_parent: '^',
		space: 'detailed',
		place: viewOnLevelP
	},
	'collch-$spec_common-map_slice': {
		place: viewOnLevelP
	},
	'sel-coll-map_slice': '$spec_common-map_slice',
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
    var mp_show_states = nesting_data.residents_struc.mp_show_states;
    var transaction = nesting_data.transaction;
    var old_transaction = old_nesting_data && old_nesting_data.transaction;

    var diff = pv.hp.probeDiff(nesting_data.transaction.bwlev, old_nesting_data && old_nesting_data.transaction.bwlev);

    var bwlevs = nesting_data.residents_struc && nesting_data.residents_struc.bwlevs;
    var mds = nesting_data.residents_struc.items;
		var target_md;


		var array = this.getRendOrderedNesting(nesname, bwlevs) || bwlevs;
		var i, cur;

		var animation_data = this.readMapSliceAnimationData(diff);

		for (i = array.length - 1; i >= 0; i--) {
			var cur_md = mds[i];
			cur = array[i];

			var dclr = pv.$v.selecPoineertDeclr(this.dclrs_fpckgs, this.dclrs_selectors,
							nesname, cur_md.model_name, this.nesting_space);

			this.callCollectionChangeDeclaration(dclr, nesname, cur);
		}

		//avoid nextTick method!

		if (this.completely_rendered_once['map_slice']){
			if (transaction){
				this.animateMapSlice(transaction, animation_data);
				if (!transaction.bwlev){
					target_md = this.findBMapTarget(array);

					if (target_md){
						pv.update(this, 'current_lev_num', pv.state(target_md, 'map_level_num'), sync_opt);
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
				this.setVMpshow(this.getStoredMpx(array[i]), mp_show_states[i]);
			}
			pv.update(this, 'current_lev_num', pv.state(target_md, 'map_level_num'), sync_opt);
			this.markAnimationEnd(models, -1);
			this.completely_rendered_once['map_slice'] = true;
		}
	},

	transform_props: transform_props,
	'stch-current_mp_bwlev': function(target) {

		//map_level_num
		//md.map_level_num



		/*
		var oved_now_active = old_md && (old_md.map_level_num-1 ===  md.map_level_num);
		if (old_md){
			target.hideLevNum(old_md.map_level_num);
			if (!oved_now_active){
				target.removePageOverviewMark(old_md.map_level_num-1);
			}
		}
		if (md.map_level_num != -1 && (!old_md || old_md.map_level_num != -1)){
			target.hideLevNum(-1);
		}

		target.addPageOverviewMark(md.map_level_num - 1);
		target.showLevNum(md.map_level_num);
		if (oved_now_active){
			target.removePageOverviewMark(old_md.map_level_num-1);
		}

		*/



		/*
		var highlight = md.state('mp-highlight');
		if (highlight && highlight.source_md){
			var source_md = highlight.source_md;

			var md_view = target.findMpxViewInChildren(md.mpx);
			if (md_view){
				var hl_view = md_view.findMpxViewInChildren(source_md.mpx);
				if (hl_view){
					//target.scrollTo(hl_view.getC());
				}
			}
		}*/
		/*

		var ov_md = md.getParentMapModel();
		var ov_highlight = ov_md && ov_md.state('mp-highlight');
		if (ov_highlight && ov_highlight.source_md){
			var source_md = ov_highlight.source_md;
			var mplev_item_view = source_md.getRooConPresentation(target);
			if (mplev_item_view){
				target.scrollTo(mplev_item_view.getC(), {
					node: target.getLevByNum(md.map_level_num - 1).scroll_con
				}, {vp_limit: 0.4, animate: 117});
			}


		}*/

		var bwlev = target.getNesting('current_mp_bwlev');
		var parent_bwlev = bwlev.getParentMapModel();
		var md = target.getNesting('current_mp_md');



		setTimeout(function() {
			if (!target.isAlive()){
				target = null;
				return;
			}

			//

			var parent_md = md.getParentMapModel();
			if (parent_md){
				// var mplev_item_view = target.getStoredMpx(md).getRooConPresentation(target, false, false, true);
				var mplev_item_view = target.getMapSliceChildInParenView(bwlev, md);
				var con = mplev_item_view && mplev_item_view.getC();
				var map_level_num = pv.state(bwlev, 'map_level_num') - 1;
				if (con && con.height()){
					target.scrollTo(mplev_item_view.getC(), {
						node: target.getLevByNum(map_level_num).scroll_con
					}, {vp_limit: 0.4, animate: 117});
				} else {
					target.getLevByNum(map_level_num).scroll_con.scrollTop(0);
				}
			}
		}, 150);





	}

});
AppBaseView.BrowserAppRootView = BrowserAppRootView;
AppBaseView.viewOnLevelP = viewOnLevelP;

var WebAppView = spv.inh(AppBaseView, {}, {
	createDetails: function() {
		this._super();
		this.root_view_uid = Date.now();

		var _this = this;
		setTimeout(function() {
			spv.domReady(_this.d, function() {
				_this.buildAppDOM();
				_this.onDomBuild();
				_this.completeDomBuilding();
				_this.RPCLegacy('attachUI', _this.root_view_uid);
			});
		});
		this.on('die', function() {
			this.RPCLegacy('detachUI', this.root_view_uid);
		});
		this.on('state_change-current_mp_bwlev', function() {
			_this.resortQueue();
		});

		(function() {
			var wd = this.getWindow();
			var checkWindowSizes = spv.debounce(function() {
				_this.updateManyStates({
					window_height: wd.innerHeight,
					window_width: wd.innerWidth
				});
			}, 150);

			spv.addEvent(wd, 'resize', checkWindowSizes);

			this.onDie(function(){
				spv.removeEvent(wd, 'resize', checkWindowSizes);
				wd = null;
			});


		}).call(this);

		this.onDie(function(){

			_this = null;
		});
	},
	remove: function() {
		this._super();
		if (this.d){
			var wd = this.getWindow();
			$(wd).off();
			$(wd).remove();
			wd = null;

			if (this.d.body && this.d.body.firstChild && this.d.body.firstChild.parentNode){
				$(this.d.body).off().find('*').remove();

			}
			$(this.d).off();
			$(this.d).remove();


		}


		this.d = null;
	},
	resortQueue: (function() {

		var getView = function(md, bwlev) {
			var parent_view = bwlev.map_parent && this.getMapSliceView(bwlev, md);
			if (parent_view) {
				var views = this.getStoredMpx(md).getViews();
				return pv.$v.matchByParent(views, parent_view);
			}
		};

		return function (queue) {
			if (queue){
				queue.removePrioMarks();
			} else {
				if (this.all_queues) {
					for (var i = 0; i < this.all_queues.length; i++) {
						this.all_queues[i].removePrioMarks();
					}
				}

			}
			var md = this.getNesting('current_mp_md');
			var view = md && getView.call(this, md, this.getNesting('current_mp_bwlev'));
			if (view){
				view.setPrio();
			}
		};
	})(),
	onDomBuild: function() {
		this.used_data_structure = getUsageTree.call(this, getUsageTree, this);
		this.RPCLegacy('knowViewingDataStructure', this.constr_id, this.used_data_structure);
		pvUpdate(this.opts.bwlev, 'view_structure', this.used_data_structure);
		console.log(this.used_data_structure);

	},
	wrapStartScreen: function(start_screen) {
		var st_scr_scrl_con = start_screen.parent();
		var start_page_wrap = st_scr_scrl_con.parent();

		var tpl = this.pvtemplate(start_page_wrap, false, false, {
			'$lev_num': -1
		});


		this.tpls.push(tpl);

		this.lev_containers[-1] = {
			c: start_page_wrap,
			material: start_screen,
			scroll_con: st_scr_scrl_con
		};
	},
	buildAppDOM: function() {
		this.c = $(this.d.body);
		var _this = this;
		//var d = this.d;


		var wd = this.getWindow();
		_this.updateManyStates({
			window_height: wd.innerHeight,
			window_width: wd.innerWidth
		});
		if (this.ui_samples_csel) {
			this.els.ui_samples = this.c.find(this.ui_samples_csel);
		}
	},
	ui_samples_csel: '#ui-samples'
});
AppBaseView.WebAppView = WebAppView;

var WebComplexTreesView = spv.inh(WebAppView, {}, {
	'collch-current_mp_md': function(name, value) {
		pv.update(this, 'current_mp_md', value._provoda_id);
	},
	'collch-current_mp_bwlev': function(name, value) {
		pv.update(this, 'current_mp_bwlev', value._provoda_id);
	},
	'collch-navigation': {
		place: 'nav.daddy'
	},

	'stch-full_page_need': function(target, state) {
		target.els.screens.toggleClass('full_page_need', !!state);
	},
	'stch-root-lev-search-form': function(target, state) {
		target.els.search_form.toggleClass('root-lev-search-form', !!state);
	},
	'stch-show_search_form': function(target, state) {
		if (!state){
			target.search_input[0].blur();
		}
	},
	remove: function() {
		this._super();

		//this.search_input = null;
		//this.nav = null;
	},
	buildAppDOM: spv.precall(AppBaseView.WebAppView.prototype.buildAppDOM, function() {
		this.selectKeyNodes();
		this.buildNav();
		this.buildSearchForm();
		this.handleSearchForm(this.els.search_form);
	}),
	onDomBuild: function() {
		this._super();
		this.c.addClass('app-loaded');
		var ext_search_query = this.els.search_input.val();
		//must be before start_page view set its value to search_input
		this.RPCLegacy('checkUserInput', {
			ext_search_query: ext_search_query
		});

	},
	handleSearchForm: function(form_node) {
		var tpl = this.createTemplate(form_node);
		this.tpls.push(tpl);

	},
	buildNav: function() {
		var justhead = this.els.navs;
		var daddy = justhead.find('.daddy');

		this.nav = {
			justhead: justhead,
			daddy: daddy
		};
		this.dom_related_props.push('nav');

		this.nav.daddy.empty().removeClass('not-inited');

		return this.nav;
	},
	buildSearchForm: function() {
		var search_form = $('#search', this.d);
		this.els.search_form = search_form;

		search_form.submit(function(){return false;});
		var search_input =  $('#q', search_form);

		this.search_input = this.els.search_input = search_input;
		this.dom_related_props.push('search_input');

		var _this = this;

		search_input.on('keyup change input', spv.throttle(function() {
			var input_value = this.value;
			_this.overrideStateSilently('search_query', input_value);
			_this.RPCLegacy('search', input_value);
		}, 100));

		search_input.on('keyup', spv.throttle(function(e) {
			if (e.keyCode == 13) {
				_this.RPCLegacy('refreshSearchRequest', Date.now());
			}
		}, 100));

		search_input.on('activate_waypoint', function() {
			search_input.focus();
		});

		this.onDie(function() {
			search_input.off();
			search_input = null;
		});
	}
});

AppBaseView.WebComplexTreesView = WebComplexTreesView;

return AppBaseView;
});
