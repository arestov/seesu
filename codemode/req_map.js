module.exports = function(file, api) {
'use strict';
var j = api.jscodeshift;

var getAPIArg = function(name) {
  return j.identifier('api')
  switch (name) {
    case "#lfm": {
      return j.identifier('api')
    }
    case "last_fm_xml": {
      return j.identifier('api')
    }
  }

  throw new Error('unknown', name)

}

function getSendPart(send_declr) {
  var send_dcl = send_declr.elements[1];
  if (send_dcl.type === 'ArrayExpression') {
    return send_dcl
  }

  var api = send_declr.elements[0]
  var method = send_declr.elements[1].value

  var array = j(send_declr).find(j.ArrayExpression).filter(function(item) {
    return item.parentPath.value.type === 'ReturnStatement';
  }).get().value


  var part = j.callExpression(
    j.memberExpression(getAPIArg(api.value), j.identifier(method)),
    array.elements
  )

  var call = j.functionExpression(
    null,
    [getAPIArg(api.value)],
    j.blockStatement([j.returnStatement(part)])
  )

  return j.arrayExpression([
    j.arrayExpression([]),
    call,
  ])
}

return j(file.source)
  .find(j.ArrayExpression)
  .filter(function(item) {
    // if (!Array.isArray(item.parentPath.value) ) {
      // return
    // }

    if (item.parentPath.name !== 'elements') {
      return
    }

    // console.log('here 1', item.parentPath)
    // console.log()

    var array_wrap = item.parentPath.parentPath
    if (array_wrap.value.type !== 'ArrayExpression') {
      return
    }

    // console.log('here 2 ', array_wrap.parentPath)

    var prop = array_wrap.parentPath.value
    if (prop.type !== 'Property') {
      return
    }
    // console.log(j(prop.key).toSource())
    // console.log('here 3', prop)
    // console.log('key:', prop.key.value)

    if (prop.key.type !== 'Identifier') {
      return
    }


    if (!prop.key.name.startsWith('req_map')) {
      return
    }

    console.log('OK!')

    if (item.value.elements.length !== 3) {
      console.log(j(item).toSource())
      console.log(file.path)
      throw new Error('not 3')
    }

    if (item.value.elements[2].type !== 'ArrayExpression') {
      console.log(j(item.value.elements[1]).toSource())
      console.log(file.path)
      throw new Error(' not arr')
    }

    return true
  })
  .forEach(function(path) {
    var propt = function(key, value) {
      return value && j.property('init', j.identifier(key), value)
    }

    console.log(j(path).toSource())

    var value = path.value;
    var states = value.elements[0]

    var parse_items = value.elements[1]
    var send_declr = value.elements[2]
    // var bb = {
    //   type: 'nest_request',
    //   parse: {},
    //   api: '#lfm',
    //   fn: [],
    // };
    var api = send_declr.elements[0]
    //
    var sendPart = getSendPart(send_declr);
    console.log(api)
    //
    var result = j.objectExpression([
      propt('type', j.literal('state_request')),
      propt('states', states),
      propt('parse', parse_items),
      propt('api', api),
      propt('fn', sendPart),
    ].filter(function(item) {return item}))
    //
    // console.log(
    //   j(
    //     result
    //   ).toSource()
    // )
    j(path).replaceWith(result)
  })
  .toSource()
}
