define(function(require) {
'use strict';
var spv = require('spv');
var get_constr = require('./get_constr');

var collapseAll = spv.collapseAll;
var getNestingConstr = get_constr.getNestingConstr;


return function getModelSources(app, md, cur) {
  var states_sources = [];
  var i;
  var states_list = cur.merged_states;
  var unfolded_states = new Array(states_list.length);
  for (i = 0; i < states_list.length; i++) {
    unfolded_states[i] = md.getNonComplexStatesList(states_list[i]);
  }

  unfolded_states = collapseAll.apply(null, unfolded_states);

  for (i = 0; i < unfolded_states.length; i++) {
    var state_name = unfolded_states[i];
    var arr = md.getStateSources(state_name, app);
    if (arr) {
      states_sources.push(arr);
    }


  }
  states_sources = collapseAll.apply(null, states_sources);

  var nestings_names_list = [];

  var nesting_name;
  for (nesting_name in cur.m_children.children_by_mn) {
    nestings_names_list.push(nesting_name);
  }
  for (nesting_name in cur.m_children.children) {
    nestings_names_list.push(nesting_name);
  }

  nestings_names_list = collapseAll(nestings_names_list);

  var nesting_sources = [];
  for (i = 0; i < nestings_names_list.length; i++) {
    var source = md.getNestingSource(nestings_names_list[i], app);
    if (source) {
      nesting_sources.push(source);
    }
  }


  var all_nest_sources =[];

  for (nesting_name in cur.m_children.children) {
    var items = getNestingConstr(app, md, nesting_name);
    for (var space_name in cur.m_children.children[nesting_name]) {

      var constr_sources;
      if (!items) {
        continue;
      }
      if (Array.isArray(items)) {
        constr_sources = [];
        for (i = 0; i < items.length; i++) {
          var cur_sources = getModelSources(app, items[i].prototype, cur.m_children.children[nesting_name][space_name]);
          if (cur_sources.length) {
            constr_sources = constr_sources.concat(cur_sources);
          }
        }
      } else {
        constr_sources = getModelSources(app, items.prototype, cur.m_children.children[nesting_name][space_name]);
      }

      if (constr_sources) {
        all_nest_sources = all_nest_sources.concat(constr_sources);
      }
    }

  }





  /*
  a) итерируем по названиям гнезд,
    получаем список или один конструктор для нужного гнезда
    совмещаем данные

  б) итерируем по названиям гнезд
    получаем список или один конструктор для нужного гнезда
    вычленяем по имени модели только используемые конструкторы


  */

  var full_sources_list = states_sources.concat(nesting_sources);
  if (all_nest_sources.length) {
    full_sources_list = full_sources_list.concat(all_nest_sources);
  }
  return  collapseAll(full_sources_list);
};
});
