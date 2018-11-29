define(function(require) {
'use strict';
var spv = require('spv')
var pvUpdate = require('../../provoda/update')
var pvState = require('../../provoda/state')

var updateNesting = require('../../provoda/updateNesting')
var readDepValue = require('../../utils/readDepValue').depValue
var getModels = require('../../utils/multiPath/getModels')
var getValues = require('../../utils/multiPath/getValues')
var getModelById = require('../../utils/getModelById');

/* EXEC

1. один результат, адресат результата определен, обычное указание адресата
1.1 один результат, адресат результата определен "*" способом указания, обычное указание адресата
2. множественный результат, адресат результатов определен, обычное указание адресата
3. множественный результат - ответ пропускается
4. множественный результат, не обычное, а указание адресата через аргумент
5. один результат, адресат результата nesting определен любым способом типа записи nesting, обычное указание адресата

*/

/* PLAN


#КУДА ПИСАТЬ
### ожидаемый результат
  #### кол-во
  - обычный
  - множественный

  #### определённость
  - указанный
  - неопределенный (*) - сделать потом

  #### способ поиска места для записи
  - обычный
  - через аргумент - сделать потом

*/

/*
#АРГУМЕНТЫ ДЛЯ ОБРАБОТЧИКА
  собрать зависимости
    специальный аргумент для получения модели по id - $ (будет работать, но запрещен. сделать потом)
    перемножающиеся nestings
    динамические пути в resource part
*/

var saveToDestModel = function(md, target, value) {
  if (target.path_type == 'by_provoda_id') {

    return
  }

  var multi_path = target.target_path

  switch (multi_path.result_type) {
    case "nesting": {
      updateNesting(md, multi_path.nesting.target_nest_name, value)
    }
    case "state": {
      pvUpdate(md, multi_path.state.base, value)
    }
  }
}

var saveByProvodaId = function(md, target, wrap) {
  for (var id in wrap) {
    if (!wrap.hasOwnProperty(id)) {
      continue;
    }
    var data = wrap[id]
    var model = getModelById(md, id)
    var states = data.states
    var nestings = data.nesting

    for (var state in states) {
      if (!states.hasOwnProperty(state)) {
        continue;
      }
      pvUpdate(model, state, states[state])
    }

    for (var nesting in nestings) {
      if (!nestings.hasOwnProperty(nesting)) {
        continue;
      }
      updateNesting(model, nesting, nestings[nesting])
    }
  }


}

var saveResultToTarget = function(md, target, value) {
  if (target.path_type == 'by_provoda_id') {
    saveByProvodaId(md, target, value)
    return
  }

  var multi_path = target.target_path
  var models = getModels(md, multi_path);

  if (Array.isArray(models)) {
    for (var i = 0; i < models.length; i++) {
      var cur = models[i];
      saveToDestModel(cur, target, value)
    }
  } else {
    saveToDestModel(models, target, value)
  }
}

var saveResult = function (md, dcl, value) {
  if (dcl.targets_list) {
    if (value !== Object(value)) {
      throw new Error('return object from handler')
    }

    for (var i = 0; i < dcl.targets_list.length; i++) {
      var cur = dcl.targets_list[i]
      if (!value.hasOwnProperty(cur.result_name)) {
        continue;
      }
      saveResultToTarget(md, cur, value[cur.result_name]);
    }
  } else {
    saveResultToTarget(md, dcl.target_single, value)
  }

}

var getDep = function(md, dep) {
  var models = getModels(md, dep)
  return models && getValues(models, dep)
}

var getDepsValues = function (md, deps) {
  if (!deps) {
    return null
  }

  var args = new Array(deps.length)
  for (var i = 0; i < deps.length; i++) {
    var cur = deps[i]
    args[i] = getDep(md, cur);
  }

  debugger

  return args;
}

return function pass(md, pass_name, data) {
  var pass_handlers = md._extendable_passes_index
  if (!pass_handlers.hasOwnProperty(pass_name)) {
    throw new Error('missing pass ' + pass_name)
  }


  var dcl = pass_handlers[pass_name]

  var fn = dcl.fn;
  var deps = dcl.deps;

  var deps_values = getDepsValues(md, deps)

  var args = deps_values ? [data].concat(deps_values) : [data]

  var result = fn.apply(null, args)
  saveResult(md, dcl, result, data)
}

})
