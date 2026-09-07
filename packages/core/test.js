const { SyncEngine, SyncClock } = require('./dist/index.js');

console.log('\n=============================================');
console.log('🕒 TESTE 1: SYNC CLOCK (NTP / LATÊNCIA)');
console.log('=============================================');
const clock = new SyncClock();

const t0 = Date.now();
// Simula que o pacote levou 100ms para ir e voltar, e o servidor respondeu no meio
clock.calibrate(t0 - 100, t0 - 50); 
console.log('Métricas Calculadas:');
console.log(` -> Offset (Desvio do Servidor): ${clock.getOffset()}ms`);
console.log(` -> RTT (Tempo de Ida e Volta):  ${clock.getRtt()}ms`);
console.log(` -> Timestamp Local:           ${Date.now()}`);
console.log(` -> Timestamp Calibrado:       ${clock.now()}`);

console.log('\n=============================================');
console.log('⚙️ TESTE 2: SYNC ENGINE (ESTADO E MATEMÁTICA)');
console.log('=============================================');
const engine = new SyncEngine({
  deadbandSec: 0.15,
  slewMinDriftSec: 0.20,
  slewMaxDriftSec: 1.20,
  seekCooldownMs: 8000,
  slewRateDifferential: 0.25
});

// Congelamos o tempo do universo em 1 milhão para ter previsibilidade matemática
const now = 1_000_000; 

console.log('\n[Cenário A: Linha do tempo pausada em 10.00s]');
engine.setState({ isPlaying: false, anchorTimeMs: 0, pausedPositionSec: 10 });
console.log(` -> Tempo Esperado: ${engine.getTargetPosition(now).toFixed(2)}s`);
console.log(` -> Saída do Motor:`, engine.evaluate(10, now));

console.log('\n[Cenário B: Tocando perfeitamente sincronizado]');
// A âncora foi plantada exatamente 50.000ms atrás
engine.setState({ isPlaying: true, anchorTimeMs: now - 50000, pausedPositionSec: 0 });
console.log(` -> Tempo Esperado: ${engine.getTargetPosition(now).toFixed(2)}s`);
console.log(` -> Saída do Motor:`, engine.evaluate(50, now));

console.log('\n[Cenário C: Zona Morta (Atraso imperceptível de 100ms)]');
console.log(` -> Posição do Player: 49.90s (Drift: +0.10s)`);
console.log(` -> Saída do Motor:`, engine.evaluate(49.9, now));

console.log('\n[Cenário D: Slewing Acelerando (Atraso de 500ms)]');
console.log(` -> Posição do Player: 49.50s (Drift: +0.50s)`);
console.log(` -> Matemática esperada: (0.50 / 0.25) * 1000 = 2000ms`);
console.log(` -> Saída do Motor:`, engine.evaluate(49.5, now));

console.log('\n[Cenário E: Slewing Freando (Adiantado em 400ms)]');
console.log(` -> Posição do Player: 50.40s (Drift: -0.40s)`);
console.log(` -> Matemática esperada: (0.40 / 0.25) * 1000 = 1600ms`);
engine.setSlewingState(false); // Reseta o estado para forçar nova avaliação
console.log(` -> Saída do Motor:`, engine.evaluate(50.4, now));

console.log('\n[Cenário F: Erro Crítico / Travamento (Atraso de 5 segundos)]');
console.log(` -> Posição do Player: 45.00s (Drift: +5.00s)`);
engine.setSlewingState(false);
console.log(` -> Saída do Motor:`, engine.evaluate(45.0, now));

console.log('\n[Cenário G: Anti-Spam (Player ainda relata atraso pós-Seek)]');
console.log(` -> Posição do Player: 45.00s (Cooldown de 8s ativo)`);
console.log(` -> Saída do Motor:`, engine.evaluate(45.0, now));

console.log('\n[Cenário H: Segurança contra Player quebrado (Retornando NaN)]');
console.log(` -> Posição do Player: NaN (ex: carregando buffer vazio)`);
console.log(` -> Saída do Motor:`, engine.evaluate(NaN, now));
console.log('\n=============================================\n');