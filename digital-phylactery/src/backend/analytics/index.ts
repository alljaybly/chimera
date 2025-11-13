// Main Adaptive UI Engine
export { AdaptiveUIEngine } from './AdaptiveUIEngine.js';

// Core Systems
export { BehavioralHookSystem } from './BehavioralHookSystem.js';
export { PatternDetector } from './PatternDetector.js';
export { UIMutationSystem } from './UIMutationSystem.js';
export { MutationHistoryManager } from './MutationHistoryManager.js';
export { MutationLoader } from './MutationLoader.js';

// Types
export type {
  ActionSequencePattern,
  FrequentAccessPattern,
  LayoutPreferencePattern
} from './PatternDetector.js';

export type {
  ReorderParameters,
  ResizeParameters,
  HideParameters,
  ShowParameters,
  ShortcutParameters
} from './UIMutationSystem.js';

export type {
  UIStateSnapshot
} from './MutationHistoryManager.js';

export type {
  LoadResult
} from './MutationLoader.js';
