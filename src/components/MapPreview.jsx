import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapPreview = ({
  latitude = 10.7769,
  longitude = 106.7009,
  title = 'Bản đồ',
  className,
  showHeader = true,
  height = 256,
}) => {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const containerClass = className || 'ui-card space-y-3';

  if (!token) {
    return (
      <div className={containerClass}>
        <p className="text-sm text-red-600 font-semibold">Thiếu VITE_MAPBOX_TOKEN trong môi trường.</p>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="section-title m-0">{title}</h2>
          <span className="text-xs text-gray-500">Mapbox</span>
        </div>
      )}
      <div className="overflow-hidden rounded-xl" style={{ height }}>
        <Map
          mapboxAccessToken={token}
          initialViewState={{ latitude, longitude, zoom: 13 }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
        >
          <Marker latitude={latitude} longitude={longitude} color="#009b77" />
        </Map>
      </div>
    </div>
  );
};

export default MapPreview;




