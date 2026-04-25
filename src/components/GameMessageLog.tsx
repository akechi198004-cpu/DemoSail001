import React, { useEffect, useState } from 'react';
import { EventBus } from '../game/events/EventBus';

interface LogMessage {
  id: number;
  text: string;
  time: number;
}

export function GameMessageLog() {
  const [messages, setMessages] = useState<LogMessage[]>([]);

  useEffect(() => {
    let nextId = 0;
    const handleGameMessage = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const newMsg: LogMessage = {
        id: nextId++,
        text: customEvent.detail,
        time: Date.now()
      };
      setMessages(prev => {
        const next = [newMsg, ...prev];
        return next.slice(0, 5); // Keep last 5
      });
    };

    EventBus.on('game-message', handleGameMessage);
    return () => {
      EventBus.off('game-message', handleGameMessage);
    };
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="absolute top-1/4 left-4 p-4 rounded bg-gray-900/60 text-white font-sans text-sm shadow-lg pointer-events-none w-64 border border-gray-800 z-40">
      <div className="space-y-1">
        {messages.map((msg, index) => (
          <div 
            key={msg.id} 
            className={`transition-opacity duration-500`}
            style={{ opacity: 1 - (index * 0.2) }} // Fade out older messages
          >
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}
