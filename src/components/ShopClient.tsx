"use client";

import { useState } from "react";
import { purchaseItem } from "@/app/actions/shop";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  item_type: string;
  texture_key: string;
}

interface InventoryItem {
  item_id: string;
  quantity: number;
  shop_items: {
    name: string;
    texture_key: string;
    item_type: string;
  };
}

interface ShopClientProps {
  items: ShopItem[];
  inventory: InventoryItem[];
  initialBalance: number;
}

export default function ShopClient({
  items,
  inventory,
  initialBalance,
}: ShopClientProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [localInventory, setLocalInventory] = useState(inventory);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase(item: ShopItem) {
    if (balance < item.price) {
      setError("Not enough currency to purchase this item.");
      return;
    }

    setPurchasing(item.id);
    setError(null);

    const result = await purchaseItem(item.id);

    if (result.error) {
      setError(result.error);
    } else {
      // Update local state for immediate feedback
      setBalance(result.newBalance);

      setLocalInventory((prev) => {
        const existing = prev.find((i) => i.item_id === item.id);
        if (existing) {
          return prev.map((i) =>
            i.item_id === item.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        } else {
          return [
            ...prev,
            {
              item_id: item.id,
              quantity: 1,
              shop_items: {
                name: item.name,
                texture_key: item.texture_key,
                item_type: item.item_type,
              },
            },
          ];
        }
      });
    }

    setPurchasing(null);
  }

  // Get emoji based on item type
  const getTypeEmoji = (type: string) => {
    switch (type) {
      case "DECORATION":
        return "🗿";
      case "SEED":
        return "🌰";
      case "THEME":
        return "🎨";
      default:
        return "📦";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Shop Catalog */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="pixel-text text-xl gradient-text mb-2">Shop</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Spend your hard-earned currency on seeds and decorations.
            </p>
          </div>
          <div className="glass-card px-4 py-2 flex items-center gap-2 border-[var(--accent-amber)]/30">
            <span className="text-xl">🪙</span>
            <span className="text-xl font-bold text-[var(--accent-amber)]">
              {balance}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-fade-in-up">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="glass-card p-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border-default)]">
                    <span className="text-xl">{getTypeEmoji(item.item_type)}</span>
                  </div>
                  <div>
                    <h3 className="pixel-text-sm text-[var(--text-primary)]">
                      {item.name}
                    </h3>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      {item.item_type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-bold text-[var(--accent-amber)]">
                  <span>🪙</span>
                  <span>{item.price}</span>
                </div>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-4 min-h-[40px]">
                {item.description}
              </p>

              <button
                onClick={() => handlePurchase(item)}
                disabled={purchasing === item.id || balance < item.price}
                className={`w-full !py-2 ${
                  balance >= item.price
                    ? "btn-primary"
                    : "btn-secondary opacity-50 cursor-not-allowed"
                }`}
              >
                {purchasing === item.id
                  ? "Buying..."
                  : balance >= item.price
                  ? "Purchase"
                  : "Not Enough 🪙"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Sidebar */}
      <div className="w-full lg:w-80 space-y-4">
        <div className="glass-card p-5 animate-fade-in-up delay-200">
          <h2 className="pixel-text-sm text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span>🎒</span> Your Inventory
          </h2>

          {localInventory.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              Your inventory is empty. Buy something from the shop!
            </p>
          ) : (
            <div className="space-y-3">
              {localInventory.map((inv) => (
                <div
                  key={inv.item_id}
                  className="flex items-center justify-between p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border-default)]"
                >
                  <div className="flex items-center gap-3">
                    <span>{getTypeEmoji(inv.shop_items.item_type)}</span>
                    <span className="text-sm text-[var(--text-primary)]">
                      {inv.shop_items.name}
                    </span>
                  </div>
                  <div className="bg-[var(--bg-primary)] px-2 py-1 rounded text-xs text-[var(--text-secondary)] font-bold">
                    x{inv.quantity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
