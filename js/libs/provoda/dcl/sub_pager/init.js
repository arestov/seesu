define(function() {
'use strict';
return function init(self) {
  self.sub_pages = null;
  if (self._sub_pages || self._sub_pager || self.subPager){
    self.sub_pages = {};
  }
};
});
