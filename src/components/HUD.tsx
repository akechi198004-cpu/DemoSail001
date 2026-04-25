import React, { useEffect, useState } from 'react';
import { EventBus, MapStats } from '../game/events/EventBus';
import { MapObject } from '../game/objects/MapObjectTypes';

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
  const [selectedPoi, setSelectedPoi] = useState<MapObject | null>(null);
  const [recentDiscoveries, setRecentDiscoveries] = useState<string[]>([]);
  const [totalDiscovered, setTotalDiscovered] = useState<number>(0);

  useEffect(() => {
    // initialize total discovered from local storage just to render the badge
    try {
      const saved = localStorage.getItem('discovered_pois');
      if (saved) {
        setTotalDiscovered(JSON.parse(saved).length);
      }
    } catch(e) {}

    const handleStats = (e: Event) => {
      const customEvent = e as CustomEvent<MapStats>;
      setStats(customEvent.detail);
    };

    const handleUnitSelected = (e: Event) => {
      const customEvent = e as CustomEvent<{id: string, type: string}>;
      setSelectedUnit(customEvent.detail);
      setSelectedPoi(null); // Deselect POI if a unit is selected
    };

    const handleUnitDeselected = () => {
      setSelectedUnit(null);
    };

    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setNotification(customEvent.detail);
      setTimeout(() => setNotification(null), 3000);
    };

    const handlePoiClicked = (e: Event) => {
      const customEvent = e as CustomEvent<MapObject>;
      setSelectedPoi(customEvent.detail);
      setSelectedUnit(null); // Deselect unit if POI is selected
    };

    const handleDiscoveredPoi = (e: Event) => {
      const customEvent = e as CustomEvent<MapObject>;
      const obj = customEvent.detail;
      setTotalDiscovered(prev => prev + 1);
      setRecentDiscoveries(prev => [obj.name, ...prev].slice(0, 3)); // keep last 3
    };

    EventBus.on('map-stats', handleStats);
    EventBus.on('unit-selected', handleUnitSelected);
    EventBus.on('unit-deselected', handleUnitDeselected);
    EventBus.on('show-notification', handleNotification);
    EventBus.on('poi-clicked', handlePoiClicked);
    EventBus.on('discovered-poi', handleDiscoveredPoi);

    return () => {
      EventBus.off('map-stats', handleStats);
      EventBus.off('unit-selected', handleUnitSelected);
      EventBus.off('unit-deselected', handleUnitDeselected);
      EventBus.off('show-notification', handleNotification);
      EventBus.off('poi-clicked', handlePoiClicked);
      EventBus.off('discovered-poi', handleDiscoveredPoi);
    };
  }, []);

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

  return (
    <>
      {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-600/90 text-white px-6 py-3 rounded shadow-lg border-2 border-yellow-300 font-bold text-lg select-none pointer-events-none z-50">
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

      {selectedPoi && (
        <div className="absolute top-4 left-4 w-64 p-4 m-4 bg-gray-900/90 text-white font-sans text-sm rounded shadow-lg border border-yellow-500">
          <div className="flex justify-between items-start border-b border-gray-600 pb-2 mb-2">
            <h3 className="font-bold text-xl text-yellow-400">{selectedPoi.isDiscovered ? selectedPoi.name : '未知地点'}</h3>
            <button 
              onClick={() => setSelectedPoi(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          {selectedPoi.isDiscovered ? (
            <div className="space-y-2">
              <div><span className="text-gray-400">类型:</span> {getTypeLabel(selectedPoi.type)}</div>
              <div><span className="text-gray-400">坐标:</span> [{selectedPoi.tx}, {selectedPoi.ty}]</div>
              <p className="text-gray-300 mt-2 italic leading-tight">{selectedPoi.description}</p>
            </div>
          ) : (
            <div className="text-gray-400 italic py-4 text-center">
              由于距离过远，无法看清全貌。<br/>请派遣船队或人员靠近探索。
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-4 left-4 p-4 m-4 bg-black/60 text-white font-sans text-sm rounded shadow-lg pointer-events-none border border-gray-700">
        <h3 className="font-bold text-gray-300 border-b border-gray-700 pb-1 mb-2">探险家手册</h3>
        <div className="text-yellow-400 font-bold">已发现地点: {totalDiscovered}</div>
        {recentDiscoveries.length > 0 && (
          <div className="mt-2 text-xs text-gray-400">
            <div>最近发现:</div>
            <ul className="list-disc list-inside">
              {recentDiscoveries.map((name, i) => <li key={i}>{name}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="absolute top-0 right-0 p-4 m-4 bg-black/70 text-white font-mono text-sm rounded shadow-lg pointer-events-none select-none border border-gray-600 z-40">
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
          * 单击地点查看详细信息<br/>
          * 单击移动已选中单位<br/>
          * 按住鼠标左键拖动以漫游地图<br/>
        </div>
      </div>
    </>
  );
}
