import { useState, useEffect, useRef } from 'react';
import { mapAPI } from '../api/map.api';
import './LocationInput.css';

const LocationInput = ({ 
  value, 
  onChange, 
  placeholder, 
  iconColor = '#3b82f6',
  onLocationSelect,
  currentLocation = null,
  onEnter = null, // optional: handle Enter key
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e) => {
    const query = e.target.value;
    onChange(query);

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Tạm thời gọi trực tiếp Mapbox API để tránh lỗi authentication
      const mapboxToken = 'pk.eyJ1IjoicGhhbmRlcHRyYWkiLCJhIjoiY21pbDRwcDI1MTA2NzNkcTM0b2xlOHVodCJ9.xsAMbskqFIZLNvTzHGk3jw';
      const proximity = currentLocation 
        ? `${currentLocation.lng},${currentLocation.lat}` 
        : '106.7009,10.7769';
      
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&limit=5&proximity=${proximity}&country=VN`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const results = data.features.map((feature) => ({
          id: feature.id,
          name: feature.text || feature.place_name,
          address: feature.place_name,
          location: {
            latitude: feature.center[1],
            longitude: feature.center[0],
          },
        }));
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setSuggestions([]);
      // Không redirect về login, chỉ log lỗi
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (place) => {
    onChange(place.address || place.name);
    setShowSuggestions(false);
    if (onLocationSelect) {
      onLocationSelect({
        name: place.name,
        address: place.address,
        lat: place.location.latitude,
        lng: place.location.longitude,
      });
    }
  };

  return (
    <div className="location-input-container">
      <div className="location-input-wrapper">
        <div 
          className="location-input-icon" 
          style={{ backgroundColor: iconColor }}
        ></div>
        <input
          ref={inputRef}
          type="text"
          className="location-input"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length >= 2 && setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onEnter) {
              e.preventDefault();
              onEnter();
            }
          }}
          placeholder={placeholder}
        />
        {isLoading && (
          <div className="location-input-loading">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="location-suggestions">
          {suggestions.map((place, index) => (
            <div
              key={place.id || index}
              className="location-suggestion-item"
              onClick={() => handleSelectSuggestion(place)}
            >
              <div className="suggestion-icon">📍</div>
              <div className="suggestion-content">
                <div className="suggestion-name">{place.name}</div>
                <div className="suggestion-address">{place.address}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;

