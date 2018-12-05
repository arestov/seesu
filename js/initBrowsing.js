define(function(require) {
'use strict';
var pv = require('pv');
var navi = require('./libs/navi');
var BrowseMap = require('./libs/BrowseMap');
var animateMapChanges = require('js/libs/provoda/dcl/probe/animateMapChanges');
var app_serv = require('app_serv');

var pvUpdate = pv.update;
var app_env = app_serv.app_env;

function initMapTree(app, start_page, needs_url_history, navi) {
  app.useInterface('navi', needs_url_history && navi);
  pv.updateNesting(app, 'navigation', []);
  pv.updateNesting(app, 'start_page', start_page);

  app.map
    .on('bridge-changed', function(bwlev) {
      animateMapChanges(app, bwlev);
    }, app.getContextOptsI());

  return app.map;
};

function handleQuery(map, md) {
  if (!md || md.model_name !== 'invstg') {return;}

  var search_criteria = map.getNesting('search_criteria');
  pvUpdate(search_criteria, 'query_face', md.state('query'));
}


return function initBrowsing(app) {
  var map = BrowseMap.hookRoot(app, app.start_page);
  app.map = map;

  initMapTree(app, app.start_page, app_env.needs_url_history, navi);

  // pv.updateNesting(app.getNesting('fake_spyglass'), 'search_criteria', app.map.getNesting('search_criteria'))
  // // TODO move search_criteria from map to spyglass

  if (app_env.needs_url_history){
    navi.init(function(e){
      var url = e.newURL;



      var state_from_history = navi.findHistory(e.newURL);
      if (state_from_history){
        state_from_history.data.showOnMap();
        handleQuery(map, state_from_history.data.getNesting('pioneer'));
      } else{
        var interest = BrowseMap.getUserInterest(url.replace(/\ ?\$...$/, ''), app.start_page);
        var bwlev = BrowseMap.showInterest(map, interest);
        BrowseMap.changeBridge(bwlev);
        handleQuery(map, bwlev.getNesting('pioneer'));
      }
    });
    (function() {
      var url = window.location && window.location.hash.replace(/^\#/,'');
      if (url){
        app.on('handle-location', function() {
          navi.hashchangeHandler({
            newURL: url
          }, true);

        });
      } else {
        var bwlev = BrowseMap.showInterest(map, []);
        BrowseMap.changeBridge(bwlev);
      }
    })();
  } else {
    var bwlev = BrowseMap.showInterest(map, []);
    BrowseMap.changeBridge(bwlev);
  }

  return map;
};

});
