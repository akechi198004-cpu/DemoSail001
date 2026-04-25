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

  useEffect(() => {
    const handleStats = (e: Event) => {
      const customEvent = e as CustomEvent<MapStats>;
      setStats(customEvent.detail);
    };

    EventBus.addEventListener('map-stats', handleStats);
    return () => EventBus.removeEventListener('map-stats', handleStats);
  }, []);

  return (
    <div className="absolute top-0 right-0 p-4 m-4 bg-black/70 text-white font-mono text-sm rounded shadow-lg pointer-events-none select-none border border-gray-600">
      <h3 className="font-bold text-lg mb-2 text-yellow-400 border-b border-gray-600 pb-1">大地图调试信息</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-gray-400">FPS:</span>
        <span className={stats.fps >= 50 ? 'text-green-400' : 'text-red-400'}>{stats.fps}</span>
        
        <span className="text-gray-400">屏幕坐标:</span>
        <span>{stats.camX}, {stats.camY}</span>
        
        <span className="text-gray-400">鼠标 Tile:</span>
        <span>{stats.tileX}, {stats.tileY}</span>
        
        <span className="text-gray-400">鼠标 地形:</span>
        <span className="text-blue-300">{stats.hoverTerrain}</span>
        
        <span className="text-gray-400">活跃 Chunk 数:</span>
        <span>{stats.chunkCount}</span>
        
        <span className="text-gray-400">渲染 Tile 数:</span>
        <span>{stats.tileCount.toLocaleString()}</span>
      </div>
      <div className="mt-3 text-xs text-gray-500 w-48">
        * 按住鼠标左键拖动以漫游地图<br/>
        * 滚动鼠标滚轮缩放视野
      </div>
    </div>
  );
}
