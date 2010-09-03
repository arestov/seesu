if(!$.browser.msie){
	
	if (app_env.as_application){
		$(function(){
			var resize_button = $('#resize-handle');
			var body = document.getElementsByTagName('body')[0];
			
			
			var old_win_height = $(window).height();
			window.resizeTo(600,old_win_height );
			var size_shift = old_win_height - $(window).height();
		
			var save_size = function(){
				w_storage('width', window.innerWidth);
				w_storage('height', window.innerHeight);
		
			}
			var drag = function(e0, x, y) {
			  e0.preventDefault(); // Prevent text selection
			  
			  var width0 = width;
			  var height0 = height;
			  
			  var mousemove = function (e1) {
				  if (x === 1) {
					width = Math.round(Math.min(screen.availWidth, e1.clientX/e0.clientX*width0));
				  }
				  if (y === 1) {
					height = Math.round(Math.min(screen.availHeight, e1.clientY/e0.clientY*height0));
				  }
				  
				  if (!timeout) {
					timeout = setTimeout(resizeWindow, 1);
				  }
			  };
			  var mouseup = function (e) {
				  document.removeEventListener('mousemove', mousemove, false);
				  document.removeEventListener('mouseup'  , mouseup  , false);
				  
				  
			  }
			  
			  addEvent(document, 'mousemove', mousemove);
			  addEvent(document, 'mouseup',   mouseup);
			  
			  
			  
			  
			};
			var resize_body = function(new_body_height){
				if (typeof new_body_height === 'number'){
					 body.style.height = height + 'px';
				} else{
					var _win_height = window.innerHeight;
		
					body.style.height = _win_height + 'px';
				}
			}
			
		
		
			function widgetResize(width, height) {
				resize_body(height);
				window.resizeTo(width, height + size_shift);
		
				
				
			 }
			
			var ResizeConfig = {
			  MinWidth  : 640,
			  MinHeight : 600
			};	
			
			var width = parseInt(w_storage('width'), 10) || ResizeConfig.MinWidth;
			var height = parseInt(w_storage('height'), 10) || ResizeConfig.MinHeight;
			
			var timeout = 0;
			function resizeWindow() {
			  timeout = 0; // clearit.
			  width = Math.max(width, ResizeConfig.MinWidth);
			  height = Math.max(height, ResizeConfig.MinHeight);
			  
			  widgetResize(width, height);
			}
				
			
			addEvent(window, "resize", $.debounce(save_size, 1000));
			
			resize_button.mousedown(function(e) {
				drag(e, 1, 1);
			})
			resizeWindow();	
			
		})
	} else {
		$('#resize-handle').remove();
	}
}
