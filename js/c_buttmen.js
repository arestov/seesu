
var button_menu = function(jq_node){
	this.node = jq_node;
	this.sectors = 20;
	this.node.data('buttmen', this);
	
	var but_hl_style = document.createElement('style');
		but_hl_style.setAttribute('title', 'button_menu');
		but_hl_style.setAttribute('type', 'text/css');
	
	
	var style = '  ';
	for (var i=1; i <= this.sectors; i++) {
		
		var x = i;
		var y = (((Math.atan(x - (this.sectors/2)))/Math.PI) + 0.5).toFixed(1);
		var style_ver = '\n .buttmen-hlts ' + '.buttmen-hlt-vertical-' + i + ' ';
		var style_hor = '\n .buttmen-hlts ' + '.buttmen-hlt-horizontal-' + i + ' ';
		style += style_hor + '.buttmen-hlt-left {opacity:' +  (1 - y) + ';}';
		style += style_hor + '.buttmen-hlt-right {opacity:' + (y) + ';}';
		style += style_ver + '.buttmen-hlt-top {opacity:' +  (1 - y) + ';}';
		style += style_ver + '.buttmen-hlt-bottom {opacity:' + (y) + ';}';
	};

	if (!but_hl_style.styleSheet){
		but_hl_style.appendChild(document.createTextNode(style));
	} else{
		but_hl_style.styleSheet.cssText = style;
	}
	
	
	document.documentElement.firstChild.appendChild(but_hl_style);

	
	
	jq_node.mousedown(this.events.mousedown)
	.mouseup(this.events.mouseup)
	.mousemove(this.events.mousemove);
	
	
	
}
button_menu.prototype = {
	rebind: function(){
		return this.node
			.data('buttmen', this)
			.unbind()
			.mousedown(this.events.mousedown)
			.mouseup(this.events.mouseup)
			.mousemove(this.events.mousemove);
		
		
	},
	events:{
		mousedown: function(e){
			e.preventDefault();
			var _this = $(this);
			var butt_hlts = _this.find('dd.buttmen-hlts ul');
			var playing_with_dots = false;
			var stat = setTimeout(function(){
				if (playing_with_dots){
					seesu.track_event('Buttmen', 'dots was showed and played');
				}
				
			},200)
			
			
			
			_this.addClass('buttmen-highlighting');
			var butt_main = $('dt.main-button', this).mouseleave(function(e){
				e.preventDefault();
				_this.removeClass('buttmen-highlighting').addClass('buttmen-butting');
				seesu.track_event('Buttmen', 'buttons are here');
				$(this).unbind('mouseleave');
			});
			$(document).mouseup(function(e){
				clearTimeout(stat);
				e.preventDefault();
				butt_main.unbind('mouseleave');
				setTimeout(function(){
					_this.removeClass('buttmen-butting');
					_this.removeClass('buttmen-highlighting');
					butt_hlts.attr('class', '' );
					seesu.track_event('Buttmen', 'some button was pressed');
				},10);
				
				$(document).unbind('mouseup');
				$(document).unbind('mousemove');
				
				return test_pressed_node(e.target, true)
			})
			
			
			var width = _this.width();
			var height = _this.height();
			var el_position = _this.offset();
			var border_top 		= el_position.top;
			var border_left 	= el_position.left;
			var border_right 	= border_left + width;
			var border_bottom 	= border_top + height;
			
			
			var sector_vertical = height/_this.data('buttmen').sectors;
			var sector_horizontal = width/_this.data('buttmen').sectors;
			
			$(document).mousemove(function(e){
				e.preventDefault();
				var x = e.pageX;
				var y = e.pageY;
				if ( (x > border_left) && (x < border_right) && (y > border_top ) && (y < border_bottom)){
					
					var sector_y = (y - border_top)/sector_vertical;
					
					
					var remainder_x = (x - border_left) % sector_horizontal;
					var sector_x = ((x - border_left) - remainder_x)/sector_horizontal + (remainder_x ? 1 : 0);
					
					var remainder_y = (y - border_top) % sector_vertical;
					var sector_y = ((y - border_top) - remainder_y)/sector_vertical + (remainder_y ? 1 : 0);
					
					butt_hlts.attr('class', 'buttmen-hlt-vertical-' + sector_y + ' '+ 'buttmen-hlt-horizontal-' + sector_x )
				}
				playing_with_dots = true;
				
			});
			
			
		},
		mouseup: function(e){
			e.preventDefault();
			var _this = $(this);
			_this.removeClass('buttmen-butting');
		},
		mousemove: function(e){
			e.preventDefault();
			if (window.getSelection) { window.getSelection().removeAllRanges(); } else 
			if (document.selection && document.selection.clear) {document.selection.clear();}
		}
	}
}
$(function(){
	var buttmen_node =  $('.buttmen');
	if (buttmen_node){
		seesu.buttmen = new button_menu(buttmen_node)
	}
	
	seesu.player.play_controls = seesu.buttmen;
})

