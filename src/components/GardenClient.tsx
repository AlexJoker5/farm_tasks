"use client";

import { useState } from "react";
import PhaserCanvas from "@/components/PhaserCanvas";
import { placePlant } from "@/app/actions/garden";
import { useRealtimeGarden } from "@/hooks/useRealtimeGarden";

interface PlacedPlant {
  gridX: number;
  gridY: number;
  milestone: string;
  title: string;
  goalId: string;
  asset_url?: string | null;
}

interface UnplacedGoal {
  id: string;
  title: string;
  current_milestone: string;
  goal_type: string;
  asset_url?: string | null;
}

interface GardenClientProps {
  plants: PlacedPlant[];
  unplacedGoals: UnplacedGoal[];
  isOwner: boolean;
  ownerName: string;
  gardenOwnerId: string;
  currentUserId: string | null;
  currentUsername: string;
}

export default function GardenClient({
  plants: initialPlants,
  unplacedGoals,
  isOwner,
  ownerName,
  gardenOwnerId,
  currentUserId,
  currentUsername,
}: GardenClientProps) {
  const [plants, setPlants] = useState(initialPlants);
  const [selectedTile, setSelectedTile] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showPlantPicker, setShowPlantPicker] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Realtime multiplayer hook
  const { onlineUsers } = useRealtimeGarden({
    gardenOwnerId,
    currentUserId,
    currentUsername,
  });

  function handleTileClick(gridX: number, gridY: number, hasPlant: boolean) {
    if (!isOwner) return;
    if (hasPlant) return;

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

    setPlants((prev) => [
      ...prev,
      {
        gridX: selectedTile.x,
        gridY: selectedTile.y,
        milestone: goal.current_milestone,
        title: goal.title,
        goalId: goal.id,
        asset_url: goal.asset_url,
      },
    ]);

    setShowPlantPicker(false);
    setSelectedTile(null);
    setPlacing(false);
  }

  function handleShareLink() {
    const url = `${window.location.origin}/garden/${gardenOwnerId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex justify-end relative z-10 pointer-events-none h-full">
      {/* Game Canvas */}
      <PhaserCanvas
        plants={plants}
        isOwner={isOwner}
        onTileClick={handleTileClick}
      />

      {/* Sidebar */}
      <div className="w-72 lg:w-80 space-y-4 pointer-events-auto max-h-full overflow-y-auto pr-2 pb-2">
        {/* Garden Info */}
        <div className="glass-card p-4">
          <h3 className="pixel-text-sm text-[var(--accent-green)] mb-2">
            {isOwner ? "Your Garden" : `${ownerName}'s Garden`}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {plants.length} plant{plants.length !== 1 ? "s" : ""} growing
          </p>

          {/* Share Link */}
          <button
            onClick={handleShareLink}
            className="mt-3 w-full btn-secondary !py-2 !text-[0.5rem] flex items-center justify-center gap-2"
          >
            {copied ? "✅ Copied!" : "🔗 Share Garden Link"}
          </button>
        </div>

        {/* Online Users */}
        <div className="glass-card p-4">
          <h3 className="pixel-text-sm text-[var(--text-secondary)] mb-3">
            🟢 Online ({onlineUsers.length + 1})
          </h3>
          <div className="space-y-2">
            {/* Current user */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-green)] to-[var(--accent-cyan)] flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">
                  {currentUsername.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-[var(--text-primary)]">
                {currentUsername}
              </span>
              <span className="pixel-text-sm text-[var(--text-muted)] ml-auto">
                (you)
              </span>
            </div>

            {/* Remote users */}
            {onlineUsers.map((user) => (
              <div key={user.userId} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-pink)] flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-[var(--text-primary)]">
                  {user.username}
                </span>
              </div>
            ))}
          </div>
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
                    {p.asset_url ? (
                      <img src={p.asset_url} alt="Tree" className="w-5 h-5 object-contain inline-block" style={{ imageRendering: 'pixelated' }} />
                    ) : p.milestone === "SEED"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-auto">
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
              Tile ({selectedTile?.x}, {selectedTile?.y}) — Choose a goal
            </p>

            {error && (
              <div className="p-2 mb-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {unplacedGoals.length === 0 ? (
              <p className="text-[var(--text-muted)] text-sm py-4 text-center">
                No eligible goals. Goals must reach Sprout stage (25%) first.
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
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="text-[var(--text-primary)] truncate block w-full text-sm font-medium pr-2">
                        {goal.asset_url ? (
                          <img src={goal.asset_url} alt="Tree" className="w-5 h-5 object-contain inline-block mr-2" style={{ imageRendering: 'pixelated' }} />
                        ) : (
                          <span className="mr-2">
                            {goal.current_milestone === "SEED"
                              ? "🌰"
                              : goal.current_milestone === "SPROUT"
                                ? "🌱"
                                : goal.current_milestone === "SAPLING"
                                  ? "🌿"
                                  : "🌳"}
                          </span>
                        )}
                        {goal.title}
                      </span>
                      <span className="pixel-text text-[8px] text-[var(--text-muted)] whitespace-nowrap">
                        {goal.current_milestone} · {goal.goal_type.replace("_", "-")}
                      </span>
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
