define(function(require) {
'use strict';

var spv = require('spv');
var hp = require('./helpers');
var updateProxy = require('./updateProxy');
var StatesLabour = require('./StatesLabour');
var Eventor = require('./Eventor');
var useInterface = require('./StatesEmitter/useInterface');
var onPropsExtend = require('./onExtendSE');

var getConnector = spv.memorize(function(state_name) {
  return function updateStateBinded(e) {
    this.updateState(state_name, e.value);
  };
});

var getLightConnector = spv.memorize(function(state_name) {
  return function updateStateBindedLightly(value) {
    this.updateState(state_name, value);
  };
});


// Eventor.extendTo(StatesEmitter,
function props(add) {


var stackStateFlowStep = function(flow_step, state_name) {
  if (!this.zdsv) {
    this.zdsv = new StatesLabour(!!this.full_comlxs_index, this._has_stchs);
    //debugger;
  }
  flow_step.p_space = 'stev';
  flow_step.p_index_key = state_name;
  this.zdsv.createFlowStepsArray('stev', state_name).push(flow_step);
};

var regfr_vipstev = (function() {
  var getState = spv.getDeprefixFunc('vip_state_change-');
  return {
    test: function(namespace) {

      return !!getState(namespace);
    },
    fn: function(namespace) {
      var state_name = getState(namespace);
      return {
        value: this.state(state_name),
        target: this
      };
    },
    getWrapper: function() {
      return hp.oop_ext.hndMotivationWrappper;
    },
    getFSNamespace: function(namespace) {
      return getState(namespace);
    },
    handleFlowStep: stackStateFlowStep
  };

})();

var regfr_stev = (function() {
  var getState = spv.getDeprefixFunc('state_change-');
  return {
    test: function(namespace) {
      return !!getState(namespace);
    },
    fn: function(namespace) {
      var state_name = getState(namespace);
      return {
        value: this.state(state_name),
        target: this
      };
    },
    getWrapper: function() {
      return hp.oop_ext.hndMotivationWrappper;
    },
    getFSNamespace: function(namespace) {
      return getState(namespace);
    },
    handleFlowStep: stackStateFlowStep
  };
})();

var regfr_lightstev = (function() {
  var getState = spv.getDeprefixFunc('lgh_sch-');
  return {
    test: function(namespace) {
      return !!getState(namespace);
    },
    fn: function(namespace) {
      return this.state(getState(namespace));
    },
    getWrapper: function() {
      return hp.oop_ext.hndMotivationWrappper;
    },
    getFSNamespace: function(namespace) {
      return getState(namespace);
    },
    handleFlowStep: stackStateFlowStep
  };
})();

var EvConxOpts = function(context, immediately) {
  this.context = context;
  this.immediately = immediately;
};

add({
  onDie: function(cb) {
    this.on('die', cb);
  },
  // init: function(){
  // 	this._super();


  // 	return this;
  // },
  useInterface: function(interface_name, obj) {
    useInterface(this, interface_name, obj);
  },

  'regfr-vipstev': regfr_vipstev,
  'regfr-stev': regfr_stev,
  'regfr-lightstev': regfr_lightstev,
  getContextOptsI: function() {
    if (!this.conx_optsi){
      this.conx_optsi = new EvConxOpts(this, true);
    }
    return this.conx_optsi;
  },
  getContextOpts: function() {
    if (!this.conx_opts){
      this.conx_opts = new EvConxOpts(this);
    }
    return this.conx_opts;
  },
  _bindLight: function(donor, event_name, cb, immediately) {
    donor.evcompanion._addEventHandler(event_name, cb, this, immediately);

    if (this != donor && this instanceof StatesEmitter){
      this.onDie(function() {
        if (!donor) {
          return;
        }
        donor.off(event_name, cb, false, this);
        donor = null;
        cb = null;
      });
    }
  },
  lwch: function(donor, donor_state, func) {
    this._bindLight(donor, hp.getSTEVNameLight(donor_state), func);
  },
  wlch: function(donor, donor_state, acceptor_state) {
    var event_name = hp.getSTEVNameLight(donor_state);
    var acceptor_state_name = acceptor_state || donor_state;
    var cb = getLightConnector(acceptor_state_name);
    this._bindLight(donor, event_name, cb);


  },
  wch: function(donor, donor_state, acceptor_state, immediately) {

    var cb;

    var event_name = immediately ?
      hp.getSTEVNameVIP(donor_state) :
      hp.getSTEVNameDefault(donor_state);

    if (typeof acceptor_state == 'function'){
      cb = acceptor_state;
    } else {
      acceptor_state = acceptor_state || donor_state;
      cb = getConnector(acceptor_state);

    }
    this._bindLight(donor, event_name, cb, immediately);


    return this;

  },
  onExtend: function(props, original) {
    onPropsExtend(this, props, original);
  }
});

add({
//	full_comlxs_list: [],
  compx_check: {},
//	full_comlxs_index: {},
  state: (function(){
    var getter = hp.stateGetter;

    return function(state_path){
      var getField = getter(state_path);
      return getField(this.states);
    };
  })()
});

add({


  updateManyStates: function(obj) {
    var changes_list = [];
    for (var state_name in obj) {
      if (obj.hasOwnProperty(state_name)){
        if (this.hasComplexStateFn(state_name)) {
          throw new Error("you can't change complex state " + state_name);
        }
        changes_list.push(true, state_name, obj[state_name]);
      }
    }
    this._updateProxy(changes_list);
  },

  updateState: function(state_name, value, opts){
    /*if (state_name.indexOf('-') != -1 && console.warn){
      console.warn('fix prop state_name: ' + state_name);
    }*/
    if (this.hasComplexStateFn(state_name)){
      throw new Error("you can't change complex state in this way");
    }
    return this._updateProxy([true, state_name, value], opts);
  },
  setStateDependence: function(state_name, source_id, value) {
    if (typeof source_id == 'object') {
      source_id = source_id._provoda_id;
    }
    var old_value = this.state(state_name) || {index: {}, count: 0};
    old_value.index[source_id] = value ? true: false;

    var count = 0;

    for (var prop in old_value.index) {
      if (!old_value.index.hasOwnProperty(prop)) {
        continue;
      }
      if (old_value.index[prop]) {
        count++;
      }
    }



    this.updateState(state_name, {
      index: old_value.index,
      count: count
    });


  },
  hasComplexStateFn: function(state_name) {
    return this.compx_check[state_name];
  },

  _updateProxy: function(changes_list, opts) {
    updateProxy(this, changes_list, opts);
  }
});
}

var StatesEmitter = spv.inh(Eventor, {
  naming: function(construct) {
    return function StatesEmitter() {
      construct(this);
    };
  },
  init: function (self) {
    self.conx_optsi = null;
    self.conx_opts = null;
    self.zdsv = null;
    self.current_motivator = self.current_motivator || null;

    self._state_updaters = null;
    self._interfaces_using = null;

    self.states = {};
  },
  onExtend: onPropsExtend,
  props: props
});

return StatesEmitter;
});
