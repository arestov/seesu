define(function () {
'use strict';
return function getBwlevFromParentBwlev(parent_bwlev, md) {
  return parent_bwlev.children_bwlevs[md._provoda_id];
};

});
