
resizeWidg = function(){
  var device = 'screen';
  
  var body = document.getElementsByTagName('body')[0];
	
  /** Helper for controlling window resize
   * @Author Benjamin "ICantDrink" Joffe
   */
  (function() {
    if (device !== "screen") return;
    
    
    function widgetResize(width, height) {
	    var zoom = (device == "mobile") ? window.innerWidth / document.documentElement.offsetWidth : 1;
	    body.style.height = (height-4) + 'px';
	    window.resizeTo(width * zoom, height * zoom);
	    
	    
	    
	    var compensation = device == "screen" ? 133 : 105; // magic numbers FTW!!
 	 }
    
    var ResizeConfig = {
      MinWidth  : 640,
      MinHeight : 600
    };
    
    var width = parseInt(widget.preferenceForKey('width'), 10) || ResizeConfig.MinWidth;
    var height = parseInt(widget.preferenceForKey('height'), 10) || ResizeConfig.MinHeight;
    
    var timeout = 0;
    function resizeWindow() {
      timeout = 0; // clearit.
      width = Math.max(width, ResizeConfig.MinWidth);
      height = Math.max(height, ResizeConfig.MinHeight);
      
      widgetResize(width, height);
    }
    
    window.addEventListener("resize", function(event) {
      if(!timeout) {
        widgetResize(width, height);
      }
    }, false);
    
    window.onscroll = function() {
      //window.scrollTo(0,0);
    };
    
    resizeWindow();
    
    function drag(e0, x, y) {
      e0.preventDefault(); // Prevent text selection
      
      var width0 = width;
      var height0 = height;
      document.addEventListener('mousemove', mousemove, false);
      document.addEventListener('mouseup',   mouseup, false);
      
      function mousemove(e1) {
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
      
      function mouseup(e) {
          document.removeEventListener('mousemove', mousemove, false);
          document.removeEventListener('mouseup'  , mouseup  , false);
          
          widget.setPreferenceForKey(window.innerWidth,'width');
          widget.setPreferenceForKey(window.innerHeight,'height');
      }
    };
    
    document.getElementById('resize-handle').onmousedown = function(e) {

      drag(e, 1, 1);
    };
    
    document.onmouseup = function() {
      document.onmousemove = null;
    };
  })();
}
document.addEventListener( 'DOMContentLoaded' , resizeWidg, false);