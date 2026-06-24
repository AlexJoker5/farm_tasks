"use client";

import { useEffect, useRef, useState } from "react";
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

interface PhaserCanvasProps {
  plants: PlacedPlant[];
  isOwner: boolean;
  onTileClick?: (gridX: number, gridY: number, hasPlant: boolean) => void;
}

export default function PhaserCanvas({
  plants,
  isOwner,
  onTileClick,
}: PhaserCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [tooltip, setTooltip] = useState<{
    title: string;
    milestone: string;
  } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Dynamic import to avoid SSR issues
    const initGame = async () => {
      const Phaser = (await import("phaser")).default;
      const { createGameConfig } = await import("@/game/config");

      // These imports trigger the scene classes to register
      await import("@/game/scenes/BootScene");
      await import("@/game/scenes/GardenScene");

      const config = createGameConfig(containerRef.current!);
      gameRef.current = new Phaser.Game(config);
    };

    initGame();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Subscribe to events from Phaser
  useEffect(() => {
    const sub: Subscription = eventBus.subscribe((event: GameEvent) => {
      switch (event.type) {
        case "SCENE_READY":
          setReady(true);
          // Send initial data to Phaser
          eventBus.next({
            type: "LOAD_PLANTS",
            payload: { plants },
          });
          eventBus.next({
            type: "SET_OWNER",
            payload: { isOwner },
          });
          break;

        case "TILE_CLICKED":
          if (onTileClick && event.payload) {
            onTileClick(
              event.payload.gridX as number,
              event.payload.gridY as number,
              event.payload.hasPlant as boolean
            );
          }
          break;

        case "PLANT_HOVER":
          if (event.payload) {
            setTooltip({
              title: event.payload.title as string,
              milestone: event.payload.milestone as string,
            });
          }
          break;

        case "PLANT_HOVER_END":
          setTooltip(null);
          break;
      }
    });

    return () => sub.unsubscribe();
  }, [plants, isOwner, onTileClick]);

  // Update plants when data changes
  useEffect(() => {
    if (ready) {
      eventBus.next({
        type: "LOAD_PLANTS",
        payload: { plants },
      });
    }
  }, [plants, ready]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-auto">
      {/* Game Canvas Container */}
      <div
        ref={containerRef}
        id="phaser-game"
        className="w-full h-full"
        style={{ imageRendering: "pixelated" }}
      />

      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/80">
          <p className="pixel-text-sm text-[var(--accent-green)] animate-pixel-blink">
            Loading garden...
          </p>
        </div>
      )}

      {/* Plant tooltip */}
      {tooltip && (
        <div className="absolute top-24 left-6 px-3 py-2 rounded-lg bg-[var(--bg-card)]/90 border border-[var(--border-default)] backdrop-blur-sm animate-fade-in pointer-events-none">
          <p className="pixel-text-sm text-[var(--accent-green)]">
            {tooltip.title}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Stage: {tooltip.milestone}
          </p>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-6 left-6 px-3 py-2 rounded-lg bg-[var(--bg-card)]/70 border border-[var(--border-default)] backdrop-blur-sm pointer-events-none">
        <p className="pixel-text-sm text-[var(--text-muted)]">
          WASD / ←↑↓→ to move · Click to place
        </p>
      </div>
    </div>
  );
}
