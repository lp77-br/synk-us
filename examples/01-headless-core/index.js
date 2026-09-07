const { SyncEngine, SyncClock } = require('../../packages/core/dist/index.js');

const clock = new SyncClock();
const engine = new SyncEngine();

// Simulate NTP ping | Simula ping NTP
const pingStart = Date.now();
setTimeout(() => {
  // Simulate 80ms RTT | Simula RTT de 80ms
  clock.calibrate(pingStart, Date.now() - 40);
  console.log(`[Clock] Calibrated. RTT: ${clock.getRtt()}ms | Offset: ${clock.getOffset()}ms`);
}, 80);

// Set timeline state | Define estado da timeline
engine.setState({
  isPlaying: true,
  anchorTimeMs: Date.now() - 10000,
  pausedPositionSec: 0
});

// Manual evaluation loop | Loop manual de avaliação
setInterval(() => {
  const nowCalibrated = clock.now();
  const projectedSec = engine.getTargetPosition(nowCalibrated);

  // Hypothetical local player | Player local hipotético
  const simulatedLocalPlayerTime = 9.2; 
  const action = engine.evaluate(simulatedLocalPlayerTime, nowCalibrated);

  console.log(`[Timeline] Target: ${projectedSec.toFixed(2)}s | Action: ${action.type}`);
}, 2000);