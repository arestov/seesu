var test = require('ava')
var requirejs = require('requirejs');
var path = require('path')
requirejs.config({
  baseUrl: __dirname,
  map: {
		'*': {
			spv: path.join(process.cwd(), 'js/libs/spv.js'),
		}
	},
})
var parse = requirejs('./parse')
var asString = requirejs('./asString')


test('check asString', function(t) {
  'use strict'

  var pipe = function(str) {
    return asString(parse(str))
  }

  //
  // "< state_name < nesting < resource < #"

  t.snapshot(pipe("< @one:state_name < nesting < resource < #"));
  t.snapshot(pipe("<< @one:nesting"));

  // t.snapshot(parse("< state_name < @one:nesting < resource < #"));

  t.snapshot(pipe("< state_name < nesting < resource < #"));

  t.snapshot(pipe("< state_name << /resource/[:ddaf]/sdf < #"));

  t.snapshot(pipe("< state_name <<< #"));

  t.snapshot(pipe("<< nesting_name << #"));

  t.snapshot(pipe("<< nesting_name << ^^"));

  t.snapshot(pipe("< state_name <<< ^^"));

  t.snapshot(pipe("< state_name"));

  t.snapshot(pipe("state_name"));

  t.snapshot(pipe("/resource/[:ddaf]/sdf < #"));

  t.snapshot(pipe("/resource/[:ddaf]/sdf <"));

  t.snapshot(pipe("nesting_name < < ^^"));


});
