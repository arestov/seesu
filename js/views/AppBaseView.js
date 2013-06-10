define(['provoda', 'spv', 'jquery','./filters'], function(provoda, spv, $, filters){



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
	createDetailes: function() {
		this.root_view = this;
		this.d = this.opts.d;
		this.tpls = [];
		this.samples = {};
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
				material: tpl.ancs['material']
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
});
return AppBaseView;
});