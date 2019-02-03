module.exports = function(file, api) {
'use strict';
var cloneDeep = require('lodash/cloneDeep')
var j = api.jscodeshift;

function propt(key, value) {
  var kkey = typeof key === 'string' ? j.identifier(key) : key;
  return value && j.property('init', kkey, value)
}

function findEffects(container) {
  var result = j(container).find(j.ObjectExpression).filter(function(propPath) {
    // console.log(
    //   propPath.value.properties.map(function(prop) {
    //     return prop.key && prop.key.value
    //   })
    // )

    var parent = propPath.parentPath.value
    if (parent.type !== 'Property') {
      return
    }

    if (parent.key.value !== '+effects') {
      return
    }

    return true;

  })
  if (result.length) {
    return result.get().value
  }
}

function ensureEffectsTarget(target) {
  var exist = findEffects(target);
  if (exist) {
    return exist
  }

  var add = propt(j.literal('+effects'), j.objectExpression([]))

  target.properties = [add].concat(target.properties)

  return findEffects(target);
}

function findConsume(effects) {
  var result = j(effects).find(j.ObjectExpression).filter(function(propPath) {
    var parent = propPath.parentPath.value
    if (parent.type !== 'Property') {
      return
    }

    if (parent.key.value !== 'consume') {
      return
    }

    return true;
  })
  if (result.length) {
    return result.get().value
  }
}

function ensureConsumeTarget(container) {
  var target = ensureEffectsTarget(container)
  var exist = findConsume(target);

  if (exist) {
    return exist
  }


  var add = propt(j.literal('consume'), j.objectExpression([]))

  target.properties = [add].concat(target.properties)


  return findConsume(target);
}

function findList(root) {
  return root
    .find(j.ObjectExpression)
    .filter(function(item) {

      var prop = item.parentPath.value
      if (prop.type !== 'Property') {
        return
      }

      if (prop.key.type !== 'Literal') {
        return
      }



      if (!String(prop.key.value).startsWith('state-')) {
        return
      }

      console.log('prop.key.value', prop.key.value)

      return true
    })
}

var root = j(file.source);


  findList(root).forEach(function(path) {
    var copy = cloneDeep(path.parentPath.value)

    copy.key = j.literal(copy.key.value.replace('state-', ''))

    var target = ensureConsumeTarget(path.parentPath.parentPath.parentPath.value)
    target.properties = target.properties.concat([copy])

  })

  findList(root).forEach(function(path) {
    var parentPath = path.parentPath
    j(parentPath).replaceWith(null)
  })

  return root.toSource()

}
