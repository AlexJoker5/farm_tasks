"use client";

import { useState } from "react";
import PhaserCanvas from "@/components/PhaserCanvas";
import { placePlant } from "@/app/actions/garden";

interface PlacedPlant {
  gridX: number;
  gridY: number;
  milestone: string;
  title: string;
  goalId: string;
}

interface UnplacedGoal {
  id: string;
  title: string;
  current_milestone: string;
  goal_type: string;
}

interface GardenClientProps {
  plants: PlacedPlant[];
  unplacedGoals: UnplacedGoal[];
  isOwner: boolean;
  ownerName: string;
}

export default function GardenClient({
  plants: initialPlants,
  unplacedGoals,
  isOwner,
  ownerName,
}: GardenClientProps) {
  const [plants, setPlants] = useState(initialPlants);
  const [selectedTile, setSelectedTile] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showPlantPicker, setShowPlantPicker] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTileClick(gridX: number, gridY: number, hasPlant: boolean) {
    if (!isOwner) return;
    if (hasPlant) return; // Cell already occupied

    setSelectedTile({ x: gridX, y: gridY });
    setShowPlantPicker(true);
    setError(null);
  }

  async function handlePlacePlant(goal: UnplacedGoal) {
    if (!selectedTile) return;
    setPlacing(true);
    setError(null);

    const result = await placePlant(goal.id, selectedTile.x, selectedTile.y);

    if (result.error) {
      setError(result.error);
      setPlacing(false);
      return;
    }

    // Add to local state
    setPlants((prev) => [
      ...prev,
      {
        gridX: selectedTile.x,
        gridY: selectedTile.y,
        milestone: goal.current_milestone,
        title: goal.title,
        goalId: goal.id,
      },
    ]);

    setShowPlantPicker(false);
    setSelectedTile(null);
    setPlacing(false);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Game Canvas */}
      <div className="flex-1">
        <PhaserCanvas
          plants={plants}
          isOwner={isOwner}
          onTileClick={handleTileClick}
        />
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-72 space-y-4">
        {/* Garden Info */}
        <div className="glass-card p-4">
          <h3 className="pixel-text-sm text-[var(--accent-green)] mb-2">
            {isOwner ? "Your Garden" : `${ownerName}'s Garden`}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {plants.length} plant{plants.length !== 1 ? "s" : ""} growing
          </p>
          {isOwner && (
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Click an empty tile to place a plant from your goals
            </p>
          )}
        </div>

        {/* Plant Legend */}
        <div className="glass-card p-4">
          <h3 className="pixel-text-sm text-[var(--text-secondary)] mb-3">
            Growth Stages
          </h3>
          <div className="space-y-2">
            {[
              { emoji: "🌰", label: "Seed", desc: "0–25%" },
              { emoji: "🌱", label: "Sprout", desc: "25–50%" },
              { emoji: "🌿", label: "Sapling", desc: "50–75%" },
              { emoji: "🌳", label: "Mature", desc: "75–100%" },
            ].map((stage) => (
              <div
                key={stage.label}
                className="flex items-center gap-2 text-sm"
              >
                <span>{stage.emoji}</span>
                <span className="text-[var(--text-primary)]">
                  {stage.label}
                </span>
                <span className="text-[var(--text-muted)] text-xs ml-auto">
                  {stage.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Placed plants list */}
        {plants.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="pixel-text-sm text-[var(--text-secondary)] mb-3">
              Planted
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {plants.map((p) => (
                <div
                  key={`${p.gridX}-${p.gridY}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <span>
                    {p.milestone === "SEED"
                      ? "🌰"
                      : p.milestone === "SPROUT"
                        ? "🌱"
                        : p.milestone === "SAPLING"
                          ? "🌿"
                          : "🌳"}
                  </span>
                  <span className="text-[var(--text-primary)] truncate flex-1">
                    {p.title}
                  </span>
                  <span className="text-[var(--text-muted)] text-xs">
                    ({p.gridX},{p.gridY})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Plant Picker Modal */}
      {showPlantPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowPlantPicker(false);
              setSelectedTile(null);
            }}
          />
          <div className="relative glass-card p-6 w-full max-w-md animate-fade-in-up">
            <h3 className="pixel-text text-sm gradient-text mb-2">
              🌱 Place a Plant
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Tile ({selectedTile?.x}, {selectedTile?.y}) — Choose a goal to
              plant here
            </p>

            {error && (
              <div className="p-2 mb-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {unplacedGoals.length === 0 ? (
              <p className="text-[var(--text-muted)] text-sm py-4 text-center">
                No eligible goals. Goals must reach at least Sprout stage (25%)
                to be planted.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unplacedGoals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => handlePlacePlant(goal)}
                    disabled={placing}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] hover:border-[var(--accent-green)] transition-all text-left disabled:opacity-50"
                  >
                    <span className="text-xl">
                      {goal.current_milestone === "SPROUT"
                        ? "🌱"
                        : goal.current_milestone === "SAPLING"
                          ? "🌿"
                          : "🌳"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] truncate">
                        {goal.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {goal.current_milestone} · {goal.goal_type.replace("_", "-")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setShowPlantPicker(false);
                setSelectedTile(null);
              }}
              className="btn-secondary w-full !py-2 mt-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
