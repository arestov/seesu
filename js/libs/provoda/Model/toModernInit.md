# RULE: if model has modern init then legacy init should be skipped


## LEGACY

init by
  - url
  - network
  - manual `new`/initSi/initChi invoke

params
  - parsed url params
  - some legacy init params

states by
  - url states
  - network states
  - legacy complex init


## NEW

modern init accept
  - head info
  - url params
  - states (network + url + head info)
  - nestings

```
{
  head: {},
  states: {},
  nestings: {},
  url_params: {},
}
```

## CHECK INVOKE FROM
  - loadable list
  - BrowseMap/routing
  - pass


## todo
  refactor network_data_as_states, nest_rq_split
