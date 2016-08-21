'use strict';

var exp = /\S+\s*\:\s*(\{\{.+?\}\}|\S+)/gi;
var two_part = /(\S+)\s*\:\s*(?:\{\{(.+?)\}\}|(\S+))/;

module.exports = function getStruct(value) {
  var statements = value.match(exp);
  if (!statements.length) { return; }

  var result = {};
  for (var i = statements.length - 1; i >= 0; i--) {
    var parts = statements[i].match(two_part);
    var class_name = parts[1];
    var condition = parts[2] || parts[3];
    if (!class_name || !condition) {
      throw new Error('wrong statement: ' + statements[i]);
    }
    result[class_name] = condition;
  }

  return result;
};
