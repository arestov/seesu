define(function (require) {
'use strict';
var hp = require('../helpers');
var $v = hp.$v;

return function (target, nesname, items, removed, old_value) {
  target.pvCollectionChange(nesname, items, removed);


  var collch = target.dclrs_fpckgs && target.dclrs_fpckgs.hasOwnProperty(nesname) && target.dclrs_fpckgs[nesname];
  if (typeof collch == 'function') {
    target.callCollectionChangeDeclaration(collch, nesname, items, old_value, removed);
    return;
  }

  if (!target.dclrs_selectors || !target.dclrs_selectors.hasOwnProperty(nesname)) {
    if (!collch) {
      return;
    }

    target.callCollectionChangeDeclaration(collch, nesname, items, old_value, removed);
    return;
  }

  if (!Array.isArray(items)) {
    var dclr = $v.selecPoineertDeclr(
      target.dclrs_fpckgs, target.dclrs_selectors,
      nesname, items.model_name, target.nesting_space
    ) || collch;

    target.callCollectionChangeDeclaration(dclr, nesname, items, old_value, removed);
    return;
  }

  for (var i = 0; i < items.length; i++) {
    var cur = items[i];
    var dclr = $v.selecPoineertDeclr(target.dclrs_fpckgs, target.dclrs_selectors,
      nesname, cur.model_name, target.nesting_space);

    if (!dclr) {
      dclr = collch;
    }

    throw new Error('WHAT TO DO WITH old_value?');
    // target.callCollectionChangeDeclaration(dclr, nesname, cur, old_value, removed);
  }
}
});
