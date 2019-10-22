define(function(require) {
'use strict';
var spv = require('spv')
var pvUpdate = require('../../provoda/update')
var pvState = require('../../provoda/state')
var getNesting = require('../../provoda/getNesting')

var updateNesting = require('../../provoda/updateNesting')
var mreadDepValue = require('../../utils/readDepValue')
var readDepValue = mreadDepValue.depValue
var getModels = require('../../utils/multiPath/getModels')
var getValues = require('../../utils/multiPath/getValues')
var getModelById = require('../../utils/getModelById');

var prepareNestingValue = require('./act/prepareNestingValue')
var getTargetModels = require('./act/getTargetModels')
var prepareResults = require('./act/prepareResults')
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

var saveToDestModel = function(current_motivator, exec_item) {
  if (!current_motivator) {
    throw new Error('should be current_motivator')
  }
  // md, target, value
  var target_md = exec_item.target_md
  var value = exec_item.value
  var target = exec_item.target

  var multi_path = target.target_path

  switch (multi_path.result_type) {
    case "nesting": {
      updateNesting(
        target_md,
        multi_path.nesting.target_nest_name,
        value
      )
    }
    case "state": {
      pvUpdate(target_md, multi_path.state.base, value)
    }
  }
}

var saveByProvodaId = function(current_motivator, md, target, wrap) {
  if (!current_motivator) {
    throw new Error('should be current_motivator')
  }

  for (var id in wrap) {
    if (!wrap.hasOwnProperty(id)) {
      continue;
    }
    var data = wrap[id]
    var model = getModelById(md, id)
    var states = data.states
    var nestings = data.nestings

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


var saveResultToTarget = function(current_motivator, exec_item) {
  var target = exec_item.target
  if (target.path_type == 'by_provoda_id') {
    saveByProvodaId(current_motivator, exec_item.md, target, exec_item.value)
    return
  }

  saveToDestModel(current_motivator, exec_item)
}

var saveResult = function (md, dcl, value, data) {
  var current_motivator = md._currentMotivator()
  var semi_result = prepareResults(md, dcl, value, data)

  for (var i = 0; i < semi_result.length; i++) {
    saveResultToTarget(current_motivator, semi_result[i])
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
