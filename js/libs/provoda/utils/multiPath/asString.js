define(function() {
'use strict';

return function multiPathAsString(multi_path) {
  if (multi_path.as_string) {
    return multi_path.as_string;
  }

  multi_path.as_string = ''
    + firstPart(multi_path.zip_name, multi_path.state)
    + nestingString(multi_path.nesting)
    + resourceString(multi_path.resource)
    + baseString(multi_path.from_base);

  return multi_path.as_string
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
  if (!state || !state.path) {
    return ''
  }

  return ' ' + state.path
}

function nestingString(nesting) {
  if (!nesting || !nesting.path) {
    return '<'
  }

  var path = nesting.path.join('.');

  return '< ' + path  + ' '
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
