/** Select a (group of) patterns from the GTFS feed */

import React, {Component, PropTypes} from 'react'

import SelectPatterns from './select-patterns'
import SelectFeedAndRoutes from './select-feed-and-routes'

export default class SelectFeedRouteAndPatterns extends Component {
  static propTypes = {
    feeds: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    routes: PropTypes.array,
    selectedFeed: PropTypes.object,
    trips: PropTypes.array // trips can be null indicating a wildcard
  }

  selectTrips = ({ patterns, trips }) => {
    let { selectedFeed, routes } = this.props
    this.props.onChange({ feed: selectedFeed.id, routes, trips })
  }

  selectFeedAndRoutes = ({
    feed,
    routes
  }) => {
    this.props.onChange({ routes, feed, trips: null })
  }

  render () {
    const {selectedFeed, feeds, routes, trips} = this.props
    const routePatterns = selectedFeed && routes && routes.length === 1
      ? selectedFeed.routesById[routes[0]].patterns
      : false
    return (
      <div>
        <SelectFeedAndRoutes
          feeds={feeds}
          onChange={this.selectFeedAndRoutes}
          selectedFeed={selectedFeed}
          selectedRouteId={routes && routes[0]}
          />

        {routePatterns &&
          <SelectPatterns
            onChange={this.selectTrips}
            routePatterns={routePatterns}
            trips={trips}
            />
        }
      </div>
    )
  }
}
