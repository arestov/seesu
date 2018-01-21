var promisify = require('util').promisify;
var parse = promisify(require('../sax-precise'))

// var path = require('path');

var exp = /\S+\s*\:\s*(\{\{.+?\}\}|\S+)/gi;
var two_part = /(\S+)\s*\:\s*(?:\{\{(.+?)\}\}|(\S+))/;

var createPVClassParse = function(wrapItem) {
  return function(node, full_declaration, directive_name) {
    var statements = full_declaration.match(exp);
    if (!statements.length) { return; }

    var result = [];
    for (var i = statements.length - 1; i >= 0; i--) {
      var parts = statements[i].match(two_part);
      var class_name = parts[1];
      var condition = parts[2] || parts[3];
      if (!class_name || !condition) {
        throw new Error('wrong statement: ' + statements[i]);
      }

      result.push(wrapItem(class_name, condition, node, directive_name));
    }

    return result;

  }
}

var parsePVClass = createPVClassParse(function(class_name) {
  return class_name
});

function keyd(list) {
  var result = {};
  for (var i = 0; i < list.length; i++) {
    result[list[i]] = list[i];
  }
  return result;
}

function getNodeClasses(node) {
  var pv_class_full = node.attribs['pv-class'];
  var pv_class_list = pv_class_full && parsePVClass(null, pv_class_full);


  var class_name = node.attribs['class'];
  var class_list = class_name && class_name.split(/\s/);

  if (!class_list && !pv_class_list) {
    return;
  }

  var full_list = (class_list || []).concat(pv_class_list || []);
  var index = keyd(full_list);

  return {
    node: node,
    full_list: full_list,
    pv_class_list: pv_class_list,
    class_list: class_list,
    class_index: index,
  };
}

function getClasses(root) {
  var nodes = parse.select('*', root);
  return nodes.map(getNodeClasses).filter(function(arg){return arg;});
}


module.exports = getClasses;
