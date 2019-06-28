define(function(require) {
'use strict'

var spv = require('spv')
var initDeclaredNestings = require('../../initDeclaredNestings');
var getParsedPath = initDeclaredNestings.getParsedPath;

var splitByDot = spv.splitByDot;
var fromLegacy = require('./fromLegacy')
var empty = {}
var parent_count_regexp = /\^+/gi;

/*


/(\^|\s+)(\<)(\s+)/
"< @all state_name < nesting < resource < #"

"< state_name < aggr:nesting < resource < #"

"< state_name << /resource/[:ddaf]/sdf < #"

"< state_name <<< #"
"<< nesting_name << #"

"<< nesting_name << ^^"
"< state_name <<< ^^"

"< state_name"
"state_name"

"/resource/[:ddaf]/sdf < #"
"/resource/[:ddaf]/sdf <"

"nesting_name < < ^^"
*/
var checkSplit = /(?:^|\s+)?<(?:\s+)?/
var end = /(<$)|(\^$)|(#$)/
var start = /^</

var parseFromStart = spv.memorize(function(string) {
  var parts = string.split(checkSplit);
  // parts[0] should be empty
  var state = parts[1]
  var nest = parts[2]
  var resource = parts[3]
  var base = parts[4]

  return parseParts(state, nest, resource, base)

})

var parseFromEnd = spv.memorize(function(string) {
  var parts = string.split(checkSplit);

  var length = parts.length
  var base = parts[length - 1]
  var resource = parts[length - 2]
  var nest = parts[length - 3]
  var state = parts[length - 4]

  return parseParts(state, nest, resource, base)
})

var canParseModern = spv.memorize(function(string) {
  var from_start = start.test(string)
  var from_end = end.test(string)
  return (from_start || from_end)
    ? {from_start: from_start, from_end: from_end}
    : null
})

var parseModern = spv.memorize(function(string) {
  var modern = canParseModern(string)
  if (!modern) {return null}

  if (modern.from_start) {
    return parseFromStart(string)
  }
  return parseFromEnd(string)
})

var parseMultiPath = function(string, allow_legacy) {
  if (string == '<<<<') {
    return {
      as_string: string,
      base_itself: true,
    }
  }


  var modern = canParseModern(string)
  if (!modern) {
    return allow_legacy ? fromLegacy(string) : null
  }

  return parseModern(string)
}
var matchZip = /(?:\@(.+?)\:)?(.+)/


return spv.memorize(parseMultiPath, function(a1, a2) {
  var legacy_ok = Boolean(a2)
  return legacy_ok + ' - ' + a1
});

function parseParts(state_raw, nest_raw, resource_raw, base_raw) {
  var state_part_splited = state_raw && state_raw.match(matchZip)
  var zip_string = state_part_splited && state_part_splited[1]
  var state_string = state_part_splited && state_part_splited[2]

  var zip_name = zip_string || null
  var state_info = getStateInfo(state_string);
  var nest_info = getNestInfo(nest_raw);
  var resource_info = getResourceInfo(resource_raw);
  var base_info = getBaseInfo(base_raw);

  var result_type = getResultType(state_info, nest_info, resource_info, base_info);

  return {
    result_type: result_type,
    zip_name: zip_name,
    state: state_info,
    nesting: nest_info,
    resource: resource_info,
    from_base: base_info,
    as_string: null,
  }
}

function getStateInfo(string) {
  if (!string) {
    return empty;
  }

  return {
    base: splitByDot(string)[0],
    path: string,
  }
}

function getNestInfo(string) {
  if (!string) {
    return empty;
  }

  var parts = string.split(':')
  var path = parts.pop()

  var full_path = splitByDot(path)

  var zip_name = parts[0] || null

  if (zip_name) {
    throw new Error('dont use. use < @[zip_name] [statename] < [nestingname]')
  }

  return {
    path: full_path,
    base: full_path.slice(0, full_path.length-1),
    target_nest_name: full_path[full_path.length-1],
  }
}

function getResourceInfo(string) {
  if (!string) {
    return empty;
  }

  return {
    path: string,
    template: getParsedPath(string),
  }
}

function getBaseInfo(string) {
  if (!string) {
    return empty;
  }

  if (string == '#') {
    return {
      type: 'root',
      steps: null,
    }
  }

  var from_parent_num = string.match(parent_count_regexp)
  if (from_parent_num) {
    return {
      type: 'parent',
      steps: from_parent_num[0].length,
    }
  }

  throw new Error('unsupported base: ' + string)
}

function getResultType(state, nest) {
  if (state && state.path) {
    return 'state'
  }

  if (nest && nest.path) {
    return 'nesting'
  }

  return null
}

})
