# 🎧 SynkUs

Deterministic timeline synchronization suite for multi-client web environments.  
*Suíte de sincronização determinística de linha do tempo para clientes web.*

[![Discord](https://img.shields.io/badge/Discord-Join%20Community-5865F2?style=flat&logo=discord&logoColor=white)](https://discord.gg/anajUFDRR5)
[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/lp77-br/synk-us?color=emerald)](https://github.com/lp77-br/synk-us/releases)

---

> ⚠️ **Project Status / Status do Projeto**  
> **EN:** This library is currently in **Beta (v0.1.0)**. It is provided **"as-is"** and is **not actively maintained with regular updates**. It is stable for personal and community setups, but feel free to fork, customize, or submit pull requests.  
> **PT-BR:** Esta biblioteca encontra-se em estágio **Beta (v0.1.0)**. O projeto é fornecido **"como está" (as-is)** e **não recebe atualizações frequentes ou manutenção ativa**. Encontra-se funcional para uso próprio e comunitário, mas sinta-se livre para criar forks e adaptar conforme sua necessidade.

---

## 🌐 English

### Overview
SynkUs delivers sub-second time calibration and drift correction across multiple players, WebSockets, HTML5 video/audio elements, and custom canvas/game loops. It relies on an NTP-style offset calculation to ensure every connected client stays in sync with zero noticeable stuttering.

### Architecture
* **`@synkus/core`**: Timeline engine, NTP clock calibration (`SyncClock`), and deterministic evaluation loop (`SyncEngine`).
* **`@synkus/adapter-youtube`**: Dedicated adapter for the YouTube IFrame API featuring adaptive playback-rate slewing and seek guards.
* **`@synkus/adapter-html5`**: Synchronization wrapper for standard HTML5 `<video>` and `<audio>` tags.
* **`@synkus/adapter-generic`**: Agnostic callback interface for Canvas rendering, game loops, WebAudio, or slide decks.

### Drift Correction Strategy
The engine continuously compares current player time against calibrated timeline targets:
1. **Deadband (< 0.15s):** Discrepancies below 150ms are ignored to prevent audio micro-stutters and buffer thrashing.
2. **Clock Slewing (0.2s - 5.0s):**
   * **Small drift (0.2s to 2.0s):** Playback rate shifts to `1.25x` (or `0.75x`) to eliminate drift seamlessly.
   * **Medium drift (2.0s to 5.0s):** Playback rate shifts to `1.5x` (or `0.5x`), cutting recovery duration by half.
3. **Hard Seek (> 5.0s):** Triggers an immediate seek with an 8-second cooldown lock to stop seeking loops during stalls.

### Quickstart (Pre-built Release)
Download the pre-compiled bundle from the [Releases](https://github.com/lp77-br/synk-us/releases) page (`synkus-v0.1.0-dist.zip`), extract it to your project, and import directly:

```html
<script type="module">
  import { SyncEngine, SyncClock } from './vendor/synkus/core/index.esm.js';
  import { YouTubeSyncAdapter } from './vendor/synkus/youtube/index.esm.js';

  const clock = new SyncClock();
  const engine = new SyncEngine({ slewMaxDriftSec: 5.0 });
  const adapter = new YouTubeSyncAdapter(player, engine, clock);

  // Calibrate with server NTP ping/pong
  clock.calibrate(clientSendTime, serverTime);

  // Schedule synced playback anchored at target UTC timestamp
  adapter.schedulePlay(targetTimestampUTC);
</script>

```

---

## 🇧🇷 Português

### Visão Geral

O SynkUs oferece calibração de tempo em subsegundos e correção automática de desvio (*drift*) entre múltiplos clientes. Projetado para funcionar com WebSockets, YouTube IFrame API, tags de mídia nativas do HTML5 e loops customizados de Canvas/jogos, o motor utiliza cálculo de tempo absoluto inspirado no protocolo NTP.

### Arquitetura

* **`@synkus/core`**: Motor matemático determinístico, relógio calibrado (`SyncClock`) e avaliador de estado de sincronia (`SyncEngine`).
* **`@synkus/adapter-youtube`**: Adaptador para o YouTube IFrame API com aceleração de velocidade suave (*slewing*) e proteção contra engasgos de buffer.
* **`@synkus/adapter-html5`**: Sincronização nativa para tags `<video>` e `<audio>`.
* **`@synkus/adapter-generic`**: Adaptador desacoplado via callbacks para Canvas, jogos, áudio procedural ou apresentações de slides.

### Estratégia de Recuperação de Sincronia

1. **Deadband (< 0.15s):** Diferenças menores que 150ms são ignoradas para evitar picotamento no áudio.
2. **Correção Suave / Slewing (0.2s a 5.0s):**
* **Atraso leve (0.2s a 2.0s):** Ajusta a velocidade para `1.25x` (ou `0.75x`) até zerar o desvio sem pausas.
* **Atraso médio (2.0s a 5.0s):** Ajusta a velocidade para `1.5x` (ou `0.5x`), cortando o tempo de recuperação pela metade.


3. **Salto Forçado / Hard Seek (> 5.0s):** Aplica seek instantâneo na âncora correta com cooldown de 8 segundos para prevenir loops de carregamento.

---

## 💬 Community & Support

Dúvidas ou discussões sobre o projeto:

👉 **[Entrar no Servidor do Discord](https://discord.gg/anajUFDRR5)**

---

## 📄 License

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](https://github.com/lp77-br/synk-us/blob/main/LICENSE) para mais detalhes.