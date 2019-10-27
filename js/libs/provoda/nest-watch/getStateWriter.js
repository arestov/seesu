define(function (require) {
'use strict';

var spv = require('spv');
var pvState = require('../utils/state');
var updateProxy = require('../updateProxy');
var pvUpdate = updateProxy.update;
var standart = require('./standartNWH');



var stateOf = spv.memorize(function(state_name) {
  return function(md) {
    return pvState(md, state_name);
  };
});

var stateG = function(callback) {
  return function(state_name) {
    return callback(stateOf(state_name));
  };
};

var toZipFunc = function(toValue) {
  return spv.memorize(stateG(toValue));
};

var map = toZipFunc(function(state) {
  return function(array) {
    return array && array.map(state);
  };
});

var some = toZipFunc(function(state) {
  return function(array) {
    return array.some(state);
  };
});

var every = toZipFunc(function(state) {
  return function(array) {
    return array.every(state);
  };
});

var one = toZipFunc(function(state) {
  return function(array) {
    return array[0] && state(array[0]);
  };
});

var arrayClone = function(array) {
  if (Array.isArray(array)) {
    return array.slice(0);
  } else {
    return array;
  }
};


var getZipFunc = spv.memorize(function(state_name, zip_name) {
  if (!state_name) {
    return arrayClone;
  }

  if (!zip_name) {
    return map(state_name);
  } else {
    switch (zip_name) {
      case 'one': {
        return one(state_name);
      }
      case 'some': {
        return some(state_name);
      }
      case 'every': {
        return every(state_name);
      }
      default: {
        throw new Error('unknow zip func ' + zip_name);
      }
    }
  }
}, function(state_name, zip_name) {
  return (state_name || "") + '-' + (zip_name || "");
});

function hdkey(full_name, state_name, zip_func) {
  return (full_name || '') + '-' + (state_name || '') + '-' + (zip_func || '');
}

var createWriter = function(write) {
  return spv.memorize(function(full_name, state_name, zip_name) {
    var zip_func = getZipFunc(state_name, zip_name);
    return standart(function stateHandler(md, items) {
      write(md, full_name, items && zip_func(items));
    });
  }, hdkey);
}

var getStateWriter = createWriter(pvUpdate);

getStateWriter.createWriter = createWriter;

return getStateWriter;
});
