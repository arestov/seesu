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
	elem.detachEvent('on' + evType, fn)
};

var getTargetField = function(obj, field){
	var tree = field.split('.');
	var nothing;
	var target = obj;
	for (var i=0; i < tree.length; i++) {
		if (target[tree[i]] !== nothing){
			target = target[tree[i]];
		} else{
			return
		}
		
	};
	return target;
};
var getFieldValueByRule = function(obj, rule){
	if (rule === Object(rule)){
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
				
				if (field_value_a && field_value_b){
					if (field_value_a > field_value_b){
						shift = cr.reverse ? -1 : 1;
					} else if (field_value_a < field_value_b){
						shift = cr.reverse ? 1 : -1;
					}
				}
			}
			
		};
		
		return shift;
		
	}
};

var makeIndexByField = function(array, field){
	var r = {};
	for (var i=0; i < array.length; i++) {
		var cur = array[i];
		var fv = getTargetField(cur, field);
		if (fv){
			if (fv instanceof Array){
				for (var k=0; k < fv.length; k++) {
					var simple_name = (fv[k] + '').toLowerCase();
					if (!r[simple_name]){
						r[simple_name] = []
						r[simple_name].real_name = fv[k];
						
					}
					if (!bN(r[simple_name].indexOf(cur))){
						r[simple_name].push(cur);
					}
				};
			} else{
				var simple_name = (fv + '').toLowerCase();
				if (!r[simple_name]){
					r[simple_name] = [];
					r[simple_name].real_name = fv;
				}
				if (!bN(r[simple_name].indexOf(cur))){
					r[simple_name].push(cur)
				}
			}
		} else {
			if (!r['#other']){
				r['#other'] = [];
			}
			if (!bN(r['#other'].indexOf(cur))){
				r['#other'].push(cur)
			}
		}

	
	};
	return r;
};

var $filter = function(array, field, value_or_testfunc){
	var r = [];
	for (var i=0; i < array.length; i++) {
		if (array[i]){
			if (value_or_testfunc){
				if (typeof value_or_testfunc == 'function'){
					var field_value = getTargetField(array[i], field);
					if (value_or_testfunc(field_value)){
						r.push(array[i]);
					}
				} else{
					if (getTargetField(array[i], field) === value_or_testfunc){
						r.push(array[i]); 
					}
				}
				
			} else{
				var field_value = getTargetField(array[i], field);
				if (field_value){
					r.push(field_value);
				}
			}
			
		}
	};
	return r;
};


function bN(num){
	/*
	special for opera browser
	http://opera.com
	http://friendfeed.com/yodapunk/935ad55d/o-rly-opera-cc-pepelsbey-foolip-erikdahlstrom
	*/
	return !!(1* (~num));
};
	
var clone_obj = function(obj, black_list, white_list){
	//not deep! 
	var _no = {};
	for(var a in obj){
		if (!white_list || !!~white_list.indexOf(a)){
			if ((typeof obj[a] != 'object') && (!black_list || !~black_list.indexOf(a))){
				_no[a] = obj[a];
			}
		}
		
	}
	return _no;
};

var isEqualObjs = function(obj1, obj2){
	
	for (var a in obj1){
		if (obj1[a] !== obj2[a]){
			return false
		}
	}
	
	for (var a in obj2){
		if (obj2[a] !== obj1[a]){
			return false
		}
	}
	return true
};
var getUnitBaseNum = function(_c){
	if (_c > 0){
		if (_c > 10 && _c < 20){
			return 2
		} else{
			var _cc = '0' + _c;
			_cc = parseFloat(_cc.slice(_cc.length-1));
			
			if (_cc === 0){
				return 2
			} else if (_cc == 1){
				return 0
			}else if (_cc < 5){
				return 1
			} else {
				return 2
			}
		}
		
	} else if (_c == 0){
		return 2
	}
};
var separateNum = function(num){
	var str = "" + num;
	var three_sep = '';
	for (var i = str.length - 1; i >= 0; i--){
		three_sep = str[i] + three_sep;
		if ((str.length - (i)) % 3 === 0){
			three_sep = ' ' + three_sep;
		}
	};
	return  three_sep
};

if (!Array.indexOf) {
  Array.prototype.indexOf = function (obj, start) {
    for (var i = (start || 0); i < this.length; i++) {
      if (this[i] == obj) {
        return i;
      }
    }
    return -1;
  };
};


