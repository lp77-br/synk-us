import { SyncEngine, SyncAction, SyncClock } from '@synkus/core';
import { GenericAdapterCallbacks, GenericAdapterOptions } from './types';

export * from './types';

export class GenericSyncAdapter {
  private engine: SyncEngine;
  private clock: SyncClock;
  private callbacks: GenericAdapterCallbacks;
  private options: Required<GenericAdapterOptions>;

  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private slewTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    engine: SyncEngine,
    clock: SyncClock,
    callbacks: GenericAdapterCallbacks,
    options?: GenericAdapterOptions
  ) {
    this.engine = engine;
    this.clock = clock;
    this.callbacks = callbacks;
    this.options = {
      pollIntervalMs: 1000,
      seekThresholdSec: 0.4,
      ...options
    };
  }

  // Start periodic sync checks | Inicia checagens periódicas de sincronia
  public start(): void {
    this.stop();
    this.syncInterval = setInterval(() => this.tick(), this.options.pollIntervalMs);
  }

  // Stop sync and reset rate | Para sincronia e reseta taxa
  public stop(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.resetSlew();
  }

  // Schedule synchronized playback start | Agenda início sincronizado da reprodução
  public schedulePlay(targetTimestampUTC: number): void {
    this.resetSlew();
    const delayMs = targetTimestampUTC - this.clock.now();

    const execute = () => {
      const nowCalibrated = this.clock.now();
      const expectedSec = this.engine.getTargetPosition(nowCalibrated);
      const state = this.callbacks.getState();

      // Avoid seek if drift is within threshold | Evita seek se desvio estiver dentro do limite
      if (Math.abs(state.currentTimeSec - expectedSec) > this.options.seekThresholdSec) {
        this.callbacks.onSeek(expectedSec);
      }
      
      this.callbacks.onPlay();
      this.start();
    };

    if (delayMs > 0) {
      setTimeout(execute, delayMs);
    } else {
      execute();
    }
  }

  private tick(): void {
    const state = this.callbacks.getState();
    if (!state.isPlaying) return;

    const action = this.engine.evaluate(state.currentTimeSec, this.clock.now());
    this.handleAction(action);
  }

  private handleAction(action: SyncAction): void {
    switch (action.type) {
      case 'IN_SYNC':
      case 'WAITING_COOLDOWN':
        break;

      case 'HARD_SEEK':
        this.resetSlew();
        this.callbacks.onSeek(action.targetPositionSec);
        break;

      case 'SLEW':
        this.applySlew(action.targetRate, action.durationMs);
        break;
    }
  }

  // Apply temporary rate change to recover drift | Aplica taxa temporária para recuperar desvio
  private applySlew(targetRate: number, durationMs: number): void {
    this.engine.setSlewingState(true);
    this.callbacks.onSetRate(targetRate);

    if (this.slewTimeout) clearTimeout(this.slewTimeout);

    this.slewTimeout = setTimeout(() => {
      this.resetSlew();
    }, durationMs);
  }

  // Reset playback rate back to 1.0x | Retorna velocidade para 1.0x
  private resetSlew(): void {
    if (this.slewTimeout) clearTimeout(this.slewTimeout);
    this.engine.setSlewingState(false);
    this.callbacks.onSetRate(1.0);
  }
}