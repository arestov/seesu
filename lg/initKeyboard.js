(function() {
"use strict";
if (!window.lgKb) {
	return;
}
window.lgKb.setInitEventHandler(function() {
	if (!window.lgKb) {
		return;
	}
	window.lgKb.onChange = function(node) {
		$(node).trigger('vkeyboard_change');
	};

	window.lgKb.onHide = function() {
		var node = window.document.activeElement;
		if (node && node.blur) {
			node.blur();
		}
		
	};
	
});

})();