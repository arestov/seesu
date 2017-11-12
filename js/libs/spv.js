var spv = {};


(function() {
"use strict";
var addEvent, removeEvent, getDefaultView, domReady,
  doesContain, shuffleArray, arrayExclude, getFields, matchWords, searchInArray, getStringPattern,
  ttime, toRealArray, getTargetField, sortByRules, makeIndexByField, $filter,
  cloneObj, createObjClone, getDiffObj, getUnitBaseNum, stringifyParams, separateNum, Class,
  debounce, throttle;
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (obj, start) {
    for (var i = (start || 0); i < this.length; i++) {
      if (this[i] == obj) {
        return i;
      }
    }
    return -1;
  };
}
spv.getArrayNoDubs = function(array, clean_array) {
  clean_array = clean_array || [];
  for (var i = 0; i < array.length; i++) {
    if (clean_array.indexOf( array[i] ) == -1){
      clean_array.push( array[i] );
    }
  }
  return clean_array;
};

spv.once = function(fn) {
  var result;
  return function(){
    if (fn){
      var fnn = fn;
      fn = null;
      return (result = fnn.apply(this, arguments));
    } else {
      return result;
    }
  };
};

spv.mapfn = function(func) {
  return function(array) {
    if (!array) {return array;}
    var result = new Array(array.length);
    for (var i = 0; i < array.length; i++) {
      result[i] = func(array[i], i);
    }
    return result;
  };
};

var hasArg = function(el) {return el;};
spv.hasEveryArgs = function() {
  return Array.prototype.every.call(arguments, hasArg);
};
spv.getExistingItems = function(arr) {
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]){
      result.push(arr[i]);
    }
  }
  return result;
};

if (typeof window !== 'undefined') {
  addEvent = spv.addEvent = window.addEventListener ?
  function(elem, evType, fn){
    elem.addEventListener(evType, fn, false);
    return fn;
  }:
  function(elem, evType, fn){
    elem.attachEvent('on' + evType, fn);
    return fn;
  };
  removeEvent = spv.removeEvent = window.addEventListener ?
  function(elem, evType, fn){
    if (!elem.removeEventListener){
      return;
    }
    elem.removeEventListener(evType, fn, false);
  }:
  function(elem, evType, fn){
    if (!elem.detachEvent){
      return;
    }
    elem.detachEvent('on' + evType, fn);
  };

  spv.listenEvent = function (elem, evType, fn) {
    addEvent(elem, evType, fn);
    return function () {
      removeEvent(elem, evType, fn);
    };
  };
}

getDefaultView = spv.getDefaultView = function(d) {
  return d.defaultView || d.parentWindow;
};
domReady = spv.domReady = function(d, callback){
  var wndw = spv.getDefaultView(d);
  if (!wndw){
    return;
  }
  if (d.readyState == 'complete' || d.readyState == 'loaded' || d.readyState == "interactive"){
    callback();
  } else{
    var done;
    var f = function(){
      if (!done){
        done = true;
        spv.removeEvent(wndw, 'load', f);
        spv.removeEvent(d, 'DOMContentLoaded', f);
        callback();
      }
    };
    spv.addEvent(wndw, 'load', f);
    spv.addEvent(d, 'DOMContentLoaded', f);
  }
};

doesContain = spv.doesContain = function(target, valueOf){
  var cached_t_value = valueOf ? valueOf.call(target) : (target.valueOf());

  for (var i=0; i < this.length; i++) {
    if (valueOf){
      if (valueOf.call(this[i]) == cached_t_value){
        return i;
      }
    } else{
      if (this[i].valueOf() == cached_t_value){
        return i;
      }
    }


  }
  return -1;
};
spv.hasCommonItems = function(arr1, arr2) {
  if (!arr2){
    return false;
  }
  for (var i = 0; i < arr1.length; i++) {
    if (arr2.indexOf(arr1[i]) != -1){
      return true;
    }
  }
  return false;
};


var arExclSimple = function(result, arr, obj) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] !== obj) {
      result.push(arr[i]);
    }
  }
  return result;
};
var arExclComplex = function(result, arr, obj) {
  for (var i = 0; i < arr.length; i++) {
    if (obj.indexOf(arr[i]) == -1){
      result.push(arr[i]);
    }
  }
  return result;
};

arrayExclude = spv.arrayExclude = function(arr, obj){
  var r = [];
  if (!arr){
    return r;
  }

  if (obj instanceof Array){
    return arExclComplex(r, arr, obj);
  } else {
    return arExclSimple(r, arr, obj);
  }
};

shuffleArray = spv.shuffleArray = function(obj) {
  var shuffled = [], rand, value;
  for (var index = 0; index < obj.length; index++) {
    value = obj[index];
    rand = Math.floor(Math.random() * (index + 1));
    shuffled[index] = shuffled[rand];
    shuffled[rand] = value;
  }
  return shuffled;
};


var fields_cache = {};
var getFieldsTree = function(string) {
  if (Array.isArray(string)){
    return string;
  } else {
    if (!fields_cache[string]){
      fields_cache[string] = string.split('.');
    }
    return fields_cache[string];
  }
};
spv.getFieldsTree = getFieldsTree;

getTargetField = function(obj, path){
  if (!path) {return obj;}

  var tree = getFieldsTree(path);
  var nothing;
  var target = obj;
  for (var i=0; i < tree.length; i++) {
    if (target[tree[i]] != nothing){
      target = target[tree[i]];
    } else{
      return;
    }
  }
  return target;
};

getFields = function(obj, fields){
  var r = [];
  for (var i=0; i < fields.length; i++) {
    var cur = fields[i];

    var value = (typeof cur == 'function') ? cur(obj) : getTargetField(obj, cur);
    if (value){
      r.push(value);
    }
  }
  return r;
};
getDiffObj = spv.getDiffObj = function(one, two) {
  var
    i,
    diff = {},
    all_props = {};

  for (i in one){
    all_props[i] = true;
  }
  for (i in two){
    all_props[i] = true;
  }

  for (i in all_props){
    if (one[i] !== two[i]){
      diff[i] = two[i];
    }
  }
  return diff;
};

createObjClone = function(obj){
  var Clonner = function(){};
  Clonner.prototype = obj;
  var nobj = new Clonner();
  nobj.constructor = Clonner;
  return nobj;
};
matchWords = spv.matchWords = function(source, query){
  var words = query.split(/[\s\.\—\-\—\–\_\|\+\(\)\*\&\!\?\@\,\\\/\❤\♡\'\"\[\]]+/gi);
  var r = {};
  if (words.length){
    r.forward = true;
    var any_order = true;
    var source_sliced = source;
    for (var i = 0; i < words.length; i++) {
      var index = source_sliced.indexOf(words[i]);
      if (index != -1){
        source_sliced.slice(index + words[i].length);
      } else {
        r.forward = false;
        break;
      }
    }
    if (!r.forward){
      for (var i = 0; i < words.length; i++) {
        if (source.indexOf(words[i]) == -1){
          any_order = false;
          break;
        }
      }
    }
    r.any = any_order;
  }
  return r;
};

searchInArray = spv.searchInArray = function (array, query, fields) {
  query = getStringPattern(query);
  var r,i,cur;

  if (query){
    r = [];

    if (fields){
      for (i=0; i < array.length; i++) {
        cur = array[i];
        var fields_values = getFields(cur, fields);
        if (fields_values.join(' ').search(query) > -1){
          r.push(cur);
        }

      }
    } else{
      for (i=0; i < array.length; i++) {
        cur = array[i];
        if (typeof cur == 'string' && cur.search(query) > -1){
          r.push(cur);
        }
      }
    }
  }
  return r;
};
var regexp_escaper = /([$\^*()+\[\]{}|.\/?\\])/g;
var escapeRegExp = function(str, clean) {
  if (clean){
    str = str.replace(/\s+/g, ' ').replace(/(^\s)|(\s$)/g, ''); //removing spaces
  }
  return str.replace(regexp_escaper, '\\$1'); //escaping regexp symbols
};

spv.escapeRegExp = escapeRegExp;

getStringPattern = function (str) {
  if (str.replace(/\s/g, '')){

    str = escapeRegExp(str, true).split(/\s/g);
    for (var i=0; i < str.length; i++) {
      str[i] = '((^\|\\s)' + str[i] + ')';
    }
    str = str.join('|');

    return new RegExp(str, 'gi');
  }
};
spv.getStringPattern = getStringPattern;

ttime = function(f){
  var d = Date.now();

  if (f){
    f();
    console.log(((new Date()) - d)/1000);
  } else{
    console.log(d/1000);
  }
};

spv.collapseAll = function(){
  var r= [];
  for (var i=0; i < arguments.length; i++) {
    var c = arguments[i];
    if (c instanceof Array){
      for (var ii=0; ii < c.length; ii++) {
        if (r.indexOf(c[ii]) == -1){
          r.push(c[ii]);
        }

      }
    } else {
      if (r.indexOf(c) == -1){
        r.push(c);
      }
    }
  }
  return r;
};

toRealArray = spv.toRealArray = function(array, check_field){
  if (array instanceof Array){
    return array;
  } else if (array && (typeof array == 'object') && array.length){
    return Array.prototype.slice.call(array);
  } else if (array && (!check_field || getTargetField(array, check_field))){
    return [array];
  } else{
    return [];
  }
};

spv.memorize = function(func, getter) {
  var cache = {};
  return getter ? function(){
    var arg = getter.apply(this, arguments);
    if (!cache.hasOwnProperty(arg)) {
      var result = cache[arg] = func.apply(this, arguments);
      return result;
    }
    return cache[arg];
  } : function(arg) {
    if (!cache.hasOwnProperty(arg)) {
      var result = cache[arg] = func.apply(this, arguments);
      return result;
    }
    return cache[arg];
  };
};

spv.f = {
  allOf: function(){
    // logical `and`, return last result of stop
    var i = 0;
    var args = new Array(arguments.length - 1);
    for (i = 1; i < arguments.length; i++) {
      args[ i - 1 ]= arguments[i];
    }

    return function (){
      var result;
      for (var i = 0; i < args.length; i++) {
        result = args[i].apply(this, arguments);
        if (!result) {
          return result;
        }
      }
      return result;
    };
  },
  firstOf: function(){
    // logical `or`, return first result of stop
    var i = 0;
    var args = new Array(arguments.length - 1);
    for (i = 1; i < arguments.length; i++) {
      args[ i - 1 ]= arguments[i];
    }

    return function (){
      var result;
      for (var i = 0; i < args.length; i++) {
        result = args[i].apply(this, arguments);
        if (result) {
          return result;
        }
      }
      return result;
    };
  },
};
var setTargetField = function(obj, tree, value) {
  tree = getFieldsTree(tree);
  var cur_obj = obj;
  for (var i=0; i < tree.length; i++) {
    var cur = tree[i];
    if (i != tree.length -1){
      var target = cur_obj[cur];
      if (!target){
        target = cur_obj[cur] = {};
      }
      cur_obj = target;
    } else {
      cur_obj[cur] = value;
    }
  }
  return true;
};


spv.setTargetField = setTargetField;

var getFieldValueByRule = function(obj, rule){
  if (rule instanceof Function){
    return rule(obj);
  } else if (Array.isArray(rule)){
    return getTargetField(obj, rule);
  } else if (rule instanceof Object){
    if (typeof rule.field =='function'){
      return rule.field(obj);
    } else {
      return getTargetField(obj, rule.field);
    }
  } else{
    return getTargetField(obj, rule);
  }



};


spv.compareArray = function compareArray(one, two) {
  if (!one || !two) {
    if (!one && !two) {
      return;
    }
    if (!one) {
      return 1;
    }
    if (!two) {
      return -1;
    }
  }
  var max = Math.max(one.length, two.length);
  for (var i = 0; i < max; i++) {
    var value_one = one[i];
    var value_two = two[i];
    if (value_one === value_two) {
      continue;
    }

    if (value_one == null && value_two == null) {
      continue;
    } else if (value_one == null) {
      return 1;
    } else if (value_two == null) {
      return -1;
    }

    if (value_one > value_two) {
      return 1;
    }
    if (value_one < value_two) {
      return -1;
    }
  }
};

sortByRules = spv.sortByRules = function(a, b, rules){
  if (a instanceof Object && b instanceof Object){
    var shift = 0;

    for (var i=0; i < rules.length; i++) {
      if (!shift){
        var cr = rules[i];
        var field_value_a = getFieldValueByRule(a, cr);
        var field_value_b = getFieldValueByRule(b, cr);
        field_value_a = field_value_a || !!field_value_a; //true > undefined == false, but true > false == true
        field_value_b = field_value_b || !!field_value_b; //so convert every "", null and undefined to false


        if (field_value_a > field_value_b){
          shift = cr.reverse ? -1 : 1;
        } else if (field_value_a < field_value_b){
          shift = cr.reverse ? 1 : -1;
        }
      }

    }

    return shift;

  }
};

spv.indexBy = function (array, field) {
  var index = {};
  if (!array || !array.length) {
    return index;
  }

  for (var i = 0; i < array.length; i++) {
    var value  = getTargetField(array[i], field);
    index[value] = array[i];
  }

  return index;
}

spv.groupBy = function (array, field) {
  var index = {};
  if (!array || !array.length) {
    return index;
  }

  for (var i = 0; i < array.length; i++) {
    var value  = getTargetField(array[i], field);
    if (!index[value]) {
      index[value] = [];
    }
    index[value].push(array[i]);
  }

  return index;
}

spv.getSortFunc = function(rules) {
  return function(a, b) {
    return sortByRules(a, b, rules);
  };
};

makeIndexByField = spv.makeIndexByField = function(array, field, keep_case){
  var r = {};
  if (array && array.length){
    for (var i=0; i < array.length; i++) {
      var simple_name,
        cur = array[i],
        fv = getTargetField(cur, field);
      if (fv || typeof fv == 'number'){
        if (fv instanceof Array){
          for (var k=0; k < fv.length; k++) {
            simple_name = (fv[k] + '');
            if (!keep_case){
              simple_name = simple_name.toLowerCase();
            }
            if (!r[simple_name]){
              r[simple_name] = [];
              r[simple_name].real_name = fv[k];
            }
            if (r[simple_name].indexOf(cur) == -1){
              r[simple_name].push(cur);
            }
          }
        } else{
          simple_name = (fv + '');
          if (!keep_case){
            simple_name = simple_name.toLowerCase();
          }
          if (!r[simple_name]){
            r[simple_name] = [];
            r[simple_name].real_name = fv;
          }
          if (r[simple_name].indexOf(cur) == -1){
            r[simple_name].push(cur);
          }
        }
      } else {
        if (!r['#other']){
          r['#other'] = [];
        }
        if (r['#other'].indexOf(cur) == -1){
          r['#other'].push(cur);
        }
      }
    }
  }
  return r;
};


$filter = function(array, field, value_or_testfunc){
  var i, r = [];
  r.not = [];
  if (!array){return r;}

  if (value_or_testfunc){
    for (i = 0; i < array.length; i++) {
      if (!array[i]){
        continue;
      }
      if (typeof value_or_testfunc == 'function'){
        if (value_or_testfunc(getTargetField(array[i], field))){
          r.push(array[i]);
        } else{
          r.not.push(array[i]);
        }
      } else{
        if (getTargetField(array[i], field) === value_or_testfunc){
          r.push(array[i]);
        } else{
          r.not.push(array[i]);
        }
      }
    }
  } else {
    for (i = 0; i < array.length; i++) {
      if (!array[i]){
        continue;
      }
      var field_value = getTargetField(array[i], field);
      if (field_value){
        r.push(field_value);
      } else{
        r.not.push(array[i]);
      }
    }
  }
  return r;
};

var simpleClone = function(_no, donor) {
  for (var prop in donor) {
    if (!donor.hasOwnProperty(prop)){
      continue;
    }
    _no[prop] = donor[prop];
  }
  return _no;
};

var doClone = Object.assign ? function(_no, donor) {
  return Object.assign(_no, donor);
} : simpleClone;


cloneObj= spv.cloneObj = function(acceptor, donor, black_list, white_list){
  //not deep!
  var _no = acceptor || {};
  var prop;
  if (black_list || white_list){
    for(prop in donor){
      if (!donor.hasOwnProperty(prop)){
        continue;
      }
      if (!white_list || !!~white_list.indexOf(prop)){
        if (!black_list || !~black_list.indexOf(prop)){
          _no[prop] = donor[prop];
        }
      }
    }
    return _no;
  } else {
    return doClone(_no, donor);
  }
};

getUnitBaseNum = function(_c){
  if (_c > 0){
    if (_c > 10 && _c < 20){
      return 2;
    } else {
      var _cc = '0' + _c;
      _cc = parseFloat(_cc.slice(_cc.length-1));

      if (_cc === 0){
        return 2;
      } else if (_cc == 1){
        return 0;
      }else if (_cc < 5){
        return 1;
      } else {
        return 2;
      }
    }
  } else if (_c === 0){
    return 2;
  }
};
spv.getUnitBaseNum = getUnitBaseNum;

stringifyParams = spv.stringifyParams = function(params, ignore_params, splitter, joiner, opts){
  opts = opts || {};
  splitter = splitter || '';
  if (typeof params == 'string'){
    return params;
  }
  var pv_signature_list = [];
  for (var p in params) {
    if (!ignore_params || ignore_params.indexOf(p) == -1){
      pv_signature_list.push(p + splitter + params[p]);
    }
  }
  if (!opts.not_sort){
    pv_signature_list.sort();
  }

  return pv_signature_list.join(joiner || '');
};


separateNum = function(num){
  var str = "" + num;
  var three_sep = '';
  for (var i = str.length - 1; i >= 0; i--){
    three_sep = str[i] + three_sep;
    if ((str.length - (i)) % 3 === 0){
      three_sep = ' ' + three_sep;
    }
  }
  return  three_sep;
};

var copyProps = (function(){
    var fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
    var allowParentCall = function(name, fn, _super){
      return function() {
        var tmp = this._super;

        // Add a new ._super() method that is the same method
        // but on the super-class
        this._super = _super[name];

        // The method only need to be bound temporarily, so we
        // remove it when we're done executing
        var ret = fn.apply(this, arguments);
        if (typeof tmp != 'undefined'){
          this._super = tmp;
        } else {
          delete this._super;
        }
        return ret;
      };
    };
  return function(prototype, props, _super) {
    for (var prop_name in props) {
      // Check if we're overwriting an existing function
      var needSuper = typeof props[prop_name] == "function" &&
        typeof _super[prop_name] == "function" && fnTest.test(props[prop_name]);
      prototype[prop_name] = needSuper ?
        allowParentCall(prop_name, props[prop_name], _super) :
        props[prop_name];
    }
    return prototype;
  };
})();

var constr_id = 0;
/* Simple JavaScript Inheritance
  * By John Resig http://ejohn.org/
  * http://ejohn.org/blog/simple-javascript-inheritance/
  * MIT Licensed.
  * Gleb Arestov mod
  */
// Inspired by base2 and Prototype

// var llcount = 0;
(function(){
  // The base Class implementation (does nothing)
  Class = function(){};

  // Create a new Class that inherits from this class
  Class.extendTo = function(namedClass, props) {
    if (typeof props == 'function') {
      //props
      props = spv.coe(props);
    }

    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    var prototype = new this();
    prototype.constr_id = constr_id++;

    prototype = copyProps(prototype, props, _super);
    // Copy the properties over onto the new prototype

    // Populate our constructed prototype object
    namedClass.prototype = prototype;

    // Enforce the constructor to be what we expect
    namedClass.prototype.constructor = namedClass;

    if (namedClass.prototype.onExtend){
      namedClass.prototype.onExtend.call(namedClass.prototype, props, _super);
    }

    // And make this class extendable
    namedClass.extendTo = Class.extendTo;
    namedClass.extend = Class.extend;
    return namedClass;
  };
  Class.extend = function(props, class_name){
    return this.extendTo(function(){}, props);
  };

})();

spv.Class = Class;

spv.passingContext = function passingContext (func) {
  // for legacy
  return function(obj) {
    var arr = new Array(arguments.length);
    for (var i = 0; i < arguments.length; i++) {
      arr[i] = arguments[i];
    }
    arr.shift();

    func.apply(obj, arr);
  };
};

spv.precall = function precall(func1, func2) {
  // for legacy
  return function() {
    func1.apply(this, arguments);
    return func2.apply(this, arguments);
  };
};

(function () {

var stPartWrapping = function(original, part) {
  return function builderWrap(obj, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
    original(obj, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
    part(obj, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
  };
};

var stNaming = function(constructor) {
  return function Class(arg1) {
    constructor(this, arg1);
  };
};

var stBuilding = function(parentBuilder) {
  return function classBuilder(obj, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
    parentBuilder(obj, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
  };
};

var wrapExtend = function(original, fresh) {
  return function(resultPrototype, props, originalPrototype, params) {
    original(resultPrototype, props, originalPrototype, params);
    fresh(resultPrototype, props, originalPrototype, params);
  };
};

var empty = function() {};

var extendTo = Class.extendTo;

function extend(Class, params, propsArg) {
  var parentNaming = Class.naming || stNaming;
  var naming = params.naming || parentNaming;
  var building;

  var initLength = false;
  if (params.init) {
    var init = params.init;
    building = function(parentBuilder) {
      return stPartWrapping(parentBuilder, init);
    };
    initLength = init.length;
  } else if (params.preinit) {
    var preinit = params.preinit;
    building = function(parentBuilder) {
      return stPartWrapping(preinit, parentBuilder);
    };
    initLength = preinit.length;
  } else {
    building = stBuilding;
  }

  var passedProps = propsArg || params.props;
  var props = typeof passedProps == 'function' ?
    spv.coe(passedProps) :
    passedProps;

  var asParentExtend = Class.onExtend || empty;
  var firstExtend = params.onPreExtend
    ? wrapExtend(params.onPreExtend, asParentExtend)
    : asParentExtend;
  var onExtend = params.onExtend
    ? wrapExtend(firstExtend, params.onExtend)
    : firstExtend;

  var parentMainBuilder = Class.inh_main_constr;
  // building нужен что бы к родительской инициализации добавить какую-то конкретную новую
  var mainConstructor = building(parentMainBuilder || empty);

  var parentPostbuilder = Class.inh_post_constr;
  var postConstructor = (function () {
    if (!params.postInit) {
      return parentPostbuilder;
    } else if (!parentPostbuilder) {
      return params.postInit;
    }
    // parent post init should always be the last in order
    return stPartWrapping(params.postInit, parentPostbuilder);
  })();

  var finalConstructor = postConstructor
    ? stPartWrapping(mainConstructor, postConstructor)
    : mainConstructor;

  var result = naming(finalConstructor);

  if (initLength === false) {
    initLength =
      postConstructor
        ? Math.max(mainConstructor.length, postConstructor.length)
        : mainConstructor.length;
  }

  if (params.strict) {
    if (initLength > result.length + 1) {
      throw new Error('naming should pass all arguments that expect `builder` or `init` func');
    }

    if (Class.initLength > result.length + 1) {
      throw new Error('naming should pass all arguments that expect parent `builder` or `init` func');
    }
  }



  result.naming = naming;
  result.inh_main_constr = mainConstructor;
  result.inh_post_constr = postConstructor;
  result.inh_constr = finalConstructor;
  result.onExtend = onExtend;
  result.initLength = Math.max(Class.initLength || initLength, initLength);

  var PrototypeConstr = parentNaming(empty);

  PrototypeConstr.prototype = Class.prototype;
  result.prototype = new PrototypeConstr();
  result.prototype.constr_id = constr_id++;
  result.prototype.constructor = result;
  if (!params.skip_code_path) {
    result.prototype.__code_path = codePath();
  }


  if (props) {
    copyProps(result.prototype, props, Class.prototype);
    // cloneObj(result.prototype, props);
    if (params.skip_first_extend) {
      if (firstExtend) {
        firstExtend(result.prototype, props, Class.prototype, params);
      }
    } else {
      if (onExtend) {
        onExtend(result.prototype, props, Class.prototype, params);
      }
    }

  }

  result.extendTo = function(Class, props) {
    console.log('don\'t use extendTo');
    console.log(codePath());

    if (!result.legacy) {
      result.legacy = naming(empty);
      result.legacy.pureBase = result;
      result.legacy.prototype = cloneObj(new PrototypeConstr(), result.prototype);
      result.legacy.prototype.init = makeInit(result.inh_constr);
      result.legacy.prototype.constr_id = constr_id++;
      result.legacy.prototype.constructor = result.legacy;
      if (!params.skip_code_path) {
        result.prototype.__code_path = codePath();
      }

    }

    return extendTo.call(result.legacy, Class, props);
  };

  return result;
}

var path = typeof window !== 'undefined' ? window.location.origin + '/' : '';

function codePath() {
  var err = new Error();
  var stack = err.stack.split('\n');
  var path = stack[3];
  return path.replace('    at ', '').replace(path, '');
}

function makeInit(builder) {
  return function(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
    builder(this, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
  };
}

spv.inh = extend;
})();


/**
 * Debounce and throttle function's decorator plugin 1.0.5
 *
 * Copyright (c) 2009 Filatov Dmitry (alpha@zforms.ru)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */
debounce = function(fn, timeout, invokeAsap, ctx) {

  if(arguments.length == 3 && typeof invokeAsap != 'boolean') {
    ctx = invokeAsap;
    invokeAsap = false;
  }

  var timer;

  return function() {

    var args = arguments,
      _this = this;

    invokeAsap && !timer && fn.apply(ctx || this, args);

    clearTimeout(timer);

    timer = setTimeout(function() {
      !invokeAsap && fn.apply(ctx || _this, args);
      timer = null;
    }, timeout);

  };

};

throttle = function(fn, timeout, ctx) {

  var timer, args, needInvoke;

  return function() {

    args = arguments;
    needInvoke = true;
    ctx = ctx || this;

    if(!timer) {
      var wrap_func = function() {
        if(needInvoke) {
          fn.apply(ctx, args);
          needInvoke = false;
          timer = setTimeout(wrap_func, timeout);
        }
        else {
          timer = null;
        }
      };
      wrap_func();
    }

  };

};
spv.capitalize = capitalize;
function capitalize(string, just_first) {
  var test = just_first ? (/(^|\s)(.)/) : (/(^|\s)(.)/g);
  return string.replace(test, function(m, p1, p2){
    return p1+p2.toUpperCase();
  });
}

spv.capitalize.fn = function(string) {
  return capitalize(string);
};

(function(){
  var splitter = new RegExp("\\%[^\\s\\%]+?\\%", 'gi');
  var var_name = new RegExp("\\%([^\\s\\%]+?)\\%");

  var pushName = function(obj, name, i){
    if (!obj[name]){
      obj[name] = [];
    }
    obj[name].push(i);
  };
  var makeDom = function(d) {
    d = d || window.document;
    for (var i = 0; i < this.length; i++) {
      if (this[i] && typeof this[i] == 'string'){
        this[i] = d.createTextNode(this[i]);
      }
    }
    return this;
  };
  var setVar = function(name, value) {

    for (var i = 0; i < this.vars[name].length; i++) {
      this[this.vars[name][i]] = value;
    }

    return this;
  };
  spv.createComlexText = function(text, not_make_dom){
    var
      vars = text.match(splitter),
      parts = text.split(splitter),
      result = [];

    result.vars = {};
    result.setVar = setVar;
    result.makeDom = makeDom;
    for (var i = 0; i < parts.length; i++) {
      result.push(parts[i]);

      if (vars[i]){
        var name = vars[i].match(var_name)[1];
        pushName(result.vars, name, result.length);
        result.push(null);
      }
    }
    if (!not_make_dom){
      result.makeDom();
    }
    return result;
  };

})();

spv.makeIndexByField = makeIndexByField;
spv.getTargetField = getTargetField;
spv.throttle = throttle;
spv.debounce = debounce;
spv.filter = $filter;



spv.zerofyString = function(string, length) {
  if (typeof string != 'string'){
    string = '' + string;
  }
  while (string.length < length){
    string = '0' + string;
  }
  return string;
};


var getFullFieldPath = function(last_part, data) {
  var cur = data;
  var result = [last_part];
  while (cur && cur.prop_name) {
    result.unshift(cur.prop_name);
    cur = cur.parent;
  }
  return result.join('.');
};


var getPropsListByTree = function(obj) {
  var all_objects = [{
    parent: null,
    prop_name: '',
    obj: obj
  }];
  var cur, i, prop_name;
  var objects_list = [];
  var result_list = [];

  while (all_objects.length) {
    cur = all_objects.shift();
    for (prop_name in cur.obj){
      if (!cur.obj.hasOwnProperty(prop_name) || !cur.obj[prop_name]){
        continue;
      }
      if (Array.isArray(cur.obj[prop_name])) {
        continue;
      }
      if (typeof cur.obj[prop_name] == 'object'){
        all_objects.push({
          parent: cur,
          prop_name: prop_name,
          obj: cur.obj[prop_name]
        });
      }
    }
    objects_list.push(cur);
  }

  for (i = 0; i < objects_list.length; i++) {
    cur = objects_list[i];
    for (prop_name in cur.obj){
      if (!cur.obj.hasOwnProperty(prop_name)){
        continue;
      }
      if (typeof cur.obj[prop_name] == 'string' || !cur.obj[prop_name] || Array.isArray(cur.obj[prop_name])){
        result_list.push({
          field_path: getFullFieldPath(prop_name, cur),
          field_path_value: cur.obj[prop_name]
        });
      }
    }
  }
  return result_list;


};

spv.mapProps = function(props_map, donor, acceptor) {
  for (var name in props_map){
    var value = getTargetField(donor, props_map[name]);
    if (typeof value != 'undefined'){
      setTargetField(acceptor, name, value);
    }
  }
  return acceptor;
};
var parseMap = function(map) {

  //var root = map;

  var all_targets = [map];
  var full_list = [];
  var cur, i;

  while (all_targets.length){
    cur = all_targets.shift();
    if (cur.parts_map) {
      for (var prop_name in cur.parts_map){
        if (!cur.parts_map.hasOwnProperty(prop_name)){
          continue;
        }
        var child_part = cur.parts_map[prop_name];
        if (typeof child_part.props_map == 'string' && child_part.parts_map) {
          console.log(['you can not have parts in', child_part, 'since it is simple string from field:' + child_part.props_map]);
          throw new Error('you can not have parts in this place since it is simple string from field:' + child_part.props_map);
        }
        all_targets.push(child_part);
      }
    }
    full_list.push(cur);
  }


  for (i = 0; i < full_list.length; i++) {
    cur = full_list[i];
    //cur.props_map

    if (typeof cur.props_map == 'object' && !Array.isArray(cur.props_map)) {
      var full_propslist = getPropsListByTree(cur.props_map);
    //	console.log(full_propslist);
      cur.props_map = full_propslist;
    }

  }


  return map;
  //'весь список подчинённостей';
  //''
};

var parent_count_regexp = /^\^+/gi;

var getPropValueByField = function(fpv, iter, scope, spec_data) {
  var source_data = scope;
  var state_name = fpv;
  var start_char = fpv.charAt(0);
  if (start_char == '^'){
    state_name = fpv.slice(1);
    var count = fpv.length - state_name.length;
    while (count) {
      --count;
      source_data = iter.parent_data;
      if (!source_data) {
        break;
      }
    }
    //states_of_parent[fpv] = this.prsStCon.parent(fpv);
  } else if (start_char == '@') {
    throw new Error('');
    //states_of_nesting[fpv] = this.prsStCon.nesting(fpv);
  } else if (start_char == '#') {
    state_name = fpv.slice(1);
    source_data = spec_data;
    if (!spec_data) {
      throw new Error();
    }
    //states_of_root[fpv] = this.prsStCon.root(fpv);
  }
  return getTargetField(source_data, state_name);
};

var getComplexPropValueByField = function(fpv, scope, iter, spec_data, converters) {



  var cur_value;


  if (typeof fpv == 'string') {
    cur_value = getPropValueByField(fpv, iter, scope, spec_data);
  } else if (Array.isArray(fpv)) {
    if (fpv.length > 1) {
      var convert = fpv[0];

      if (typeof convert == 'string' ) {
        convert = converters[convert];
      }

      cur_value = convert(fpv[1] && getPropValueByField(fpv[1], iter, scope, spec_data));
    } else {
      cur_value = fpv[0];
    }

  }
  return cur_value;
};

var getTargetProps = function(obj, scope, iter, spec_data, converters) {
  for (var i = 0; i < iter.map_opts.props_map.length; i++) {
    var cur = iter.map_opts.props_map[i];

    var fpv = cur.field_path_value;
    if (!fpv) {
      fpv = cur.field_path;
    }

    var cur_value = getComplexPropValueByField(fpv, scope, iter, spec_data, converters);

    setTargetField(obj, cur.field_path, cur_value);
  }

};

var handlePropsMapScope = function(spec_data, cur, objects_list, scope, converters) {
  if (typeof cur.map_opts.props_map == 'string') {
    return getComplexPropValueByField(cur.map_opts.props_map, scope, cur, spec_data, converters);
  }

  var result_value_item = {};
  getTargetProps(result_value_item, scope, cur, spec_data, converters);

  for (var prop_name in cur.map_opts.parts_map) {
    //cur.map_opts.parts_map[prop_name];
    var map_opts = cur.map_opts.parts_map[prop_name];

    var result_value = map_opts.is_array ? [] : {} ;//объект используемый потомками создаётся в контексте родителя, что бы родитель знал о потомках
    setTargetField(result_value_item, prop_name, result_value);//здесь родитель записывает информацию о своих потомках

    objects_list.push({
      map_opts: map_opts,
      parent_data: scope,
      parent_map: cur.map_opts,
      writeable_array: result_value,

      data_scope: null
    });
  }
  return result_value_item;
};

var executeMap = function(map, data, spec_data, converters) {

  var root_struc = {
    map_opts: map,
    parent_data: data,
    parent_map: null,
    writeable_array: map.is_array ? [] : {},
    //writeable_array - объект или массив объектов получающихся в результате парсинга одной из областей видимости
    //должен быть предоставлен потомку родителем

    data_scope: null
  };


  var objects_list = [root_struc], result_item;

  while (objects_list.length) {
    var cur = objects_list.shift();


    var cvalue;
    if (cur.map_opts.source) {
      cvalue = getTargetField(cur.parent_data, cur.map_opts.source);
    } else {
      cvalue = cur.parent_data;
    }

    if (!cvalue) {
      continue;
    }

    if (!cur.map_opts.is_array) {
      cur.data_scope = cvalue;
      result_item = handlePropsMapScope(spec_data, cur, objects_list, cur.data_scope, converters);
      if (typeof result_item != 'object') {
        throw new Error('use something more simple!');
      }
      cloneObj(cur.writeable_array, result_item);
    } else {
      cur.data_scope = toRealArray( cvalue );
      cur.writeable_array.length = cur.data_scope.length;

      for (var i = 0; i < cur.data_scope.length; i++) {
        var scope = cur.data_scope[i];
        cur.writeable_array[i] = handlePropsMapScope(spec_data, cur, objects_list, scope, converters);


      }
    }




  }

  return root_struc.writeable_array;
};


var MorphMap = function(config, converters) {
  if (config && typeof config != 'object') {
    throw new Error('map should be `object`');
  }
  this.config = config;
  this.converters = converters;
  this.pconfig = null;

  var _this = this;
  return function() {
    return _this.execute.apply(_this, arguments);
  };
};
MorphMap.prototype.execute = function(data, spec_data, converters) {
  if (!this.pconfig) {
    this.pconfig = parseMap(this.config);
  }
  return executeMap( this.pconfig, data, spec_data, converters || this.converters);
};

//var data_bymap = executeMap( parseMap(map), raw_testmap_data, {smile: '25567773'} );
//console.log(data_bymap);

spv.MorphMap = MorphMap;
spv.mmap = function(config, converters) {
  return new MorphMap(config, converters);
};
//i should not rewrite fields




spv.coe = function(cb) {
  var result = {};
  var add = function(obj) {
    cloneObj(result, obj);
  };
  cb(add);
  return result;
};

var letter_regexp = /[^\u00C0-\u1FFF\u2C00-\uD7FF\w]/gi;
//http://stackoverflow.com/questions/150033/regular-expression-to-match-non-english-characters#comment22322603_150078


var hardTrim = function(string) {
  return string.replace(letter_regexp, '').toLowerCase();
};
spv.hardTrim = hardTrim;




spv.insertItem = function(array, item, index) {
  var array_length = array.length;
  var next_value = item;
  var value_to_recover;

  for (var jj = index; jj < array_length + 1; jj++) {
    value_to_recover = array[jj];
    array[jj] = next_value;
    next_value = value_to_recover;
  }
  return array;
};

var removeItem = function(array, index) {
  //var array_length = array.length;
  for (var i = index + 1; i < array.length; i++) {
    array[ i - 1 ] = array[ i ];
  }
  array.length = array.length - 1;
  return array;
};

spv.removeItem = removeItem;

spv.findAndRemoveItem = function(array, item) {
  var index = array.indexOf(item);
  if (index === -1) {
    return array;
  } else {
    return removeItem(array, index);
  }
};

var startsWith;
if (String.prototype.startsWith) {
  startsWith = function(str, substr, pos) {
    return str.startsWith(substr, pos);
  };
} else {
  //http://jsperf.com/starts-with/14, without problems for GC
  startsWith = function(str, substr, pos) {
    var len = substr.length;
    var shift = pos || 0;

    for (var i = 0; i < len; i ++) {
      if (str.charAt(i + shift) != substr.charAt(i)) {
        return false;
      }
    }
    return true;
  };
}

spv.startsWith = startsWith;

var endsWith;
if (String.prototype.endsWith) {
  endsWith = function(str, substr, pos) {
    return str.endsWith(substr, pos);
  }
} else {
  endsWith = function (str, substr, pos) {
    var len = substr.length;
    var big_length_diff = (pos || str.length) - len;

    for (var i = len;i > 0; i --) {
      if (str.charAt(big_length_diff + i - 1) !== substr.charAt(i - 1)) {
        return false;
      }
    }
    return true;
  }
}

spv.endsWith = endsWith;

spv.getDeprefixFunc = function(prefix, simple) {
  var cache = {};
  return function (namespace) {
    if (!cache.hasOwnProperty(namespace)) {
      if (startsWith(namespace, prefix)) {
        cache[namespace] = simple ? true : namespace.slice(prefix.length);
      } else {
        cache[namespace] = false;
      }
    }
    return cache[namespace];
  };

};

spv.getPrefixingFunc = function(prefix) {
  var cache = {};
  return function (state_name) {
    if (!cache.hasOwnProperty(state_name)) {
      cache[state_name] = prefix + state_name;
    }
    return cache[state_name];
  };
};

spv.forEachKey = function(obj, fn, arg1, arg2) {
  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) {continue;}
    fn(obj[key], key, arg1, arg2);
  }
};

spv.countKeys = function(obj, truthy) {
  var count = 0;
  for (var prop in obj) {
    if (!truthy) {
      count++;
    } else if (obj[prop]){
      count++;
    }
  }
  return count;
};

spv.nil = function (arg) {
  if (arg !== undefined && arg !== null) {
    return false;
  }

  return true;
}

spv.set = (function() {

  var Set = function () {
    this.list = [];
    this.index = {};
  };


  return {
    contains: isInSet,
    get: getFromSet,
    add: AddToSet,
    remove: RemoveFromSet,
    create: create,
  }

  function getFromSet(set, key) {
    if (isInSet(set, key)) {return set.index[key];}
  }

  function isInSet(set, key) {
    return set.index.hasOwnProperty(key);
  }

  function AddToSet(set, key, item) {
    if (!item) {
      throw new Error('cant\'t add nothing');
    }

    if (isInSet(set, key)) {return item;}

    set.index[key] = item;
    set.list.push(item);

    return item;
  }

  function RemoveFromSet(set, key) {
    var item = set.index[key];
    if (!isInSet(set, key)) {return;}

    delete set.index[key];
    set.list = spv.findAndRemoveItem(set.list, item);
    return item;
  }

  function create() {
    return new Set();
  }
})();


})();



define(function(){return spv;});
