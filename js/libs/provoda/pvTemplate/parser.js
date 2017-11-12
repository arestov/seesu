define(function(require) {
'use strict';

var d_parsers = require('./directives_parsers');
var config = d_parsers.config;

var parser = {
  config: config,
  comment_directives_p: d_parsers.comment_directives_p,
  directives_p: d_parsers.directives_p,
  scope_generators_p: d_parsers.scope_generators_p,
  parse: null,
  parseEasy: null
};

return parser;
});
