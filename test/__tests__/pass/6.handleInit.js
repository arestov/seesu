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

test('auto dispatch and handle `handleInit` pass', t => {
  const app = setup()
  const steps = makeStepsRunner(app)
  const getData = (item, keys = ['artist', 'title']) => {
    if (!item) {
      return {}
    }

    return keys.reduce((acc, key) => ({
      ...acc,
      [key]: pvState(item, key),
    }), {})
  }

  const getSong = (num, plnum = 0) => {
    const list = getNesting(
      getNesting(app.start_page, 'all_playlists')[plnum],
      'songs_list',
    ) || []

    if (num == null) {
      return list
    }

    return list[num]
  }

  const getListItem = (num, plnum = 0) => getData(getSong(num, plnum))

  return steps([
    () => {
      t.deepEqual(
        {},
        getListItem(0),
      )
    },
    () => {
      pvPass(app.start_page, 'addToEnd', {
        states: {
          crazy_state: 'new york value',
          artist: 'Cloudy beasts',
          title: 'added to end',
        },
      })
    },
    () => {
      t.deepEqual(
        {
          artist: 'Cloudy beasts',
          title: 'added to end',
          crazy_state: 'new york value',
          special_prop: 'new york value',
        },
        getData(getSong(0), ['artist', 'title', 'crazy_state', 'special_prop']),
        'should add proper states to song of songs_list',
      )
    },
  ])

  function setup() {
    const Song = createDeepChild('Song', {
      '+passes': {
        handleInit: {
          to: ['< special_prop'],
          fn: [
            [],
            ({ states }) => states.crazy_state,
          ],
        },
      },
    })
    const Playlist = createDeepChild('playlist', {
      'nest_rqc-songs_list': Song,

    })

    const createAction = (method, id = 1) => ({
      to: [`songs_list < /playlists/${id}/ < #`, {
        method,
        // 'at_start' || 'at_end' || 'set_one' || 'replace' || 'at_index' || 'move_to',
        // model: Song,
      }],
      fn: [
        [],
        data => data,
      ],
    })

    const app = init({
      'chi-start__page': createDeepChild('start', {
        model_name: 'startModel',
        '+nests': {
          all_playlists: ['nest', [['playlists/1', 'playlists/2']]],
        },
        '+passes': {
          addToEnd: createAction('at_end'),
        },
        sub_pager: {
          type: {
            playlists: 'playlist',
          },
          by_type: {
            playlist: {
              head: {
                id: 'by_slash.0',
              },
              title: [[]],
              constr: Playlist,
            },
          },
        },
      }),
    }, self => {
      self.start_page = self.initChi('start__page') // eslint-disable-line
    }).app_model

    return app
  }
})
