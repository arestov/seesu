'use strict';
var traverse = require('traverse');

module.exports = function (opts) {
	opts = opts || {};

	// Work with options here

	return function (tree, result) {
		return tree;

		var replace = function(string) {
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

		};

		traverse(tree).forEach(function(entity) {
				if (!this.node.block) {return;}
				if (!entity.attrs || !entity.attrs['pv-class']) {return;}

				var value = entity.attrs['pv-class'];
				var simple_classes = [];

				


				this.after(function() {

						entity.attrs['pv-class'] = value.replace(/\{\{.+?\}\}|\S+/gi, function(part) {
							var calculable = part.charAt(0) == '{';
							if (!calculable) {
								simple_classes.push(part);
								return '';
							} else {
								return replace(part) || '';
							}

						});

						// entity.attrs = opts.attrsTree[cssrulekey(this.node)];

						this.update(entity);
				});
		});

		return tree;
		// Transform CSS AST here

	};
};
