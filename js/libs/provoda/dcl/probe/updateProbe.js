define(function(require) {
'use strict';
 // var getSPByPathTemplate = function(app, start_md, string_template, need_constr, md_for_urldata) {
var spv = require('spv');
var switchCurrentBwlev = require('./animateMapChanges').switchCurrentBwlev;
var initDeclaredNestings = require('../../initDeclaredNestings');
var getSPByPathTemplate = initDeclaredNestings.getSPByPathTemplate;
var getModelById = require('../../utils/getModelById');
var createLevel = require('../../bwlev/createLevel');

var getBWlev = function(probe_md, md) {
  return probe_md.bwlevs[md._provoda_id];
}

var ensureBwLev = function(BWL, probe_md, probe_name, md) {
  if (!probe_md.bwlevs.hasOwnProperty(md._provoda_id)) {
    probe_md.bwlevs[md._provoda_id] = createLevel(BWL, probe_name, -1, null, md, probe_md);
  }

  return getBWlev(probe_md, md);
};

var getProbeChange = function (toggle) {
  return function (BWL, bwlev, target_id, probe_name, value, probe_container_uri) {
    var app = bwlev.app;

    var target = getModelById(bwlev, target_id);

    var set = bwlev._run_probes[probe_name];
    var key = target_id;

    // var probe_mds = bwlev.getNesting(transportName(probe_name));
    var probe_md = spv.set.get(set, key);
    if (!probe_md) {
      return; // throw ?
    }

    var container = probe_container_uri ? getSPByPathTemplate(app, target, probe_container_uri) : target;
    var subpage = getSPByPathTemplate(app, container, value);

    var nested_bwlev = subpage && ensureBwLev(BWL, probe_md, probe_name, subpage);
    var prev_subpage = probe_md.getNesting('current_md');
    var prev_nested_bwlev = prev_subpage && getBWlev(probe_md, prev_subpage);

    if (!toggle) {
      probe_md.updateNesting('current_md', subpage);
      switchCurrentBwlev(nested_bwlev, prev_nested_bwlev);
      probe_md.updateNesting('current_bwlev', nested_bwlev);
      return;
    }

    var cur = probe_md.getNesting('current_md');
    if (cur === subpage) {
      probe_md.updateNesting('current_md', null);
      switchCurrentBwlev(null, prev_nested_bwlev);
      probe_md.updateNesting('current_bwlev', null);
    } else {

      probe_md.updateNesting('current_md', subpage);
      switchCurrentBwlev(nested_bwlev, prev_nested_bwlev);
      probe_md.updateNesting('current_bwlev', nested_bwlev);
    }
  };
};

var updateProbe = getProbeChange();
var toggleProbe = getProbeChange(true);
updateProbe.toggleProbe = toggleProbe;

return updateProbe;
});
