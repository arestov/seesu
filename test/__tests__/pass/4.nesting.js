// 5. один результат,
// адресат результата nesting определен любым способом типа записи nesting,
// обычное указание адресата
// a - передача nesting

/*
  инициализировать /playlists/1
  добавть Song в /playlists/1 в songs_list
*/


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

test('special nestings by pass calculated', t => {
  const app = setup()
  const steps = makeStepsRunner(app)
  const getData = item => {
    if (!item) {
      return {}
    }

    return {
      artist: pvState(item, 'artist'),
      title: pvState(item, 'title'),
    }
  }
  const getListItem = (num, plnum = 0) => {
    const list = getNesting(
      getNesting(app.start_page, 'all_playlists')[plnum],
      'songs_list',
    ) || []

    if (num == null) {
      return list
    }

    return getData(list[num])
  }

  return steps([
    () => {
      t.deepEqual(
        {},
        getListItem(0),
      )
      pvPass(app.start_page, 'addToStart', {
        states: {
          artist: 'Cloudy beasts',
          title: '1st added to start',
        },
      })
      pvPass(app.start_page, 'addToStart', {
        states: {
          artist: 'Cloudy beasts',
          title: '2nd added to start',
        },
      })
      pvPass(app.start_page, 'addToStart', {
        states: {
          artist: 'Cloudy beasts',
          title: '3rd added to start',
        },
      })
    },
    () => {
      t.deepEqual(
        {
          artist: 'Cloudy beasts',
          title: '3rd added to start',
        },
        getListItem(0),
        'should be 1st from start',
      )
      t.deepEqual(
        {
          artist: 'Cloudy beasts',
          title: '2nd added to start',
        },
        getListItem(1),
        'should be 2nd from start',
      )
      t.deepEqual(
        {
          artist: 'Cloudy beasts',
          title: '1st added to start',
        },
        getListItem(2),
        'should be 3rd from start',
      )
    },

    () => {
      pvPass(app.start_page, 'addToEnd', {
        states: {
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
        },
        getListItem(3),
        'should add to end',
      )
    },

    () => {
      // add at index
      pvPass(app.start_page, 'addToIndex', [
        1,
        {
          states: {
            artist: 'Cloudy beasts',
            title: 'added to index 1',
          },
        },
      ])
    },
    () => {
      t.deepEqual(
        {
          artist: 'Cloudy beasts',
          title: 'added to index 1',
        },
        getListItem(1),
        'should be 2d from start',
      )
    },

    () => {
      // replace at index
      pvPass(app.start_page, 'replace', [
        1,
        {
          states: {
            artist: 'Cloudy beasts',
            title: 'replaced at index 1',
          },
        },
      ])
    },
    () => {
      t.deepEqual(
        {
          artist: 'Cloudy beasts',
          title: 'replaced at index 1',
        },
        getListItem(1),
      )
      t.deepEqual(
        {
          artist: 'Cloudy beasts',
          title: '2nd added to start',
        },
        getListItem(2),
        'should be 3rd from start',
      )
    },

    () => {
      // set one
      pvPass(app.start_page, 'setOne', {
        states: {
          artist: 'Cloudy beasts',
          title: 'just one',
        },
      })
    },
    () => {
      const item = getListItem(null, 1)
      t.is(false, Array.isArray(item), 'nesting should not be array')

      t.deepEqual(
        {
          artist: 'Cloudy beasts',
          title: 'just one',
        },
        getData(item),
        'should be just one item instead of list',
      )

      pvPass(app.start_page, 'setOne', {
        states: {
          artist: 'Cloudy beasts',
          title: 'another one',
        },
      })
    },
    () => {
      const item = getListItem(null, 1)
      t.is(false, Array.isArray(item), 'nesting should not be array')

      t.deepEqual(
        {
          artist: 'Cloudy beasts',
          title: 'another one',
        },
        getData(item),
        'should be just one item instead of list',
      )
    },
  ])

  function setup() {
    const Song = createDeepChild('Song')
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
          addToStart: createAction('at_start'),
          addToEnd: createAction('at_end'),
          addToIndex: createAction('at_index'),
          replace: createAction('replace'),
          setOne: createAction('set_one', 2),
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
