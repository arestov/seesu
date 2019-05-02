define(function () {
'use strict';
return function watcherKey(name, target_view) {
  return name + target_view.mpx.md._provoda_id + target_view.location_name;
}
})
