define(function () {
'use strict';

return function(related_md, id) {
  return related_md._highway.models[id];
};
});
