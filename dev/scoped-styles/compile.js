'use strict';
var path = require('path');
var gutil = require('gulp-util');
var promisify = require('util').promisify;
var fs = require('fs');

var readFile = promisify(fs.readFile);
var parse = promisify(require('../sax-precise'))
var processor = require('postcss-selector-parser')();

var plugin = require('../gulp-plugin');
var examCSS = require('./exam-css');
var examHTML = require('./exam-html');


function copyFile(src, data, name) {
	return new gutil.File({
		cwd: src.cwd,
		base: src.base,
		path: name ?  path.join(path.dirname(src.path), name) : src.path,
		contents: ((data instanceof Buffer) ? data : new Buffer(data))
	});
}

function parseRule(rule) {
  var root = processor.astSync(rule.selector);
  var parsed_selector = root.nodes[0].nodes;
  // console.log(parsed_selector);
  return {
    rule: rule,
    selector_root: root,
    parsed_selector: parsed_selector,
  };
}

function getHTMLIndex(cls_html) {
  var all_indexes = cls_html.map(function(item) {
    return item.class_index;
  });

  all_indexes.unshift({})
  return Object.assign.apply(null, all_indexes);
}

function getCSSIndex (css_parsed) {
  var result = {};
  css_parsed.forEach(function(rule){
    rule.parsed_selector.forEach(function(part) {
      if (part.type !== 'class') {
        return;
      }
      result[part.value] = part.value;
    })

  });
  return result;
}


function checkHTML(css_parsed, cls_html) {
  var index = getCSSIndex(css_parsed);

  // console.log(index);

  console.log('HTML:');

  cls_html.forEach(function(item) {
    item.full_list.forEach(function(class_name) {
      if (!index[class_name]) {
        console.log(class_name);
      }
    })
  });
}

function replaceStyles(item, html_index) {
  var node = item.node;
  var css_root = item.css_root;

  //mutating

  css_root.walkRules(function(rule) {
    var selector_wrap = parseRule(rule);

    // console.log('selector_wrap', selector_wrap)
    // .walkCombinators

    // selector_wrap.rule.selector = ''

    selector_wrap.selector_root.walkClasses(function(part) {
      if (part.type !== 'class') {
        return;
      }

      var combSelector = part.parent;
      var comb = combSelector.parent;

      if (comb && comb.value === ':global') {
        // console.log('selector_wrap.selector_root', selector_wrap.selector_root)

        var realSelector = comb.parent;

        combSelector.remove();
        realSelector.insertBefore(comb, combSelector);
        comb.remove();

        return;
      }

      if (!html_index[part.value]) {
        console.warn(part.value, '\t', selector_wrap.rule.selector);
      } else {
        // console.log("ok", part.value);
      }

    });

    selector_wrap.rule.selector = selector_wrap.selector_root.toString();
  })
  return css_root.toString();
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

function replaceText(node, newText) {
  var first = node.children[0];
  first.data = newText;
  node.children = [first];
}

function replaceCSS(css, cls_html) {
  var html_index = getHTMLIndex(cls_html)
  css.style_nodes.forEach(function(item) {
    replaceText(item.node, replaceStyles(item, html_index));
  });
}

function checkCSS(css_parsed, cls_html) {
  var html_index = getHTMLIndex(cls_html)
  console.log('CSS:');

  css_parsed.forEach(function(parsed) {
    parsed.selector_root.walkClasses(function(part) {
      if (part.type !== 'class') {
        return;
      }

      if (part.parent.parent.value === ':global') {
        return;
      }

      if (!html_index[part.value]) {
        console.warn(part.value, '\t', parsed.rule.selector);
      } else {
        // console.log("ok", part.value);
      }

    });
  });
}

module.exports = plugin('gulp-compile-scoped-styles', function(options, file, enc, done) {
  var content = file.contents.toString();
  console.log(file.path);
  // console.log('!!!!!!!!!!!!!!', content)
  var html_root = parse(content, {});

  return html_root.then(function(html_root) {
    return Promise.all([examCSS(html_root), examHTML(html_root)])
      .then(function(values) {
        var css = values[0];
        var cls_css = css.rules;
        var cls_html = values[1];

        var css_parsed = cls_css.map(parseRule);

        checkHTML(css_parsed, cls_html);
        checkCSS(css_parsed, cls_html);

        replaceCSS(css, cls_html);

        return html_root;
      })
      .then(function(html_root) {
        return copyFile(file, parse.stringify(html_root));
      });
  })

  // done(null, );

  // var source = file.contents.toString();

  // fs.readFile(patch_path, function (err, patch) {
  //   if (err) {return console.error(err);}
  //
  //   patch = patch.toString();
  //
  //   var result = jsdiff.applyPatch(source, patch.toString(), diff_options);
  //
  //   if (!result) {
  //     return cb(patch.toString());
  //   }
  //
  //   file.contents = new Buffer(result);
  //
  //   setImmediate(function () {
  //     cb(null, file);
  //   });
  // });
});
