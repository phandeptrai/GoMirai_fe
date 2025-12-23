import { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import useCurrentLocation from '../hooks/useCurrentLocation';

const MapboxMap = ({ 
  className = '', 
  height = '40vh',
  pickupMarker = null,
  destinationMarker = null,
  driverMarker = null, // Vị trí tài xế realtime
  routePolyline = null, // Polyline cho route
  onMapClick = null
}) => {
  const { location: currentLocation, loading: locationLoading } = useCurrentLocation();
  
  const [viewState, setViewState] = useState({
    latitude: 10.7769,
    longitude: 106.7009,
    zoom: 13,
  });

  const token = 'pk.eyJ1IjoicGhhbmRlcHRyYWkiLCJhIjoiY21pbDRwcDI1MTA2NzNkcTM0b2xlOHVodCJ9.xsAMbskqFIZLNvTzHGk3jw';

  // Set initial view to current location if available
  useEffect(() => {
    if (currentLocation && !pickupMarker) {
      setViewState(prev => ({
        ...prev,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        zoom: 15,
      }));
    }
  }, [currentLocation]);

  // Update view when markers change
  useEffect(() => {
    if (pickupMarker) {
      setViewState(prev => ({
        ...prev,
        latitude: pickupMarker.lat,
        longitude: pickupMarker.lng,
        zoom: 15,
      }));
    } else if (currentLocation && !destinationMarker && !driverMarker) {
      // If no pickupMarker but have currentLocation, center on it
      setViewState(prev => ({
        ...prev,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        zoom: 15,
      }));
    }
  }, [pickupMarker, currentLocation, destinationMarker, driverMarker]);

  useEffect(() => {
    if (destinationMarker && !pickupMarker) {
      setViewState(prev => ({
        ...prev,
        latitude: destinationMarker.lat,
        longitude: destinationMarker.lng,
        zoom: 15,
      }));
    }
  }, [destinationMarker]);

  if (!token) {
    return (
      <div className={`bg-gray-200 ${className}`} style={{ height, width: '100%' }}>
        <div className="flex items-center justify-center h-full text-gray-500">
          Thiếu Mapbox token
        </div>
      </div>
    );
  }

  const handleMapClick = (event) => {
    if (onMapClick) {
      onMapClick({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      });
    }
  };

  // Parse route polyline to GeoJSON format
  const routeGeoJSON = useMemo(() => {
    if (!routePolyline) return null;

    try {
      // If polyline is a string, try to parse as JSON first (GeoJSON)
      if (typeof routePolyline === 'string') {
        try {
          const parsed = JSON.parse(routePolyline);
          // If it's already a GeoJSON object
          if (parsed.type === 'LineString' || parsed.type === 'Feature') {
            return parsed.type === 'Feature' ? parsed : {
              type: 'Feature',
              geometry: parsed,
              properties: {}
            };
          }
          // If it's coordinates array
          if (Array.isArray(parsed) && parsed.length > 0) {
            return {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: parsed.map(coord => 
                  Array.isArray(coord) ? [coord[1], coord[0]] : [coord.longitude || coord.lng, coord.latitude || coord.lat]
                )
              },
              properties: {}
            };
          }
        } catch (e) {
          // Not JSON, might be encoded polyline - skip for now
          console.warn('Polyline is not JSON format:', e);
        }
      }
      
      // If polyline is an array of coordinates
      if (Array.isArray(routePolyline)) {
        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: routePolyline.map(coord => {
              // Handle different coordinate formats
              if (Array.isArray(coord)) {
                // Assume [lng, lat] format from Mapbox API
                // If it's [lat, lng], swap them
                if (coord.length >= 2) {
                  // Check if first value looks like latitude (usually -90 to 90)
                  const first = coord[0];
                  const second = coord[1];
                  if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
                    // First is lat, second is lng - swap to [lng, lat]
                    return [second, first];
                  }
                  // Already [lng, lat]
                  return [first, second];
                }
                return coord;
              }
              // Object with lat/lng or latitude/longitude
              const lng = coord.longitude || coord.lng;
              const lat = coord.latitude || coord.lat;
              if (lng !== undefined && lat !== undefined) {
                return [lng, lat];
              }
              return null;
            }).filter(coord => coord !== null)
          },
          properties: {}
        };
      }

      // If it's already a GeoJSON object
      if (routePolyline.type === 'LineString' || routePolyline.type === 'Feature') {
        return routePolyline.type === 'Feature' ? routePolyline : {
          type: 'Feature',
          geometry: routePolyline,
          properties: {}
        };
      }
    } catch (error) {
      console.warn('Error parsing route polyline:', error);
    }

    return null;
  }, [routePolyline]);

  // Update view to fit route bounds if route exists
  useEffect(() => {
    if (routeGeoJSON && routeGeoJSON.geometry && routeGeoJSON.geometry.coordinates) {
      const coordinates = routeGeoJSON.geometry.coordinates;
      if (coordinates.length > 0) {
        // Calculate bounds
        const lats = coordinates.map(coord => coord[1]);
        const lngs = coordinates.map(coord => coord[0]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        // Center map on route
        setViewState(prev => ({
          ...prev,
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          zoom: Math.max(prev.zoom || 13, 12),
        }));
      }
    }
  }, [routeGeoJSON]);

  return (
    <div className={`relative ${className}`} style={{ height, width: '100%' }}>
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapboxAccessToken={token}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Route polyline */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#3b82f6',
                'line-width': 4,
                'line-opacity': 0.7
              }}
            />
          </Source>
        )}
        
        {pickupMarker && (
          <Marker 
            latitude={pickupMarker.lat} 
            longitude={pickupMarker.lng} 
            color="#3b82f6"
          />
        )}
        {destinationMarker && (
          <Marker 
            latitude={destinationMarker.lat} 
            longitude={destinationMarker.lng} 
            color="#ef4444"
          />
        )}
        {driverMarker && (
          <Marker 
            latitude={driverMarker.lat} 
            longitude={driverMarker.lng} 
            color="#10b981"
          />
        )}
        {!pickupMarker && !destinationMarker && !driverMarker && currentLocation && (
          <Marker 
            latitude={currentLocation.lat} 
            longitude={currentLocation.lng} 
            color="#0ba360" 
          />
        )}
        {!pickupMarker && !destinationMarker && !driverMarker && !currentLocation && (
          <Marker latitude={10.7769} longitude={106.7009} color="#0ba360" />
        )}
      </Map>
    </div>
  );
};

export default MapboxMap;

