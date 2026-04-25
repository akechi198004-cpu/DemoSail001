import React, { useEffect, useState } from 'react';
import { EventBus, MapStats } from '../game/events/EventBus';

export function HUD() {
  const [stats, setStats] = useState<MapStats>({
    fps: 0,
    camX: 0,
    camY: 0,
    tileX: 0,
    tileY: 0,
    chunkCount: 0,
    tileCount: 0,
    hoverTerrain: ''
  });

  const [selectedUnit, setSelectedUnit] = useState<{id: string, type: string} | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const handleStats = (e: Event) => {
      const customEvent = e as CustomEvent<MapStats>;
      setStats(customEvent.detail);
    };

    const handleUnitSelected = (e: Event) => {
      const customEvent = e as CustomEvent<{id: string, type: string}>;
      setSelectedUnit(customEvent.detail);
    };

    const handleUnitDeselected = () => {
      setSelectedUnit(null);
    };

    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setNotification(customEvent.detail);
      setTimeout(() => setNotification(null), 3000);
    };

    EventBus.on('map-stats', handleStats);
    EventBus.on('unit-selected', handleUnitSelected);
    EventBus.on('unit-deselected', handleUnitDeselected);
    EventBus.on('show-notification', handleNotification);

    return () => {
      EventBus.off('map-stats', handleStats);
      EventBus.off('unit-selected', handleUnitSelected);
      EventBus.off('unit-deselected', handleUnitDeselected);
      EventBus.off('show-notification', handleNotification);
    };
  }, []);

  return (
    <>
      {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-6 py-3 rounded shadow-lg border-2 border-red-500 font-bold text-lg select-none pointer-events-none z-50">
          {notification}
        </div>
      )}

      {selectedUnit && (
        <div className="absolute top-4 left-4 p-4 m-4 bg-blue-900/80 text-white font-mono text-sm rounded shadow-lg pointer-events-none select-none border border-blue-400">
          <h3 className="font-bold text-lg mb-2 text-yellow-300 border-b border-gray-600 pb-1">选中单位</h3>
          <div>类型: {selectedUnit.type === 'SHIP' ? '船只 ⛵' : '人物 🧍'}</div>
          <div>编号: {selectedUnit.id}</div>
        </div>
      )}

      <div className="absolute top-0 right-0 p-4 m-4 bg-black/70 text-white font-mono text-sm rounded shadow-lg pointer-events-none select-none border border-gray-600">
        <h3 className="font-bold text-lg mb-2 text-yellow-400 border-b border-gray-600 pb-1">大地图调试信息</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-gray-400">FPS:</span>
          <span className={stats.fps >= 50 ? 'text-green-400' : 'text-red-400'}>{stats.fps}</span>
          
          <span className="text-gray-400">屏幕坐标:</span>
          <span>{Math.round(stats.camX)}, {Math.round(stats.camY)}</span>
          
          <span className="text-gray-400">鼠标 Tile:</span>
          <span>{stats.tileX}, {stats.tileY}</span>
          
          <span className="text-gray-400">鼠标 地形:</span>
          <span className="text-blue-300">{stats.hoverTerrain}</span>
          
          <span className="text-gray-400">活跃 Chunk 数:</span>
          <span>{stats.chunkCount}</span>
          
          <span className="text-gray-400">渲染 Tile 数:</span>
          <span>{stats.tileCount.toLocaleString()}</span>
        </div>
        <div className="mt-3 text-xs text-gray-400 w-56">
          * 单击选中人物/船只 或 移动选中单位<br/>
          * 按住鼠标左键拖动以漫游地图<br/>
          * 滚动鼠标滚轮缩放视野
        </div>
      </div>
    </>
  );
}
