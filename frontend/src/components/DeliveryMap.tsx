"use client";

import { useEffect, useRef, useState } from "react";

interface DeliveryMapProps {
  deliveryLat: number;
  deliveryLng: number;
  areaName: string;
}

const MAPS_API_KEY = process.env.NEXT_PUBLIC_MAPS_API_KEY;

if (!MAPS_API_KEY) {
  throw new Error('NEXT_PUBLIC_MAPS_API_KEY environment variable is not set');
}

export const DeliveryMap: React.FC<DeliveryMapProps> = ({ deliveryLat, deliveryLng, areaName }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get device current location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by this browser");
      // Fallback to Bangalore center
      setCurrentLocation({ lat: 12.9716, lng: 77.5946 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocationError("Location access denied – using Bangalore center");
        setCurrentLocation({ lat: 12.9716, lng: 77.5946 });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (mapLoaded) return;
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).google) {
      setMapLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, [mapLoaded]);

  // Render map once both location and script are ready
  useEffect(() => {
    if (!mapLoaded || !currentLocation || !mapRef.current) return;

    const google = (window as unknown as Record<string, any>).google; // eslint-disable-line
    if (!google?.maps) return;

    const bounds = new google.maps.LatLngBounds();
    const currentPos = new google.maps.LatLng(currentLocation.lat, currentLocation.lng);
    const deliveryPos = new google.maps.LatLng(deliveryLat, deliveryLng);

    bounds.extend(currentPos);
    bounds.extend(deliveryPos);

    const map = new google.maps.Map(mapRef.current, {
      zoom: 13,
      center: bounds.getCenter(),
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8888aa" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a4a" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e1e3a" }] },
        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6c7b95" }] },
      ],
    });

    map.fitBounds(bounds, 60);

    // Current location marker (blue)
    new google.maps.Marker({
      position: currentPos,
      map,
      title: "Your Location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#6366f1",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
        scale: 10,
      },
    });

    // Delivery location marker (green)
    new google.maps.Marker({
      position: deliveryPos,
      map,
      title: `Delivery: ${areaName}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#22c55e",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
        scale: 10,
      },
    });

    // Draw a line between current and delivery
    new google.maps.Polyline({
      path: [currentPos, deliveryPos],
      geodesic: true,
      strokeColor: "#818cf8",
      strokeOpacity: 0.7,
      strokeWeight: 3,
      map,
    });

    // Info windows
    const currentInfo = new google.maps.InfoWindow({ content: "<b style='color:#333'>📍 You</b>" });
    const deliveryInfo = new google.maps.InfoWindow({ content: `<b style='color:#333'>🏠 ${areaName}</b>` });
    currentInfo.open(map, map.markers?.[0]);
    deliveryInfo.open(map, map.markers?.[1]);

  }, [mapLoaded, currentLocation, deliveryLat, deliveryLng, areaName]);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10">
      {locationError && (
        <p className="px-4 py-2 text-xs text-amber-400 bg-amber-500/10">{locationError}</p>
      )}
      <div className="flex items-center gap-4 px-4 py-3 bg-white/5">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#6366f1" }} /> You
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#22c55e" }} /> Delivery
        </span>
      </div>
      <div ref={mapRef} style={{ width: "100%", height: "280px" }} />
    </div>
  );
};
