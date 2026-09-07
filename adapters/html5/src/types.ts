export interface HTML5AdapterOptions {
  // Polling interval in ms (default: 1000ms) | Intervalo de checagem em ms (padrão: 1000ms)
  pollIntervalMs?: number;
  // Discrepancy threshold before seek on play (default: 0.4s) | Limite tolerado antes de seek no play (padrão: 0.4s)
  seekThresholdSec?: number;
}