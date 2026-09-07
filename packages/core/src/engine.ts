import { TimelineState, SyncEngineConfig, SyncAction } from './types';

export class SyncEngine {
  private state: TimelineState | null = null;
  private config: SyncEngineConfig;
  private lastHardSeekTimeMs: number = 0;
  private isSlewing: boolean = false;

  constructor(customConfig?: Partial<SyncEngineConfig>) {
    this.config = {
      slewMinDriftSec: 0.2,
      slewMaxDriftSec: 3,
      deadbandSec: 0.15,
      seekCooldownMs: 8000,
      slewRateDifferential: 0.25,
      ...customConfig
    };
  }

  public setState(newState: TimelineState): void {
    this.state = newState;
    this.isSlewing = false;
  }

  public setSlewingState(active: boolean): void {
    this.isSlewing = active;
  }

  public getTargetPosition(nowCalibratedMs: number): number {
    if (!this.state) return 0;
    if (!this.state.isPlaying) return this.state.pausedPositionSec;

    const elapsedSec = (nowCalibratedMs - this.state.anchorTimeMs) / 1000;
    return Math.max(0, elapsedSec);
  }

  public evaluate(actualPositionSec: number, nowCalibratedMs: number): SyncAction {
    if (!this.state || !this.state.isPlaying || !Number.isFinite(actualPositionSec)) {
      return { type: 'IN_SYNC' };
    }

    const expectedPositionSec = this.getTargetPosition(nowCalibratedMs);
    const driftSec = expectedPositionSec - actualPositionSec;
    const absDrift = Math.abs(driftSec);

    if (absDrift < this.config.deadbandSec) {
      return { type: 'IN_SYNC' };
    }

    if (absDrift > this.config.slewMaxDriftSec) {
      const localNow = Date.now();
      if (localNow - this.lastHardSeekTimeMs > this.config.seekCooldownMs) {
        this.lastHardSeekTimeMs = localNow;
        this.isSlewing = false;
        return { type: 'HARD_SEEK', targetPositionSec: expectedPositionSec };
      }
      return { type: 'WAITING_COOLDOWN' };
    }

    if (absDrift >= this.config.slewMinDriftSec && !this.isSlewing) {
      const targetRate = driftSec > 0 
        ? 1.0 + this.config.slewRateDifferential 
        : 1.0 - this.config.slewRateDifferential;
        
      const durationMs = Math.round((absDrift / this.config.slewRateDifferential) * 1000);

      return { type: 'SLEW', targetRate, durationMs };
    }

    return { type: 'IN_SYNC' };
  }
}