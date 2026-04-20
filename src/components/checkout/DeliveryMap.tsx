"use client";

import React, { useEffect, useState, useCallback, memo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

interface DeliveryMapProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  center?: [number, number];
}

const MapEvents = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const ChangeView = ({ center, setMarkerPos }: { center: [number, number], setMarkerPos: (pos: [number, number]) => void }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16, { animate: true });
    setMarkerPos(center); // Synchronise le marqueur avec le centre (utile pour le GPS)
  }, [center, map, setMarkerPos]);
  return null;
};

const DeliveryMap = ({ onLocationSelect, center = [9.5092, -13.7122] }: DeliveryMapProps) => {
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(center);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentCenter, setCurrentCenter] = useState<[number, number]>(center);

  // Met à jour le centre si le parent change la position (ex: via bouton GPS)
  useEffect(() => {
    setCurrentCenter(center);
  }, [center]);

  const handleSelect = useCallback((lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    onLocationSelect(lat, lng);
  }, [onLocationSelect]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ", Conakry, Guinea")}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        setCurrentCenter([newLat, newLng]);
        setMarkerPos([newLat, newLng]);
        onLocationSelect(newLat, newLng, display_name);
      }
    } catch (error) {
      console.error("Erreur de recherche:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full h-full relative group">
      <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un quartier..." 
              className="pl-10 h-10 rounded-xl border-none bg-white/90 backdrop-blur-md shadow-lg focus-visible:ring-pink-500 text-xs font-bold"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isSearching}
            className="h-10 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 shadow-lg text-xs font-black"
          >
            {isSearching ? "..." : "OK"}
          </Button>
        </form>
      </div>

      <MapContainer 
        center={currentCenter} 
        zoom={13} 
        zoomControl={false}
        className="h-full w-full z-0"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEvents onLocationSelect={handleSelect} />
        <ChangeView center={currentCenter} setMarkerPos={setMarkerPos} />
        {markerPos && <Marker position={markerPos} icon={customIcon} />}
      </MapContainer>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-white/50">
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Cliquez sur la carte pour placer le point</p>
      </div>
    </div>
  );
};

export default memo(DeliveryMap);