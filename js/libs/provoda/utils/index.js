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
        ancestors: count,
        state_name: state_name
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

    var doubleHandler = getStateWriter(string, state_name, zip_func);

    return {
      rel_type: 'nesting',
      full_name: string,
      nesting_name: nesting_source.selector.join('.'),
      state_name: state_name,
      zip_func: zip_func || itself,
      nwatch: new NestWatch(nesting_source, state_name, {
        onchd_state: doubleHandler,
        onchd_count: doubleHandler,
      })
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


var getEncodedState = spv.memorize(function getEncodedState(state_name) {
  // isSpecialState
  var start = state_name.charAt(0);
  if (enc_states[start]) {
    return enc_states[start](state_name);
  } else {
    return null;
  }
});

function itself(item) {return item;}

return {
  getShortStateName: getShortStateName,
  getEncodedState: getEncodedState,
  getPropsPrefixChecker: getPropsPrefixChecker,
};
});
