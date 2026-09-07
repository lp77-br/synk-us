export class SyncClock {
  private offsetMs: number = 0;
  private lastRttMs: number = 0;

  public calibrate(clientT0: number, serverT1: number): void {
    if (!Number.isFinite(clientT0) || !Number.isFinite(serverT1)) return;

    const clientT2 = Date.now();
    const rtt = Math.max(0, clientT2 - clientT0);
    
    this.offsetMs = (serverT1 + (rtt / 2)) - clientT2;
    this.lastRttMs = rtt;
  }

  public now(): number {
    return Date.now() + this.offsetMs;
  }

  public getOffset(): number {
    return this.offsetMs;
  }

  public getRtt(): number {
    return this.lastRttMs;
  }
}