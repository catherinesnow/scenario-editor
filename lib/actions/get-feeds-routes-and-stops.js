/** use the graphql api to get data needed for modifications */

import {setFeeds} from './'
import {serverAction} from './network'
import * as query from '../graphql/query'
import * as types from '../utils/modification-types'

let currentBundleId = null // TODO this should be handled more gracefully
let fetchedFeeds = null

export default function getFeedsRoutesAndStops ({
  bundleId,
  forceCompleteUpdate = false,
  modifications = []
}) {
  const routeIds = getUniqueRouteIdsFromModifications(modifications)
  const shouldGetAllRoutesAndStops = forceCompleteUpdate || bundleId !== currentBundleId || Object.keys(fetchedFeeds || {}).length === 0
  currentBundleId = bundleId
  if (shouldGetAllRoutesAndStops) {
    return getAllRoutesAndStops({bundleId, routeIds})
  } else {
    return getUnfetchedRoutes({bundleId, routeIds})
  }
}

function getAllRoutesAndStops ({
  bundleId,
  routeIds
}) {
  return serverAction({
    url: query.compose(query.data, {bundleId, routeIds}),
    next: async (response) => {
      const json = await response.json()

      // make sure the bundle ID hasn't changed in the meantime from a concurrent request
      if (bundleId === currentBundleId) {
        fetchedFeeds = []
        if (json.bundle && json.bundle.length > 0) {
          json.bundle[0].feeds.forEach((feed) => {
            let {checksum, detailRoutes, feed_id, routes, stops} = feed
            routes = routes.map(labelRoute)
            detailRoutes = detailRoutes.map(labelRoute)

            const routesById = {}
            const addToRoutes = (route) => { routesById[route.route_id] = route }
            routes.forEach(addToRoutes)
            // detailRoutes will overwrite less detailed routes
            detailRoutes.forEach(addToRoutes)

            const stopsById = {}
            stops.forEach((stop) => { stopsById[stop.stop_id] = stop })
            fetchedFeeds.push({
              id: feed_id,
              routes: Object.values((routesById)).sort(routeSorter),
              routesById,
              stops,
              stopsById,
              checksum
            })
          })
        }

        return setFeeds(fetchedFeeds)
      }
    }
  })
}

function getUnfetchedRoutes ({
  bundleId,
  routeIds
}) {
  // partial fetch, fetch only routes that are not already fetched.
  const unfetchedRouteIds = getUnfetchedRouteIds({fetchedFeeds, routeIds})
  // no routes found that haven't been fetched
  if (unfetchedRouteIds.length > 0) {
    return serverAction({
      url: query.compose(query.route, {bundleId, routeIds}),
      next: async (response) => {
        const json = await response.json()
        // if another request has changed the bundle out from under us, bail
        if (bundleId === currentBundleId) {
          if (json.bundle && json.bundle.length > 0) {
            json.bundle[0].feeds.forEach((feed) => {
              const fetchedFeed = fetchedFeeds.find((f) => f.id === feed.feed_id)
              feed.routes.forEach((route) => {
                fetchedFeed.routesById[route.route_id] = labelRoute(route)
              })
              fetchedFeed.routes = Object.values(fetchedFeed.routesById).sort(routeSorter)
            })

            return setFeeds(fetchedFeeds)
          } else {
            console.error('No bundles were returned.')
            window.alert('No bundles were returned.')
          }
        }
      }
    })
  }
}

function labelRoute (r) {
  r.label = getRouteLabel(r)
  return r
}

function getRouteLabel (r) {
  return (r.route_short_name ? r.route_short_name + ' ' : '') + (r.route_long_name ? r.route_long_name : '')
}

function routeSorter (r0, r1) {
  const name0 = r0.route_short_name ? r0.route_short_name : r0.route_long_name
  const name1 = r1.route_short_name ? r1.route_short_name : r1.route_long_name

  // if name0 is e.g. 35 Mountain View Transit Center, parseInt will return 35, stripping the text
  const num0 = parseInt(name0, 10)
  const num1 = parseInt(name1, 10)

  if (!isNaN(num0) && !isNaN(num1)) return num0 - num1
  // numbers before letters
  else if (!isNaN(num0) && isNaN(num1)) return -1
  else if (isNaN(num0) && !isNaN(num1)) return 1

  // no numbers, sort by name
  else if (name0 < name1) return -1
  else if (name0 === name1) return 0
  else return 1
}

function getUniqueRouteIdsFromModifications (modifications) { // TODO: this can be done at the reducer
  // for every route referenced in the scenario we get the patterns
  const routes = new Set()
  for (const modification of modifications) {
    if (modification.type === types.REMOVE_TRIPS ||
      modification.type === types.REMOVE_STOPS ||
      modification.type === types.ADJUST_SPEED ||
      modification.type === types.ADJUST_DWELL_TIME ||
      modification.type === types.CONVERT_TO_FREQUENCY ||
      modification.type === types.ADD_STOPS) {
      // NB we are in fact getting all routes in every feed that have this route ID, which means we're pulling down a bit more data than we need to but it's pretty benign
      if (modification.routes !== null) modification.routes.forEach((r) => routes.add(r))
    }
  }
  return [...routes]
}

function getUnfetchedRouteIds ({
  fetchedFeeds,
  routeIds
}) {
  return routeIds.filter((r) => {
    return Object.values(fetchedFeeds).find((feed) => {
      return feed.routesById[r] && feed.routesById[r].patterns != null
    }) == null
  })
}
