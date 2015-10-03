'use strict';

module.exports = function getStruct(value) {
	var simple_classes = [];
	var result = value.replace(/\{\{.+?\}\}|\S+(\x20*)/gi, function(part) {
		var calculable = part.charAt(0) == '{';
		if (!calculable) {
			simple_classes.push(part.replace(/\x20+/gi, ''));
			return '';
		} else {
			return replace(part) || '';
		}

	}).replace(/\n\s+?\n/gi, '\n').replace(/\n+/gi, '\n');
	return {
		array: simple_classes,
		value: result
	};
};

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