import { SyncEngine, SyncAction, SyncClock } from '@synkus/core';
import { HTML5AdapterOptions } from './types';

export * from './types';

export class HTML5SyncAdapter {
  private media: HTMLMediaElement;
  private engine: SyncEngine;
  private clock: SyncClock;
  private options: Required<HTML5AdapterOptions>;

  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private slewTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    media: HTMLMediaElement,
    engine: SyncEngine,
    clock: SyncClock,
    options?: HTML5AdapterOptions
  ) {
    this.media = media;
    this.engine = engine;
    this.clock = clock;
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

    const execute = async () => {
      const nowCalibrated = this.clock.now();
      const expectedSec = this.engine.getTargetPosition(nowCalibrated);
      const currentSec = this.media.currentTime;

      // Avoid seek if drift is within threshold | Evita seek se desvio estiver dentro do limite
      if (Math.abs(currentSec - expectedSec) > this.options.seekThresholdSec) {
        this.media.currentTime = expectedSec;
      }
      
      try {
        await this.media.play();
        this.start();
      } catch {
        // Silently catch autoplay policy errors | Trata erros de política de autoplay silenciosamente
      }
    };

    if (delayMs > 0) {
      setTimeout(execute, delayMs);
    } else {
      execute();
    }
  }

  private tick(): void {
    if (this.media.paused || this.media.ended) return;

    const action = this.engine.evaluate(this.media.currentTime, this.clock.now());
    this.handleAction(action);
  }

  private handleAction(action: SyncAction): void {
    switch (action.type) {
      case 'IN_SYNC':
      case 'WAITING_COOLDOWN':
        break;

      case 'HARD_SEEK':
        this.resetSlew();
        this.media.currentTime = action.targetPositionSec;
        break;

      case 'SLEW':
        this.applySlew(action.targetRate, action.durationMs);
        break;
    }
  }

  // Apply temporary rate change to recover drift | Aplica taxa temporária para recuperar desvio
  private applySlew(targetRate: number, durationMs: number): void {
    this.engine.setSlewingState(true);
    this.media.playbackRate = targetRate;

    if (this.slewTimeout) clearTimeout(this.slewTimeout);

    this.slewTimeout = setTimeout(() => {
      this.resetSlew();
    }, durationMs);
  }

  // Reset playback rate back to 1.0x | Retorna velocidade para 1.0x
  private resetSlew(): void {
    if (this.slewTimeout) clearTimeout(this.slewTimeout);
    this.engine.setSlewingState(false);
    
    if (this.media.playbackRate !== 1.0) {
      this.media.playbackRate = 1.0;
    }
  }
}