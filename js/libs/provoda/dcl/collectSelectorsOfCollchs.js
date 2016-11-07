define(function (require) {
'use strict';
var spv = require('spv');
var getPropsPrefixChecker = require('../utils/getPropsPrefixChecker');
var getUnprefixed = spv.getDeprefixFunc( 'sel-coll-' );
var hasPrefixedProps = getPropsPrefixChecker( getUnprefixed );

var parseCollchSel = spv.memorize(function(str) {
  var parts = str.split('/');
  var model_name = parts[1];
  var parent_space_name = parts[2];
  var prio = 0;
  if (model_name) {
    prio += 2;
  }
  if (parent_space_name) {
    prio += 1;
  }

  var key = '';
  if (model_name) {
    key += model_name;
  }
  if (parent_space_name) {
    key += '/' + parent_space_name;
  }

  return {
    nesting_name : parts[0],
    model_name: parts[1] || null,
    parent_space_name: parts[2] || null,
    prio: prio,
    key: key
  };
});


return function(self, props){
  var need_recalc = hasPrefixedProps( props );
  if (!need_recalc){
    return;
  }

  var prop;

  self.dclrs_selectors = {};

  for (prop in self){
    if (getUnprefixed( prop )){
      var collch = self[ prop ];
      var selector_string = getUnprefixed( prop );
      //self.dclrs_selectors[selector_string] = collch;
      var selector = parseCollchSel(selector_string);
      if (!self.dclrs_selectors.hasOwnProperty(selector.nesting_name)) {
        self.dclrs_selectors[selector.nesting_name] = {};
      }
      self.dclrs_selectors[selector.nesting_name][selector.key] = collch;

      // self.dclrs_selectors[selector.nesting_name].push({
      // 	selector: selector,
      // 	collch: collch
      // });


    }
  }
  return true;
};
});
