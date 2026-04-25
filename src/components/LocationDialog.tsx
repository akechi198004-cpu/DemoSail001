import React, { useEffect, useState } from 'react';
import { EventBus } from '../game/events/EventBus';
import { MapObject } from '../game/objects/MapObjectTypes';
import { LocationActionMenu } from './LocationActionMenu';

export function LocationDialog() {
  const [location, setLocation] = useState<MapObject | null>(null);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<MapObject>;
      setLocation(customEvent.detail);
    };

    const handleClose = () => {
      setLocation(null);
    };

    // Close on ESC
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    EventBus.on('open-location-dialog', handleOpen);
    EventBus.on('close-location-dialog', handleClose);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      EventBus.off('open-location-dialog', handleOpen);
      EventBus.off('close-location-dialog', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!location) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CITY': return '城市';
      case 'PORT': return '港口';
      case 'VILLAGE': return '村落';
      case 'RUIN': return '遗迹';
      case 'DISCOVERY': return '奇观';
      default: return '地点';
    }
  };

  const closeDialog = () => {
    EventBus.emit('close-location-dialog');
  };

  // We add 'pointer-events-auto' to intercept clicks when this is open.
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="bg-gray-900 border border-yellow-600 rounded-lg shadow-2xl p-6 relative w-[400px]">
        {/* Close button X */}
        <button 
          onClick={closeDialog}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <div className="mb-4">
          <h2 className="text-2xl font-bold text-yellow-400 mb-1">{location.name}</h2>
          <div className="text-sm text-gray-400 flex gap-4">
            <span>类型: {getTypeLabel(location.type)}</span>
            <span>坐标: [{location.tx}, {location.ty}]</span>
          </div>
        </div>

        <div className="text-gray-300 italic mb-6">
          {location.description}
        </div>

        <LocationActionMenu location={location} onClose={closeDialog} />
      </div>
    </div>
  );
}
