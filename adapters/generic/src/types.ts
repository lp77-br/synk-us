export interface GenericPlayerState {
  // Current playback position in seconds | Posição atual de reprodução em segundos
  currentTimeSec: number;
  // Playback active state | Estado de reprodução ativa
  isPlaying: boolean;
}

export interface GenericAdapterCallbacks {
  // Seek media to target seconds | Pula a mídia para os segundos alvo
  onSeek: (positionSec: number) => void;
  // Set media playback rate | Define a velocidade de reprodução da mídia
  onSetRate: (rate: number) => void;
  // Start media playback | Inicia a reprodução da mídia
  onPlay: () => void;
  // Sample current state | Lê o estado atual
  getState: () => GenericPlayerState;
}

export interface GenericAdapterOptions {
  // Polling interval in ms (default: 1000ms) | Intervalo de checagem em ms (padrão: 1000ms)
  pollIntervalMs?: number;
  // Discrepancy threshold before seek on play (default: 0.4s) | Limite tolerado antes de seek no play (padrão: 0.4s)
  seekThresholdSec?: number;
}