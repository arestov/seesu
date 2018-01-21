var promisify = require('util').promisify;
var parse = promisify(require('../sax-precise'))

var postcss = require('postcss');



// processor.process()


// postcss.parse()

var getStylesText = function(root) {
  var styles = parse.select('style', root);

  var uninlined = '';
  for (var i = 0; i < styles.length; i++) {
    uninlined += text(styles[i]);
    // remove(styles[i]);
  }

  return uninlined;
}

var getClassFromCSS = function(root) {
  var styles_text = getStylesText(root);
  var css_root = postcss.parse(styles_text);
  var list = [];
  css_root.walkRules(function(rule) {
    list.push(rule);
  })

  return list;
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
