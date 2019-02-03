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
  // find all items
  return root
    .find(j.ObjectExpression)
    .filter(function(item) {

      var pList = item.parentPath.value
      if (!Array.isArray(pList)) {
        return
      }

      var pArrEx = item.parentPath.parentPath.value

      if (pArrEx.type !== 'ArrayExpression') {
        return
      }


      var wrap = item.parentPath.parentPath.parentPath.value


      if (wrap.type !== 'Property') {
        return
      }


      if (wrap.key.type !== 'Identifier') {
        return
      }

      if (wrap.key.name !== 'req_map') {
        return
      }


      return true
    })
}

var root = j(file.source);


  findList(root).forEach(function(path) {
    // var copy = cloneDeep(path.value)
    // console.log(copy)

    var index = path.parentPath.value.indexOf(path.value)
    console.log({index: index});
    // copy.key.value.replace('nest_req-', '')
    // copy.key = j.literal(index)

    // console.log(path.parentPath.parentPath.parentPath.parentPath.parentPath.value)

    // create "effects.consume"
    var target = ensureConsumeTarget(path.parentPath.parentPath.parentPath.parentPath.parentPath.value)
    target.properties = target.properties.concat([
      propt(j.literal(index), path.value)
    ])

  })

  console.log('ok')

  findList(root).forEach(function(path) {
    // replace all items
    // var parentPath = path.parentPath
    j(path.parentPath.parentPath.parentPath).replaceWith(null)
  })

  return root.toSource()

}
