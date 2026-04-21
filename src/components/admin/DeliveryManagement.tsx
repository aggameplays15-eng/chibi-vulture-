"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from '@/context/AppContext';
import { showSuccess, showError } from '@/utils/toast';

interface Zone {
  id: string;
  label: string;
  price: number;
}

const DeliveryManagement = () => {
  const { deliveryZones, updateDeliveryZones, primaryColor } = useApp();
  const [zones, setZones] = useState<Zone[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when context loads
  useEffect(() => {
    if (deliveryZones.length > 0 && zones.length === 0) {
      setZones(deliveryZones);
    }
  }, [deliveryZones]);

  const handleAddZone = () => {
    setZones(prev => [
      ...prev,
      { id: `zone-${Date.now()}`, label: '', price: 0 }
    ]);
  };

  const handleUpdateZone = (id: string, field: 'label' | 'price', value: string | number) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, [field]: value } : z));
  };

  const handleRemoveZone = (id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
  };

  const handleSave = () => {
    // Validation
    const invalid = zones.find(z => !z.label.trim());
    if (invalid) {
      showError('Chaque zone doit avoir un nom.');
      return;
    }
    const hasNegative = zones.find(z => z.price < 0);
    if (hasNegative) {
      showError('Le prix ne peut pas être négatif.');
      return;
    }

    setIsSaving(true);
    try {
      updateDeliveryZones(zones);
      showSuccess('Zones de livraison mises à jour ! 🚚');
    } catch {
      showError('Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div>
          <h3 className="font-black text-gray-900 text-lg">Zones de Livraison</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">{zones.length} zone(s) configurée(s)</p>
        </div>
        <Button
          onClick={handleAddZone}
          className="rounded-2xl gap-2 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus size={18} /> Ajouter
        </Button>
      </div>

      <div className="space-y-3">
        {zones.length === 0 && (
          <div className="text-center py-10 text-gray-300">
            <MapPin size={36} className="mx-auto mb-2" />
            <p className="text-sm font-bold">Aucune zone. Clique sur Ajouter.</p>
          </div>
        )}
        {zones.map((zone) => (
          <Card key={zone.id} className="border-none shadow-sm rounded-[28px] overflow-hidden border border-gray-50 hover:border-pink-100 transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-pink-50 p-3 rounded-2xl text-pink-500 flex-shrink-0">
                <MapPin size={20} />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase ml-1">Nom de la zone</p>
                  <Input
                    value={zone.label}
                    onChange={(e) => handleUpdateZone(zone.id, 'label', e.target.value)}
                    placeholder="Ex: Kaloum"
                    className="h-10 rounded-xl border-gray-100 text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase ml-1">Prix (GNF)</p>
                  <Input
                    type="number"
                    min={0}
                    value={zone.price}
                    onChange={(e) => handleUpdateZone(zone.id, 'price', parseInt(e.target.value) || 0)}
                    className="h-10 rounded-xl border-gray-100 text-sm font-black"
                    style={{ color: primaryColor }}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveZone(zone.id)}
                className="text-gray-300 hover:text-red-500 rounded-xl flex-shrink-0"
              >
                <Trash2 size={18} />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {zones.length > 0 && (
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-14 rounded-2xl text-lg font-black shadow-lg flex gap-2 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <Save size={20} />
          {isSaving ? 'ENREGISTREMENT...' : 'ENREGISTRER LES MODIFICATIONS'}
        </Button>
      )}
    </div>
  );
};

export default DeliveryManagement;
