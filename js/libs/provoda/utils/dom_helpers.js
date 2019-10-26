define(function(require) {
'use strict';
var $ = require('jquery');

var append = function(place, target) {
  $(place).append(target);
}

var after = function(place, target) {
  $(place).after(target)
}

var detach = function(target) {
  $(target).detach();
}

var before = function(place, comment_anchor) {
  $(place).before(comment_anchor);
}

var wrap = function(node) {
  return $(node);
}


var getText = function(node) {
  return $(node).text()
}

var setText = function(node, value) {
  return $(node).text(value);
}

return {
  append: append,
  after: after,
  detach: detach,
  before: before,
  wrap: wrap,
  getText: getText,
  setText: setText,
}

})
