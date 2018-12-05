define(function(require) {
'use strict'

var updateNesting = require('../../Model/updateNesting');
var multiPathAsString = require('../../utils/multiPath/asString')
var isNestingChanged = require('../../utils/isNestingChanged')

var prepareArgs = function(dcl, _runStates) {
  var result = new Array(dcl.deps.length);

  for (var i = 0; i < dcl.deps.length; i++) {
    result[i] = _runStates[dcl.deps[i]]
  }

  return result;
};

var createInitialStates = function(dcl) {
  var _runStates = {}

  for (var i = 0; i < dcl.deps.length; i++) {
    _runStates[dcl.deps[i]] = null
  }

  return _runStates;
}

var changeValue = function(runner, dep_full_name, value, checkFromNesting) {
  var dcl = runner.dcl


  if (!runner._runStates) {
    runner._runStates = createInitialStates(dcl)
  }

  if (!checkFromNesting) {
    if (runner._runStates[dep_full_name] === value) {
      return;
    }
  } else {
    if (!isNestingChanged(runner._runStates[dep_full_name], value)) {
      return;
    }
  }

  runner._runStates[dep_full_name] = value;

  var args = prepareArgs(dcl, runner._runStates)
  var calcFn = dcl.calcFn
  var result = calcFn.apply(null, args)

  var dest_name = dcl.dest_name;

  updateNesting(runner.md, dest_name, result)
}


return {
  hnest: function nestCompxNestDepChangeHandler(flow_step, _, lwroot, __, value) {
    var data = lwroot.data
    var runner = data.runner

    // we can get same, but mutated `value`
    var to_pass = Array.isArray(value) ? value.slice(0) : value;

    changeValue(runner, multiPathAsString(data.dep), to_pass, true)
  },
  hstate: function nestCompxStateDepChangeHandler(runner, dep_full_name, value) {
    changeValue(runner, dep_full_name, value, false)
  }
}

})
