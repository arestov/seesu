define(function(require) {
'use strict';

var spv = require('spv');
var $ = require('jquery');
var angbo = require('angbo');
var StandartChange = require('./StandartChange');

var capitalize = spv.capitalize;
var startsWith = spv.startsWith;
var getTargetField = spv.getTargetField;
var setTargetField = spv.setTargetField;


var DOT = '.';
var regxp_complex_spaces = /(^\s+)|(\s+$)|(\s{2,})/gi;
var regxp_spaces = /\s+/gi;

var convertFieldname = function(prop_name) {
  var parts = prop_name.replace(/^-/, '').split('-');
  if (parts.length > 1){
    for (var i = 1; i < parts.length; i++) {
      parts[i] = capitalize(parts[i]);
    }
  }
  return parts.join('');
};
var createPropChange = (function() {
  var getValue = function(node, prop) {
    return getTargetField(node, prop);
  };
  var setValue = function(node, value, old_value, wwtch) {
    return setTargetField(node, wwtch.data, value || '');
  };

  return function(node, prop, statement, directive_name) {
    var parts = prop.split(DOT);
    for (var i = 0; i < parts.length; i++) {
      parts[i] = convertFieldname(parts[i]);
    }
    prop = parts.join(DOT);

    return new StandartChange(node, {
      data: prop,
      statement: statement,
      getValue: getValue,
      setValue: setValue
    }, directive_name);
  };
})();


var regxp_props_com = /\S[\S\s]*?\:[\s]*?\{\{[\S\s]+?\}\}/gi;
var regxp_props_com_soft = /\S[\S\s]*?\:[\s]*?(?:\{\{[\S\s]+?\}\})|(?:\S+?(\s|$))/gi;
var regxp_props_spaces = /^\s*|s*?$/;
var regxp_props_coms_part = /\s*\:\s*?(?=\{\{)/;
var regxp_props_statement = /(^\{\{)|(\}\}$)/gi;

var getFieldsTreesBases = StandartChange.getFieldsTreesBases;

var exp = /\S+\s*\:\s*(\{\{.+?\}\}|\S+)/gi;
var two_part = /(\S+)\s*\:\s*(?:\{\{(.+?)\}\}|(\S+))/;

var createPVClassParse = function(wrapItem) {
  return function(node, full_declaration, directive_name) {
    var statements = full_declaration.match(exp);
    if (!statements.length) { return; }

    var result = [];
    for (var i = statements.length - 1; i >= 0; i--) {
      var parts = statements[i].match(two_part);
      var class_name = parts[1];
      var condition = parts[2] || parts[3];
      if (!class_name || !condition) {
        throw new Error('wrong statement: ' + statements[i]);
      }

      result.push(wrapItem(class_name, condition, node, directive_name));
    }

    return result;

  }
}

var getIndexList = function(obj, arr) {
  var result = arr || [];
  for (var prop in obj) {
    result.push( prop );
  }
  return result;
};

return {
  config: (function(){
    var config = {
      one_parse: {
        'pv-import': true,
        'pv-when': true
      },
      one_parse_list: [],
      pseudo: {
        'pv-when-condition': true
      },
      pseudo_list: [],
      scope_generators: {
        'pv-nest': true,
        'pv-repeat': true,
        'pv-foreign': true
      },
      scope_g_list: [],
      states_using_directives: {
        'pv-text': true,
        'pv-class': true,
        'pv-props': true,
        'pv-type': true,
        'pv-repeat': true
      },
      sud_list: [],
      directives: {
        'pv-text': true,
        'pv-class': true,
        'pv-props': true,
        'pv-anchor': true,
        'pv-type': true,
        'pv-events': true
      },
      directives_names_list: [],

      comment_directives: {
      //	'pv-when': true,
        'pv-replace': true,
        'pv-importable': true
      },
      comment_directives_names_list: [],
    };

    getIndexList(config.directives, config.directives_names_list);
    //порядок директив важен, по идее
    //должен в результате быть таким каким он задекларирован

    getIndexList(config.scope_generators, config.scope_g_list);
    //порядок директив важен, по идее
    //должен в результате быть таким каким он задекларирован

    getIndexList(config.states_using_directives, config.sud_list);

    getIndexList(config.comment_directives, config.comment_directives_names_list);

    getIndexList(config.one_parse, config.one_parse_list);
    getIndexList(config.pseudo, config.pseudo_list);

    return config;
  })(),
  getIndexList: getIndexList,
  getFieldsTreesBases: getFieldsTreesBases,
  comment_directives_p: {
    'pv-replace': function(node, full_declaration, directive_name, getSample) {
      var index = {};
      var complex_value = full_declaration;
      var complects = complex_value.match( regxp_props_com_soft );

      for (var i = 0; i < complects.length; i++) {
        complects[i] = complects[i].replace( regxp_props_spaces, '' );
        var splitter_index = complects[i].indexOf(':');

        var prop = complects[i].slice( 0, splitter_index );
        var statement = complects[i].slice( splitter_index + 1 ).replace( regxp_props_statement, '' );

        if (!prop || !statement){
          throw new Error('wrong declaration: ' + complex_value);
        }
        index[prop] = statement;
      }

      return index;
    }
  },
  directives_p: {
    'pv-text': (function() {
      var getTextValue = function(node) {
        return $(node).text();
      };
      var setTextValue = function(node, new_value) {
        $(node).text(new_value);
      };
      return function(node, full_declaration, directive_name) {
        return new StandartChange(node, {
          complex_statement: full_declaration,
          getValue: getTextValue,
          setValue: setTextValue
        }, directive_name);
      };
    })(),
    'pv-class': (function() {
      var getClassName = function(node, class_name) {
        return node.classList.contains(class_name);
      };
      var setClassName = function(node, new_value, old, wwtch) {
        var class_name = wwtch.data;
        if (new_value) {
          node.classList.add(class_name);
        } else {
          node.classList.remove(class_name);
        }

      };

      var parsePVClass = createPVClassParse(function(class_name, condition, node, directive_name) {
        return new StandartChange(node, {
          data: class_name,
          statement: condition,
          getValue: getClassName,
          setValue: setClassName,
          simplifyValue: Boolean
        }, class_name + '$' + directive_name)
      });

      return parsePVClass;
    })(),
    'pv-props': function(node, full_declaration, directive_name) {
      var result = [];
      var complex_value = full_declaration;
      var complects = complex_value.match(regxp_props_com);
      for (var i = 0; i < complects.length; i++) {
        complects[i] = complects[i].replace(regxp_props_spaces,'').split(regxp_props_coms_part);
        var prop = complects[i][0];
        var statement = complects[i][1] && complects[i][1].replace(regxp_props_statement,'');

        if (!prop || !statement){
          throw new Error('wrong declaration: ' + complex_value);
          //return;
        }
        var item = createPropChange(node, prop, statement, prop + '$' + directive_name);
        if (item){
          result.push(item);
        }

      }
      return result;
      //пример:
      //"style.width: {{play_progress}} title: {{full_name}} style.background-image: {{album_cover_url}}"
    },
    'pv-when': function(node, full_declaration, directive_name) {
      if (!full_declaration){
        return;
      }
      return full_declaration;
    },
    'pv-type': (function() {
      var getPVTypes = function() {
        return '';
      };

      var setPVTypes = function(node, new_value, ov, wwtch){
        var types = new_value.split(regxp_spaces);
        wwtch.pv_type_data.marks = {};
        for (var i = 0; i < types.length; i++) {
          if (types[i]){
            wwtch.pv_type_data.marks[types[i]] = true;
          }
        }

        wwtch.context._pvTypesChange();
      };

      return function(node, full_declaration, directive_name) {
        if (!full_declaration){
          return;
        }
        full_declaration = hlpSimplifyValue(full_declaration);

        //если pv-types не требует постоянных вычислений (не зависит ни от одного из состояний)
        //то использующие шаблон ноды могут выдавать общий результирующий объект - это нужно реализовать fixme

        return new StandartChange(node, {
          complex_statement: full_declaration,
          getValue: getPVTypes,
          setValue: setPVTypes,
          simplifyValue: hlpSimplifyValue
        }, directive_name);
      };
    })(),
    'pv-events': (function(){
        var createPVEventData = function(event_name, data, event_opts) {

        event_opts = event_opts && event_opts.split(',');
        var event_handling = {};
        if (event_opts){
          for (var i = 0; i < event_opts.length; i++) {
            event_handling[event_opts[i]] = true;
          }
        }


        return {
          event_name: event_name,
          fn: function(e, context) {
            if (event_handling.sp){
              e.stopPropagation();
            }
            if (event_handling.pd){
              e.preventDefault();
            }
            context.callEventCallback(this, e, data.slice());
          }
        };
      };


      var createEventParams = function(array) {
        for (var i = 0; i < array.length; i++) {
          var cur = array[i];
          if (cur.indexOf('{{') != -1) {
            array[i] = angbo.interpolateExpressions( cur );
          }
        }
        return array;
      };

      return function(node, full_declaration) {
        /*
        click:Callback
        mousemove|sp,pd:MovePoints
        */
        var result = [];
        var declarations = full_declaration.split(regxp_spaces);
        for (var i = 0; i < declarations.length; i++) {
          var cur = declarations[i].split(':');
          var dom_event = cur.shift();
          var decr_parts =  dom_event.split('|');



          result.push(createPVEventData(decr_parts[0], createEventParams(cur), decr_parts[1]));
        }
        return result;
      };
    })()
  },
  scope_generators_p: {
    'pv-nest': function(node, full_declaration) {
      var attr_value = full_declaration;

      var filter_parts = attr_value.split('|');

      var filterFn;
      if (filter_parts[1]){
        var calculator = angbo.parseExpression('obj |' + filter_parts[1]);
        filterFn = function(array) {
          return calculator({obj: array});
        };
      }

      var parts = filter_parts[0].split(/\s+/gi);
      var for_model,
        coll_name,
        controller_name,
        space;

      for (var i = 0; i < parts.length; i++) {

        var cur_part = parts[i];
        if (!cur_part){
          continue;
        }

        if (startsWith(cur_part, 'for_model:')){
          for_model = cur_part.slice('for_model:'.length);
        } else if (startsWith(cur_part, 'controller:')) {
          controller_name = cur_part.slice('controller:'.length);
        } else {
          var space_parts = cur_part.split(':');
          if (!coll_name){
            coll_name = space_parts[0];
          }
          if (!space){
            space = space_parts[1] || '';
          }
        }

      }

      return {
        coll_name: coll_name,
        for_model: for_model,
        controller_name: controller_name,
        space: space,
        filterFn: filterFn
      };
    },
    'pv-repeat': function(node, full_declaration) {

      //start of angular.js code
      var expression = full_declaration;//attr.ngRepeat;
      var match = expression.match(/^\s*(.+)\s+in\s+(.*)\s*$/),
        lhs, rhs, valueIdent, keyIdent;
      if (! match) {
        throw new Error("Expected ngRepeat in form of '_item_ in _collection_' but got '" +
        expression + "'.");
      }
      lhs = match[1];
      rhs = match[2];
      match = lhs.match(/^(?:([\$\w]+)|\(([\$\w]+)\s*,\s*([\$\w]+)\))$/);
      if (!match) {
        throw new Error("'item' in 'item in collection' should be identifier or (key, value) but got '" +
        lhs + "'.");
      }
      valueIdent = match[3] || match[1];
      keyIdent = match[2];
      //end of angular.js code

      var calculator = angbo.parseExpression(rhs);
      var all_values = calculator.propsToWatch;
      var sfy_values = getFieldsTreesBases(all_values);

      return {
        expression: expression,
        valueIdent: valueIdent,
        keyIdent: keyIdent,
        calculator: calculator,
        sfy_values: sfy_values
      };
    }
  }
};


function hlpFixStringSpaces(str, p1, p2, p3) {
  if (p1 || p2){
    return '';
  }
  if (p3){
    return ' ';
  }
  return '';
  //console.log(arguments);
}

function hlpSimplifyValue(value) {
  //this is optimization!
  if (!value){
    return value;
  }
  return value.replace(regxp_complex_spaces, hlpFixStringSpaces);
  // regxp_edge_spaces: /^\s+|\s+$/gi,
  //return value.replace(regxp_spaces,' ').replace(regxp_edge_spaces,'');
}

});
