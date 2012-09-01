var bpath = '';
		
(function(){
function isFileReady ( readyState ) {
    // Check to see if any of the ways a file can be ready are available as properties on the file's element
    return ( ! readyState || readyState == 'loaded' || readyState == 'complete' );
  }	
	
	
var p = document.getElementsByTagName('script'),
	p = p[p.length-1]; 
		
window.loadJS = function(src, callback){
	var s = document.createElement('script'),
		done;
	s.onreadystatechange = s.onload = function () {

	  if ( ! done && isFileReady( s.readyState ) ) {

		// Set done to prevent this function from being called twice.
		done = true;
		callback();

		// Handle memory leak in IE
		s.onload = s.onreadystatechange = null;
	  }
	};
	s.src = src;
	p.parentNode.insertBefore(s, p);
};
})();
loadJS(bpath + 'js/common-libs/yepnope.1.5.4-min.js', function(){
	yepnope({
		load: bpath + 'js/_seesu.jslist.js',
		complete: function(){
			var cbp;
			if (window.chrome && chrome.extension){
				cbp = chrome.extension.getBackgroundPage();	
			} else if (window.opera && opera.extension && opera.extension.bgProcess){
				cbp = opera.extension.bgProcess;
			}

			if (!cbp || cbp != window){
				jsLoadComplete({
					test: function() {
						return window.app_env
					},
					fn: function() {
						handleDocument(window.document);
					}
				});
			}
			
		}
	});
});