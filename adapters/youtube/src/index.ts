import { SyncEngine, SyncAction, SyncClock } from '@synkus/core';
import { YouTubePlayerLike, YouTubeAdapterOptions } from './types';

export * from './types';

export class YouTubeSyncAdapter {
  private player: YouTubePlayerLike;
  private engine: SyncEngine;
  private clock: SyncClock;
  private options: Required<YouTubeAdapterOptions>;

  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private slewTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    player: YouTubePlayerLike,
    engine: SyncEngine,
    clock: SyncClock,
    options?: YouTubeAdapterOptions
  ) {
    this.player = player;
    this.engine = engine;
    this.clock = clock;
    this.options = {
      pollIntervalMs: 1000,
      seekThresholdSec: 0.4,
      ...options
    };
  }

  // Start drift monitoring loop | Inicia o loop de monitoramento de drift
  public start(): void {
    this.stop();
    this.syncInterval = setInterval(() => this.tick(), this.options.pollIntervalMs);
  }

  // Stop monitoring and reset playback rate | Interrompe o monitoramento e reseta a velocidade
  public stop(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.resetSlew();
  }

  // Schedule playback at target UTC timestamp | Agenda a reprodução no timestamp UTC alvo
  public schedulePlay(targetTimestampUTC: number): void {
    this.resetSlew();
    const delayMs = targetTimestampUTC - this.clock.now();

    const execute = () => {
      const nowCalibrated = this.clock.now();
      const expectedSec = this.engine.getTargetPosition(nowCalibrated);
      const currentSec = this.player.getCurrentTime() || 0;

      // Avoid visual seek if initial drift is minimal | Evita seek visual se desvio inicial for mínimo
      if (Math.abs(currentSec - expectedSec) > this.options.seekThresholdSec) {
        this.player.seekTo(expectedSec, true);
      }
      
      this.player.playVideo();
      this.start();
    };

    // Wait for target timestamp or execute immediately | Aguarda o timestamp alvo ou executa imediatamente
    if (delayMs > 0) {
      setTimeout(execute, delayMs);
    } else {
      execute();
    }
  }

  private tick(): void {
    // Skip evaluation if player is not playing (1 = PLAYING) | Ignora avaliação se player não estiver tocando (1 = PLAYING)
    if (this.player.getPlayerState() !== 1) return;

    const currentSec = this.player.getCurrentTime();
    const action = this.engine.evaluate(currentSec, this.clock.now());

    this.handleAction(action);
  }

  private handleAction(action: SyncAction): void {
    switch (action.type) {
      case 'IN_SYNC':
      case 'WAITING_COOLDOWN':
        break;

      case 'HARD_SEEK':
        this.resetSlew();
        this.player.seekTo(action.targetPositionSec, true);
        break;

      case 'SLEW':
        this.applySlew(action.targetRate, action.durationMs);
        break;
    }
  }

  private applySlew(targetRate: number, durationMs: number): void {
    let finalRate = targetRate;
    let finalDuration = durationMs;

    // Scale rate to 1.5x/0.5x if drift exceeds 2s (>8000ms duration) | Escala taxa para 1.5x/0.5x se desvio passar de 2s (>8000ms de duração)
    if (durationMs > 8000) {
      finalRate = targetRate > 1 ? 1.5 : 0.5;
      finalDuration = Math.round(durationMs / 2);
    }

    const availableRates = this.player.getAvailablePlaybackRates() || [1];
    
    // Abort if player does not support target rate | Aborta se o player não suportar a taxa solicitada
    if (!availableRates.includes(finalRate)) return;

    this.engine.setSlewingState(true);

    try {
      this.player.setPlaybackRate(finalRate);
    } catch {}

    if (this.slewTimeout) clearTimeout(this.slewTimeout);

    // Restore baseline rate when drift recovery finishes | Restaura taxa padrão ao concluir recuperação do desvio
    this.slewTimeout = setTimeout(() => {
      this.resetSlew();
    }, finalDuration);
  }

  // Restore playback rate to 1.0x | Restaura taxa de reprodução para 1.0x
  private resetSlew(): void {
    if (this.slewTimeout) clearTimeout(this.slewTimeout);
    this.engine.setSlewingState(false);

    try {
      if (this.player.getPlaybackRate() !== 1) {
        this.player.setPlaybackRate(1);
      }
    } catch {}
  }
}