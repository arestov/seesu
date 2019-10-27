define(function(require) {
'use strict';
var $ = require('jquery');

var find = function(con, selector) {
  return $(con).find(selector)
}

var append = function(place, target) {
  $(place).append(target);
}

var prepend = function(place, target) {
  return $(place).prepend(target);
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

var unwrap = function(wrapped) {
  if (!wrapped) {
    return null;
  }

  if ("nodeType" in wrapped) {
    return wrapped
  }

  if ("length" in wrapped) {
    return wrapped[0]
  }

  return null;
}

var parent = function(node) {
  return $(node).parent()
}


var getText = function(node) {
  return $(node).text()
}

var setText = function(node, value) {
  return $(node).text(value);
}

var remove = function(node) {
  return $(node).remove();
}

var prev = function(node) {
  return $(node).prev()
}

var is = function(one, two) {
  return $(one).is(two);
}


var offset = function(node) {
  return $(node).offset();
}

var outerWidth = function(node) {
  return $(node).outerWidth()
}

var outerHeight = function(node) {
  $(node).outerHeight()
}



var height = function(node) {
  return $(node).height()
}

var css = function(node, css) {
  return $(node).css(css);
}


var scrollTop = function(node, value) {
  node.scrollTop(value)
}

return {
  find: find,
  append: append,
  prepend: prepend,
  after: after,
  detach: detach,
  before: before,
  wrap: wrap,
  unwrap: unwrap,
  parent: parent,
  getText: getText,
  setText: setText,
  remove: remove,
  prev: prev,
  is: is,
  offset: offset,
  outerWidth: outerWidth,
  outerHeight: outerHeight,
  height: height,
  css: css,
  scrollTop: scrollTop,
}

})
