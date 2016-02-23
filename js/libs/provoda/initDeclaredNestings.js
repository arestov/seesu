define(function(require) {
"use strict";

var spv = require('spv');

var executePreload = function(md, nesting_name) {
	var lists_list = md.getNesting(nesting_name);

	if (!lists_list) {return;}
	if (Array.isArray(lists_list)) {
		for (var i = 0; i < lists_list.length; i++) {
			var cur = lists_list[i];
			if (cur.preloadStart){
				cur.preloadStart();
			}

		}
	} else {
		if (lists_list.preloadStart){
			lists_list.preloadStart();
		}
	}
};


//если есть состояние для предзагрузки
//если изменилось гнездование

var bindPreload = function(md, preload_state_name, nesting_name) {

	md.on('lgh_sch-' + preload_state_name, function(state) {
		if (state) {
			executePreload(md, nesting_name);
		}
	});
	/*
	md.wch(md, preload_state_name, function(e) {
		if (e.value){
			executePreload(md, nesting_name);
		}
	});*/
};

var pathExecutor = function(getChunk) {
	return function getPath(obj, app, arg1, arg2) {
		var full_path;
		if (obj.states) {
			full_path = '';
			for (var i = 0; i < obj.clean_string_parts.length; i++) {
				full_path += obj.clean_string_parts[i];
				var cur_state = obj.states[i];
				if (cur_state) {
					var chunk = getChunk(cur_state, app, arg1, arg2);
					full_path += (chunk && app.encodeURLPart(chunk || '')) || 'null';
				}
			}
		} else {
			full_path = obj.full_usable_string;
		}
		return full_path;
	};
};

var getPath = pathExecutor(function(chunkName, app, md) {
	return md._provoda_id && md.state(chunkName);
});

var executeStringTemplate = function(app, md, obj, need_constr) {
	var full_path = getPath(obj, app, md);
	return app.routePathByModels(full_path, obj.from_root ? app.start_page : md, need_constr);

};


var string_state_regexp = /\[\:.+?\]/gi;
var parsed_strings_templates = {};


var getParsedPath = spv.memorize(function(string_template) {
	if (!parsed_strings_templates[string_template]) {
		//example "#tracks/[:artist],[:track]"
		var from_root = string_template.charAt(0) == '#';
		var full_usable_string = from_root ? string_template.slice( 1 ) : string_template;

		var clean_string_parts = full_usable_string.split(string_state_regexp);
		var states = full_usable_string.match(string_state_regexp);

		if (states) {
			for (var i = 0; i < states.length; i++) {
				states[i] = states[i].slice( 2, states[i].length - 1 );
			}
		}

		parsed_strings_templates[string_template] = {
			from_root: from_root,
			clean_string_parts: clean_string_parts,
			states: states,
			full_usable_string: full_usable_string
		};
	}
	return parsed_strings_templates[string_template];
});

var getSPByPathTemplate = function(app, md, string_template, need_constr) {

	var parsed_template = getParsedPath(string_template);


	return executeStringTemplate(app, md, parsed_template, need_constr);
};

var getSubPByDeclr = function(md, cur) {
	if (cur.type == 'route') {
		return getSPByPathTemplate(md.app, md, cur.value);
	} else {
		var constr = md._all_chi[cur.key];
		return md.initSi(constr);
	}
};

var getSubpages = function(md, el) {
	var array = el.subpages_names_list;
	var result;
	if (Array.isArray( array )) {
		result = new Array(array);
		for (var i = 0; i < array.length; i++) {
			result[i] = getSubPByDeclr(md, array[i]);
		}
	} else {
		result = getSubPByDeclr(md, array);
	}
	return result;
};

var initOneDeclaredNesting = function(md, el) {
	/*
	nesting_name
	subpages_names_list
	preload
	init_state_name
	*/
	var preload_state_name = el.preload && (typeof el.preload == 'string' ? el.preload : 'mp_has_focus');

	if (el.init_state_name) {
		var init_func = function(state) {

			if (state) {
				this.updateNesting(el.nesting_name, getSubpages( this, el ));
				if (preload_state_name && this.state(preload_state_name)) {
					executePreload(this, el.nesting_name);
				}

				md.off('lgh_sch-' + el.init_state_name, init_func);
			}
		};

		md.on('lgh_sch-' + el.init_state_name, init_func);

	} else {
		md.updateNesting(el.nesting_name, getSubpages( md, el ));
	}

	if (el.preload) {
		bindPreload(md, preload_state_name, el.nesting_name);
	}

};

var initDeclaredNestings = function(md) {
	for (var i = 0; i < md.nestings_declarations.length; i++) {
		initOneDeclaredNesting(md, md.nestings_declarations[i]);
	}
};

initDeclaredNestings.getParsedPath = getParsedPath;
initDeclaredNestings.getSubpages = getSubpages;
initDeclaredNestings.pathExecutor = pathExecutor;


initDeclaredNestings.getConstrByPath = function(app, md, string_template) {
	return getSPByPathTemplate(app, md, string_template, true);
};

return initDeclaredNestings;
});
