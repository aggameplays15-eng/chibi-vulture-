"use client";

import React, { useState } from 'react';
import { Plus, Trash2, MapPin, Save, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from '@/context/AppContext';
import { showSuccess, showError } from '@/utils/toast';

const DeliveryManagement = () => {
  const { deliveryZones, updateDeliveryZones, primaryColor } = useApp();
  const [zones, setZones] = useState(deliveryZones);

  const handleAddZone = () => {
    const newZone = {
      id: `zone-${Date.now()}`,
      label: "Nouvelle Zone",
      price: 0
    };
    setZones([...zones, newZone]);
  };

  const handleUpdateZone = (id: string, field: 'label' | 'price', value: string | number) => {
    setZones(zones.map(z => z.id === id ? { ...z, [field]: value } : z));
  };

  const handleRemoveZone = (id: string) => {
    setZones(zones.filter(z => z.id !== id));
  };

  const handleSave = () => {
    updateDeliveryZones(zones);
    showSuccess("Zones de livraison mises à jour ! 🚚");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div>
          <h3 className="font-black text-gray-900 text-lg">Zones de Livraison</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">{zones.length} zones configurées</p>
        </div>
        <Button 
          onClick={handleAddZone}
          className="rounded-2xl gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus size={18} /> Ajouter
        </Button>
      </div>

      <div className="space-y-3">
        {zones.map((zone) => (
          <Card key={zone.id} className="border-none shadow-sm rounded-[28px] overflow-hidden border border-gray-50 group hover:border-pink-100 transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-pink-50 p-3 rounded-2xl text-pink-500">
                <MapPin size={20} />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase ml-1">Nom de la zone</p>
                  <Input 
                    value={zone.label}
                    onChange={(e) => handleUpdateZone(zone.id, 'label', e.target.value)}
                    data-testid="zone-label"
                    className="h-10 rounded-xl border-gray-100 text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase ml-1">Prix (GNF)</p>
                  <Input 
                    type="number"
                    value={zone.price}
                    onChange={(e) => handleUpdateZone(zone.id, 'price', parseInt(e.target.value) || 0)}
                    data-testid="zone-price"
                    className="h-10 rounded-xl border-gray-100 text-sm font-black text-pink-600"
                  />
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleRemoveZone(zone.id)}
                data-testid="delete-zone"
                className="text-gray-300 hover:text-red-500 rounded-xl"
              >
                <Trash2 size={18} />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-4">
        <Button 
          onClick={handleSave}
          className="w-full h-14 rounded-2xl text-lg font-black shadow-lg flex gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          <Save size={20} /> ENREGISTRER LES MODIFICATIONS
        </Button>
      </div>
    </div>
  );
};

export default DeliveryManagement;