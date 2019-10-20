define(function (require) {
'use strict';
var pv = require('pv');
var BrowseMap = require('./provoda/BrowseMap');
var flatStruc = require('./structure/flatStruc');

function fetchData(db, App, schema, url) {
  var proxies = new pv.views_proxies.Proxies();
  var calls_flow = new pv.CallbacksFlow(global);

  var highway = {
    models_counters: 1,
    sync_sender: new pv.SyncSender(),
    views_proxies: proxies,
    models: {},
    requests: [],
    calls_flow: calls_flow,
    proxies: proxies
  };

  var app  = new App({
    _highway: highway
  }, db);

  var md = BrowseMap.routePathByModels(app.start_page, url, false, true);
  if (!md) {
    return Promise.reject([404]);
  } else {
    if (schema) {
      var to_load = {
        list: flatStruc(md, schema),
        supervision: {
          greedy: true,
          needy_id: -1,
          store: {},
          reqs: {},
          is_active: {}
        }
      };
      for (var i = 0; i < to_load.list.length; i++) {
        var cur = to_load.list[i];
        if (!cur) {continue;}
        md.addReqDependence(to_load.supervision, cur);
      }
    }

    return calcsReady(highway).then(function() {
      return md;
    });
  }
}

function calcsReady(highway) {
  var calls_flow = highway.calls_flow;
  var requests_promise = Promise.all(highway.requests);

  var flow_promise = calls_flow.flow_end ? new Promise(function(resolve) {
      calls_flow.pushToFlow(function() {
        resolve();
      }, false, false, false, false, false, { complex_order: [Infinity], inited_order: [Infinity] }, true);
    }) : Promise.resolve();

  return new Promise(function(resolve, reject) {
    Promise.all([flow_promise, requests_promise]).then(check, reject);

    function check() {
      if (!calls_flow.flow_end && !highway.requests.length) {
        resolve();
      } else {
        calcsReady(highway).then(resolve);
      }
    }

  });
}

fetchData.getWatchStruct = getWatchStruct;

function getWatchStruct(schema) {
  // in:
  // {
  //   states: [],
  //   nestings: {
  //     artists: {
  //       states: [],
  //       nesting: {}
  //     }
  //   }
  // }

  // out:
  // struc.main.merged_states
  // struc.main.m_children.children

  var nestings = {};
  for (var nesting_name in schema.nestings) {
    nestings[nesting_name] = getWatchStruct(schema.nestings[nesting_name]);
  }

  return {
    main: {
      limit: schema.limit,
      merged_states: schema.states || [],
      m_children: {
        children: nestings
      }
    }
  };
}

return fetchData;
});
