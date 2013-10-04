define(['provoda', 'spv', 'jquery','./modules/filters'], function(provoda, spv, $, filters){
"use strict";


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

var AppBaseView = function() {};
AppBaseView.viewOnLevelP = viewOnLevelP;
provoda.View.extendTo(AppBaseView, {
	dom_rp: true,
	createDetails: function() {
		this.root_view = this;
		this.d = this.opts.d;
		this.tpls = [];
		this.els = {};
		this.samples = {};
		this.lev_containers = {};
		this.dom_related_props.push('samples', 'lev_containers', 'els');
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
			var tpl = this.buildTemplate();
			tpl.init({
				node: node,
				spec_states: {
					'$lev_num': num
				}
			});

			this.tpls.push(tpl);
			tpl.setStates(this.states);

			return this.lev_containers[num] = {
				c: node.appendTo(this.els.screens),
				scroll_con: tpl.ancs['scroll_con'],
				material: tpl.ancs['material'],
				tpl: tpl
			};
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
		opts = opts || {};
	//	if (!this.view_port || !this.view_port.node){return false;}

		//var scrollingv_port = ;

		//var element = view.getC();

	//	var jnode = $(view.getC());
		if (!jnode[0]){
			return;
		}

		var view_port_limit = opts.vp_limit || 1;

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
			if (opts.animate){
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
	getSample: function(name) {
		var sample_node = this.samples[name];
		if (!sample_node){
			sample_node = this.samples[name] = this.els.ui_samples.children('.' + name);
		}
		if (!sample_node[0]){
			sample_node = this.samples[name] = this.requirePart(name);
		}
		if (!sample_node[0]){
			throw new Error('no such sample');
		}
		return $(sample_node).clone();
	},
	animationMark: function(models, prop, anid) {
		for (var i = 0; i < models.length; i++) {
			models[i].getMD().updateState(prop, anid);
		}
	},
	'collch-map_slice': function(nesname, nesting_data){
		var array = nesting_data.items;
		var transaction_data = nesting_data.transaction;
		array = this.getRendOrderedNesting(nesname, array) || array;
		var i, cur;

		for (i = 0; i < array.length; i++) {
			cur = array[i];
			var model_name = cur.model_name;
			if (this['spec-collch-' + model_name]){
				this.callCollectionChangeDeclaration(this['spec-collch-' + model_name], model_name, cur);
			} else {
				this.callCollectionChangeDeclaration({
					place: AppBaseView.viewOnLevelP
				}, model_name, cur);
			}
		}
		/*

			'compx-current_lev_num': {
		depends_on: ['current_mp_md'],
		fn: function(md) {
			return md.map_level_num;
		}
	},
		
		spec_states


		map_animating, mp_show_end
		используется для того, что бы понять - можно ли считывать координаты элементов views или они в анимации ()
		*/
		if (transaction_data){
			var all_changhes = spv.filter(transaction_data.array, 'changes');
			all_changhes = [].concat.apply([], all_changhes);
			var models = spv.filter(all_changhes, 'target');

			this.animationMark(models, 'animation_started', transaction_data.anid);

			for (i = 0; i < all_changhes.length; i++) {
				cur = all_changhes[i];
				var target = cur.target.getMD();

				/*if (cur.type == 'move-view'){

					target.updateState('vis_mp_show', {
						anid: transaction_data.anid,
						value: cur.value
					});
					//MUST UPDATE VIEW, NOT MODEL!!!!!
				} else */

				if (cur.type == 'destroy'){
					this.removeChildViewsByMd(target.mpx);
				}

			}
			if (transaction_data.target){
				var current_lev_num = transaction_data.target.getMD().map_level_num;
				var lc;
				/*
				if (current_lev_num != -1){
					lc = this.getLevelContainer(current_lev_num);
					this.updateState('disallow_animation', true);

					lc.c.css({
						'-webkit-transform': 'translate(5px, 5px)  scale(0.1)'
					});
					//lc.tpl.spec_states['disallow_animation'] = true;



					//lc.tpl.spec_states['disallow_animation'] = false;

					this.updateState('disallow_animation', false);
				}*/

				this.updateState('current_lev_num', current_lev_num);
				/*

				if (lc){
					this.nextTick(function() {
						lc.c.css('-webkit-transform', '');
					});
					
				}*/

				//сейчас анимация происходит в связи с сменой класса при изменении состояния current_lev_num
			}
			this.nextTick(function() {
				this.animationMark(models, 'animation_completed', transaction_data.anid);
			});
			
		}


	},

	'stch-current_mp_md': function(md, old_md) {

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

			var md_view = this.getChildView(md.mpx, 'main');
			if (md_view){
				var hl_view = md_view.getChildView(source_md.mpx, 'main');
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
			var mplev_item_view = source_md.getRooConPresentation();
			if (mplev_item_view){
				this.scrollTo(mplev_item_view.getC(), {
					node: this.getLevByNum(md.map_level_num - 1).scroll_con
				}, {vp_limit: 0.4, animate: 117});
			}

			
		}*/


		var _this = this;
		setTimeout(function() {
			var parent_md = md.getParentMapModel();
			if (parent_md){
				var mplev_item_view = md.mpx.getRooConPresentation(false, false, true);
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

		





		//var parent_md = md.getParentMapModel();
		//this.getChildView(mpx)
	},
	"stch-doc_title": function(title) {
		this.d.title = title || "";
	}

});
return AppBaseView;
});