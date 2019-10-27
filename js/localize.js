define(function(require) {
'use strict';

var localizer = require('localizer');

var sviga = {};
var localize = function(lang){
  return function(string, j) {
    if (localizer[string]){
      return localizer[string][lang] || localizer[string].original;
    }

    if (j){
      sviga[string] ={
        original:j
      };
      return j;
    }

    var result = 'no this localization: ' + string
    return result;
  };
};
return localize;
})
