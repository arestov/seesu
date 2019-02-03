define(function() {
'use strict';
return function changeSources(store, send_declr) {
  var api_name = send_declr.api_name;
  if (typeof api_name == 'string') {
    store.api_names.push(api_name);
  } else {
    var network_api = api_name.call();
    if (!network_api.source_name) {
      throw new Error('no source_name');
    }
    store.sources_names.push(network_api.source_name);
  }
};
})
