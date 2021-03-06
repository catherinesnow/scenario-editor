import dbg from 'debug'

const debug = dbg('scenario-editor:reducers')

function createInitialState () {
  return {
    activeModification: null,
    bundles: [],
    bundlesById: {},
    currentBundle: null,
    currentScenario: null,
    feeds: [],
    feedsById: {},
    modifications: [],
    modificationsById: {},
    modificationsByType: {},
    scenarios: [],
    scenariosById: {},
    variants: []
  }
}

export const reducers = {
  'delete bundle' (state, action) {
    const id = action.payload
    const bundles = state.bundles.filter((b) => b.id !== id)
    return {
      ...state,
      bundles,
      bundlesById: arrayToObj(bundles)
    }
  },
  'log out' (state, action) {
    return createInitialState()
  },
  'set modifications' (state, action) {
    const modifications = action.payload
    return {
      ...state,
      modifications,
      modificationsById: arrayToObj(modifications),
      modificationsByType: organizeByType(modifications)
    }
  },
  'set scenario' (state, action) {
    const currentScenario = {...action.payload}
    const scenariosById = {...state.scenariosById}
    scenariosById[currentScenario.id] = currentScenario
    return {
      ...state,
      currentBundle: state.bundlesById[currentScenario.bundleId],
      currentScenario,
      scenarios: Object.values(scenariosById),
      scenariosById,
      variants: currentScenario.variants || []
    }
  },
  /** add a newly created scenario to the state */
  'add scenario' (state, action) {
    let scenarios = [...state.scenarios, action.payload]

    return {
      ...state,
      scenarios,
      scenariosById: arrayToObj(scenarios)
    }
  },
  'set feeds' (state, action) {
    const feeds = action.payload || []
    return {
      ...state,
      feeds: [...feeds],
      feedsById: arrayToObj(feeds)
    }
  },
  'set bundle' (state, action) {
    const id = action.payload
    return {
      ...state,
      currentBundle: state.bundlesById[id],
      currentScenario: {
        ...state.currentScenario,
        bundleId: id
      }
    }
  },
  'set bundles' (state, action) {
    const bundles = [...action.payload]
    const bundlesById = arrayToObj(bundles)
    let currentBundle = null
    if (state.currentScenario && state.currentScenario.bundleId) {
      currentBundle = bundlesById[state.currentScenario.bundleId]
    }
    return {
      ...state,
      bundles,
      bundlesById,
      currentBundle
    }
  },
  'add bundle' (state, action) {
    const bundles = [...state.bundles, action.payload]
    const bundlesById = arrayToObj(bundles)
    return {
      ...state,
      bundles,
      bundlesById
    }
  },
  'set active modification' (state, action) {
    const modification = action.payload
    const isNotCurrentlyActive = !state.activeModification || !state.activeModification.id || state.activeModification.id !== modification.id
    if (isNotCurrentlyActive) {
      return {
        ...state,
        activeModification: {...modification}
      }
    } else {
      return state
    }
  },
  'set modification' (state, action) {
    const modification = {...action.payload}
    const modificationsById = {...state.modificationsById}
    modificationsById[modification.id] = modification
    const modifications = Object.values(modificationsById)
    return {
      ...state,
      modifications,
      modificationsById,
      modificationsByType: organizeByType(modifications)
    }
  },
  'delete modification' (state, action) {
    const modificationId = action.payload
    const modificationsById = {...state.modificationsById}
    delete modificationsById[modificationId]

    let activeModification = state.activeModification
    if (activeModification && activeModification.id === modificationId) {
      activeModification = null
    }

    const modifications = Object.values(modificationsById)
    return {
      ...state,
      activeModification,
      modifications,
      modificationsById,
      modificationsByType: organizeByType(modifications)
    }
  },
  'set scenarios' (state, action) {
    const scenarios = action.payload
    return {
      ...state,
      scenarios,
      scenariosById: arrayToObj(scenarios)
    }
  },
  'create variant' (state, action) {
    return {
      ...state,
      variants: [
        ...state.variants,
        action.payload
      ]
    }
  },
  'expand variant' (state, action) {
    const index = action.payload
    const modifications = state.modifications.map((modification) => {
      return {
        ...modification,
        expanded: modification.variants[index]
      }
    })
    return {
      ...state,
      modifications,
      modificationsById: arrayToObj(modifications),
      modificationsByType: organizeByType(modifications)
    }
  },
  'show variant' (state, action) {
    const index = action.payload
    const modifications = state.modifications.map((modification) => {
      return {
        ...modification,
        showOnMap: modification.variants[index]
      }
    })
    return {
      ...state,
      modifications,
      modificationsById: arrayToObj(modifications),
      modificationsByType: organizeByType(modifications)
    }
  },
  'update variant' (state, action) {
    const variants = [...state.variants]
    state.variants[action.payload.index] = action.payload.value
    return {
      ...state,
      variants
    }
  },
  'update variants' (state, action) {
    if (action.payload == null || action.payload.length === 0) {
      debug('Attempt to set null variants, ignoring') // TODO: seems like this shouldn't ever occur?
      return state
    }
    return {
      ...state,
      variants: [...action.payload]
    }
  }
}

function arrayToObj (a) {
  const obj = {}
  for (let i = 0; i < a.length; i++) obj[a[i].id] = a[i]
  return obj
}

function organizeByType (modifications) {
  return modifications.reduce((modifications, modification) => {
    const {type} = modification
    if (!modifications[type]) modifications[type] = []
    modifications[type].push(modification)
    return modifications
  }, {})
}

export const initialState = createInitialState()
