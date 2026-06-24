/**
 * GardenScene — Main game scene
 * Renders a 25x25 tile grid with placed plants, player character,
 * and remote player avatars with lerp interpolation.
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

interface RemotePlayer {
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  targetX: number;
  targetY: number;
}

const MILESTONE_TEXTURE: Record<string, string> = {
  SEED: "plant_seed",
  SPROUT: "plant_sprout",
  SAPLING: "plant_sapling",
  MATURE: "plant_mature",
  WITHERED: "plant_withered",
};

const LERP_SPEED = 0.15;

export class GardenScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private highlight!: Phaser.GameObjects.Image;
  private plantSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private eventSub!: Subscription;
  private plants: PlacedPlant[] = [];
  private isOwner: boolean = false;
  private lastBroadcastX: number = 0;
  private lastBroadcastY: number = 0;

  constructor() {
    super({ key: "GardenScene" });
  }

  create() {
    // Build tile grid
    this.buildGrid();

    // Create highlight cursor
    this.highlight = this.add
      .image(0, 0, "highlight")
      .setDepth(5)
      .setVisible(false);

    // Create player
    this.player = this.add.sprite(
      (GRID_WIDTH * TILE_SIZE) / 2,
      (GRID_HEIGHT * TILE_SIZE) / 2,
      "player"
    );
    this.player.setDepth(10);

    // Camera follows player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    
    // Scale zoom so the grid covers the whole screen
    const minZoomX = window.innerWidth / (GRID_WIDTH * TILE_SIZE);
    const minZoomY = window.innerHeight / (GRID_HEIGHT * TILE_SIZE);
    const targetZoom = Math.max(minZoomX, minZoomY, 2); // At least 2x zoom for pixel art feel
    this.cameras.main.setZoom(targetZoom);
    
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
      this.input.keyboard.addKeys("W,A,S,D");
    }

    // Click to select tile
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const gridX = Math.floor(worldPoint.x / TILE_SIZE);
      const gridY = Math.floor(worldPoint.y / TILE_SIZE);

      if (
        gridX >= 0 &&
        gridX < GRID_WIDTH &&
        gridY >= 0 &&
        gridY < GRID_HEIGHT
      ) {
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

      if (
        gridX >= 0 &&
        gridX < GRID_WIDTH &&
        gridY >= 0 &&
        gridY < GRID_HEIGHT
      ) {
        this.highlight.setPosition(
          gridX * TILE_SIZE + TILE_SIZE / 2,
          gridY * TILE_SIZE + TILE_SIZE / 2
        );
        this.highlight.setVisible(true);
      } else {
        this.highlight.setVisible(false);
      }
    });

    // Subscribe to events from React / Realtime hook
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
        case "REMOTE_PLAYER_MOVE":
          this.handleRemoteMove(event.payload as Record<string, unknown>);
          break;
        case "PLAYER_JOIN":
          // A new player joined, wait briefly then tell them where we are
          // Use window.setTimeout because Phaser's clock pauses when tab is inactive
          window.setTimeout(() => {
            this.forceBroadcastPosition();
          }, 500);
          break;
        case "PLAYER_LEAVE":
          this.removeRemotePlayer(event.payload?.userId as string);
          break;
        case "PRESENCE_SYNC":
          this.syncPresence(
            event.payload?.users as { userId: string; username: string }[]
          );
          // Use window.setTimeout to avoid Phaser clock pausing
          window.setTimeout(() => {
            this.forceBroadcastPosition();
          }, 200);
          break;
      }
    });

    // Tell React we're ready
    eventBus.next({ type: "SCENE_READY" });
  }

  private forceBroadcastPosition() {
    if (this.player) {
      eventBus.next({
        type: "LOCAL_PLAYER_MOVE",
        payload: { x: this.player.x, y: this.player.y },
      });
    }
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

    // Broadcast local player position if moved
    if (
      dx !== 0 ||
      dy !== 0 ||
      this.lastBroadcastX !== this.player.x ||
      this.lastBroadcastY !== this.player.y
    ) {
      if (dx !== 0 || dy !== 0) {
        this.lastBroadcastX = this.player.x;
        this.lastBroadcastY = this.player.y;
        eventBus.next({
          type: "LOCAL_PLAYER_MOVE",
          payload: { x: this.player.x, y: this.player.y },
        });
      }
    }

    // Lerp remote players toward their targets
    this.remotePlayers.forEach((remote) => {
      remote.sprite.x = Phaser.Math.Linear(
        remote.sprite.x,
        remote.targetX,
        LERP_SPEED
      );
      remote.sprite.y = Phaser.Math.Linear(
        remote.sprite.y,
        remote.targetY,
        LERP_SPEED
      );
      // Keep label above sprite
      remote.label.setPosition(remote.sprite.x, remote.sprite.y - 20);
    });
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
    this.plantSprites.forEach((sprite) => sprite.destroy());
    this.plantSprites.clear();
    this.plants = plants || [];

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

  // ── Multiplayer ──

  private handleRemoteMove(payload: Record<string, unknown>) {
    const userId = payload.userId as string;
    const username = payload.username as string;
    const x = payload.x as number;
    const y = payload.y as number;

    let remote = this.remotePlayers.get(userId);

    if (!remote) {
      // Create new remote player sprite
      const sprite = this.add.sprite(x, y, "player").setDepth(9).setTint(0x9999ff);

      const label = this.add
        .text(x, y - 20, username, {
          fontSize: "8px",
          fontFamily: '"Press Start 2P", monospace',
          color: "#a78bfa",
          stroke: "#000",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(11);

      remote = { sprite, label, targetX: x, targetY: y };
      this.remotePlayers.set(userId, remote);
    }

    // Update target for lerp
    remote.targetX = x;
    remote.targetY = y;
  }

  private removeRemotePlayer(userId: string) {
    const remote = this.remotePlayers.get(userId);
    if (remote) {
      remote.sprite.destroy();
      remote.label.destroy();
      this.remotePlayers.delete(userId);
    }
  }

  private syncPresence(users: { userId: string; username: string }[]) {
    // Remove players who left
    const onlineIds = new Set(users.map((u) => u.userId));
    this.remotePlayers.forEach((_, id) => {
      if (!onlineIds.has(id)) {
        this.removeRemotePlayer(id);
      }
    });
  }

  shutdown() {
    if (this.eventSub) {
      this.eventSub.unsubscribe();
    }
    // Clean up remote players
    this.remotePlayers.forEach((remote) => {
      remote.sprite.destroy();
      remote.label.destroy();
    });
    this.remotePlayers.clear();
  }
}
