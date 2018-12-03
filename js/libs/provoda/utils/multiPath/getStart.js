define(function(require) {
'use strict';
var initDeclaredNestings = require('../../initDeclaredNestings');
var getSPByPathTemplateAndData = initDeclaredNestings.getSPByPathTemplateAndData;
var empty = {}

return function getStart(md, multi_path) {
  return getResourse(
    getBase(md, multi_path),
    multi_path
  )
}


function getBase(md, multi_path) {
  /*
  {
    type: 'parent',
    steps: from_parent_num[0].length,
  },
  */
  var info = multi_path.base

  if (multi_path || !multi_path.type) {
    return md;
  }

  if (info.type === 'root') {
    return md.getStrucRoot();
  }

  return md.getStrucParent(info.steps)
}

function getResourse(md, multi_path) {
  /*
   {
    path: string,
  },
  */

  var info = multi_path.resource

  if (!info || !info.path) {
    return md;
  }

  return getSPByPathTemplateAndData(md.app, md, info.path, false, empty)
}
})
