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

var addEvent = window.addEventListener ? 
function(elem, evType, fn){
	elem.addEventListener(evType, fn, false);
	return fn;
}:
function(elem, evType, fn){
	elem.attachEvent('on' + evType, fn);
	return fn;
};
var removeEvent = window.addEventListener ?
function(elem, evType, fn){
	elem.removeEventListener(evType, fn, false);
}:
function(elem, evType, fn){
	elem.detachEvent('on' + evType, fn);
};
var domReady = function(d, callback){
	if (d.readyState == 'complete' || d.readyState == 'loaded'){
		setTimeout(callback, 30);
	} else{
		var done;
		var f = function(){
			if (!done){
				done = true;
				callback();
				
			}
		};
		addEvent(d.defaultView, 'load', f);
		addEvent(d, 'DOMContentLoaded', f);
	}
};

doesContain = function(target, valueOf){
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
var arrayExclude = function(arr, obj){
	var r = []; obj = toRealArray(obj);
	for (var i = 0; i < arr.length; i++) {
		if (obj.indexOf(arr[i]) == -1){
			r.push(arr[i]);
		}	
	}
	return r;
};


var getFields = function(obj, fields){
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

var searchInArray = function (array, query, fields) {
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

var getStringPattern = function (str) {
	if (str.replace(/\s/g, '')){
		str = str.replace(/\s+/g, ' ').replace(/(^\s)|(\s$)/g, ''); //removing spaces
		str = str.replace(/([$\^*()+\[\]{}|.\/?\\])/g, '\\$1').split(/\s/g);  //escaping regexp symbols
		for (var i=0; i < str.length; i++) {
			str[i] = '(\\b' + str[i] + ')';
		}
		str = str.join('|');
		
		return RegExp(str, 'gi');
	}
};

var ttime = function(f){
	var d = +new Date();
	
	if (f){
		f();
		console.log(((new Date()) - d)/1000);
	} else{
		console.log(d/1000);
	}
};

var collapseAll = function(){
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



var toRealArray = function(array, check_field){
	if (array instanceof Array){
		return array;
	} else if (array === Object(array) && array.length){
		return Array.prototype.slice.call(array);
	} else if (array && (!check_field || getTargetField(array, check_field))){
		return [array];	
	} else{
		return [];
	}
};

var getTargetField = function(obj, field){
	var tree = field.split('.');
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
var getFieldValueByRule = function(obj, rule){
	if (typeof rule == 'object' && rule === Object(rule)){
		if (typeof rule.field =='function'){
			return rule.field(obj);
		} else {
			return getTargetField(obj, rule.field);
		}
	} else if (typeof rule =='function'){
		return rule(obj);
	} else{
		return getTargetField(obj, rule);
	}
	
	
};

var sortByRules = function(a, b, rules){
	if (a === Object(a) && b === Object(b)){
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

var makeIndexByField = function(array, field){
	var r = {};
	if (array && array.length){
		for (var i=0; i < array.length; i++) {
			var simple_name,
				cur = array[i],
				fv = getTargetField(cur, field);
			if (fv){
				if (fv instanceof Array){
					for (var k=0; k < fv.length; k++) {
						simple_name = (fv[k] + '').toLowerCase();
						if (!r[simple_name]){
							r[simple_name] = [];
							r[simple_name].real_name = fv[k];
							
						}
						if (!bN(r[simple_name].indexOf(cur))){
							r[simple_name].push(cur);
						}
					}
				} else{
					simple_name = (fv + '').toLowerCase();
					if (!r[simple_name]){
						r[simple_name] = [];
						r[simple_name].real_name = fv;
					}
					if (!bN(r[simple_name].indexOf(cur))){
						r[simple_name].push(cur);
					}
				}
			} else {
				if (!r['#other']){
					r['#other'] = [];
				}
				if (!bN(r['#other'].indexOf(cur))){
					r['#other'].push(cur);
				}
			}
	
		
		}
	}
	
	return r;
};

var $filter = function(array, field, value_or_testfunc){
	var r = [];
	r.not = [];
	if (!array){return r;}
	for (var i=0; i < array.length; i++) {
		if (array[i]){
			if (value_or_testfunc){
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
				
			} else{
				var field_value = getTargetField(array[i], field);
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


function bN(num){
	/*
	special for opera browser
	http://opera.com
	http://friendfeed.com/yodapunk/935ad55d/o-rly-opera-cc-pepelsbey-foolip-erikdahlstrom
	*/
	return !!(1* (~num));
}
	
var cloneObj= function(acceptor, donor, black_list, white_list){
	//not deep! 
	var _no = acceptor || {};
	for(var a in donor){
		if (!white_list || !!~white_list.indexOf(a)){
			if (!black_list || !~black_list.indexOf(a)){
				_no[a] = donor[a];
			}
		}
		
	}
	return _no;
};

var isEqualObjs = function(obj1, obj2){
	var a;
	for (a in obj1){
		if (obj1[a] !== obj2[a]){
			return false;
		}
	}
	
	for (a in obj2){
		if (obj2[a] !== obj1[a]){
			return false;
		}
	}
	return true;
};
var getUnitBaseNum = function(_c){
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


var stringifyParams= function(params, ignore_params, splitter, joiner){
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
	pv_signature_list.sort();
	return pv_signature_list.join(joiner || '');
};


var separateNum = function(num){
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

var createPrototype = function(constr, assi_prototype, clone_prototype){
	var parent_prototype = assi_prototype.constructor.prototype;
	constr.prototype = assi_prototype;
	cloneObj(constr.prototype, {
		constructor: constr,
		callParentMethod: function(){
			var tmp = this.callParentMethod;
			this.callParentMethod = parent_prototype.callParentMethod;
			//console.log(constr)
			//console.log(assi_prototype)
			var args = Array.prototype.slice.call(arguments);
			var method = args.shift();

			var r = parent_prototype[method].apply(this, args);

			this.callParentMethod = tmp;
			
			return r;
		}
	});
	cloneObj(constr.prototype, clone_prototype);
	return constr;
};