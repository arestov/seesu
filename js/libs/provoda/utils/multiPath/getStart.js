define(function(require) {
'use strict';
var initDeclaredNestings = require('../../initDeclaredNestings');
var getSPByPathTemplateAndData = initDeclaredNestings.getSPByPathTemplateAndData;
var getSPByPathTemplate = initDeclaredNestings.getSPByPathTemplate

var empty = {}

return function getStart(md, multi_path, use_state_from_initial_model) {
  return getResourse(
    getBase(md, multi_path),
    multi_path,
    use_state_from_initial_model
  )
}


function getBase(md, multi_path) {
  /*
  {
    type: 'parent',
    steps: from_parent_num[0].length,
  },
  */
  var info = multi_path.from_base

  if (!info || !info.type) {
    return md;
  }

  if (info.type === 'root') {
    if (multi_path.resource && multi_path.resource.path) {
      return md.getStrucRoot().start_page
    }
    return md.getStrucRoot();
  }

  return md.getStrucParent(info.steps)
}

function getResourse(md, multi_path, use_state_from_initial_model) {
  /*
   {
    path: string,
  },
  */

  var info = multi_path.resource

  if (!info || !info.path) {
    return md;
  }

  if (use_state_from_initial_model) {
    return getSPByPathTemplate(md.app, md, info.path)
  }

  return getSPByPathTemplateAndData(md.app, md, info.path, false, empty)
}
})
