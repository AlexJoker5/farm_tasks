"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import eventBus from "@/game/bus/EventBus";



interface PresenceUser {
  userId: string;
  username: string;
  avatar: string;
}

interface UseRealtimeGardenOptions {
  gardenOwnerId: string;
  currentUserId: string | null;
  currentUsername: string;
}

export function useRealtimeGarden({
  gardenOwnerId,
  currentUserId,
  currentUsername,
}: UseRealtimeGardenOptions) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastBroadcast = useRef<number>(0);

  // Throttled position broadcast (60ms = ~16fps)
  const broadcastPosition = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - lastBroadcast.current < 60) return;
      lastBroadcast.current = now;

      if (channelRef.current && currentUserId) {
        channelRef.current.send({
          type: "broadcast",
          event: "player_move",
          payload: {
            userId: currentUserId,
            username: currentUsername,
            x,
            y,
          },
        });
      }
    },
    [currentUserId, currentUsername]
  );

  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createClient();
    const channelName = `garden:${gardenOwnerId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: currentUserId },
        broadcast: { self: false },
      },
    });

    // Handle presence sync
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const uniqueUsers = new Map<string, PresenceUser>();

      Object.values(state).forEach((presences) => {
        (presences as unknown as { userId: string; username: string; avatar?: string }[]).forEach((p) => {
          if (p.userId !== currentUserId) {
            uniqueUsers.set(p.userId, {
              userId: p.userId,
              username: p.username,
              avatar: p.avatar || "default",
            });
          }
        });
      });

      const users = Array.from(uniqueUsers.values());

      setOnlineUsers(users);

      // Tell Phaser about online users
      eventBus.next({
        type: "PRESENCE_SYNC",
        payload: { users },
      });
    });

    // Handle presence join
    channel.on("presence", { event: "join" }, ({ newPresences }) => {
      (newPresences as unknown as { userId: string; username: string }[]).forEach((p) => {
        if (p.userId !== currentUserId) {
          eventBus.next({
            type: "PLAYER_JOIN",
            payload: {
              userId: p.userId,
              username: p.username,
            },
          });
        }
      });
    });

    // Handle presence leave
    channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
      (leftPresences as unknown as { userId: string }[]).forEach((p) => {
        eventBus.next({
          type: "PLAYER_LEAVE",
          payload: { userId: p.userId },
        });
      });
    });

    channel.on("broadcast", { event: "player_move" }, ({ payload }) => {
      if (payload.userId !== currentUserId) {
        eventBus.next({
          type: "REMOTE_PLAYER_MOVE",
          payload: payload as unknown as Record<string, unknown>,
        });
      }
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          userId: currentUserId,
          username: currentUsername,
          avatar: "default",
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    // Listen for local player movement from Phaser to broadcast
    const moveSub = eventBus.subscribe((event) => {
      if (event.type === "LOCAL_PLAYER_MOVE" && event.payload) {
        broadcastPosition(
          event.payload.x as number,
          event.payload.y as number
        );
      }
    });

    return () => {
      moveSub.unsubscribe();
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [gardenOwnerId, currentUserId, currentUsername, broadcastPosition]);

  return { onlineUsers };
}
