'use strict';
var plugin = require('./gulp-plugin');
var parse  = require('./sax-precise');
var path = require('path');

var gutil = require('gulp-util');

function copyFile(src, data, name) {
	return new gutil.File({
		cwd: src.cwd,
		base: src.base,
		path: name ?  path.join(path.dirname(src.path), name) : src.path,
		contents: ((data instanceof Buffer) ? data : new Buffer(data))
	});
}

module.exports = plugin('gulp-extract-html-style', function (options, file, enc, done) {
	var stream = this;
	parse(file.contents.toString(), {}, function(err, root) {

		if (err) {return done(err);}
		var styles = parse.select('style', root);

		var uninlined = '';
		for (var i = 0; i < styles.length; i++) {
			uninlined += text(styles[i]);
			remove(styles[i]);
		}

		var file_path = options.file_path;

		stream.push(copyFile(file, uninlined.replace(/^\s+\n|$/gi,''), file_path));

		if (options && options.noInject) {
			stream.push(copyFile(file, parse.stringify(root)));
			return done();
		}

		var head = parse.select('head', root);

		parse('<link src="' + file_path + '" rel="stylesheet"/>\n', {}, function(err, parsed) {
			if (err) {return done(err);}

			append(head[0], parsed[0]);
			append(head[0], parsed[1]);

			stream.push(copyFile(file, parse.stringify(root)));

			done();
		});
	});
});

function remove(node) {
	if (!node.parent) {return;}

	var index = node.parent.children.indexOf(node);
	if (index == -1) {return;}

	node.parent.children.splice(index, 1);

	var prev = node.prev;
	var next = node.next;

	if (node.prev) {
		node.prev.next = next || null;
		node.prev = null;
	}

	if (node.next) {
		node.next.prev = prev || null;
		node.next = null;
	}

	node.parent = null;
}

function after(target, node) {
	// var index = target.parent.children.indexOf(target);

}

function append(target, node) {
	var list = target.children;
	var last = list[ list.length - 1 ];
	list.push(node);
	node.prev = null;
	node.next = null;
	node.parent = target;
	if (last) {
		node.prev = last;
		last.next = node;
	}
}

function text(node) {
	if (node.type == 'text') {
		return node.data;
	}
	if (node.o.type =='node') {
		var result = '';
		for (var i = 0; i < node.children.length; i++) {

			result += text(node.children[i]);
		}
		return result;
	}
	return '';
}
