/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { createGame } from './game/Game';
import { HUD } from './components/HUD';
import { LocationDialog } from './components/LocationDialog';
import { GameMessageLog } from './components/GameMessageLog';
import { FleetOverview } from './components/FleetOverview';

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    console.log("App mounted");
    // Initialize phaser game
    if (!gameRef.current) {
      console.log("Creating Phaser Game");
      gameRef.current = createGame();
    }

    return () => {
      // Phaser cleanup
      console.log("Destroying Phaser Game");
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {/* Phaser Game Container */}
      <div id="phaser-container" className="w-full h-full absolute inset-0 text-white" />
      
      {/* React HUD Overlay */}
      <HUD />
      <LocationDialog />
      <GameMessageLog />
      <FleetOverview />
    </div>
  );
}

