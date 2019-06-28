define(function() {
'use strict';

return function multiPathAsString(multi_path) {
  if (multi_path.as_string) {
    return multi_path.as_string;
  }

  multi_path.as_string = ''
    + firstPart(isStateOk(multi_path.state) && multi_path.zip_name, multi_path.state)
    + nestingString(!isStateOk(multi_path.state) && multi_path.zip_name, multi_path.nesting)
    + resourceString(multi_path.resource)
    + baseString(multi_path.from_base);

  return multi_path.as_string
}

function isStateOk(state) {
  return state && state.path
}

function firstPart(zip_name, state) {
  return '<' + zipPart(zip_name) + stateString(state)
}

function zipPart(zip_name) {
  if (!zip_name) {
    return ''
  }

  return ' @' + zip_name
}


function stateString(state) {
  if (!isStateOk(state)) {
    return ''
  }

  return ' ' + state.path
}

function isNestingOk(nesting) {
  return nesting && nesting.path
}

function nestingString(zip_name, nesting) {
  if (!isNestingOk(nesting)) {
    return '<'
  }

  var path = nesting.path.join('.');

  return '< ' + zipPart(zip_name) + ' ' + path  + ' '
}

function resourceString(resource) {
  if (!resource || !resource.path) {
    return '<'
  }

  return '< ' + resource.path + ' '
}

function baseString(from_base) {
  if (!from_base || !from_base.type) {
    return '<'
  }

  switch (from_base.type) {
    case "root": {
      return '< ' + '#'
    }
    case "parent": {
      var repeated = '';
      var counter = 1;
      while (counter <= from_base.steps) {
        repeated += '^'
        counter++
      }
      return '< ' + repeated
    }

  }

}
})
