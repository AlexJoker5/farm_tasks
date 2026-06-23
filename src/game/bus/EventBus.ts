import { Subject } from "rxjs";

/**
 * EventBus — Cross-framework communication bridge.
 *
 * This singleton RxJS Subject lives outside both the React tree and
 * Phaser's scene graph. It enables decoupled, bidirectional messaging:
 *
 * React → Phaser:
 *   eventBus.next({ type: 'PLACE_PLANT', payload: { goalId, x, y } })
 *
 * Phaser → React:
 *   eventBus.next({ type: 'TILE_CLICKED', payload: { x, y } })
 *
 * Subscribers filter by `type` to handle only relevant events.
 */

export interface GameEvent {
  type: string;
  payload?: Record<string, unknown>;
}

// Singleton instance — shared across the entire application
const eventBus = new Subject<GameEvent>();

export default eventBus;
