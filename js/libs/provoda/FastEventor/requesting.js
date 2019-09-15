define(function (require) {
'use strict';
var morph_helpers = require('js/libs/morph_helpers');
var Promise = require('Promise');
var hex_md5 = require('hex_md5');
var hp = require('../helpers');
var spv = require('spv');
var toBigPromise = require('js/modules/extendPromise').toBigPromise;
var countKeys = spv.countKeys;
var getTargetField = spv.getTargetField;

var clean_obj = {};

var withoutSelf = function(array, name) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] != name) {
      return spv.arrayExclude(array, name)
    }
  }

  return array;
}

var usualRequest = function (send_declr, sputnik, opts, network_api_opts) {
  var api_name = send_declr.api_name;
  var api_method = send_declr.api_method_name;
  var api_args = send_declr.getArgs.call(sputnik, opts);
  var manual_nocache = api_args[2] && api_args[2].nocache;

  var non_standart_api_opts = send_declr.non_standart_api_opts;

  if (!non_standart_api_opts) {
    api_args[2] = api_args[2] || network_api_opts;
  }

  var cache_key;
  if (!non_standart_api_opts && !manual_nocache) {
    var big_string = JSON.stringify([
      'usual', api_name, send_declr.api_resource_path, api_method, api_args
    ]);
    cache_key = hex_md5(big_string);
  }


  return {
    cache_key: cache_key,
    data: api_args
  };
};

var manualRequest = function (send_declr, sputnik, opts) {
  var declr = send_declr.manual;
  var api_name = send_declr.api_name;

  var args = new Array(declr.dependencies + 2);

  args[0] = null;
  args[1] = opts;

  for (var i = 0; i < declr.dependencies.length; i++) {
    args[i+2] = sputnik.state(declr.dependencies[i]);
  }

  var cache_key = hex_md5(JSON.stringify([
    'manual', api_name, send_declr.api_resource_path, opts, declr.fn_body, args
  ]));

  return {
    cache_key: cache_key,
    data: args
  };
};



var idsRequest = function (send_declr, sputnik) {
  var declr = send_declr.ids_declr;
  var api_name = send_declr.api_name;

  var ids = sputnik.state(declr.arrayof);

  var cache_key = hex_md5(JSON.stringify([
    'ids', api_name, send_declr.api_resource_path, declr.fn_body, ids
  ]));

  return {
    cache_key: cache_key,
    data: ids
  };

  // var states = new Array();
  // arrayof: 'user_id',
  // indexBy: '_id',
  // req: function(api, ids) {
  // 	return api.find({_id: {'$in': ids}}).limit(ids.length);
  // }
};

var oneFromList = function(array) {
  return array && array[0];
};

var getApiPart = function (send_declr, sputnik, app) {
  var network_api = hp.getNetApiByDeclr(send_declr, sputnik, app);
  return !send_declr.api_resource_path
    ? network_api
    : spv.getTargetField(network_api, send_declr.api_resource_path);
};

var getRequestByDeclr = function(send_declr, sputnik, opts, network_api_opts) {
  if (!sputnik._highway.requests_by_declarations) {
    sputnik._highway.requests_by_declarations = {};
  }
  var requests_by_declarations = sputnik._highway.requests_by_declarations;


  var network_api = hp.getNetApiByDeclr(send_declr, sputnik);
  var api_part = getApiPart(send_declr, sputnik);

  if (!network_api.source_name) {
    throw new Error('network_api must have source_name!');
  }

  if (!network_api.errors_fields && !network_api.checkResponse) {
    throw new Error('provide a way to detect errors!');
  }

  var api_name = send_declr.api_name;
  if (typeof api_name != 'string') {
    api_name = network_api.api_name;
  }

  if (typeof api_name != 'string') {
    throw new Error('network_api must have api_name!');
  }

  var request_data;
  if (send_declr.api_method_name) {
    request_data = usualRequest(send_declr, sputnik, opts, network_api_opts);
  } else if (send_declr.manual) {
    request_data = manualRequest(send_declr, sputnik, opts);
  } else if (send_declr.ids_declr) {
    request_data = idsRequest(send_declr, sputnik);
  }

  var cache_key = request_data.cache_key;
  if (cache_key && !opts.has_error && requests_by_declarations[cache_key]) {
    return requests_by_declarations[cache_key];
  }


  var request;
  if (send_declr.api_method_name) {
    request = api_part[ send_declr.api_method_name ].apply(network_api, request_data.data);
  } else if (send_declr.manual) {
    request_data.data[0] = api_part;
    request = send_declr.manual.fn.apply(null, request_data.data);
  } else if (send_declr.ids_declr) {
    if (sputnik._highway.reqs_batching.is_processing) {
      request = doBatch(sputnik._highway.reqs_batching, send_declr, request_data.data);
    } else {
      request = send_declr.ids_declr.req.call(null, api_part, [request_data.data])
        .then(oneFromList);
    }

    //  idsRequest(send_declr, sputnik, opts);
  }

  var result_request = checkRequest(request);
  result_request.network_api = network_api;
  if (cache_key) {
    requests_by_declarations[cache_key] = result_request;
    result_request.then(anyway, anyway);
  }

  return result_request;

  function anyway() {
    if (requests_by_declarations[cache_key] == request) {
      delete requests_by_declarations[cache_key];
    }
  }
};

function checkRequest(request) {
  if (!request.catch) {
    if (!request.abort && !request.db) {
      throw new Error('request must have `abort` method');
    }
    return toBigPromise(request);
  }
  return request;
}

return {
  requestState: (function(){

    function failed(err) {
      return Promise.reject(err);
    }

    function bindRequest(request, selected_map, store, self) {
      var network_api = hp.getNetApiByDeclr(selected_map.send_declr, self.sputnik);


      var states_list = selected_map.states_list;
      var parse = selected_map.parse;

      function anyway() {
        store.process = false;
        self.sputnik.updateManyStates(makeLoadingMarks(states_list, false));
      }

      onPromiseFail(request, function(){
        store.error = true;
      });



      return request.then(function(r) {
        return new Promise(function(resolve) {
          self.sputnik.nextTick(function() {
            var has_error = network_api.errors_fields ? findErrorByList(r, network_api.errors_fields) : network_api.checkResponse(r);
            if (!has_error) {
              var result = parse.call(self.sputnik, r, null, morph_helpers);
              if (result) {
                return resolve(result)
              }
            }

            resolve(failed(new Error(has_error || 'no Result')));
          })
        })
      }).then(function (response) {
        self.sputnik.nextTick(function () {
          anyway();
          handleResponse(response);
        }, null, false, null);
      }, function() {
        self.sputnik.nextTick(anyway, null, false, null);
      });


      function handleResponse(result){
        var i;
        var result_states;

        if (Array.isArray(result)) {
          if (result.length != states_list.length) {
            throw new Error('values array does not match states array');
          }

          result_states = {};
          for (i = 0; i < states_list.length; i++) {
            result_states[ states_list[i] ] = result[ i ];
          }

        } else if (typeof result == 'object') {
          for (i = 0; i < states_list.length; i++) {
            if (!result.hasOwnProperty(states_list[i])) {
              throw new Error('object must have all props:' + states_list + ', but does not have ' + states_list[i]);
            }
          }
          result_states = result;
        }

        for (var i = 0; i < states_list.length; i++) {
          result_states[states_list[i] + '__$complete'] = true;
        }

        self.sputnik.updateManyStates( result_states );


        store.error = false;
        store.done = true;
      }
    }

    function sendRequest(selected_map, store, self) {
      var request = getRequestByDeclr(selected_map.send_declr, self.sputnik,
        {has_error: store.error},
        {nocache: store.error});

      self.addRequest(request);
      return request;

    }

    function checkDependencies(selected_map, store, self) {
      var not_ok;
      for (var i = 0; i < selected_map.dependencies.length; i++) {
        if (!self.sputnik.state(selected_map.dependencies[i])) {
          not_ok = selected_map.dependencies[i];
          break;
        }
      }

      if (not_ok) {
        return failed(new Error('missing ' + not_ok));
      }

      return sendRequest(selected_map, store, self);
    }

    var resolved = Promise.resolve();

    function requestDependencies(self, dependencies, soft) {
      var reqs_list = [];
      for (var i = 0; i < dependencies.length; i++) {
        var cur = dependencies[i];
        var compx = self.sputnik.compx_check[cur];
        if (compx) {
          if (self.sputnik.state(cur)) {
            continue;
          }

          var without_self_name = withoutSelf(compx.depends_on, compx.name)
          reqs_list.push(requestDependencies(self, without_self_name, true));
          continue;
        }

        if (soft) {
          var maps_for_state = self.sputnik._states_reqs_index && self.sputnik._states_reqs_index[cur];
          if (!maps_for_state) {
            continue;
          }
        }

        var dep_req = self.requestState(dependencies[i]);
        if (dep_req) {
          reqs_list.push(dep_req);
        }
      }

      var req = !reqs_list.length
        ? resolved
        : Promise.all(reqs_list);

      return req;
    }

    function makeLoadingMarks(states_list, value) {
      var loading_marks = {};
      for (var i = 0; i < states_list.length; i++) {
        loading_marks[ states_list[i] + '__loading'] = value;
      }
      return loading_marks;
    }

    return function(state_name) {
      var current_value = this.sputnik.state(state_name);
      if (current_value) {
        return;
      }

      var i, cur;
      var maps_for_state = this.sputnik._states_reqs_index && this.sputnik._states_reqs_index[state_name];
      if (!maps_for_state) {
        console.warn('cant request state:', state_name, 'but tried. should not try without dcl')
      }
      var cant_request;
      if (this.mapped_reqs) {
        for (i = 0; i < maps_for_state.length; i++) {
          cur = this.mapped_reqs[maps_for_state[i].num];
          if (cur && (cur.done || cur.process)) {
            cant_request = true;
            break;
          }
        }
      }

      if (cant_request) {
        return;
      }

      var selected_map = maps_for_state[0]; //take first
      var selected_map_num = selected_map.num;
      if (!this.mapped_reqs) {
        this.mapped_reqs = {};
      }


      if ( !this.mapped_reqs[selected_map_num] ) {
        this.mapped_reqs[selected_map_num] = {
          done: false,
          error: false,
          process: false
        };
      }

      var store = this.mapped_reqs[selected_map_num];

      store.process = true;

      this.sputnik.updateManyStates(makeLoadingMarks(selected_map.states_list, true));

      if (!selected_map.dependencies) {
        return bindRequest(sendRequest(selected_map, store, this), selected_map, store, this);
      }

      var self = this;

      var req = requestDependencies(self, selected_map.dependencies).then(function () {
        return checkDependencies(selected_map, store, self);
      });

      return bindRequest(req, selected_map, store, self);

    };
  })(),
  requestNesting: function(dclt, nesting_name, limit) {
    if (!dclt) {
      return;
    }
    if (!this.nesting_requests) {
      this.nesting_requests = {};
    }

    if (!this.nesting_requests[ nesting_name ]) {
      this.nesting_requests[ nesting_name ] = {
        //has_items: false,
        has_all_items: false,
        last_page: 0,
        error: false,
        process: false
      };
    }

    var store = this.nesting_requests[ nesting_name ];
    if (store.process || store.has_all_items) {
      return;
    }

    var is_main_list = nesting_name == this.sputnik.main_list_name;

    this.sputnik.updateState('loading_nesting_' + nesting_name, true);
    this.sputnik.updateState(nesting_name + '$loading', true);
    if (is_main_list) {
      this.sputnik.updateState('main_list_loading', true);
    }

    var parse_items = dclt.parse_items;
    var parse_serv = dclt.parse_serv;
    var side_data_parsers = dclt.side_data_parsers;
    var send_declr = dclt.send_declr;
    var supports_paging = !!parse_serv;
    var limit_value = limit && (limit[1] - limit[0]);
    var paging_opts = this.sputnik.getPagingInfo(nesting_name, limit_value);

    var network_api_opts = {
      nocache: store.error
    };

    if (supports_paging) {
      network_api_opts.paging = paging_opts;
    }




    var request = getRequestByDeclr(send_declr, this.sputnik,
      {has_error: store.error, paging: paging_opts},
      network_api_opts);
    var network_api = request.network_api;
    var source_name = network_api.source_name;

    store.process = true;
    var _this = this;

    function anyway() {
      store.process = false;
      _this.sputnik.updateState('loading_nesting_' + nesting_name, false);
      _this.sputnik.updateState(nesting_name + '$loading', false);
      if (is_main_list) {
        _this.sputnik.updateState('main_list_loading', false);
      }
    }

    function handleError() {
      _this.sputnik.updateState(nesting_name + "$error", true);
      anyway();
    }

    onPromiseFail(request, function(){
      store.error = true;
    });

    var initiator = _this.sputnik.current_motivator;
    var release;
    if (initiator) {
      var num = initiator.num;
      batch(_this.sputnik, num);

      release = function () {
        releaseBatch(this, num);
      };
      release.init_end = true;
    }

    /*
      postfixes:

      $error
      $has_any
      $all_loaded
      $loading
      $waiting_queue

    */

    if (request.queued_promise) {
      var stopWaiting = function () {
        _this.sputnik.updateState(nesting_name + '$waiting_queue', false);
      };

      _this.sputnik.updateState(nesting_name + '$waiting_queue', true);
      request.queued_promise.then(stopWaiting, stopWaiting);
    }



    request.then(function (response) {
      _this.sputnik.nextTick(_this.sputnik.inputFn(function () {
        handleResponse(response);
        anyway();
      }), null, false);
      if (release) {
        _this.sputnik.nextTick(release, null, false, initiator);
      }

    }, function () {
      _this.sputnik.nextTick(handleError, null, false);
      if (release) {
        _this.sputnik.nextTick(release, null, false, initiator);
      }

    });

    function handleResponse(r){
      var sputnik = _this.sputnik;
      var has_error = network_api.errors_fields ? findErrorByList(r, network_api.errors_fields) : network_api.checkResponse(r);

      if (has_error){
        store.error = true;
        sputnik.updateState(nesting_name + "$error", true);
        return;
      }



      var many_states = {};
      many_states[nesting_name + "$error"] = null;
      many_states[nesting_name + "$has_any"] = true;

      var items = parse_items.call(sputnik, r, clean_obj, morph_helpers, network_api);
      var serv_data = typeof parse_serv == 'function' && parse_serv.call(sputnik, r, paging_opts, morph_helpers);

      if (!supports_paging) {
        store.has_all_items = true;
        if (is_main_list) {
            sputnik.updateState("all_data_loaded", true);
        }

        many_states[nesting_name + "$all_loaded"] = true;
      } else {
        var has_more_data = hasMoreData(serv_data, limit_value, paging_opts, items);

        if (!has_more_data) {
          store.has_all_items = true;

          if (is_main_list) {
              sputnik.updateState("all_data_loaded", true);
          }

          many_states[nesting_name + "$all_loaded"] = true;
        }
      }

      sputnik.updateManyStates(many_states);

      items = paging_opts.remainder ? items.slice( paging_opts.remainder ) : items;

      sputnik.insertDataAsSubitems(sputnik, nesting_name, items, serv_data, source_name);

      if (!sputnik.loaded_nestings_items) {
        sputnik.loaded_nestings_items = {};
      }

      if (!sputnik.loaded_nestings_items[nesting_name]) {
        sputnik.loaded_nestings_items[nesting_name] = 0;
      }
      var has_data_holes = serv_data === true || (serv_data && serv_data.has_data_holes === true);

      sputnik.loaded_nestings_items[nesting_name] +=
        has_data_holes ? paging_opts.page_limit : (items ? items.length : 0);
      //special logic where server send us page without few items. but it can be more pages available
      //so serv_data in this case is answer for question "Is more data available?"

      if (!side_data_parsers) {return;}

      for (var i = 0; i < side_data_parsers.length; i++) {
        sputnik.nextTick(
          sputnik.handleNetworkSideData, [
            sputnik,
            source_name,
            side_data_parsers[i][0],
            side_data_parsers[i][1].call(sputnik, r, paging_opts, morph_helpers)
          ], true);
      }

      //сделать выводы о завершенности всех данных
    }

    this.addRequest(request);
    return request;

    /*
    есть ли декларация
    все ли возможные данные получены
    в процессе запроса (пока можно запрашивать в один поток)


    маркировка ошибок с прошлых запросов не участвует в принятиях решений, но используется для отказа от кеша при новых запросах


    */
  }


};

function hasMoreData(serv_data, page_limit, paging_opts, items) {
  if (serv_data === true) {
    return true;
  } else if (serv_data && ((serv_data.hasOwnProperty('total_pages_num') && serv_data.hasOwnProperty('page_num')) || serv_data.hasOwnProperty('total'))) {
    if (!isNaN(serv_data.total)) {
      if ( (paging_opts.current_length + items.length) < serv_data.total && serv_data.total > paging_opts.page_limit) {
        return true;
      }
    } else {
      if (serv_data.page_num < serv_data.total_pages_num) {
        return true;
      }
    }

  } else {
    return items.length == page_limit;
  }

}

function findErrorByList(data, errors_selectors) {
  var i, cur, has_error;
  for (i = 0; i < errors_selectors.length; i++) {
    cur = errors_selectors[i];
    has_error = spv.getTargetField(data, cur);
    if (has_error){
      break;
    }
  }
  return has_error;
}

function onPromiseFail(promise, cb) {
  if (promise.fail) {
    return promise.fail(cb);
  } else {
    return promise.catch(cb);
  }
}

function BatchingTemplate() {
  this.keys = {};
  this.is_processing = false;
  this.collected = {};
}

function batch(md, num) {
  if (!md._highway.reqs_batching) {
    md._highway.reqs_batching = new BatchingTemplate();
  }

  var batching =  md._highway.reqs_batching;
  batching.keys[num] = true;
  batching.is_processing = true;
}

function releaseBatch(md, num) {
  var batching =  md._highway.reqs_batching;
  batching.keys[num] = false;
  batching.is_processing = countKeys(batching.keys, true);
  if (!batching.is_processing) {
    finalizeBatch(batching, md);
  }
}

function doBatch(reqs_batching, send_declr, id) {
  if (!reqs_batching.collected[send_declr.id]) {
    reqs_batching.collected[send_declr.id] = new CollectedTemplate(send_declr);
  }

  var colleted = reqs_batching.collected[send_declr.id];

  if (!colleted.ids[id]) {
    colleted.ids[id] = ensureDeferred(colleted).then(function (index) {
      return index[id];
    });
  }

  return colleted.ids[id];
}

function bindToMakeIndex(send_declr) {
  return function (arr) {
    var index = {};
    for (var i = 0; i < arr.length; i++) {
      index[getTargetField(arr[i], send_declr.ids_declr.indexBy)] = arr[i];
    }
    return index;
  };
}

function finalizeCollected(collected, md) {
  if (!collected.deffered) {
    return;
  }

  var send_declr = collected.send_declr;
  var req = send_declr.ids_declr.req.call(null, getApiPart(send_declr, md), Object.keys(collected.ids))
    .then(bindToMakeIndex(send_declr));

  var deffered = collected.deffered;
  req.then(function () {
    if (collected.deffered !== deffered) {
      return;
    }
    collected.ids = {};
    collected.effered = null;
    collected.resolve = null;
    collected.reject = null;
  });

  req.then(collected.resolve, collected.reject);


}

function finalizeBatch(reqs_batching, md) {
  for (var send_declr_id in reqs_batching.collected) {
    finalizeCollected(reqs_batching.collected[send_declr_id], md);
    reqs_batching.collected[send_declr_id] = null;
  }
}

function CollectedTemplate(send_declr) {
  this.ids = {};
  this.send_declr = send_declr;
  this.deffered = null;
  this.resolve = null;
  this.reject = null;
}

function ensureDeferred(collected) {
  if (collected.deffered) {
    return collected.deffered;
  }

  collected.deffered = new Promise(function (resolve, reject) {
    collected.resolve = resolve;
    collected.reject = reject;
  });

  return collected.deffered;
}



});
