export interface TimelineState {
  isPlaying: boolean;
  anchorTimeMs: number;
  pausedPositionSec: number;
}

export interface SyncEngineConfig {
  slewMinDriftSec: number;
  slewMaxDriftSec: number;
  deadbandSec: number;
  seekCooldownMs: number;
  slewRateDifferential: number;
}

export type SyncAction =
  | { type: 'IN_SYNC' }
  | { type: 'SLEW'; targetRate: number; durationMs: number }
  | { type: 'HARD_SEEK'; targetPositionSec: number }
  | { type: 'WAITING_COOLDOWN' };