define(function (require) {
'use strict';
var spv = require('spv');
var NestWatch = require('../nest-watch/NestWatch');
var getShortStateName = require('./getShortStateName');
var NestingSourceDr = require('./NestingSourceDr');
var getPropsPrefixChecker= require('./getPropsPrefixChecker');
var getStateWriter = require('../nest-watch/getStateWriter');

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

    var nesting_source = new NestingSourceDr(nesting_name);

    return {
      rel_type: 'nesting',
      full_name: string,
      state_name: state_name,

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
      state_name: state_name
    };
  }
};


var getParsedState = spv.memorize(function getParsedState(state_name) {
  // isSpecialState
  var start = state_name.charAt(0);
  if (enc_states[start]) {
    return enc_states[start](state_name);
  } else {
    return null;
  }
});

var getEncodedState = spv.memorize(function getEncodedState(state_name) {
  var result = getParsedState(state_name)

  if (!result) {
    return null
  }

  if (result.rel_type !== 'nesting') {
    return result
  }

  var doubleHandler = getStateWriter(result.full_name, result.state_name, result.zip_name);
  var nwatch = new NestWatch(result.nesting_source, result.state_name, {
    onchd_state: doubleHandler,
    onchd_count: doubleHandler,
  })

  var copy = spv.cloneObj({}, result);
  copy.nwatch = nwatch

  return copy
});

function itself(item) {return item;}

return {
  getShortStateName: getShortStateName,
  getParsedState: getParsedState,
  getEncodedState: getEncodedState,
  getPropsPrefixChecker: getPropsPrefixChecker,
};
});
