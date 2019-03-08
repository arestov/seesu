define(function(require) {
'use strict';

var StatesLabour = require('./StatesLabour');
var utils_simple = require('./utils/simple');
var spv = require('spv');
var produceEffects = require('./StatesEmitter/produceEffects');
var push = Array.prototype.push;
var getSTCHfullname = spv.getPrefixingFunc('stch-');
var getFinupFullname = spv.getPrefixingFunc('finup-');
var checkStates = require('./nest-watch/index').checkStates;
var _passHandleState = require('./dcl/passes/handleState/handle')

var serv_counter = 1;
var ServStates = function() {
  this.num = ++serv_counter;
  this.collecting_states_changing = false;
  // this.original_states = {};

  this.states_changing_stack = [];
  this.all_i_cg = [];

  this.changed_states = [];
  this.total_ch = [];

  // this.stch_states = {};
  this.all_ch_compxs = [];
};

var pool = {
  free: [],
  busy: {}
};

var getFree = function(pool) {
  if (pool.free.length) {
    return pool.free.pop();
  } else {
    var item = new ServStates();
    pool.busy[item.num] = true;
    return item;
  }
};

var release = function(pool, item) {
  pool.busy[item.num] = null;
  pool.free.push(item);
};


function updateProxy(etr, changes_list, opts) {
  if (etr._lbr && etr._lbr.undetailed_states){
    iterateChList(changes_list, etr, _setUndetailedState);
    return etr;
  }

  //порождать события изменившихся состояний (в передлах одного стэка/вызова)
  //для пользователя пока пользователь не перестанет изменять новые состояния
  if (!etr.zdsv){
    etr.zdsv = new StatesLabour(!!etr.full_comlxs_index, etr._has_stchs);
  }

  var zdsv = etr.zdsv;
  var serv_st = getFree(pool);


  serv_st.states_changing_stack.push(changes_list, opts);

  if (serv_st.collecting_states_changing){
    return etr;
  }

  serv_st.collecting_states_changing = true;
  //etr.zdsv is important for etr!!!
  //etr.serv_st.collecting_states_changing - must be semi public;


  var original_states = zdsv.original_states;

  var total_ch = serv_st.total_ch;
  var all_i_cg = serv_st.all_i_cg;
  var all_ch_compxs = serv_st.all_ch_compxs;
  var changed_states = serv_st.changed_states;

  while (serv_st.states_changing_stack.length){

    //spv.cloneObj(original_states, etr.states);

    var cur_changes_list = serv_st.states_changing_stack.shift();
    var cur_changes_opts = serv_st.states_changing_stack.shift();

    //получить изменения для состояний, которые изменил пользователь через публичный метод
    getChanges(etr, original_states, cur_changes_list, cur_changes_opts, changed_states);
    //var changed_states = ... ↑

    cur_changes_list = cur_changes_opts = null;

    if (etr.full_comlxs_index) {
      //проверить комплексные состояния
      var first_compxs_chs = getComplexChanges(etr, original_states, changed_states);
      if (first_compxs_chs.length){
        push.apply(all_ch_compxs, first_compxs_chs);
      }

      var current_compx_chs = first_compxs_chs;
      //довести изменения комплексных состояний до самого конца
      while (current_compx_chs.length){
        var cascade_part = getComplexChanges(etr, original_states, current_compx_chs);
        current_compx_chs = cascade_part;
        if (cascade_part.length){
          push.apply(all_ch_compxs, cascade_part);
        }
        cascade_part = null;

      }
      current_compx_chs = null;
    }



    //собираем все группы изменений
    if (changed_states.length){
      push.apply(all_i_cg, changed_states);
    }
    if (all_ch_compxs && all_ch_compxs.length){
      push.apply(all_i_cg, all_ch_compxs);
    }
    //устраняем измененное дважды и более
    compressStatesChanges(all_i_cg);



    iterateChList(all_i_cg, etr, _triggerVipChanges, zdsv);



    if (all_i_cg.length){
      push.apply(total_ch, all_i_cg);
    }


    utils_simple.wipeObj(original_states);
    all_i_cg.length = changed_states.length = 0;
    if (all_ch_compxs) {
      all_ch_compxs.length = 0;
    }

    //объекты используются повторно, ради выиграша в производительности
    //которые заключается в исчезновении пауз на сборку мусора
  }

  //устраняем измененное дважды и более
  compressStatesChanges(total_ch);
  iterateChList(total_ch, etr, _triggerStChanges, zdsv);
  produceEffects(total_ch, etr);

  //utils_simple.wipeObj(original_states);
  //all_i_cg.length = all_ch_compxs.length = changed_states.length = 0;

  if (etr.sendStatesToMPX && total_ch.length){
    etr.sendStatesToMPX(total_ch);
    total_ch.length = 0;
  } else {
    total_ch.length = 0;
  }


  serv_st.collecting_states_changing = false;

  release(pool, serv_st);
  //zdsv = null;
  return etr;
}

function iterateChList(changes_list, context, cb, zdsv) {
  for (var i = 0; i < changes_list.length; i+=3) {
    cb(context, i, changes_list[i+1], changes_list[i+2], zdsv);
  }
}

function _setUndetailedState(etr, i, state_name, value) {
  etr._lbr.undetailed_states[state_name] = value;
}


function proxyStch(target, value, state_name) {
  var old_value = target.zdsv.stch_states[state_name];
  if (old_value === value) {
    return;
  }

  target.zdsv.stch_states[state_name] = value;
  var method = (target[ getSTCHfullname( state_name ) ] || (target.state_change && target.state_change[state_name]));

  method(target, value, old_value);
}

function _handleStch(etr, original_states, state_name, value, skip_handler, sync_tpl) {
  var stateChanger = !skip_handler && (etr[ getSTCHfullname( state_name ) ] || (etr.state_change && etr.state_change[state_name]));
  if (!stateChanger) {
    return;
  }

  etr.zdsv.abortFlowSteps('stch', state_name, true);

  var old_value = etr.zdsv.stch_states[state_name];
  if (old_value === value) {
    return;
  }

  var method = stateChanger && (
    typeof stateChanger == 'function'
      ? stateChanger
      : (etr.checkDepVP && etr.checkDepVP(stateChanger) && stateChanger.fn)
  );

  if (!method) {
    return;
  }

  if (!sync_tpl) {
    var flow_step = etr.nextLocalTick(proxyStch, [etr, value, state_name], true, method.finup);
    flow_step.p_space = 'stch';
    flow_step.p_index_key = state_name;
    etr.zdsv.createFlowStepsArray('stch', state_name, flow_step);
  } else {
    proxyStch(etr, value, state_name);
  }
}

function getChanges(etr, original_states, changes_list, opts, result_arr) {
  var changed_states = result_arr || [];
  var i;
  for (i = 0; i < changes_list.length; i+=3) {
    _replaceState(etr, original_states, changes_list[i+1], changes_list[i+2], changed_states);
  }

  for (i = 0; i < changes_list.length; i+=3) {
    _passHandleState(etr, original_states, changes_list[i+1], changes_list[i+2]);
  }

  if (etr.updateTemplatesStates){
    etr.updateTemplatesStates(changes_list, opts && opts.sync_tpl);
  }
  for (i = 0; i < changes_list.length; i+=3) {
    _handleStch(etr, original_states, changes_list[i+1], changes_list[i+2], opts && opts.skip_handler, opts && opts.sync_tpl);
  }
  return changed_states;
}

function getComplexChanges(etr, original_states, changes_list) {
  return getChanges(etr, original_states, checkComplexStates(etr, changes_list));
}


function _replaceState(etr, original_states, state_name, value, stack) {
  if (!state_name) {
    return;
  }

  var old_value = etr.states[state_name];
  if (old_value === value){
    return;
  }

  //value = value || false;
  //less calculations? (since false and "" and null and undefined now os equeal and do not triggering changes)

  if (!original_states.hasOwnProperty(state_name)) {
    original_states[state_name] = old_value;
  }
  etr.states[state_name] = value;
  stack.push(true, state_name, value);
}

function getComplexInitList(etr) {
  if (!etr.full_comlxs_list) {return;}
  var result_array = [];

  for (var i = 0; i < etr.full_comlxs_list.length; i++) {
    var cur = etr.full_comlxs_list[i];
    result_array.push(true, cur.name, compoundComplexState(etr, cur));
  }

  return result_array;
}


function checkComplexStates(etr, changes_list) {
  return getTargetComplexStates(etr, changes_list);
}

function getTargetComplexStates(etr, changes_list) {
  var uniq = {};
  var matched_compxs = [];

  var i, cur;

  for ( i = 0; i < changes_list.length; i+=3) {
    cur = etr.full_comlxs_index[changes_list[i+1]];
    if (!cur){
      continue;
    }
    for (var jj = 0; jj < cur.length; jj++) {
      var name = cur[jj].name;
      if (uniq.hasOwnProperty(name)) {
        continue;
      }
      uniq[name] = true;
      matched_compxs.push(cur[jj]);
    }
  }

  var length = matched_compxs.length;
  matched_compxs.length = matched_compxs.length * 3;


  for (i = length - 1; i >= 0; i--) {
    cur = matched_compxs[i];
    var ti = i * 3;
    matched_compxs[ti] = true;
    matched_compxs[ti + 1] = cur.name;
    matched_compxs[ti + 2] = compoundComplexState(etr, cur);
  }

  return matched_compxs;
}

function compoundComplexState(etr, temp_comx) {
  var values = new Array(temp_comx.depends_on.length);
  for (var i = 0; i < temp_comx.depends_on.length; i++) {
    values[i] = etr.state(temp_comx.depends_on[i]);
  }
  return temp_comx.fn.apply(etr, values);
}

function compressChangesList(result_changes, changes_list, i, prop_name, value, counter) {
  if (result_changes[prop_name] === true){
    return;
  }

  var num = (changes_list.length - 1) - counter * 3;
  changes_list[ num - 1 ] = prop_name;
  changes_list[ num ] = value;

  result_changes[prop_name] = true;
  return true;
}

function reversedIterateChList(changes_list, context, cb) {
  var counter = 0;
  for (var i = changes_list.length - 1; i >= 0; i-=3) {
    if (cb(context, changes_list, i, changes_list[i-1], changes_list[i], counter)){
      counter++;
    }
  }
  return counter;
}

function compressStatesChanges(changes_list) {
  var result_changes = {};
  var counter = reversedIterateChList(changes_list, result_changes, compressChangesList);
  counter = counter * 3;
  while (changes_list.length != counter){
    changes_list.shift();
  }
  return changes_list;
}

var PVStateChangeEvent = function(type, value, old_value, target) {
  this.type = type;
  this.value = value;
  this.old_value = old_value;
  this.target = target;
};


//var st_event_name_default = ;
//var st_event_name_vip = 'vip_state_change-';
//var st_event_name_light = 'lgh_sch-';

var st_event_opt = {force_async: true};

function _triggerVipChanges(etr, i, state_name, value, zdsv) {
  var vip_name = utils_simple.getSTEVNameVIP( state_name);
  zdsv.abortFlowSteps('vip_stdch_ev', state_name);


  var vip_cb_cs = etr.evcompanion.getMatchedCallbacks(vip_name);
  if (!vip_cb_cs.length) {
    return;
  }

  var flow_steps = zdsv.createFlowStepsArray('vip_stdch_ev', state_name);
  var event_arg = new PVStateChangeEvent(state_name, value, zdsv.original_states[state_name], etr);

  //вызов внутреннего для самого объекта события
  etr.evcompanion.triggerCallbacks(vip_cb_cs, false, false, vip_name, event_arg, flow_steps);
  utils_simple.markFlowSteps(flow_steps, 'vip_stdch_ev', state_name);
}

function triggerLegacySChEv(etr, state_name, value, old_value, default_cb_cs, default_name, flow_steps) {
  var event_arg = new PVStateChangeEvent(state_name, value, old_value, etr);
      //вызов стандартного события
  etr.evcompanion.triggerCallbacks(default_cb_cs, false, st_event_opt, default_name, event_arg, flow_steps);
}

function _triggerStChanges(etr, i, state_name, value, zdsv) {

  zdsv.abortFlowSteps('stev', state_name);

  checkStates(etr, zdsv, state_name, value, zdsv.original_states[state_name]);

  var default_name = utils_simple.getSTEVNameDefault( state_name );
  var light_name = utils_simple.getSTEVNameLight( state_name );

  var default_cb_cs = etr.evcompanion.getMatchedCallbacks(default_name);
  var light_cb_cs = etr.evcompanion.getMatchedCallbacks(light_name);

  if (!light_cb_cs.length && !default_cb_cs.length) {
    return;
  }

  var flow_steps = zdsv.createFlowStepsArray('stev', state_name);

  if (light_cb_cs.length) {
    etr.evcompanion.triggerCallbacks(light_cb_cs, false, false, light_name, value, flow_steps);
  }

  if (default_cb_cs.length) {
    triggerLegacySChEv(etr, state_name, value, zdsv.original_states[state_name], default_cb_cs, default_name, flow_steps);
  }

  if (flow_steps) {
    utils_simple.markFlowSteps(flow_steps, 'stev', state_name);
  }

  // states_links

}

updateProxy.update = function(md, state_name, state_value, opts) {
  /*if (state_name.indexOf('-') != -1 && console.warn){
    console.warn('fix prop state_name: ' + state_name);
  }*/
  if (md.hasComplexStateFn(state_name)){
    throw new Error("you can't change complex state " + state_name);
  }
  return updateProxy(md, [true, state_name, state_value], opts);


  // md.updateState(state_name, state_value, opts);
};
updateProxy.getComplexInitList = getComplexInitList;

return updateProxy;
});
