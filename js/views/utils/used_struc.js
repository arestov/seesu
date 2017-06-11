define(function(require) {
'use strict';

var selecPoineertDeclr = require('js/libs/provoda/structure/selecPoineertDeclr');

var bhv = {
  'compx-view_path': [
    ['_provoda_id'],
    function() {
      return getViewPath(this).join('.');
    }
  ],
  'stch-used_struc': function(self, value) {
    self.RPCLegacy('updateState', 'used_struc', value);
  },
  'compx-used_struc': [
    ['#view_structure', 'view_path'],
    function(view_structure, view_path) {
      if (!view_structure || !view_path) {
        return;
      }

      return view_structure.children_index[view_path];
    }
  ]
}

function getDcl(cur) {
  var parent_view = cur.parent_view;
  if (!parent_view || !parent_view.dclrs_fpckgs || !parent_view.dclrs_selectors) {
    return;
  }

  return selecPoineertDeclr(
    parent_view.dclrs_fpckgs,
    parent_view.dclrs_selectors,
    cur.nesting_name,
    cur.mpx.md.model_name,
    parent_view.nesting_space,
    true
  );
}

function getKey(cur, by_model_name) {
  return by_model_name
    ? ['children_by_mn', cur.nesting_name, cur.mpx.md.model_name, cur.nesting_space]
    : ['children', cur.nesting_name, cur.nesting_space];
}

function getViewPath(view) {
  var cur = view;

  var path = [];

  while (cur) {
    if (!cur.root_view || cur === cur.root_view) {
      break;
    }

    // var dcl = getDcl(cur);
    // console.log('dcl!!!', dcl)

    var key = getKey(cur, cur.by_model_name);
    path.unshift.apply(path, key);

    cur = cur.parent_view;

  }

  return path;
}

return {
  bhv: bhv,
}

});
