import { useState, useRef, useEffect } from 'react';
import { Icons } from './constants';
import { AppState } from './types';

const MapArea = ({ appState, pickup, dropoff, onMapClick }) => {
  const [position, setPosition] = useState({ x: -500, y: -400 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef(null);
  const [driverPos, setDriverPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (appState === AppState.ON_TRIP) {
      const interval = setInterval(() => {
        setDriverPos((prev) => ({
          x: prev.x + (Math.random() - 0.5) * 2,
          y: prev.y + (Math.random() - 0.5) * 2,
        }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [appState]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden cursor-move bg-gray-200"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      onClick={(e) => {
        if (onMapClick && mapRef.current) {
          const rect = mapRef.current.getBoundingClientRect();
          const lat = ((e.clientY - rect.top) / rect.height) * 180 - 90;
          const lng = ((e.clientX - rect.left) / rect.width) * 360 - 180;
          onMapClick(lat, lng);
        }
      }}
    >
      <div
        ref={mapRef}
        className="map-pattern w-[2000px] h-[2000px] absolute transition-transform duration-75 ease-out"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center">
        {appState === AppState.CHOOSING_LOCATION && (
          <div className="mb-2 bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">Kéo bản đồ để chọn điểm đón</div>
        )}
        <div className="relative">
          <span className="absolute -inset-1 bg-blue-500 rounded-full opacity-30 animate-ping"></span>
          <Icons.MapPin className="w-10 h-10 text-blue-600 drop-shadow-xl" />
        </div>
        <div className="w-3 h-1 bg-black/30 rounded-full blur-[1px] mt-[-2px]"></div>
      </div>

      {dropoff && (
        <div
          className="absolute z-10 flex flex-col items-center transition-all duration-500"
          style={{ top: `calc(50% - 150px + ${position.y * 0.1}px)`, left: `calc(50% + 100px + ${position.x * 0.1}px)` }}
        >
          <div className="mb-1 bg-white border border-gray-200 text-xs font-bold px-2 py-1 rounded-md shadow-md text-gray-800 whitespace-nowrap">{dropoff.name}</div>
          <Icons.MapPin className="w-10 h-10 text-red-500 drop-shadow-md" />
        </div>
      )}

      {(appState === AppState.DRIVER_FOUND || appState === AppState.ON_TRIP) && (
        <div className="absolute z-20 transition-all duration-1000 ease-linear" style={{ top: `${driverPos.y}%`, left: `${driverPos.x}%` }}>
          <div className="bg-white p-1 rounded-full shadow-lg border border-gray-200">
            <Icons.Bike className="w-6 h-6 text-green-600" />
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button className="bg-white p-2 rounded-full shadow-lg text-gray-600 hover:text-blue-600 transition-colors">
          <Icons.Navigation className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default MapArea;
