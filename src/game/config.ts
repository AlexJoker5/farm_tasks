/**
 * Phaser Game Configuration
 * Shared config for the garden canvas
 */
import Phaser from "phaser";
import { BootScene } from "@/game/scenes/BootScene";
import { GardenScene } from "@/game/scenes/GardenScene";

export const TILE_SIZE = 32;
export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 20;
export const VIEWPORT_TILES_X = 20;
export const VIEWPORT_TILES_Y = 15;

export function createGameConfig(
  parent: string | HTMLElement
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    pixelArt: true,
    backgroundColor: "#0c0e16",
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, GardenScene],
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
  };
}
