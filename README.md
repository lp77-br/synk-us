\# SynkUs



Deterministic timeline synchronization suite for multi-client web environments.



SynkUs provides sub-second time calibration and drift correction across different media players, WebSockets, HTML5 video/audio, and custom canvas loops.



\---



\## Architecture



\* \*\*`@synkus/core`\*\*: Deterministic timeline engine, NTP-based clock calibration, and drift correction evaluation.

\* \*\*`@synkus/adapter-youtube`\*\*: Adapter for the YouTube IFrame Player API.

\* \*\*`@synkus/adapter-html5`\*\*: Native HTML5 `<video>` and `<audio>` synchronization.

\* \*\*`@synkus/adapter-generic`\*\*: Callback-driven engine for custom game loops, HTML Canvas, WebAudio, or slide decks.



\---



\## Drift Correction Strategy



1\. \*\*Deadband (< 0.15s):\*\* Discrepancy is ignored to avoid audio micro-stuttering.

2\. \*\*Clock Slewing (0.2s - 5.0s):\*\*

&#x20;  \* Small drift (0.2s to 2.0s): rate scaled to 1.25x (or 0.75x) to recover sync smoothly.

&#x20;  \* Medium drift (2.0s to 5.0s): rate scaled to 1.5x (or 0.5x) to cut recovery time in half.

3\. \*\*Hard Seek (> 5.0s):\*\* Forces instantaneous seek with an 8-second cooldown lock to prevent seeking loops.



\---



\## Installation \& Build



```bash

git clone \[https://github.com/lp77-br/synk-us.git](https://github.com/lp77-br/synk-us.git)

cd synk-us

npm install

npm run build

npm test

