define(function (require) {
'use strict';
var pvState = require('../../utils/state');
var initDeclaredNestings = require('../../initDeclaredNestings');
var executeStringTemplate = initDeclaredNestings.executeStringTemplate;

function addHead(md, hands, head) {
  hands.heads.push(head);
  md.nextTick(function (hands, head) {
    runHeadFilter(this.current_motivator, head, hands);
  }, [hands, head], true);
}

function Hands(dcl) {
  this.dcl = dcl;
  this.declr = dcl;
  this.items = null;
  this.heads = [];
  this.hands = this;
  this.deep_item_states_index = null;
  this.deep_item_states_index = dcl.selectFn && {};

  // sometimes different heads can share one `hands` object

  // when filtering does not depend on head
  // we can share `filtering` result for different heads
  this.can_filter_here = !dcl.deps.base.cond;
  this.item_cond_index = this.can_filter_here ? {} : null;

  // when sorting does not depend on head
  // we can share `sorting` result for different heads
  this.can_sort_here = this.can_filter_here && !dcl.deps.base.sort;


  this.items_filtered = null;
  this.items_sorted = null;
}

var count = 1;
var NestSelector = function (md, declr, hands) {
  this.num = 'nsel-' + (count++);
  this.md = md;
  this.declr = declr;
  this.hands = hands

  this.items_changed = null;
  // this.waiting_chd_count = false;

  this.state_name = declr.deps.base.all.list;
  this.short_state_name = declr.deps.base.all.shorts;

  this.item_cond_index = (declr.selectFn && declr.deps.base.cond) ? {} : null;
  this.base_states = null;

  if (declr.selectFn && declr.deps.base.all.list) {
    var base_states = {};
    for (var i = 0; i < declr.deps.base.all.list.length; i++) {
      var cur = declr.deps.base.all.list[i];
      base_states[cur] = pvState(md, cur);
    }
    this.base_states = base_states;
  }

};

NestSelector.Hands = Hands;
NestSelector.addHead = addHead;

NestSelector.prototype.selector = [];
NestSelector.prototype.state_handler = handleChdDestState;

NestSelector.handleChdDeepState = handleChdDeepState;
NestSelector.handleChdCount = handleChdCount;
NestSelector.handleAdding = handleAdding;
NestSelector.handleRemoving = handleRemoving;
NestSelector.rerun = rerun;

function handleChdDestState(motivator, fn, head, args) {
  // input - changed "dest" state
  // expected - invalidated all item conditions, rerunned query, updated nesting
  var hands = head.hands;
  if (!hands.declr.selectFn) {
    return runHeadFilter(motivator, head, hands);
  }

  var state_name = args[0];
  var value = args[1];

  var states = head.base_states;
  states[state_name] = value;
  var base = hands.dcl.deps.base;
  if (base.cond && base.cond.index[state_name] === true) {
    head.item_cond_index = {};
  }

  runHeadFilter(motivator, head, hands);
}

function handleChdDeepState(motivator, _, lnwatch, args) {
  // input - changed "deep source" state
  // expected - invalidated one item condition, rerunned query, updated nesting
  var state_name = args[0];
  var value = args[1];
  var md = args[3];

  var hands = lnwatch.data;

  var _provoda_id = md._provoda_id;
  var states = hands.deep_item_states_index[_provoda_id];
  if (!states) {
    // we can get state change event just after item was removed from list
    return
  }
  states[state_name] = value;
  hands.deep_item_states_index[_provoda_id] = states;

  var deep = hands.dcl.deps.deep;
  if (deep.cond && deep.cond.index[state_name] === true) {

    if (hands.can_filter_here) {
      delete hands.item_cond_index[_provoda_id];
      hands.items_filtered = null;
    } else {
      for (var i = 0; i < hands.heads.length; i++) {
        var head = hands.heads[i];
        delete head.item_cond_index[_provoda_id];
      }
    }
  }
  if (hands.can_sort_here && deep.sort && deep.sort.index[state_name] === true) {
    hands.items_sorted = null;
  }

  runFilter(motivator, hands);
}

function rerun(motivator, _, lnwatch) {
  runFilter(motivator, lnwatch.data);
}

function checkCondition(head, hands, _provoda_id) {
  var deep_states = hands.deep_item_states_index[_provoda_id];
  var base_states = head.base_states;
  var args_schema = head.declr.args_schema;

  var args = new Array(args_schema.length);
  for (var i = 0; i < args_schema.length; i++) {
    var cur = args_schema[i];
    var value;
    switch (cur.type) {
      case 'deep':
        value = deep_states[cur.name];
        break;
      case 'base':
        value = base_states[cur.name];
        break;
      default:
        throw new Error('unknow type dep type');
    }
    args[i] = value;
  }
  return Boolean(head.declr.selectFn.apply(null, args));
}

function keyFromCache(head, hands, cache, key) {
  if (!cache.hasOwnProperty(key)) {
    cache[key] = checkCondition(head, hands, key);
  }
  return cache[key];
}

function isFine(md, head, hands) {
  var cache = hands.can_filter_here ? hands.item_cond_index : head.item_cond_index;
  return keyFromCache(head, hands, cache, md._provoda_id);
}

function switchDistant(do_switch, base, deep) {
  return do_switch ? deep : base;
}

function getFiltered(head, hands) {
  if (!hands.items) {return;}
  var dcl = head.declr;
  var cond_base = dcl.deps.base.cond;
  var cond_deep = dcl.deps.deep.cond;
  if (!(cond_base && cond_base.list) && !(cond_deep && cond_deep.list)) {
    return hands.items;
  }

  var result = [];

  for (var i = 0; i < hands.items.length; i++) {
    var cur = hands.items[i];
    if (isFine(cur, head, hands)) {
      result.push(cur);
    }
  }

  return result;
}

function getReadyItems(head, hands, filtered) {
  var dcl = head.declr;

  if (!dcl.map) {
    return filtered;
  }

  if (!filtered) {return;}
  var arr = new Array(filtered.length);
  var distant = dcl.map.from_distant_model;
  for (var i = 0; i < filtered.length; i++) {
    var cur = filtered[i];
    var md_from = switchDistant(distant, head.md, cur);
    var md_states_from = switchDistant(distant, cur, head.md);

    arr[i] = executeStringTemplate(
      head.md.app, md_from, dcl.map.template, false, md_states_from
    );
  }
  return arr;
}

function getCommonFiltered(head, hands) {
  var sharing_allowed = hands.can_filter_here;
  if (!sharing_allowed) {
    return getFiltered(head, hands);
  }
  if (!hands.items_filtered) {
    hands.items_filtered = getFiltered(head, hands);
  }
  return hands.items_filtered;
}

function getSorted(head, hands, items) {
  if (!items) {return;}
  return items.slice().sort(function (one, two) {
    return head.declr.sortFn.call(null, one, two, head.md);
  });
}

function getCommonSorted(head, hands, items) {
  var sharing_allowed = hands.can_sort_here;
  if (!sharing_allowed) {
    return getSorted(head, hands, items);
  }
  if (!hands.items_sorted) {
    hands.items_sorted = getSorted(head, hands, items);
  }
  return hands.items_sorted;
}

function getFilteredAndSorted(head, hands) {
  var filtered = getCommonFiltered(head, hands);
  var sorted = (filtered && head.declr.sortFn)
    ? getCommonSorted(head, hands, filtered)
    : filtered;

  return sorted;
}

function runHeadFilter(motivator, head, hands) {
  // item_cond_index
  // deep_item_states_index
  // base_states

  var sorted = getFilteredAndSorted(head, hands);
  var result = getReadyItems(head, hands, sorted);

  var md = head.md;
  var old_motivator = md.current_motivator;
  md.current_motivator = motivator;
  md.updateNesting(head.declr.dest_name, result);
  md.current_motivator = old_motivator;

  return result;
}

function runFilter(motivator, hands) {
  for (var i = 0; i < hands.heads.length; i++) {
    runHeadFilter(motivator, hands.heads[i], hands);
  }
}

function handleChdCount(motivator, _, lnwatch, __, items) {
  // input - changed list order or length
  // expected - rerunned query, updated nesting

  var hands = lnwatch.data;
  hands.items = items;
  runFilter(motivator, hands);
}

function handleAdding(md, lnwatch, skip) {
  // input - signal of added to list item
  // expected - prepared item state cache

  if (skip !== lnwatch.selector.length) {return;}


  var hands = lnwatch.data;
  if (hands.can_filter_here) {
    hands.items_filtered = null;
  }

  var declr = hands.dcl;
  var _provoda_id = md._provoda_id;

  var states = {};
  var deep = declr.deps.deep;
  for (var i = 0; i < deep.cond.list.length; i++) {
    var cur = deep.cond.list[i];
    states[cur] = pvState(md, cur);
  }
  hands.deep_item_states_index[_provoda_id] = states;
}

function handleRemoving(md, lnwatch, skip) {
  // input - signal of removed item form list
  // expected - removed item state cache

  if (skip !== lnwatch.selector.length) {return;}

  var hands = lnwatch.data;
  if (hands.can_filter_here) {
    hands.items_filtered = null;
  }
  var _provoda_id = md._provoda_id;
  delete hands.deep_item_states_index[_provoda_id];
}

return NestSelector;
});
