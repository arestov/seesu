define(function(require) {
'use strict';
var Model = require('pv/Model');
var spv = require('spv');
var routePathByModels = require('pv/routePathByModels');

return spv.inh(Model, {}, {
  "+states": {
    "now_playing": [
      "compx",
      ['#now_playing'],
    ],
    "now_playing_text": [
      "compx",
      ['#now_playing_text'],
    ],
    "playing": [
      "compx",
      ['#playing'],
    ],
    "viewing_playing": [
      "compx",
      ['#viewing_playing'],
    ],
  },
  suggestNavHelper: function() {
    this.app.suggestNavHelper();
  },
  showNowPlaying: function(no_stat) {
    this.app.showNowPlaying(no_stat);
  },
  showResultsPage: function(query){
    // если нет элемента или элемент не отображается
    // если элемента нет или в элемент детализировали
    var invstg = routePathByModels(this.app.start_page, 'search/', false, true, {reuse: true});
    invstg.changeQuery(query);
    invstg.showOnMap();
    return invstg;
  },
  attachUI: function(app_view_id) {
    this.app.app_view_id = app_view_id;
    checkPageTracking(this.app);
  },
  detachUI: function(app_view_id) {
    if (this.app.p && this.app.p.c_song){
      this.showNowPlaying(true);
    }
    if (this.app.app_view_id === app_view_id){
      this.app.app_view_id = null;
    }
  },
});


function checkPageTracking(app) {
  if (app.app_view_id && app.last_page_tracking_data){
    app.trackStat.call(this, app.last_page_tracking_data);
    app.last_page_tracking_data = null;
  }
}
});
