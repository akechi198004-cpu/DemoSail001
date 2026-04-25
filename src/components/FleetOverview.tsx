import React, { useEffect, useState } from 'react';
import { gameStateStore, FleetState } from '../game/state/GameStateStore';

export function FleetOverview() {
  const [state, setState] = useState<FleetState>(gameStateStore.getState());

  useEffect(() => {
    const unsubscribe = gameStateStore.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="absolute bottom-4 right-4 p-4 rounded bg-gray-900/90 text-white font-sans shadow-lg border border-gray-700 select-none z-40 w-48 pointer-events-none">
      <h3 className="font-bold text-gray-300 border-b border-gray-700 pb-1 mb-2">舰队状态</h3>
      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400">名称</span>
          <span className="text-yellow-400 font-bold">{state.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">金币</span>
          <span>{state.gold}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">食物</span>
          <span>{state.food}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">水</span>
          <span>{state.water}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">船员</span>
          <span>{state.crew}</span>
        </div>
      </div>
    </div>
  );
}
