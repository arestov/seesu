define(function(require) {
'use strict';
var spv = require('spv');
var splitByDot = spv.splitByDot
var parse = require('./NestingSourceDr/parse');

function itself(item) {return item;}

var enc_states = {
  '^': (function(){
    // parent

    var parent_count_regexp = /^\^+/gi;

    return function parent(string) {
      //example: '^visible'

      var state_name = string.replace(parent_count_regexp, '');
      var count = string.length - state_name.length;
      return {
        rel_type: 'parent',
        full_name: string,
        state_name: state_name,
        full_state_name: state_name,
        base_state_name: state_name && splitByDot(state_name)[0],
        ancestors: count,
      };
    };
  })(),
  '@': function nesting(string) {
    // nesting

    //example:  '@some:complete:list'
    var nesting_and_state_name = string.slice(1);
    var parts = nesting_and_state_name.split(':');

    var nesting_name = parts.pop();
    var state_name = parts.pop();
    var zip_func = parts.pop();

    var nesting_source = parse(nesting_name);

    return {
      rel_type: 'nesting',
      full_name: string,
      state_name: state_name,
      full_state_name: state_name,
      base_state_name: state_name && splitByDot(state_name)[0],


      nesting_source: nesting_source,
      nesting_name: nesting_source.selector.join('.'),
      zip_name: zip_func,
      zip_func: zip_func || itself,
    };
  },
  '#': function(string) {
    // root

    //example: '#vk_id'
    var state_name = string.slice(1);
    if (!state_name) {
      throw new Error('should be state_name');
    }

    return {
      rel_type: 'root',
      full_name: string,
      state_name: state_name,
      full_state_name: state_name,
      base_state_name: state_name && splitByDot(state_name)[0],
    };
  }
}

var getParsedState = spv.memorize(function getParsedState(state_name) {
  // isSpecialState
  var start = state_name.charAt(0);
  if (enc_states[start]) {
    return enc_states[start](state_name);
  } else {
    return null;
  }
});
return getParsedState
})
