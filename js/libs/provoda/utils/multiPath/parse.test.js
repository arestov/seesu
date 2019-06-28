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
test('check parsing', function(t) {
  'use strict'


  //
  // "< state_name < nesting < resource < #"

  t.snapshot(parse("< @one:state_name < nesting < resource < #"));

  // t.snapshot(parse("< state_name < @one:nesting < resource < #"));

  t.throws(function() {
    parse("< state_name < @one:nesting < resource < #")
  });

  t.throws(function() {
    parse("< @one: < nesting < resource < #")
  });

  t.snapshot(parse("< state_name < nesting < resource < #"));

  t.throws(function() {
    parse("< state_name < aggr:nesting < resource < #")
  });

  t.snapshot(parse("< state_name << /resource/[:ddaf]/sdf < #"));

  t.snapshot(parse("< state_name <<< #"));

  t.snapshot(parse("<< nesting_name << #"));

  t.snapshot(parse("<< nesting_name << ^^"));

  t.snapshot(parse("< state_name <<< ^^"));

  t.snapshot(parse("< state_name"));

  t.snapshot(parse("state_name"));

  t.snapshot(parse("@one:state_name:nest"));
  t.snapshot(parse("@state_name:nest.test"));


  t.snapshot(parse("/resource/[:ddaf]/sdf < #"));

  t.snapshot(parse("/resource/[:ddaf]/sdf <"));

  t.snapshot(parse("nesting_name < < ^^"));


});
