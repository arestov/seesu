var promisify = require('util').promisify;
var parse = promisify(require('../sax-precise'))
var postcss = require('postcss');

var getClassFromCSS = function(root) {
  var parsed =  parse.select('style', root).map(function(node) {
    return {
      node: node,
      css_root: postcss.parse(text(node)),
    };
  });

  var list = [];

  parsed.forEach(function(parsed) {
    parsed.css_root.walkRules(function(rule) {
      list.push(rule);
    })

  });

  return {
    style_nodes: parsed,
    rules: list
  };
}


module.exports = getClassFromCSS;

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
