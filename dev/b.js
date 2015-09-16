(function() {
	[].forEach.call(document.querySelectorAll('*'), function(el) {
		var pv_class = el.getAttribute('pv-class');
		if (!pv_class) {return;}

		var struct = getStruct(pv_class);

		el.setAttribute('pv-class', struct.value);
	});
})();


function getStruct(value) {
	var simple_classes = [];
	var result = value.replace(/\{\{.+?\}\}|\S+/gi, function(part) {
		var calculable = part.charAt(0) == '{';
		if (!calculable) {
			simple_classes.push(part);
			return '';
		} else {
			return replace(part) || '';
		}

	});
	return {
		array: simple_classes,
		value: result
	};
}

function replace(string) {
	var value = string.replace(/^\{\{|\}\}$/gi,'');
	// console.log('VALUE', value);

	var struct = value.match(/(.+?)\s?\&\&\s?\'(.+?)\'$/);
	if (!struct || !struct.length) {
		console.warn('WRONG', value);
		return;
	}

	// console.log()

	var cond = struct[1];
	var result = struct[2];

	return result + ': ' + (cond.match(/\s/) ? ['{{', cond, '}}'].join(' ') : cond);

}