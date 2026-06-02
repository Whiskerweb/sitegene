// Génère une bande-son ORIGINALE + des SFX en WAV (libres de droits, auto-contenus).
// Aucune dépendance : synthèse PCM 16-bit mono 44100 Hz.
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SR = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "audio");
mkdirSync(join(OUT, "sfx"), { recursive: true });

const clamp = (x) => Math.max(-1, Math.min(1, x));
function writeWav(path, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(clamp(samples[i]) * 32767), 44 + i * 2);
  writeFileSync(path, buf);
}
const note = (s) => 440 * Math.pow(2, s / 12);
const N = {
  C3: note(-21), E3: note(-17), G3: note(-14), A3: note(-12),
  C4: note(-9), D4: note(-7), E4: note(-5), F4: note(-4), G4: note(-2),
  A4: note(0), B4: note(2), C5: note(3), D5: note(5), E5: note(7), G5: note(10),
};

function buildTrack() {
  const dur = 21.6;
  const len = Math.floor(SR * dur);
  const out = new Float32Array(len);
  const chords = [
    [N.C3, N.E3, N.G3, N.C4],
    [N.G3, N.B4 / 2, N.D4, N.G4],
    [N.A3, N.C4, N.E4, N.A4],
    [N.F4 / 2, N.A3, N.C4, N.F4],
  ];
  const chordDur = 2.6;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const ci = Math.floor(t / chordDur) % chords.length;
    const local = (t % chordDur) / chordDur;
    const env = Math.sin(Math.min(Math.PI, local * Math.PI)) * 0.6 + 0.4;
    let s = 0;
    for (const f of chords[ci]) {
      const vib = 1 + 0.002 * Math.sin(2 * Math.PI * 5 * t);
      s += Math.sin(2 * Math.PI * f * vib * t) * 1.0;
      s += Math.sin(2 * Math.PI * f * 2 * t) * 0.12;
    }
    out[i] += (s / 4) * 0.16 * env;
  }
  const mel = [
    [0.4, N.G4], [1.6, N.C5], [3.2, N.E5], [4.4, N.D5],
    [5.6, N.G4], [6.4, N.C5], [7.2, N.D5], [7.9, N.G5],
    [10.0, N.E5], [11.2, N.G4], [12.6, N.C5], [13.8, N.A4],
    [15.2, N.E5], [16.4, N.D5], [18.0, N.C5], [19.4, N.G4], [20.4, N.C5],
  ];
  for (const [start, f] of mel) {
    const a = Math.floor(start * SR);
    const dlen = Math.floor(1.4 * SR);
    for (let i = 0; i < dlen && a + i < len; i++) {
      const t = i / SR;
      const env = Math.exp(-t * 3.2);
      const s = Math.sin(2 * Math.PI * f * t) * 0.7 + Math.sin(2 * Math.PI * f * 2 * t) * 0.18 + Math.sin(2 * Math.PI * f * 3 * t) * 0.06;
      out[a + i] += s * env * 0.14;
    }
  }
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const ci = Math.floor(t / chordDur) % chords.length;
    out[i] += Math.sin(2 * Math.PI * (chords[ci][0] / 2) * t) * 0.05;
  }
  const fi = Math.floor(SR * 0.8), fo = Math.floor(SR * 1.6);
  for (let i = 0; i < fi; i++) out[i] *= i / fi;
  for (let i = 0; i < fo; i++) out[len - 1 - i] *= i / fo;
  for (let i = 0; i < len; i++) out[i] = Math.tanh(out[i] * 1.1) * 0.9;
  return out;
}
function whoosh(dur = 0.5, peak = 0.5) {
  const len = Math.floor(SR * dur);
  const o = new Float32Array(len);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const env = Math.sin(Math.PI * t);
    lp += (Math.random() * 2 - 1 - lp) * (0.04 + 0.25 * t);
    o[i] = lp * env * peak;
  }
  return o;
}
function pop(dur = 0.16) {
  const len = Math.floor(SR * dur);
  const o = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    o[i] = Math.sin(2 * Math.PI * (320 + 680 * Math.exp(-t * 30)) * t) * Math.exp(-t * 26) * 0.5;
  }
  return o;
}
function click(dur = 0.05) {
  const len = Math.floor(SR * dur);
  const o = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    o[i] = ((Math.random() * 2 - 1) * 0.5 + Math.sin(2 * Math.PI * 2200 * t) * 0.5) * Math.exp(-t * 120) * 0.35;
  }
  return o;
}
function chime(dur = 1.6) {
  const len = Math.floor(SR * dur);
  const o = new Float32Array(len);
  const fr = [N.C5, N.E5, N.G5, N.C5 * 2];
  for (let k = 0; k < fr.length; k++) {
    const off = Math.floor(k * 0.05 * SR);
    for (let i = 0; i < len - off; i++) {
      const t = i / SR;
      o[off + i] += Math.sin(2 * Math.PI * fr[k] * t) * Math.exp(-t * 3.0) * 0.16;
    }
  }
  return o;
}
function riser(dur = 2.2) {
  const len = Math.floor(SR * dur);
  const o = new Float32Array(len);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    lp += (Math.random() * 2 - 1 - lp) * (0.02 + 0.2 * t);
    o[i] = (Math.sin(2 * Math.PI * (200 + 1400 * t) * (i / SR)) * 0.4 + lp * 0.6) * (t * t) * 0.4;
  }
  return o;
}
function typing(dur = 2.0) {
  const len = Math.floor(SR * dur);
  const o = new Float32Array(len);
  const every = Math.floor(SR * 0.065);
  for (let p = 0; p < len; p += every) {
    const a = Math.max(0, p + Math.floor((Math.random() - 0.5) * every * 0.4));
    for (let i = 0; i < SR * 0.03 && a + i < len; i++) {
      const t = i / SR;
      o[a + i] += ((Math.random() * 2 - 1) * 0.5 + Math.sin(2 * Math.PI * 2000 * t) * 0.5) * Math.exp(-t * 150) * 0.22;
    }
  }
  return o;
}

writeWav(join(OUT, "track.wav"), buildTrack());
writeWav(join(OUT, "sfx", "whoosh.wav"), whoosh(0.5, 0.5));
writeWav(join(OUT, "sfx", "whoosh-big.wav"), whoosh(0.8, 0.7));
writeWav(join(OUT, "sfx", "pop.wav"), pop());
writeWav(join(OUT, "sfx", "click.wav"), click());
writeWav(join(OUT, "sfx", "chime.wav"), chime());
writeWav(join(OUT, "sfx", "riser.wav"), riser());
writeWav(join(OUT, "sfx", "typing.wav"), typing(2.0));
console.log("Audio généré dans", OUT);
