define(function (require) {
'use strict';
var spv = require('spv');
var getPropsPrefixChecker = require('../utils/getPropsPrefixChecker');
var getUnprefixed = spv.getDeprefixFunc(  'collch-' );
var hasPrefixedProps = getPropsPrefixChecker( getUnprefixed );

var solvingOf = function(declr) {
  var by_model_name = declr.by_model_name;
  var space = declr.space != 'main' && declr.space;
  var is_wrapper_parent = declr.is_wrapper_parent;
  var needs_expand_state = declr.needs_expand_state;
  if (by_model_name || space || is_wrapper_parent || needs_expand_state) {
    return {
      by_model_name: by_model_name,
      space: space,
      is_wrapper_parent: is_wrapper_parent,
      needs_expand_state: needs_expand_state
    };
  }
};
var parseCollectionChangeDeclaration = function(collch) {
  if (typeof collch == 'string'){
    collch = {
      place: collch
    };
  }
  var expand_state = collch.needs_expand_state;
  if (expand_state && typeof expand_state != 'string') {
    expand_state = 'can_expand';
  }

  var is_wrapper_parent = collch.is_wrapper_parent &&  collch.is_wrapper_parent.match(/^\^+/gi);

  var declr = {
    place: collch.place,
    by_model_name: collch.by_model_name,
    space: collch.space || 'main',
    strict: collch.strict,
    is_wrapper_parent: is_wrapper_parent && is_wrapper_parent[0].length,
    opts: collch.opts,
    needs_expand_state: expand_state || null,
    not_request: collch.not_request,
    limit: collch.limit,
    solving: null
  };
  var solving = solvingOf(declr);
  if (solving) {
    declr.solving = solving;
  }
  return declr;
};

return function(self, props) {
  var need_recalc = hasPrefixedProps( props );


  if (!need_recalc){
    return;
  }
  var prop;

  self.dclrs_fpckgs = {};

  for (prop in self){
    if (getUnprefixed( prop )){
      var collch = self[ prop ];
      var nesting_name = getUnprefixed( prop );
      if (typeof collch == 'function'){
        self.dclrs_fpckgs[ nesting_name ] = collch;
      } else {
        if (Array.isArray(collch)) {
          throw new Error('do not support arrays anymore');
        }
        self.dclrs_fpckgs[ nesting_name ] = parseCollectionChangeDeclaration(collch);
      }

    }
  }
  return true;
};

});
