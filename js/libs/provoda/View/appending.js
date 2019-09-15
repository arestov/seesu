define(function(require) {
'use strict'
var spv = require('spv');
var $ = require('jquery');
var hp = require('../helpers');
var updateProxy = require('../updateProxy');


var pvUpdate = updateProxy.update;
var $v = hp.$v;

var appendSpace = function() {
  //fixme
  //$(target).append(document.createTextNode(' '));
};


return {
  appen_ne_vws: {
    appendDirectly: function(fragt) {
      this.place.append(fragt);
    },
    getFreeView: function(cur) {
      return this.view.getFreeChildView({
        by_model_name: this.by_model_name,
        nesting_name: this.nesname,
        nesting_space: this.space
      }, cur, (typeof this.view_opts == 'function' ? this.view_opts.call(this.view, cur) : this.view_opts));
    }
  },
  pvCollectionChange: function(nesname, items, removed) {
    var pv_views_complex_index = spv.getTargetField(this, this.tpl_children_prefix + nesname);
    if (!pv_views_complex_index && this.tpls) {
      for (var i = 0; i < this.tpls.length; i++) {
        pv_views_complex_index = spv.getTargetField(this.tpls[i], ['children_templates', nesname]);
        if (pv_views_complex_index) {
          break;
        }
      }
    }
    var cur;
    if (pv_views_complex_index){
      var space_name;
      var array = spv.toRealArray(items);
      if (removed && removed.length) {
        for (space_name in pv_views_complex_index.usual){
          this.removeViewsByMds(removed, nesname, space_name);
        }
        for (space_name in pv_views_complex_index.by_model_name){
          this.removeViewsByMds(removed, nesname, space_name);
        }
      }


      for (space_name in pv_views_complex_index.usual){
        cur = pv_views_complex_index.usual[space_name];
        if (!cur) {continue;}
        this.checkCollchItemAgainstPvView(nesname, array, space_name, pv_views_complex_index.usual[space_name]);
      }
      for (space_name in pv_views_complex_index.by_model_name){
        cur = pv_views_complex_index.by_model_name[space_name];
        if (!cur) {continue;}
        this.checkCollchItemAgainstPvViewByModelName(nesname, array, space_name, cur);
      }
      /*
      for (var
        i = 0; i < space.length; i++) {
        space[i]
      };*/


      this.requestAll();
    }
  },
  appendNestingViews: function(declr, view_opts, nesname, array, not_request){
    var place;
    if (typeof declr.place == 'string'){
      place = spv.getTargetField(this, declr.place);
    } else if (typeof declr.place == 'function'){
      //place = spv.getTargetField(this, declr.place);
    }

    array = array && array.map(function(cur) {
      for (var i = 0; i < declr.is_wrapper_parent; i++) {
        cur = cur.getParentMapModel();
      }
      return cur;
    });

    this.appendCollection(declr.space, {
      view: this,
      place: place,
      nesname: nesname,
      space: declr.space,
      by_model_name: declr.by_model_name,
      view_opts: view_opts,
      appendDirectly: this.appen_ne_vws.appendDirectly,
      getFreeView: this.appen_ne_vws.getFreeView
    }, view_opts, nesname, array, not_request);

  },
  appendCollection: function(space, funcs, view_opts, nesname, array, not_request) {
    var location_id = $v.getViewLocationId(this, nesname, space || 'main');



    var ordered_rend_list = this.getRendOrderedNesting(nesname, array);
    if (ordered_rend_list){
      this.appendOrderedCollection(space, funcs, view_opts, array, not_request, ordered_rend_list);
    } else {
      this.appendOrderedCollection(space, funcs, view_opts, array, not_request);
    }



    //исправляем порядковый номер вьюхи в нэстинге
    var counter = 0;
    for (var i = 0; i < array.length; i++) {
      var view = this.getStoredMpx(array[i]).getView(location_id);
      if (view) {
        view._lbr.innesting_pos_current = counter;

        var $first = counter === 0;
        var $last = counter === (array.length - 1);

        view.current_motivator = this.current_motivator;

        pvUpdate(view, '$index', counter);
        pvUpdate(view, '$index_back', (array.length - 1) - counter);
        pvUpdate(view, '$first', $first);
        pvUpdate(view, '$last', $last);
        pvUpdate(view, '$middle', !($first || $last));

        view.current_motivator = null;

        counter++;
      }
    }
  },
  createDOMComplect: function(complects, ordered_complects, view, type) {
    var comt_id = view.view_id + '_' + type;
    if (!complects[comt_id]){
      var complect = {
        fragt: window.document.createDocumentFragment(),
        view: view,
        type: type
      };
      complects[comt_id] = complect;
      ordered_complects.push(comt_id);
    }
    return complects[comt_id];
  },
  appendOrderedCollection: function(space, funcs, view_opts, array, not_request, ordered_rend_list) {
    if (!this.isAlive()){
      return;
    }
    var cur = null, view = null, i = 0, prev_view = null, next_view = null;

    var location_id = $v.getViewLocationId(this, funcs.nesname, space || 'main');
    var detached = [];
    var ordered_part;

    while (!ordered_part && ordered_rend_list && ordered_rend_list.length){
      ordered_part = ordered_rend_list && ordered_rend_list.shift();
      if (ordered_part && ordered_part.length == array && array.length){
        ordered_part = null;
      }
      if (ordered_part) {
        //если у всех приоритезированных моделей уже есть вьюхи, то не не используем преоритезацию
        var has_any_nonviewed = false;
        for (i = 0; i < ordered_part.length; i++) {
          if (this.getStoredMpx(ordered_part[i]).getView(location_id)){
            has_any_nonviewed = true;
          }
        }
        if (!has_any_nonviewed){
          ordered_part = null;
        }
      }
    }

    //если сосед имевший меньший номер теперь имеет номер больше значит нас сместили в начало
    //если сосед имел больший, а теперь меньше, нас сместили в конец


    for (i = 0; i < array.length; i++) {
      cur = array[i];
      view = this.getStoredMpx(cur).getView(location_id);
      if (view){
        prev_view = this.getPrevView(array, i, location_id, true);
        if (prev_view){
          var current_node = view.getT();
          var prev_node = prev_view.getT();
          if (!current_node.prev().is(prev_node)){
            var parent_node = current_node[0] && current_node[0].parentNode;
            if (parent_node){
              parent_node.removeChild(current_node[0]);
            }
            view.setVisState('con_appended', false);

            view._lbr.detached = true;
            detached.push(view);
          }
        }
      }
    }
    var append_list = [];
    var ordered_complects = [];
    var complects = {};
    //view_id + 'after'

    //создать контроллеры, которые уже имеют DOM в документе, но ещё не соединены с ним
    //следующий итератор получит эти views через getChildView
    if (funcs.getView){
      for (i = 0; i < array.length; i++) {
        funcs.getView( array[i], space, ordered_part);
      }
    }


    for (i = 0; i < array.length; i++) {
      cur = array[i];
      view = this.getStoredMpx(cur).getView(location_id);
      if (view && !view._lbr.detached){
        continue;
      }
      if (!view && ordered_part && ordered_part.indexOf(cur) == -1){
        continue;
      }
      prev_view = this.getPrevView(array, i, location_id, true);

      if (prev_view && prev_view.state('vis_con_appended')) {
        append_list.push(cur, this.createDOMComplect(complects, ordered_complects, prev_view, 'after'));
      } else {
        next_view = this.getNextView(array, i, location_id, true);
        if (next_view && next_view.state('vis_con_appended')){
          append_list.push(cur, this.createDOMComplect(complects, ordered_complects, next_view, 'before'));
        } else {
          append_list.push(cur, this.createDOMComplect(complects, ordered_complects, false, 'direct'));
        }
      }
      //cur.append_list = append_list;
    }
    var apd_views = new Array(append_list.length/2);
    for (i = 0; i < append_list.length; i+=2) {
      cur = append_list[ i ];
      var complect = append_list[ i + 1 ];

      view = this.getStoredMpx(cur).getView(location_id);
      if (!view){
        view = funcs.getFreeView(cur);
      }
      apd_views[i/2] = view;
      //append_data.view = view;
      view.skip_anchor_appending = true;
      var fragt = $(complect.fragt);
      fragt.append(view.getT());
      appendSpace(fragt);
      //append_data.complect.fragt.appendChild(view.getT()[0]);
      //$(.fragt).append();
    }
    if (!this._lbr._collections_set_processing){
      for (i = array.length - 1; i >= 0; i--) {
        view = this.getStoredMpx(array[i]).getView(location_id);
        if (view){
          view.requestDetailesCreating();
        }
      }
      if (!not_request){
        //this._lbr._collections_set_processing
        this.requestAll();
      }
    }

    for (i = 0; i < ordered_complects.length; i++) {
      var complect = complects[ordered_complects[i]];
      if (complect.type == 'after'){
        complect.view.getT().after(complect.fragt);
      } else if (complect.type == 'before'){
        complect.view.getT().before(complect.fragt);
      } else if (complect.type =='direct'){
        funcs.appendDirectly(complect.fragt);
      }
    }
    for (i = 0; i < detached.length; i++) {
      detached[i]._lbr.detached = null;
    }
    if (ordered_part && ordered_part.length){
      this.nextLocalTick(this.appendOrderedCollection, [space, funcs, view_opts, array, not_request, ordered_rend_list]);
      //fixme can be bug (если nesting изменён, то измнения могут конфликтовать)
    }


    for (i = 0; i < array.length; i++) {
      view = this.getStoredMpx(array[i]).getView(location_id);
      if (view){
        view._lbr.innest_prev_view = this.getPrevView(array, i, location_id, true);
        view._lbr.innest_next_view = this.getNextView(array, i, location_id, true);

      }

    }

    for (i = 0; i < apd_views.length; i++) {
      cur = apd_views[i];
      cur.skip_anchor_appending = null;
      cur.appendCon();
    }
    return complects;
    //1 открепить неправильно прикреплённых
    //1 выявить соседей
    //отсортировать существующее
    //сгруппировать новое
    //присоединить новое
  },
  appendFVAncorByVN: function(opts) {
    var view = this.getFreeChildView({
      by_model_name: opts.by_model_name,
      nesting_name: opts.name,
      nesting_space: opts.space
    }, opts.md, opts.opts);
    var place = opts.place;
    if (place && typeof opts.place == 'function'){
      if ((opts.strict || view) && place){
        place = opts.place.call(this, opts.md, view, opts.original_md);
        if (!place && typeof place != 'boolean'){
          throw new Error('give me place');
        } else {
          place.append(view.getA());
          appendSpace(place);
        }
      }

    }
  },
  checkCollchItemAgainstPvViewByModelName: (function(){
    var getFreeView = function(cur_md, node_to_use) {
      var pv_view = this.cur_pv_v_data;
      if (!pv_view){
        return;
      }

      var view = this.view.getFreeChildView({
        by_model_name: true,
        controller_name: pv_view.controller_name,
        nesting_name: this.nesname,
        nesting_space: this.space_name,
        sampleController: this.DOMView()
      }, cur_md);

      if (view){
        if (!node_to_use){
          node_to_use = pv_view.sampler.getClone();
          //node_to_use = pv_view.original_node.cloneNode(true);
        }
        view.pv_view_node = $(node_to_use);
        //var model_name = mmm.model_name;

        pv_view.node = null;
        pv_view.views.push(view.view_id);

        pv_view.last_node = node_to_use;

        pv_view.onDie(function() {
          view.die();
        });

        return view;
      }
    };

    var appendDirectly = function(fragt) {
      $(this.cur_pv_v_data.comment_anchor).after(fragt);
    };

    return function(nesname, real_array, space_name, pv_v_data) {

      var jobs_by_mn = {};

      for (var i = 0; i < real_array.length; i++) {
        var cur = real_array[i];
        if (cur.model_name && pv_v_data.index[cur.model_name]){
          jobs_by_mn[cur.model_name] = jobs_by_mn[cur.model_name] || [];
          jobs_by_mn[cur.model_name].push(cur);
        }
      }

      for (var model_name in jobs_by_mn) {
        if (jobs_by_mn.hasOwnProperty(model_name)) {
          this.appendCollection(space_name, {
            view: this,
            nesname: nesname,
            cur_pv_v_data: pv_v_data.index[model_name],
            space_name: space_name,
            getFreeView: getFreeView,
            appendDirectly: appendDirectly
          }, false, nesname, jobs_by_mn[model_name]);
        }
      }

      //var filtered = pv_view.filterFn ? pv_view.filterFn(real_array) : real_array;
    };
  })(),

  checkCollchItemAgainstPvView:(function() {
    var getView = function(cur_md, space, preffered) {
      if (this.pv_view.node){
        if (!preffered || preffered.indexOf(cur_md) != -1){
          return this.getFreeView(cur_md, this.pv_view.node);
        }
      }
    };

    var getFreeView = function(cur_md, node_to_use) {
      var pv_view = this.pv_view;
      var view = this.view.getFreeChildView({
        by_model_name: false,
        controller_name: pv_view.controller_name,
        nesting_name: this.nesname,
        nesting_space: this.space_name,
        sampleController: this.DOMView()
      }, cur_md);

      if (view){
        if (!node_to_use){
          //node_to_use = pv_view.original_node.cloneNode(true);
          node_to_use = pv_view.sampler.getClone();
        }
        view.pv_view_node = $(node_to_use);
        //var model_name = mmm.model_name;

        pv_view.node = null;
        pv_view.views.push(view.view_id);

        pv_view.last_node = node_to_use;
        pv_view.onDie(function() {
          view.die();
        });
        return view;
      }
    };

    var appendDirectly = function(fragt) {
      $(this.pv_view.comment_anchor).after(fragt);
    };

    return function(nesname, real_array, space_name, pv_view) {
    //	if (!pv_view.original_node){
    //		pv_view.original_node = pv_view.node.cloneNode(true);

    //	}
      if (!pv_view.comment_anchor){
        pv_view.comment_anchor = window.document.createComment('collch anchor for: ' + nesname + ", " + space_name);
        $(pv_view.node).before(pv_view.comment_anchor);
      }

      if (pv_view.node){
        $(pv_view.node).detach();
        pv_view.node = null;
      }

      var filtered = pv_view.filterFn ? pv_view.filterFn(real_array) : real_array;

      this.appendCollection(space_name, {
        view: this,
        pv_view: pv_view,
        nesname: nesname,
        space_name: space_name,
        getView: pv_view.node && getView,
        appendDirectly: appendDirectly,
        getFreeView: getFreeView
      }, false, nesname, filtered);

    };
  })(),

  getPrevView: function(array, start_index, location_id, view_itself) {


    var i = start_index - 1;
    if (i >= array.length || i < 0){
      return;
    }
    for (; i >= 0; i--) {
      var view = this.getStoredMpx(array[i]).getView(location_id);
      var dom_hook = view && !view._lbr.detached && view.getT();
      if (dom_hook){
        if (view_itself){
          return view;
        } else {
          return dom_hook;
        }
      }

    }
  },
  getNextView: function(array, start_index, location_id, view_itself) {
    var i = start_index + 1;
    if (i >= array.length || i < 0){
      return;
    }
    for (; i < array.length; i++) {
      var view = this.getStoredMpx(array[i]).getView(location_id);
      var dom_hook = view && !view._lbr.detached && view.getT();
      if (dom_hook){
        if (view_itself){
          return view;
        } else {
          return dom_hook;
        }
      }
    }
  },
  tpl_children_prefix: 'tpl.children_templates.',
}
})
