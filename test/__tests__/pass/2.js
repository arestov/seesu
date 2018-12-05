// 2. множественный результат, адресат результатов определен, обычное указание адресата

// a - передача state
// b - передача nestings

const action = {
  to: {
    way1: [
      'selected',
    ],
    way2: [
      '< title < target_child.indie',
    ],
    way3: [
      'skip_this_state',
    ],
  },
  fn() {
    return {
      way1: true, // Исполнитель должен проверить hasOwnProperty()
      way2: 'Michael Jackson',
      // way3 - 3. множественный результат - ответ пропускается

    }
  },
}


const test = require('ava')

const requirejs = require('../../../requirejs-config')

const spv = requirejs('spv')
const Model = requirejs('pv/Model')
const pvState = requirejs('pv/state')
const pvPass = requirejs('pv/pass')
const pvUpdate = requirejs('pv/update')
const getNesting = requirejs('pv/getNesting')

const init = requirejs('test/init')
const makeStepsRunner = require('../../steps')

const mdl = props => spv.inh(Model, {}, props)
const createDeepChild = (num, props) => mdl({
  '+states': {
    desc: [
      'compx',
      [],
      () => `DeepChild${num}`,
    ],
  },
  ...props,
})

test('multiple state by pass calculated', t => {
  const app = setup()
  const steps = makeStepsRunner(app)

  return steps([
    () => {
      pvUpdate(app.start_page, 'skip_this_state', 'untouched')
      pvPass(app.start_page, 'action', 13)
    },
    () => {
      t.is(
        true,
        pvState(app.start_page, 'selected'),
      )
      t.is(
        'untouched',
        pvState(app.start_page, 'skip_this_state'),
      )

      t.is(
        'Michael Jackson',
        pvState(
          getNesting(getNesting(app.start_page, 'target_child'), 'indie'),
          'title',
        ),
      )
    },
  ])

  function setup() {
    const TargetChild = mdl({
      '+nests': {
        indie: [
          'nest', [createDeepChild('indie')],
        ],
        list: [
          'nest', [[createDeepChild(1), createDeepChild(2)]],
        ],
        calculated_child: [
          'compx',
          ['number <<< #', 'nickname <<< ^', '<< indie', '<< list'],
          (num, nickname, indie_value, list) => {
            if (num === 100) {
              return list.slice(0, 1)
            }

            if (nickname === 'smith') {
              return indie_value
            }

            return list
          },
        ],
      },
    })

    const app = init({
      'chi-start__page': createDeepChild('start', {
        model_name: 'startModel',
        '+nests': {
          target_child: ['nest', [TargetChild]],
        },
        '+passes': {
          action,
        },
      }),
    }, self => {
      self.start_page = self.initChi('start__page') // eslint-disable-line
    }).app_model

    return app
  }
})
