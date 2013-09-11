define(['jquery'], function($){
'use strict';

var Panoramator = function(){};
Panoramator.prototype = {
	constructor: Panoramator,
	init: function(opts){

		if (opts.onUseEnd){
			this.onUseEnd = opts.onUseEnd;
		}
		

		var _this = this;
		this.viewport = opts.viewport;
		this.viewport.on('mousedown', function(e){
			if (e.which && e.which != 1){
				return true;
			}
			e.preventDefault();
			_this.handleUserStart(e);
		});
		this.improved_con = opts.improved_con;
		this.lift = opts.lift;
		this.ready_class_name = opts.ready_class_name || 'ready_to_use';
		this.lift_items = [];
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

	},
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
		this.path_points.push({
			cpos: e.pageX,
			time: e.timeStamp
		});
		

		var path_diff = this.path_points[0].cpos - e.pageX;
		var target_pos = -this.path_points.lift_pos -path_diff;
		var move_data = this.getMoveData(target_pos);

		
		//this.lift.stop();
		this.lift.css("margin-left", (move_data.main + move_data.above_limit/this.limit_difficult) + 'px');
		
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
		var lift_target_pos = -this.path_points.lift_pos -last_diff;

		this.path_points.push({
			cpos: e.pageX,
			time: e.timeStamp
		});

		if (this.checkVectorAndSpeed()){
			var move_data = this.getMoveData(lift_target_pos);
			if (move_data.above_limit){
				this.lift.animate({
					"margin-left": move_data.main + 'px'
				}, this.standart_animation_time);
			}

		}


		$(this.viewport[0].ownerDocument)
			.off('mouseup', this.mouseUp)
			.off('mousemove', this.mouseMove);
		this.viewport.removeClass('touching-this');
		if (this.onUseEnd){
			this.onUseEnd();
		}
		//this.viewport
	},
	handleUserStart: function(e){
		
	
		this.lift.stop();
		this.path_points = [];
		this.path_points.lift_pos = this.getLiftPos();
		this.path_points.push({
			cpos: e.pageX,
			time: e.timeStamp
		});
		this.viewport.addClass('touching-this');
		$(this.viewport[0].ownerDocument)
			.on('mousemove', this.mouseMove)
			.on('mouseup', this.mouseUp);

	},
	setCollection: function(array){
		this.lift_items = array;
		this.checkSize();
		this.lift.addClass(this.ready_class_name);
	},
	checkSize: function(){
		this.total_width = this.checkTotalWidth();
		if (!this.improved_con){
			this.lift.css({
				width: this.total_width + 'px'
			});
		}
		
		this.viewport_width = this.viewport.width();
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
	getLiftPos: function(){
		return -parseFloat(this.lift.css("margin-left")) || 0;
	},
	checkTotalWidth: function() {
		if (this.improved_con){
			return this.lift.outerWidth(true);
		} else {
			var width = 0;
			$.each(this.lift_items, function(i ,el) {
				width += $(el).outerWidth(true);
			});
			return width;
		}
		
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
			this.lift.animate({
				"margin-left": target_pos + 'px'
			},  speed ? this.getAnimationTime(target_pos, -lift_pos, speed) :  (time || this.standart_animation_time));
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
			this.lift.animate({
				"margin-left": target_pos + 'px'
			}, speed ? this.getAnimationTime(target_pos, -lift_pos, speed) :  (time || this.standart_animation_time));
			return true;

		} else {
			return false;
		}
		
	}

};
return Panoramator;
});