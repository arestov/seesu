define(function(require) {
'use strict';

return function(self, pass_name, data) {
  var act = self.__act
  act(self, pass_name, data)
};
})
