var spv = {};


(function() {
"use strict";
var addEvent, removeEvent, getDefaultView, domReady,
	doesContain, shuffleArray, arrayExclude, getFields, matchWords, searchInArray, getStringPattern,
	ttime, collapseAll, toRealArray, getTargetField, sortByRules, makeIndexByField, $filter,
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
var hasArg = function(el) {return el;};
spv.hasEveryArgs = function() {
	return Array.prototype.every.call(arguments, hasArg);
};

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
	elem.removeEventListener(evType, fn, false);
}:
function(elem, evType, fn){
	elem.detachEvent('on' + evType, fn);
};
getDefaultView = spv.getDefaultView = function(d) {
	return d.defaultView || d.parentWindow;
};
domReady = spv.domReady = function(d, callback){
	if (d.readyState == 'complete' || d.readyState == 'loaded' || d.readyState == "interactive"){
		callback();
	} else{
		var done;
		var f = function(){
			if (!done){
				done = true;
				spv.removeEvent(spv.getDefaultView(d), 'load', f);
				spv.removeEvent(d, 'DOMContentLoaded', f);
				callback();
			}
		};
		spv.addEvent(spv.getDefaultView(d), 'load', f);
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
arrayExclude = spv.arrayExclude = function(arr, obj){
	var r = [];
	if (!arr){
		return r;
	}

	obj = spv.toRealArray(obj);
	for (var i = 0; i < arr.length; i++) {
		if (obj.indexOf(arr[i]) == -1){
			r.push(arr[i]);
		}
	}
	return r;
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

getFields = function(obj, fields){
	var r = [];
	for (var i=0; i < fields.length; i++) {
		var cur = fields[i];

		var value = (typeof cur == 'function') ? cur(obj) : spv.getTargetField(obj, cur);
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

getStringPattern = function (str) {
	if (str.replace(/\s/g, '')){
		str = str.replace(/\s+/g, ' ').replace(/(^\s)|(\s$)/g, ''); //removing spaces
		str = str.replace(/([$\^*()+\[\]{}|.\/?\\])/g, '\\$1').split(/\s/g);  //escaping regexp symbols
		for (var i=0; i < str.length; i++) {
			str[i] = '((^\|\\s)' + str[i] + ')';
		}
		str = str.join('|');

		return new RegExp(str, 'gi');
	}
};

ttime = function(f){
	var d = +new Date();

	if (f){
		f();
		console.log(((new Date()) - d)/1000);
	} else{
		console.log(d/1000);
	}
};

collapseAll = function(){
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
	} else if (array && (!check_field || spv.getTargetField(array, check_field))){
		return [array];
	} else{
		return [];
	}
};

getTargetField = function(obj, tree){
	tree= Array.isArray(tree) ? tree : tree.split('.');
	var nothing;
	var target = obj;
	for (var i=0; i < tree.length; i++) {
		if (target[tree[i]] !== nothing){
			target = target[tree[i]];
		} else{
			return;
		}
	}
	return target;
};

spv.setTargetField = function(obj, tree, value) {
	tree = Array.isArray(tree) ? tree : tree.split('.');
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

var getFieldValueByRule = function(obj, rule){
	if (rule instanceof Function){
		return rule(obj);
	} else if (Array.isArray(rule)){
		return spv.getTargetField(obj, rule);
	} else if (rule instanceof Object){
		if (typeof rule.field =='function'){
			return rule.field(obj);
		} else {
			return spv.getTargetField(obj, rule.field);
		}
	} else{
		return spv.getTargetField(obj, rule);
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

makeIndexByField = spv.makeIndexByField = function(array, field, keep_case){
	var r = {};
	if (array && array.length){
		for (var i=0; i < array.length; i++) {
			var simple_name,
				cur = array[i],
				fv = spv.getTargetField(cur, field);
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
	var r = [];
	r.not = [];
	if (!array){return r;}
	for (var i=0; i < array.length; i++) {
		if (array[i]){
			if (value_or_testfunc){
				if (typeof value_or_testfunc == 'function'){
					if (value_or_testfunc(spv.getTargetField(array[i], field))){
						r.push(array[i]);
					} else{
						r.not.push(array[i]);
					}
				} else{
					if (spv.getTargetField(array[i], field) === value_or_testfunc){
						r.push(array[i]);
					} else{
						r.not.push(array[i]);
					}
				}
				
			} else{
				var field_value = spv.getTargetField(array[i], field);
				if (field_value){
					r.push(field_value);
				} else{
					r.not.push(array[i]);
				}
			}
			
		}
	}
	return r;
};




cloneObj= spv.cloneObj = function(acceptor, donor, black_list, white_list){
	//not deep!
	var _no = acceptor || {};
	var prop;
	if (black_list || white_list){
		for(prop in donor){
			if (!white_list || !!~white_list.indexOf(prop)){
				if (!black_list || !~black_list.indexOf(prop)){
					_no[prop] = donor[prop];
				}
			}
		}
	} else {
		for(prop in donor){
			_no[prop] = donor[prop];
		}
	}
	return _no;
};
spv.mapProps = function(props_map, donor, acceptor) {
	for (var name in props_map){
		var value = spv.getTargetField(donor, props_map[name]);
		if (typeof value != 'undefined'){
			spv.setTargetField(acceptor, name, value);
		}
	}
	return acceptor;
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




/* Simple JavaScript Inheritance
  * By John Resig http://ejohn.org/
  * http://ejohn.org/blog/simple-javascript-inheritance/
  * MIT Licensed.
  * Gleb Arestov mod
  */
// Inspired by base2 and Prototype
(function(){
	var
		fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/,
		allowParentCall = function(name, fn, _super){
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


	// The base Class implementation (does nothing)
	Class = function(){};

	// Create a new Class that inherits from this class
	Class.extendTo = function(namedClass, prop) {
		var _super = this.prototype;

		// Instantiate a base class (but only create the instance,
		// don't run the init constructor)
		var prototype = new this();

		// Copy the properties over onto the new prototype
		for (var name in prop) {
			// Check if we're overwriting an existing function
			prototype[name] = typeof prop[name] == "function" &&
				typeof _super[name] == "function" && fnTest.test(prop[name]) ?
				allowParentCall(name, prop[name], _super) :
				prop[name];
		}

		// Populate our constructed prototype object
		namedClass.prototype = prototype;

		// Enforce the constructor to be what we expect
		namedClass.prototype.constructor = namedClass;

		if (namedClass.prototype.onExtend){
			namedClass.prototype.onExtend.call(namedClass.prototype);
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
spv.capitalize = function(string, just_first) {
	var test = just_first ? (/(^|\s)(.)/) : (/(^|\s)(.)/g);
	return string.replace(test, function(m, p1, p2){
		return p1+p2.toUpperCase();
	});
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



spv.Depdc = function(init) {
	if (init){
		this.init();
	}
};
spv.Depdc.prototype = {
	constructor: spv.Depdc,
	init: function() {
		this.dep_list = [];
	},
	addDepend: function(de) {
		if (this.dep_list.indexOf(de) == -1){
			this.dep_list.push(de);
		}
	},
	removeDepend: function(de) {
		this.dep_list = arrayExclude(this.dep_list, de);
	},
	softAbort: function(de) {
		if (de){
			this.removeDepend(de);
		}
		if (!this.dep_list.length){
			this.abort();
		}
	}
};
spv.makeIndexByField = makeIndexByField;
spv.getTargetField = getTargetField;
spv.throttle = throttle;
spv.debounce = debounce;
spv.filter = $filter;

})();
define(function(){return spv;});
