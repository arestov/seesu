var d = window.document;
var cbp;
if (window.chrome && chrome.extension){
	cbp = chrome.extension.getBackgroundPage();	
} else if (window.opera && opera.extension && opera.extension.bgProcess){
	cbp = opera.extension.bgProcess;
}
cbp.big_timer.setN('popup-start');
cbp.jsLoadComplete({
	test: function() {
		return cbp.app_env
	},
	fn: function() {
		cbp.handleDocument(window.document, {category: 'popup-init', start_time: 'popup-start'});
		//cbp.handleDocument(d);
	}
});
