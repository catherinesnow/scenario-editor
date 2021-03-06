import React from 'react'
import {GeoJson} from 'react-leaflet'

export const Patterns = ({
  color,
  patterns
}) => {
  const geometry = {
    type: 'FeatureCollection',
    features: patterns.map((pat) => {
      return {
        type: 'Feature',
        geometry: pat.geometry
      }
    })
  }

  return <GeoJson
    data={geometry}
    color={color}
    weight={3}
    />
}
