define(['jquery'], function($){
'use strict';

var dom_style_obj = document.body.style;
var has_transform_prop;
['transform', '-o-transform', '-webkit-transform', '-moz-transform'].forEach(function(el) {
	if (!has_transform_prop && el in dom_style_obj){
		has_transform_prop = el;
	}
});
var getLeftPos, setLeftPos, animateLeftPos;
var simple_replace = /(px)|\(|\)/gi;
var cached_value;

var changeCache = function(step_value) {
	cached_value = step_value;
};
if (false && has_transform_prop){
	/*getLeftPos = function(node) {
		var value = $(node).css(has_transform_prop);
		return parseFloat(value.replace('translateX', '').replace(simple_replace,''));

	};
	setLeftPos = function(node, value) {

	};
	animateLeftPos = function() {

	};*/
} else {
	getLeftPos = function(node) {
		if (typeof cached_value == 'undefined'){
			var value = $(node).css('margin-left');
			cached_value = parseFloat(value.replace(simple_replace,''));
		}
		return cached_value;
	};
	setLeftPos = function(node, value) {
		cached_value = value;
		node.css('margin-left', value + 'px');
	};
	animateLeftPos = function(node, value, time) {
		node.animate({
			'margin-left': value + 'px'
		}, {
			step: changeCache,
			duration: time
		});
	};
}
//  transform: translate(350px,0);

var PathPoint = function(cpos, time) {
	this.cpos = cpos;
	this.time = time;
};

var Panoramator = function(opts){

	this.total_width = null;
	this.viewport_width = null;
	this.lift_items = [];

	this.onUseEnd = null;
	if (opts.onUseEnd){
		this.onUseEnd = opts.onUseEnd;
	}
	this.getFastLiftWidth= null;
	if (opts.getFastLiftWidth){
		this.getFastLiftWidth = opts.getFastLiftWidth;
	}
	

	var _this = this;
	this.viewport = opts.viewport;
	this.viewport.on('mousedown', function(e){
		if (e.which && e.which != 1){
			return true;
		}
		_this.refreshLiftWidth();
		e.preventDefault();
		_this.handleUserStart(e);
	});
	this.improved_con = opts.improved_con;
	this.lift = opts.lift;

	
	this.mouseMove = function(e){
		if (e.which && e.which != 1){
			return true;
		}
		_this.cursorMove(e);
	};
	this.mouseUp = function(e){
		if (e.which && e.which != 1){
			return true;
		}
		_this.handleUserEnd(e);
	};
	this.path_points = [];
	this.move_star_lift_pos = null;
};
Panoramator.prototype = {
	constructor: Panoramator,
	limit_difficult: 3,
	mininmal_speed: 0.5,
	normal_speed: 0.7,
	standart_animation_time: 150,
	getMoveData: function(target_pos){
		if (target_pos > 0 || (this.total_width < this.viewport_width)){
			return {
				main: 0,
				above_limit: target_pos
			};
		} else {
			var allowed_length = this.total_width - this.viewport_width;
			if (-target_pos > allowed_length){
				return {
					main: -allowed_length,
					above_limit: allowed_length + target_pos
				};
			} else {
				return {
					main: target_pos,
					above_limit: 0
				};
			}
		}
	},
	cursorMove: function(e){
		//this.path_points
		this.path_points.push(new PathPoint(e.pageX, e.timeStamp));
		

		var path_diff = this.path_points[0].cpos - e.pageX;
		var target_pos = -this.move_star_lift_pos -path_diff;
		var move_data = this.getMoveData(target_pos);

		
		//this.lift.stop();
		setLeftPos(this.lift, (move_data.main + move_data.above_limit/this.limit_difficult));
		
	},
	checkVectorAndSpeed: function(){
		var first = this.path_points[0];
		var last = this.path_points[this.path_points.length-1];


		var travel = last.cpos - first.cpos;
		var speed = travel/(last.time - first.time);

		if (Math.abs(travel) > 5){
			if (Math.abs(speed) > this.mininmal_speed){
				if (speed > 0 ){
					return !this.prev(speed);
				} else {
					return !this.next(speed);
				}
			} else {

				return true;
			}
			//
			
			//with speed or not?

		} else {
			var all_path = 0;
			for (var i = 1; i < this.path_points.length; i++) {
				all_path += Math.abs(this.path_points[i].cpos - this.path_points[i-1].cpos);
			}
			if (all_path > 5){
			//	console.log(all_path)
				return true;
			} else {
				var vwpp = this.viewport.offset().left;
				var cur_pos = last.cpos - vwpp;
				cur_pos = this.viewport_width/2 - cur_pos;
				var center_factor = cur_pos * (1/(this.viewport_width/2));
				if (center_factor > 0){

					this.prev(false, 300 - 220 * Math.abs(center_factor));
				} else if (center_factor < 0) {
					this.next(false, 300 - 220 * Math.abs(center_factor));
				}
			//	console.log(center_factor);
				
			}

			//click or big gesture like circle?
			return true;
		}
	},
	handleUserEnd: function(e){

		var last_diff = this.path_points[0].cpos - this.path_points[this.path_points.length-1].cpos;
		var lift_target_pos = -this.move_star_lift_pos -last_diff;

		this.path_points.push(new PathPoint(e.pageX, e.timeStamp));

		if (this.checkVectorAndSpeed()){
			var move_data = this.getMoveData(lift_target_pos);
			if (move_data.above_limit){
				animateLeftPos(this.lift, move_data.main, this.standart_animation_time);
			}

		}


		$(this.viewport[0].ownerDocument)
			.off('mouseup', this.mouseUp)
			.off('mousemove', this.mouseMove);
		this.viewport.removeClass('touching-this');
		if (this.onUseEnd){
			this.onUseEnd();
		}
		this.path_points.length = 0;
		//this.viewport
	},
	handleUserStart: function(e){
		
	
		this.lift.stop();
		this.move_star_lift_pos = this.getLiftPos();
		this.path_points.push(new PathPoint(e.pageX, e.timeStamp));
		this.viewport.addClass('touching-this');
		$(this.viewport[0].ownerDocument)
			.on('mousemove', this.mouseMove)
			.on('mouseup', this.mouseUp);

	},
	setCollection: function(array, manual){
		this.lift_items = array;
		if (!manual && !this.improved_con){
			//this.setTotalWidth(this.checkTotalWidth());
		}
		
		
	},
	checkViewportWidth: function() {
		return this.viewport.width();
	},
	checkTotalWidth: function() {
		if (this.improved_con){
			return this.lift[0].scrollWidth;
		} else {
			var width = 0;
			$.each(this.lift_items, function(i ,el) {
				width += $(el).outerWidth(true);
			});
			return width;
		}
		
	},
	refreshLiftWidth: function() {
		if (this.getFastLiftWidth){
			this.setTotalWidth(this.getFastLiftWidth());
		} else {
			this.setTotalWidth(this.checkTotalWidth());
		}
		
	},
	setTotalWidth: function(total_width) {
		if (this.total_width == total_width){
			return;
		}
		this.total_width = total_width;
		if (!this.improved_con){
			this.lift.css({
				width: this.total_width + 'px'
			});
		}
	},
	setViewportWidth: function(viewport_width) {
		this.viewport_width = viewport_width;
	},
	checkSize: function(){
		//this.setTotalWidth(this.checkTotalWidth());
		this.setViewportWidth(this.checkViewportWidth());
	},
	isEdgeElem: function(el, mobil_pos_shift, next) {
		var cur = $(el);

		var position = cur.position().left;
		var width = cur.outerWidth();


		if ( next ? ((position + width) > (this.viewport_width + mobil_pos_shift)) : (position < mobil_pos_shift)){
			return {
				el: cur,
				left: position,
				owidth: width
			};
		}
	},
	getTargetPos: function(last_visible, next) {
		var pos = -last_visible.left + (this.viewport_width - last_visible.owidth)/2;
		return next ? Math.max(pos, -(this.total_width - this.viewport_width)) : Math.min(pos, 0);
	},
	getBestLiftPos: function() {
		//transform
		//transform: translate(350px,0);

	},
	setBestLiftPos: function() {

	},
	getLiftPos: function(){
		return -getLeftPos(this.lift) || 0;
	},
	toStart: function(){

	},
	toEnd: function(){

	},
	getNextEdgeElem: function(lift_pos){
		var last_visible;

		for (var i = 0; i < this.lift_items.length; i++) {

			last_visible = this.isEdgeElem(this.lift_items[i], lift_pos, true);
			if (last_visible){
				break;
			}

		}
		return last_visible;
	},
	getPrevEdgeElem: function(lift_pos){
		var last_visible;

		for (var i = this.lift_items.length - 1; i >= 0; i--) {
			last_visible = this.isEdgeElem(this.lift_items[i], lift_pos);
			if (last_visible){
				break;
			}
		}
		return last_visible;
	},
	getAnimationTime: function(target_pos, lift_pos, speed){
		return  ( target_pos - lift_pos )/(speed * 1.5);
	},
	next: function(speed, time){
		this.lift.stop(false, true);
		var lift_pos = this.getLiftPos();
		var last_visible = this.getNextEdgeElem(lift_pos);
		 
		if (last_visible){
			var target_pos = this.getTargetPos(last_visible, true);
			animateLeftPos(this.lift, target_pos, speed ? this.getAnimationTime(target_pos, -lift_pos, speed) :  (time || this.standart_animation_time));
			return true;
		} else {
			return false;
		}

		
	},
	prev: function(speed, time){
		this.lift.stop(false, true);
		var lift_pos = this.getLiftPos();
		var last_visible = this.getPrevEdgeElem(lift_pos);
		
		if (last_visible){
			var target_pos = this.getTargetPos(last_visible);
			animateLeftPos(this.lift, target_pos, speed ? this.getAnimationTime(target_pos, -lift_pos, speed) :  (time || this.standart_animation_time));

			return true;

		} else {
			return false;
		}
		
	}

};
return Panoramator;
});