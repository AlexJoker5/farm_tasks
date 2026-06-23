/**
 * BootScene — Generates placeholder pixel-art textures
 * These will be replaced with real sprite sheets later.
 */
import Phaser from "phaser";
import { TILE_SIZE } from "@/game/config";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // No external assets to load yet — we generate textures in create()
  }

  create() {
    // Generate grass tile texture
    this.generateTile("grass", 0x2d5a1e, 0x3a7a28);
    this.generateTile("grass_dark", 0x264f19, 0x2d5a1e);

    // Generate plant textures for each milestone
    this.generatePlant("plant_seed", 0x8b6914, 4);
    this.generatePlant("plant_sprout", 0x4ade80, 8);
    this.generatePlant("plant_sapling", 0x22c55e, 14);
    this.generatePlant("plant_mature", 0x15803d, 20);

    // Generate withered plant
    this.generatePlant("plant_withered", 0x6b5b3a, 10);

    // Generate player sprite
    this.generatePlayer();

    // Generate highlight tile
    this.generateHighlight();

    // Transition to garden
    this.scene.start("GardenScene");
  }

  private generateTile(key: string, color1: number, color2: number) {
    const graphics = this.add.graphics();
    graphics.fillStyle(color1);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    // Add pixel-art variation
    graphics.fillStyle(color2);
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(0, TILE_SIZE - 2);
      const y = Phaser.Math.Between(0, TILE_SIZE - 2);
      graphics.fillRect(x, y, 2, 2);
    }

    graphics.generateTexture(key, TILE_SIZE, TILE_SIZE);
    graphics.destroy();
  }

  private generatePlant(key: string, color: number, size: number) {
    const graphics = this.add.graphics();
    const cx = TILE_SIZE / 2;
    const cy = TILE_SIZE;

    // Trunk
    graphics.fillStyle(0x5a3e1b);
    graphics.fillRect(cx - 1, cy - size - 4, 2, size / 2 + 4);

    // Canopy / flower
    graphics.fillStyle(color);
    const canopySize = Math.max(4, size);
    graphics.fillRect(
      cx - canopySize / 2,
      cy - size - 6,
      canopySize,
      canopySize
    );

    // Highlight pixel
    graphics.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(30).color);
    graphics.fillRect(cx - canopySize / 2 + 1, cy - size - 5, 2, 2);

    graphics.generateTexture(key, TILE_SIZE, TILE_SIZE);
    graphics.destroy();
  }

  private generatePlayer() {
    const graphics = this.add.graphics();
    const cx = TILE_SIZE / 2;

    // Body
    graphics.fillStyle(0x4a90d9);
    graphics.fillRect(cx - 4, 12, 8, 12);

    // Head
    graphics.fillStyle(0xf5d0a9);
    graphics.fillRect(cx - 3, 6, 6, 6);

    // Hat
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(cx - 5, 3, 10, 4);

    // Eyes
    graphics.fillStyle(0x000000);
    graphics.fillRect(cx - 2, 8, 1, 1);
    graphics.fillRect(cx + 1, 8, 1, 1);

    // Legs
    graphics.fillStyle(0x3a3a3a);
    graphics.fillRect(cx - 3, 24, 3, 4);
    graphics.fillRect(cx, 24, 3, 4);

    graphics.generateTexture("player", TILE_SIZE, TILE_SIZE);
    graphics.destroy();
  }

  private generateHighlight() {
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x4ade80, 0.8);
    graphics.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
    graphics.generateTexture("highlight", TILE_SIZE, TILE_SIZE);
    graphics.destroy();
  }
}
