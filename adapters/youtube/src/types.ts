/**
 * Interface genérica baseada na IFrame Player API.
 * Evita a obrigação de instalar @types/youtube no projeto final.
 */
export interface YouTubePlayerLike {
  getPlayerState(): number;
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setPlaybackRate(suggestedRate: number): void;
  getPlaybackRate(): number;
  getAvailablePlaybackRates(): number[];
  playVideo(): void;
  pauseVideo(): void;
}

export interface YouTubeAdapterOptions {
  pollIntervalMs?: number;    // Frequência do loop de checagem (padrão: 1000ms)
  seekThresholdSec?: number;  // Limite tolerado na largada do buffer (padrão: 0.4s)
}