const { SyncEngine, SyncClock } = require('./packages/core/dist/index.js');
const { YouTubeSyncAdapter } = require('./adapters/youtube/dist/index.js');
const { HTML5SyncAdapter } = require('./adapters/html5/dist/index.js');
const { GenericSyncAdapter } = require('./adapters/generic/dist/index.js');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ OK: ${message}`);
  }
}

const clock = new SyncClock();
const engine = new SyncEngine();
const now = 1_000_000;

// O SEGREDO DO TESTE: Travar o relógio no tempo simulado
clock.now = () => now;

// Timeline playing, started 50s ago | Timeline tocando, iniciada há 50s
engine.setState({
  isPlaying: true,
  anchorTimeMs: now - 50_000,
  pausedPositionSec: 0
});

console.log('\n[TEST ENGINE SETUP]');
console.log(` -> Clock Now: ${now}ms`);
console.log(` -> Anchor UTC: ${now - 50_000}ms`);
console.log(` -> Expected Timeline Position: 50.00s`);

console.log('\n=============================================');
console.log('▶️  TEST 1: YOUTUBE ADAPTER');
console.log('=============================================');
let ytRate = 1.0;
let ytSeekedTo = null;

const mockYtPlayer = {
  getPlayerState: () => 1,
  getCurrentTime: () => 45.0, // 5s atrasado | 5s behind
  seekTo: (sec) => { ytSeekedTo = sec; },
  setPlaybackRate: (rate) => { ytRate = rate; },
  getPlaybackRate: () => ytRate,
  getAvailablePlaybackRates: () => [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
  playVideo: () => {},
  pauseVideo: () => {}
};

console.log(' -> Simulating Drift: +5.0s (Player at 45.00s)');
const ytAdapter = new YouTubeSyncAdapter(mockYtPlayer, engine, clock);
ytAdapter['tick'](); // invocation for testing | invocação para teste

console.log(' -> Output Metrics:');
console.log(`    - Action Taken: HARD_SEEK`);
console.log(`    - Seeked To   : ${ytSeekedTo}s`);
console.log(`    - Rate Set    : ${ytRate}x`);
assert(ytSeekedTo === 50, 'YouTube adapter executed hard seek to projected 50s');

console.log('\n=============================================');
console.log('🎵 TEST 2: HTML5 ADAPTER');
console.log('=============================================');
let html5SeekedTo = null;
let html5Rate = 1.0;

const mockHtml5Media = {
  paused: false,
  ended: false,
  play: async () => {}
};

// Mock properties | Propriedades mockadas
Object.defineProperty(mockHtml5Media, 'currentTime', {
  get: () => 49.5, // 0.5s atrasado | 0.5s behind
  set: (val) => { html5SeekedTo = val; }
});
Object.defineProperty(mockHtml5Media, 'playbackRate', {
  get: () => html5Rate,
  set: (val) => { html5Rate = val; }
});

console.log(' -> Simulating Drift: +0.5s (Player at 49.50s)');
const html5Adapter = new HTML5SyncAdapter(mockHtml5Media, engine, clock);
engine.setSlewingState(false);
html5Adapter['tick']();

console.log(' -> Output Metrics:');
console.log(`    - Action Taken: SLEW (Accelerate)`);
console.log(`    - Seeked To   : ${html5SeekedTo !== null ? html5SeekedTo + 's' : 'N/A (Skipped)'}`);
console.log(`    - Rate Set    : ${html5Rate}x`);
assert(html5Rate === 1.25, 'HTML5 adapter adjusted playbackRate to 1.25x for slewing');

console.log('\n=============================================');
console.log('🎮 TEST 3: GENERIC ADAPTER');
console.log('=============================================');
let genericSeeked = null;
let genericRate = null;

const genericCallbacks = {
  onSeek: (pos) => { genericSeeked = pos; },
  onSetRate: (rate) => { genericRate = rate; },
  onPlay: () => {},
  getState: () => ({ currentTimeSec: 50.4, isPlaying: true }) // 0.4s adiantado | 0.4s ahead
};

console.log(' -> Simulating Drift: -0.4s (Player at 50.40s)');
const genericAdapter = new GenericSyncAdapter(engine, clock, genericCallbacks);
engine.setSlewingState(false);
genericAdapter['tick']();

console.log(' -> Output Metrics:');
console.log(`    - Action Taken: SLEW (Brake)`);
console.log(`    - Seeked To   : ${genericSeeked !== null ? genericSeeked + 's' : 'N/A (Skipped)'}`);
console.log(`    - Rate Set    : ${genericRate}x`);
assert(genericRate === 0.75, 'Generic adapter adjusted playbackRate to 0.75x to brake');

console.log('\n🎉 ALL 3 ADAPTERS PASSED COMPATIBILITY TESTS!\n');