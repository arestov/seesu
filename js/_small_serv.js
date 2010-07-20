hard_testing = false;

if (typeof console != 'object'){
	
	
	if  (navigator.userAgent.match(/Opera/)){
		log = function(){
				opera.postError.apply(opera, arguments)
			
		}
	} else {
		if (hard_testing) {
			document.addEventListener('DOMContentLoaded', function(){
				var h = document.getElementsByTagName('head')[0];
				var _s = document.createElement('script');
					_s.src = "http://userscripts.ru/js/nice-alert/nice_alert.js";
				h.appendChild(_s)
			}, false);
		}
		
	
		log = function(text){
			if (!hard_testing) {return false;}
			alert(text)	
		}
	}
	
	
	console = {};
	console.log = function(text){
		log(text)
	}	
} else {
	log = function(text){
		console.log(text)
	}
}
if (typeof System != "undefined") {
	log = function(text){
		System.Debug.outputString(text);
	}
}




if ((typeof widget != 'object')){
	widget.identifier = '0';
	widget.openURL = function(url){
		window.open(url);
	}
	
}
window.addEvent = window.addEventListener ? 
	function(elem, evType, fn){
		elem.addEventListener(evType, fn, false);
		return fn;
	}:
	function(elem, evType, fn){
		elem.attachEvent('on' + evType, fn);
		return fn;
	};
window.removeEvent = window.addEventListener ?
	function(elem, evType, fn){
		elem.removeEventListener(evType, fn, false);
	}:
	function(elem, evType, fn){
		elem.detachEvent('on' + evType, fn)
	};