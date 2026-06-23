/**
 * GardenScene — Main game scene
 * Renders a 100x100 tile grid with placed plants and a player character.
 * Communicates with React via the EventBus.
 */
import Phaser from "phaser";
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT } from "@/game/config";
import eventBus from "@/game/bus/EventBus";
import type { GameEvent } from "@/game/bus/EventBus";
import { Subscription } from "rxjs";

interface PlacedPlant {
  gridX: number;
  gridY: number;
  milestone: string;
  title: string;
  goalId: string;
}

const MILESTONE_TEXTURE: Record<string, string> = {
  SEED: "plant_seed",
  SPROUT: "plant_sprout",
  SAPLING: "plant_sapling",
  MATURE: "plant_mature",
  WITHERED: "plant_withered",
};

export class GardenScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private highlight!: Phaser.GameObjects.Image;
  private plantSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private eventSub!: Subscription;
  private plants: PlacedPlant[] = [];
  private isOwner: boolean = false;

  constructor() {
    super({ key: "GardenScene" });
  }

  create() {
    // Build tile grid
    this.buildGrid();

    // Create highlight cursor
    this.highlight = this.add.image(0, 0, "highlight").setDepth(5).setVisible(false);

    // Create player
    this.player = this.add.sprite(
      GRID_WIDTH * TILE_SIZE / 2,
      GRID_HEIGHT * TILE_SIZE / 2,
      "player"
    );
    this.player.setDepth(10);

    // Camera follows player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(
      0,
      0,
      GRID_WIDTH * TILE_SIZE,
      GRID_HEIGHT * TILE_SIZE
    );

    // World bounds
    this.physics.world.setBounds(
      0,
      0,
      GRID_WIDTH * TILE_SIZE,
      GRID_HEIGHT * TILE_SIZE
    );

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();

      // WASD support
      this.input.keyboard.addKeys("W,A,S,D");
    }

    // Click to select tile
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const gridX = Math.floor(worldPoint.x / TILE_SIZE);
      const gridY = Math.floor(worldPoint.y / TILE_SIZE);

      if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
        // Check if a plant exists here
        const plant = this.plants.find(
          (p) => p.gridX === gridX && p.gridY === gridY
        );

        eventBus.next({
          type: "TILE_CLICKED",
          payload: {
            gridX,
            gridY,
            hasPlant: !!plant,
            plant: plant || null,
          },
        });
      }
    });

    // Hover highlight
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const gridX = Math.floor(worldPoint.x / TILE_SIZE);
      const gridY = Math.floor(worldPoint.y / TILE_SIZE);

      if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
        this.highlight.setPosition(
          gridX * TILE_SIZE + TILE_SIZE / 2,
          gridY * TILE_SIZE + TILE_SIZE / 2
        );
        this.highlight.setVisible(true);
      } else {
        this.highlight.setVisible(false);
      }
    });

    // Subscribe to React events
    this.eventSub = eventBus.subscribe((event: GameEvent) => {
      switch (event.type) {
        case "LOAD_PLANTS":
          this.loadPlants(event.payload?.plants as PlacedPlant[]);
          break;
        case "PLACE_PLANT":
          this.addPlant(event.payload as unknown as PlacedPlant);
          break;
        case "SET_OWNER":
          this.isOwner = event.payload?.isOwner as boolean;
          break;
      }
    });

    // Tell React we're ready
    eventBus.next({ type: "SCENE_READY" });
  }

  update() {
    if (!this.cursors) return;

    const speed = 3;
    let dx = 0;
    let dy = 0;

    const keyboard = this.input.keyboard;
    const wKey = keyboard?.addKey("W", false);
    const aKey = keyboard?.addKey("A", false);
    const sKey = keyboard?.addKey("S", false);
    const dKey = keyboard?.addKey("D", false);

    if (this.cursors.left.isDown || aKey?.isDown) dx = -speed;
    else if (this.cursors.right.isDown || dKey?.isDown) dx = speed;

    if (this.cursors.up.isDown || wKey?.isDown) dy = -speed;
    else if (this.cursors.down.isDown || sKey?.isDown) dy = speed;

    // Move player
    this.player.x = Phaser.Math.Clamp(
      this.player.x + dx,
      0,
      GRID_WIDTH * TILE_SIZE
    );
    this.player.y = Phaser.Math.Clamp(
      this.player.y + dy,
      0,
      GRID_HEIGHT * TILE_SIZE
    );
  }

  private buildGrid() {
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        const textureKey = (x + y) % 2 === 0 ? "grass" : "grass_dark";
        this.add
          .image(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            textureKey
          )
          .setDepth(0);
      }
    }
  }

  private loadPlants(plants: PlacedPlant[]) {
    // Clear existing
    this.plantSprites.forEach((sprite) => sprite.destroy());
    this.plantSprites.clear();
    this.plants = plants || [];

    // Add new
    for (const plant of this.plants) {
      this.addPlantSprite(plant);
    }
  }

  private addPlant(plant: PlacedPlant) {
    this.plants.push(plant);
    this.addPlantSprite(plant);
  }

  private addPlantSprite(plant: PlacedPlant) {
    const texture = MILESTONE_TEXTURE[plant.milestone] || "plant_seed";
    const sprite = this.add
      .image(
        plant.gridX * TILE_SIZE + TILE_SIZE / 2,
        plant.gridY * TILE_SIZE + TILE_SIZE / 2,
        texture
      )
      .setDepth(3);

    // Interactive: show tooltip on hover
    sprite.setInteractive();
    sprite.on("pointerover", () => {
      eventBus.next({
        type: "PLANT_HOVER",
        payload: { title: plant.title, milestone: plant.milestone },
      });
    });
    sprite.on("pointerout", () => {
      eventBus.next({ type: "PLANT_HOVER_END" });
    });

    const key = `${plant.gridX},${plant.gridY}`;
    this.plantSprites.set(key, sprite);
  }

  shutdown() {
    if (this.eventSub) {
      this.eventSub.unsubscribe();
    }
  }
}
