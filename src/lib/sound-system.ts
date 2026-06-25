'use client';

class SoundSystem {
  private audioCtx: AudioContext | null = null;

  private init() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            this.audioCtx = new AudioContextClass();
        }
    }
    if (this.audioCtx?.state === 'suspended') {
        this.audioCtx.resume();
    }
  }

  playRequestSound() {
    this.init();
    if (!this.audioCtx) return;
    
    // Play a friendly, alerting two-tone chime
    const t = this.audioCtx.currentTime;
    this.playTone(440, 'sine', t, 0.1);      // A4
    this.playTone(554.37, 'sine', t + 0.15, 0.3); // C#5
  }

  playSuccessSound() {
    this.init();
    if (!this.audioCtx) return;
    
    // Play an uplifting, pleasant chord
    const t = this.audioCtx.currentTime;
    this.playTone(523.25, 'sine', t, 0.1);      // C5
    this.playTone(659.25, 'sine', t + 0.1, 0.1); // E5
    this.playTone(783.99, 'sine', t + 0.2, 0.3); // G5
  }

  playRejectSound() {
    this.init();
    if (!this.audioCtx) return;
    
    // Play a gentle descending tone
    const t = this.audioCtx.currentTime;
    this.playTone(349.23, 'triangle', t, 0.15); // F4
    this.playTone(329.63, 'triangle', t + 0.2, 0.3); // E4
  }

  private playTone(freq: number, type: OscillatorType, time: number, duration: number) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.3, time + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    osc.start(time);
    osc.stop(time + duration);
  }

  vibrate(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
  }
}

export const soundSystem = new SoundSystem();
