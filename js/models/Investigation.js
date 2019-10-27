define(function(require) {
'use strict';
var pv = require('pv');
var pvUpdate = require('pv/update');
var spv = require('spv');
var BrowseMap = require('js/libs/BrowseMap');
var LoadableListBase = require('pv/LoadableList');

  var Investigation = spv.inh(BrowseMap.Model, {
    init: function(self) {
      self.q = self.state('query') || (self.init_states && self.init_states.query);

      self.names = {};
      self.enter_items = false;
      self.setInactiveAll();

      self.on('child_change-section', function(e) {
        this.names = {};
        if (e.value) {
          for (var i = 0; i < e.value.length; i++) {
            this.names[ e.value[i].model_name ] = e.value[i];
          }
        }
        this.changeQuery(this.q, true);
      });

    }
  }, {
    model_name: 'invstg',
    addCallback: function(event_name, func){
      this.on(event_name, func);
    },
    changeResultsCounter: function(){
      var rc = 0;
      var sections_array = this.getNesting('section') || [];
      for (var i = 0; i < sections_array.length; i++) {
        rc += sections_array[i].r.length;
      }
      this.trigger('resultsChanged', rc);
    },
    doEverythingForQuery: function(){
      this.searchf.call(this);
    },
    g: function(name){
      return this.names[name];
    },
    _changeActiveStatus: function(remove, except){
      except = except && this.g(except);
      var sections_array = this.getNesting('section') || [];

      for (var i=0; i < sections_array.length; i++) {
        var cur = sections_array[i];

        if ((!except || cur != except) && !remove){
          cur.setActive();
        } else{
          cur.setInactive();
        }


      }
    },
    doesNeed: function(q){
      return q == this.q;
    },
    loading:function(){
      this.trigger('stateChange', 'loading');
    },
    loaded: function(q){
      if (!q || this.doesNeed(q)){
        this.trigger('stateChange', 'complete');
      }

    },
    remarkStyles: function(){
      var c = 0;
      var sections_array = this.getNesting('section') || [];
      for (var i=0; i < sections_array.length; i++) {
        var cur = sections_array[i];
        if (!cur.nos){
          cur.markOdd( !cur.state('active') || !(++c % 2 == 0) );
        }
      }
    },
    setActiveAll: function(except){
      this._changeActiveStatus(false, except);
    },
    setInactiveAll: function(except){
      this._changeActiveStatus(true, except);
    },

    bindItemsView: function(){
      var r = this.getAllItems(true);
      r = spv.filter(r, 'binvstg', true).not;
      var _this = this;

      var seiaclck = function(){
        _this.setItemForEnter(this);
      };

      for (var i = 0; i < r.length; i++) {
        r[i].on('view',seiaclck).binvstg = true;

      }
    },
    refreshEnterItems: function(){
      var r = this.getAllItems();
      for (var i = 0; i < r.length; i++) {
        var el = r[i];
        el.serial_number = i;
      }
      this.enter_items = r;
      this.setItemForEnter(r[this.selected_inum || 0]);
    },
    pressEnter: function(){
      if (this.enter_item){
        this.enter_item.view();
      }
    },
    setItemForEnter: function(item){
      if (this.enter_item != item){
        if (this.enter_item){
          this.enter_item.setInactive();
          delete this.enter_item;
        }
        if (item){
          this.enter_item = item;
          //this.scrollTo(item);
          this.enter_item.setActive();
        }
      }

    },
    selectEnterItemAbove: function(){
      var ci = (this.enter_item && this.enter_item.serial_number) || 0,
        ni = (ci ? ci : this.enter_items.length) - 1,
        t = this.enter_items[ni];
      this.setItemForEnter(t);
      this.selected_inum = ni;
    },
    selectEnterItemBelow: function(){
      var ci = (this.enter_item && this.enter_item.serial_number) || 0,
        ni = (ci + 1 < this.enter_items.length) ? ci + 1 : 0,
        t = this.enter_items[ni];
      this.setItemForEnter(t);
      this.selected_inum = ni;
    },
    getAllItems: function(no_button){
      var r = [];
      var sections_array = this.getNesting('section') || [];
      for (var i=0; i < sections_array.length; i++) {
        var cur = sections_array[i];
        var items = cur.getItems(no_button);
        if (items.length){
          r = r.concat(items);
        }
      }
      return r;
    },
    changeQuery: function(q, force){
      if (this.q != q || force){
        this.stopRequests();

        this.loaded();
        this.setItemForEnter();
        var sections_array = this.getNesting('section') || [];
        for (var i=0; i < sections_array.length; i++) {
          sections_array[i].changeQuery(q);
        }
        this.q = q;

        delete this.selected_inum;
        pvUpdate(this, 'query', q);
        this.changeResultsCounter();
        this.doEverythingForQuery();
      }

    },
    query_regexp: /\ ?\%query\%\ ?/
  });


  var BaseSuggest = spv.inh(pv.Model, {}, {
    setActive: function(){
      pvUpdate(this, 'active', true);
    },
    setInactive: function(){
      pvUpdate(this, 'active', false);
    },
    getTitle: function(){
      return this.valueOf();
    },
    view: function(){
      if (this.onView){
        this.onView();
      }
      this.trigger('view');
    }
  });

  var BaseSectionButton = spv.inh(BaseSuggest, {}, {
    "+states": {
      "button_text": ["compx", ['^button_text']]
    },

    show: function(){
      pvUpdate(this, 'disabled', false);
    },

    hide: function(){
      pvUpdate(this, 'disabled', true);
      this.setInactive();
    }
  });

  var SearchResults = function(query, prepared, valueOf){
    if (query){
      this.query = query;
    }
    if (prepared){
      this.append(prepared, valueOf);
    }
  };
  SearchResults.prototype = [];
  spv.cloneObj(SearchResults.prototype, {
    setQuery: function(q){
      this.query=q;
    },
    doesContain: spv.doesContain,
    add: function(target, valueOf){
      if (this.doesContain(target, valueOf) == -1){
        target.q = this.query;
        return this.push(target);
      } else{
        return false;
      }
    },
    append: function(array, valueOf){
      for (var i=0; i < array.length; i++) {
        this.add(array[i], valueOf);

      }
    }
  });


  var SearchSection = spv.inh(LoadableListBase, {
    init: function(self) {
      // self.app = opts && opts.app;
      // self.map_parent = opts && opts.map_parent;
      self.edges_list = [];
      self.rendering_list = [];


      var map_parent = self.map_parent;
      // opts = null;
      self
        .on('items-change', function(results){
          map_parent.refreshEnterItems();
          if (results){
            map_parent.changeResultsCounter();
          }
          map_parent.bindItemsView();
        })
        .on('state_change-active', function(){
          map_parent.remarkStyles();
        })
        .on('requests', function(array){
          map_parent.addRequests(array);
        }, {immediately: true});
    }
  }, {
    main_list_name: 'items',
    'nest_rqc-items': null, // resItem
    appendResults: function(arr, render, no_more_results) {
      var r = this.insertDataAsSubitems(this, 'items', arr);

      this.r.append(r);

      if (render){
        this.renderSuggests(no_more_results);
      }
      return this;
    },
    setActive: function(){
      pvUpdate(this, 'active', true);
    },
    setInactive: function(){

      pvUpdate(this, 'active', false);
    },
    loading: function(){
      pvUpdate(this, 'loading', true);
    },
    loaded: function(){
      pvUpdate(this, 'loading', false);
    },
    markOdd: function(remove){
      pvUpdate(this, 'odd_section', !remove);
    },
    getItems: function(no_button){
      var r = [].concat(this.rendering_list);
      if (!no_button && this.button && !this.button.state('disabled')){
        r.push(this.button);
      }
      return r;
    },
    hideButton: function(){
      if (this.button){
        this.button.hide();

      }
    },
    showButton: function(){
      if (this.button){
        this.button.show();
      }
    },
    doesNeed: function(q){
      return q == (this.r && this.r.query);
    },
    changeQuery: function(q){
      if (!q && !this.no_results_text){
        this.setInactive();
      }
      this.loaded();
      this.removeOldResults();
      pvUpdate(this, 'has_no_results', false);


      this.r = new SearchResults(q);
      this.rendering_list = [];
      this.edges_list = [];
      pvUpdate(this, 'query', q);
      this.showButton();
      this.trigger('items-change');
      return this;
    },
    removeOldResults: function(){
      for (var i = 0; i < this.rendering_list.length; i++) {
        this.rendering_list[i].die();
      }
      pv.updateNesting(this, 'rendering_list', []);

    },
    renderSuggests: function(no_more_results, preview){


      var slice = preview && !this.edges_list.length,
        last_rendered = this.edges_list && this.edges_list[this.edges_list.length-1],
        start = (last_rendered) || 0,
        end   = (slice && Math.min(this.r.length, start + 5)) || this.r.length;

      if (this.r.length){
        for (var i=start; i < end; i++) {
          this.rendering_list.push(this.r[i]);
        }
        this.edges_list.push(end);
      } else{
        if (no_more_results){
          if (this.no_results_text){
            pvUpdate(this, 'has_no_results', true);
            this.hideButton();
          } else{
            this.setInactive();
          }


        }
      }

      for (var i = 0; i < this.edges_list.length; i++) {

        var cur = this.rendering_list[this.edges_list[i]];
        if (cur){
          pvUpdate(cur, 'bordered', true);
        }

      }

      pvUpdate(this, 'no_more_results', no_more_results);
      pvUpdate(this, 'preview', preview);
      pv.updateNesting(this, 'rendering_list', this.rendering_list);
      pvUpdate(this, 'changed', new Date());
      pvUpdate(this, 'any_results', !!this.r.length);
      this.trigger('items-change', this.r.length);
      return this;
    }
  });
return {
  Investigation: Investigation,
  BaseSectionButton: BaseSectionButton,
  BaseSuggest: BaseSuggest,
  SearchSection: SearchSection
};
});
