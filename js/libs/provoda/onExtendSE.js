define(function(require){
'use strict';
var collectRegFires = require('./dcl/collectRegFires');

return function onPropsExtend (self, props) {
  collectRegFires(self, props);
};

});
