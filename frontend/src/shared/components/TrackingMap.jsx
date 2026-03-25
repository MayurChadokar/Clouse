import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '24px'
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    {
      "featureType": "all",
      "elementType": "geometry.fill",
      "stylers": [{ "weight": "2.00" }]
    },
    {
      "featureType": "all",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#9c9c9c" }]
    },
    {
      "featureType": "all",
      "elementType": "labels.text",
      "stylers": [{ "visibility": "on" }]
    },
    {
      "featureType": "landscape",
      "elementType": "all",
      "stylers": [{ "color": "#f2f2f2" }]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#ffffff" }]
    },
    {
      "featureType": "landscape.man_made",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#ffffff" }]
    },
    {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "road",
      "elementType": "all",
      "stylers": [{ "saturation": -100 }, { "lightness": 45 }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#eeeeee" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#7b7b7b" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#ffffff" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "all",
      "stylers": [{ "visibility": "simplified" }]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.icon",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "transit",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "water",
      "elementType": "all",
      "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#c8d7d4" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#070707" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#ffffff" }]
    }
  ]
};

// Icons with high-quality PNGs
const ICONS = {
  rider: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
  customer: "https://cdn-icons-png.flaticon.com/512/1275/1275210.png",
  vendor: "https://cdn-icons-png.flaticon.com/512/606/606363.png"
};

const TrackingMap = ({ 
  deliveryLocation, // { lat, lng }
  customerLocation, // { lat, lng }
  vendorLocation,   // { lat, lng }
  path = [],        // Array of { lat, lng }
  followMode = true 
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(deliveryLocation || customerLocation || { lat: 20.5937, lng: 78.9629 });

  const onLoad = useCallback(function callback(map) {
    setMap(map);
    
    // Fit bounds if we have both points
    if (deliveryLocation && (customerLocation || vendorLocation)) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(deliveryLocation);
      if (customerLocation) bounds.extend(customerLocation);
      if (vendorLocation) bounds.extend(vendorLocation);
      map.fitBounds(bounds, 50); // 50px padding
    }
  }, [deliveryLocation, customerLocation, vendorLocation]);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  useEffect(() => {
    if (followMode && deliveryLocation && map) {
      setCenter(deliveryLocation);
    }
  }, [deliveryLocation, followMode, map]);

  if (!isLoaded) return (
    <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center gap-3">
       <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Satellite Data...</span>
    </div>
  );

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {/* Path Line */}
      {path.length > 1 && (
        <Polyline
          path={path}
          options={{
            strokeColor: "#6366f1",
            strokeOpacity: 0.8,
            strokeWeight: 4,
            geodesic: true,
          }}
        />
      )}

      {/* Delivery Boy Marker */}
      {deliveryLocation && (
        <Marker
          position={deliveryLocation}
          title="Delivery Partner"
          icon={{
            url: ICONS.rider,
            scaledSize: new window.google.maps.Size(46, 46),
            anchor: new window.google.maps.Point(23, 23)
          }}
        />
      )}

      {/* Customer Marker */}
      {customerLocation && (
        <Marker
          position={customerLocation}
          title="Your Location"
          icon={{
            url: ICONS.customer,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20)
          }}
        />
      )}

      {/* Vendor Marker */}
      {vendorLocation && (
        <Marker
          position={vendorLocation}
          title="Store Location"
          icon={{
            url: ICONS.vendor,
            scaledSize: new window.google.maps.Size(35, 35),
            anchor: new window.google.maps.Point(17, 17)
          }}
        />
      )}
    </GoogleMap>
  );
};

export default React.memo(TrackingMap);
