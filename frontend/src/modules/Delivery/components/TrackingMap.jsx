import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

const TrackingMap = ({ 
  deliveryLocation, // { lat, lng }
  customerLocation, // { lat, lng }
  vendorLocation,   // { lat, lng }
  followMode = true 
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY_HERE"
  });

  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(deliveryLocation || customerLocation || { lat: 20.5937, lng: 78.9629 });

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  useEffect(() => {
    if (followMode && deliveryLocation && map) {
      setCenter(deliveryLocation);
    }
  }, [deliveryLocation, followMode, map]);

  if (!isLoaded) return <div className="animate-pulse bg-gray-200 h-full w-full rounded-lg flex items-center justify-center">Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {/* Delivery Boy Marker */}
      {deliveryLocation && (
        <Marker
          position={deliveryLocation}
          title="Delivery Partner"
          icon={{
            url: "https://maps.google.com/mapfiles/ms/icons/cycling.png", // Or a custom motorbike icon
            scaledSize: new window.google.maps.Size(40, 40)
          }}
        />
      )}

      {/* Customer Marker */}
      {customerLocation && (
        <Marker
          position={customerLocation}
          title="Your Location"
          icon={{
            url: "https://maps.google.com/mapfiles/ms/icons/red-pushpin.png",
            scaledSize: new window.google.maps.Size(40, 40)
          }}
        />
      )}

      {/* Vendor Marker */}
      {vendorLocation && (
        <Marker
          position={vendorLocation}
          title="Store Location"
          icon={{
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: new window.google.maps.Size(30, 30)
          }}
        />
      )}
    </GoogleMap>
  );
};

export default React.memo(TrackingMap);
