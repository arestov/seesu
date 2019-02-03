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

    var prop = item.parentPath.value
    if (prop.type !== 'Property') {
      return
    }

    if (prop.key.type !== 'Literal') {
      return
    }

    if (!prop.key.value.startsWith('nest_req-')) {
      return
    }

    var value = item.value;

    if (value.type !== 'ArrayExpression') {
      return
    }

    if (value.elements.length !== 2) {
      console.log(prop.key.value, file.path)
      throw new Error()
    }

    if (value.elements[1].type !== 'ArrayExpression') {
      console.log(prop.key.value, file.path)
      throw new Error()
    }

    return true
  })
  .forEach(function(path) {
    var propt = function(key, value) {
      return value && j.property('init', j.identifier(key), value)
    }

    console.log(j(path).toSource())


    // console.log(1)
    var value = path.value;
    // console.dir(value.elements)
    var parse_items = value.elements[0]
    // var parse_serv = value.elements[2]
    // var side_parse = value.elements[2]
    var send_declr = value.elements[1]
    // var
    var bb = {
      type: 'nest_request',
      parse: {},
      api: '#lfm',
      fn: [],
    };
    var api = send_declr.elements[0]

    var sendPart = getSendPart(send_declr);


    // console.log(j(part).toSource())



    // console.log(j(call).toSource())
    // console.log()

    var result = j.objectExpression([
      propt('type', j.literal('nest_request')),
      propt('parse', parse_items),
      propt('api', api),
      propt('fn', sendPart),
    ].filter(function(item) {return item}))

    console.log(
      j(
        result
      ).toSource()
    )
    j(path).replaceWith(result)
    // console.log(path.toSource())
    // console.log()
  })
  .toSource()
}
