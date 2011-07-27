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

var ttime = function(f){
	var d = +new Date
	
	if (f){
		f();
		console.log((+new Date - d)/1000)
	} else{
		console.log(d/1000)
	}
};

var getAllParents = function(el, include_itself, excl){
	var ps = [];
	if (include_itself){
		ps.push({
			node: el,
			exception: include_itself.exception
		});
	}
	while (el && ((el = el.parentNode) && ((!excl && el != el.ownerDocument)|| (el != excl )))) {
		ps.push({
			node: el
		});
	};
	return ps;
};



(function(){
	
	var checkParent = function(parents, filter){
		if (parents.length){
			var p =parents.shift();
			var el = p.node;
			if (p.exception){
				if (p.exception.classes){
					for (var i=0; i < p.exception.classes.length; i++) {
						filter = filter.replace('.' + p.exception.classes[i], '');
					};
				}
				
			}
			
			
			
			if (!filter || $(el).is(filter)){
				return true;
			} else{
				console.log(filter)
			}
		}
		
		
	}
	
	var checkParents = function(parents, filter){
		while ( parents.length ) {
			if (checkParent(parents, filter)){
				return true
			}
		}
		
		console.log('vava')
	}
	
	
	var checkRelative = function(rule, filter, parents){
		if (!rule){
			return !!checkParents(parents, filter);
		} else if (rule == '>'){
			return !!checkParent(parents, filter);
		}

		
	};
	
	checkRelativesBySteps = function(el, steps, parents){
		var rule,
			p = parents || getAllParents(el, false, el.ownerDocument);
		
		
		
		for (var i = steps.length - 1; i >= 0; i--){
			
			if (typeof rule != 'undefined'){
				if (!checkRelative(rule, steps[i].t, p)){
					console.log('failed')
					console.log(rule);
					console.log(steps[i].t);
					console.log(p);
					
					
					
					return false;
				} else{
					
				}
				
			}
			rule = steps[i].r;			
		};
		return true;
		
	};
		
})();





(function(){
	var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g;
	var relative = {
		'+': true,
		'>': true,
		'~': true
	 };
	
	parseCSSSelector = function(selector){
		var m, cur,
			parts = [],
			steps = [],
			soFar = selector;
		
			
		do {
			chunker.exec( "" );
			m = chunker.exec( soFar );
	
			if ( m ) {
				soFar = m[3];
			
				parts.push( m[1] );
			
				if ( m[2] ) {
					extra = m[3];
					break;
				}
			}
		} while ( m );
		
		
		
		
		while ( parts.length ) {
			cur = parts.shift();
			pop = cur;
	
			if ( !relative[cur]) {
				cur = "";
			} else {
				pop = parts.shift();
			}
	
			if ( pop == null ) {
				pop = context;
			}
			steps.push({t: pop, r: cur})
			//Expr.relative[ cur ]( checkSet, pop, contextXML );
		}
		
		
		return steps;
	};

})();

var collapseAll = function(){
	var r= [];
	for (var i=0; i < arguments.length; i++) {
		var c = arguments[i];
		if (c instanceof Array){
			for (var ii=0; ii < c.length; ii++) {
				if (r.indexOf(c[ii]) == -1){
					r.push(c[ii]);
				}
				
			};
		} else{
			if (r.indexOf(c) == -1){
				r.push(c);
			}
		}
	};
	return r;
};

var findCSSRules = function(selector_part){
	selector_part=selector_part.toLowerCase();
	
	
	var target_rules = [];
	if (document.styleSheets) {
	  for (var i=0; i < document.styleSheets.length; i++) {
		var styleSheet = document.styleSheets[i]; 
		var c_rules = styleSheet.cssRules || styleSheet.rules;
		var ct_rules = $filter(c_rules, 'selectorText', function(v){
			if (v){
				if (bN(v.toLowerCase().indexOf(selector_part))){
					return true
				}
			}
		});
		if (ct_rules.length){
			target_rules = target_rules.concat.apply(target_rules, ct_rules);
		}
		
	  }
	  return target_rules.length && target_rules;
	}  
	return false;

	
};

/*
var killCSSRule = function (selector_part) { 
	return getCSSRule(selector_part,'delete');
}

var addCSSRule = function (selector_part) {
	if (document.styleSheets) { 
	  if (!getCSSRule(selector_part)) {
		 if (document.styleSheets[0].addRule) {
			document.styleSheets[0].addRule(selector_part, null,0);
		 } else { 
			document.styleSheets[0].insertRule(selector_part+' { }', 0); 
		 }
	  }
	}
	return getCSSRule(selector_part); 
}
*/

//var AnimateToCSSClass= 

var checkNodeParticipation = function(node, god_father, oldold_parents, steps){
	var r=[];
	for (var i=0; i < node.length; i++) {
		var n = node[i];
		
		var node_parents = getAllParents(n, false, god_father).concat(oldold_parents);
		if (checkRelativesBySteps(n, steps, node_parents)){
			r.push(n);
		}
		
	};	
	return r.length && r;
};


var getECParticipials = function(el, class_name){
	var classes = class_name instanceof Array ? class_name : [class_name];
	
	var tnodes = [],
		parents = getAllParents(el, {exception: {classes : classes}});
	
	for (var ii=0; ii < classes.length; ii++) {
		var c_class_name = classes[ii];
		var rules = findCSSRules("." + c_class_name);
	
		for (var i=0; i < rules.length; i++) {
			
			var steps = parseCSSSelector(rules[i].selectorText);
			if (steps.length > 1){
				var last_step = steps[steps.length-1].t;
				
				if (last_step.indexOf("." +c_class_name) == -1){
					var node = $(el).find(last_step);
					var ns = checkNodeParticipation(node, el, parents, steps);
					if (ns){
						tnodes = tnodes.concat(ns);
					}
				}
				
	
				
			}
			
			
		};
	};	
		
	
	
	return tnodes.length && collapseAll(tnodes);
}



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
	
var cloneObj= function(acceptor, donor, black_list, white_list){
	//not deep! 
	var _no = {};
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


