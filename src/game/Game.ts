import { Game, Types, Scale, AUTO } from 'phaser';
import { MainScene } from './scenes/MainScene';

const config: Types.Core.GameConfig = {
  type: AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'phaser-container',
  backgroundColor: '#000000',
  scene: [MainScene],
  scale: {
    mode: Scale.RESIZE,
    autoCenter: Scale.CENTER_BOTH
  }
};

export function createGame() {
  return new Game(config);
}
