window.window_resizer = function(d){
	if(!$.browser.msie){
		if (app_env.opera_widget || app_env.firefox_widget){
			addEvent(d, "DOMContentLoaded", function(){
				var wb = d.getElementById('wb');
				if (!wb) {return false;}
				var resz_b = d.createElement('img');
					resz_b.src="i/resize.png"; resz_b.id='resize-handle'; resz_b.alt='/';
				wb.appendChild(resz_b);
				
				var body = d.body;
				
				
				var old_win_height = window.innerHeight;
				window.resizeTo(610,old_win_height );
				var size_shift = old_win_height - window.innerHeight;
			
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
					  d.removeEventListener('mousemove', mousemove, false);
					  d.removeEventListener('mouseup'  , mouseup  , false);
					  
					  
				  }
				  
				  addEvent(d, 'mousemove', mousemove);
				  addEvent(d, 'mouseup',   mouseup);
				  
				  
				  
				  
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
				  MinHeight : 610
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
				
				addEvent(resz_b, "mousedown", function(e) {
					drag(e, 1, 1);
				});
	
				resizeWindow();	
				
			})
		}
	}
	return true;
}
window.window_resized = window_resizer(document);

