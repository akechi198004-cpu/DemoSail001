import React from 'react';
import { MapObject } from '../game/objects/MapObjectTypes';
import { EventBus } from '../game/events/EventBus';
import { gameStateStore } from '../game/state/GameStateStore';

interface ActionMenuProps {
  location: MapObject;
  onClose: () => void;
}

export function LocationActionMenu({ location, onClose }: ActionMenuProps) {
  
  const sendMessage = (msg: string) => {
    EventBus.emit('game-message', msg);
  };

  const updateStateAndLog = (msg: string, updates: any) => {
    const currentState = gameStateStore.getState();
    const resolvedUpdates: any = {};
    for (const key in updates) {
      resolvedUpdates[key] = currentState[key as keyof typeof currentState] as number + updates[key];
    }
    gameStateStore.updateState(resolvedUpdates);
    sendMessage(msg);
  };

  const renderButtons = () => {
    switch (location.type) {
      case 'PORT':
        return (
          <>
            <button className="menu-btn" onClick={() => updateStateAndLog('补给完毕：消耗 50 金币，获得 50 食物和水。', { gold: -50, food: 50, water: 50 })}>补给</button>
            <button className="menu-btn" onClick={() => updateStateAndLog('船只修理完毕：消耗 100 金币。', { gold: -100 })}>修船</button>
            <button className="menu-btn" onClick={() => sendMessage('交易功能尚未开放。')}>交易</button>
          </>
        );
      case 'CITY':
        return (
          <>
            <button className="menu-btn" onClick={() => sendMessage('来到酒馆打听到了一些流言蜚语...')}>酒馆</button>
            <button className="menu-btn" onClick={() => sendMessage('市场老板表示今天不缺货。')}>市场</button>
            <button className="menu-btn" onClick={() => sendMessage('长官不想见你。')}>官府</button>
            <button className="menu-btn" onClick={() => updateStateAndLog('招募了 5 名水手：花费 25 金币。', { crew: 5, gold: -25 })}>招募</button>
          </>
        );
      case 'VILLAGE':
        return (
          <>
            <button className="menu-btn" onClick={() => sendMessage('村民热情地与你打招呼。')}>交谈</button>
            <button className="menu-btn" onClick={() => updateStateAndLog('购买了一些特产物资。消耗 10 金币，获得 10 食物。', { gold: -10, food: 10 })}>采购物资</button>
          </>
        );
      case 'RUIN':
        return (
          <>
            <button className="menu-btn" onClick={() => sendMessage('你仔细调查了这些残垣断壁，没发现什么贵重物品。')}>调查</button>
            <button className="menu-btn" onClick={() => sendMessage('已将此处发现记录在航海日志中。')}>记录发现</button>
          </>
        );
      case 'DISCOVERY':
        return (
          <>
            <button className="menu-btn" onClick={() => sendMessage('此处奇妙的风光令你驻足。')}>探索</button>
            <button className="menu-btn" onClick={() => sendMessage('已经在海图上做了特别的标记。')}>标记地点</button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-2 mt-4 flex-wrap">
      <style>{`
        .menu-btn {
          background-color: rgba(30, 41, 59, 1);
          border: 1px solid rgba(71, 85, 105, 1);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .menu-btn:hover {
          background-color: rgba(51, 65, 85, 1);
          border-color: rgba(148, 163, 184, 1);
        }
      `}</style>
      
      {renderButtons()}
      <button className="menu-btn bg-red-900 border-red-700 hover:bg-red-800!" onClick={onClose}>离开</button>
    </div>
  );
}
