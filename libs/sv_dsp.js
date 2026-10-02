/* Studio Voice DSP core — pure functions, no DOM. Runs in the browser page and in Node for tests.
   Everything happens on-device: the singer's voice is cleaned, tuned to the note, harmonized
   with choir voices derived from their own voice, mastered, and exported as WAV. */
(function (root) {
  "use strict";

  function hann(n) {
    const w = new Float32Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    return w;
  }

  /* Two-stage autocorrelation pitch detection. Returns f0 in Hz, or 0 when unvoiced. */
  function detectPitch(buf, sr, rmsFloor) {
    const n = buf.length;
    let e = 0;
    for (let i = 0; i < n; i++) e += buf[i] * buf[i];
    const rms = Math.sqrt(e / n);
    if (rms < (rmsFloor || 0.006)) return 0;
    const maxLag = Math.min(Math.floor(sr / 65), n - 2);
    const minLag = Math.max(2, Math.ceil(sr / 1050));
    const r0 = e;
    if (r0 <= 0) return 0;
    /* coarse */
    let bestLag = -1, best = 0;
    for (let lag = minLag; lag <= maxLag; lag += 3) {
      let s = 0, e2 = 0;
      for (let i = 0; i + lag < n; i += 2) { const v = buf[i]; s += v * buf[i + lag]; e2 += v * v; }
      const nc = s / (Math.sqrt(r0 * (e2 * 2) + 1e-12) + 1e-12);
      if (nc > best) { best = nc; bestLag = lag; }
    }
    if (bestLag < 0 || best < 0.30) return 0;
    /* refine */
    let bl = bestLag, bv = best;
    for (let lag = Math.max(minLag, bestLag - 3); lag <= Math.min(maxLag, bestLag + 3); lag++) {
      let s = 0, e2 = 0;
      for (let i = 0; i + lag < n; i++) { const v = buf[i]; s += v * buf[i + lag]; e2 += v * v; }
      const nc = s / (Math.sqrt(r0 * e2 + 1e-12) + 1e-12);
      if (nc > bv) { bv = nc; bl = lag; }
    }
    if (bv < 0.32) return 0;
    /* parabolic interpolation for sub-sample lag precision */
    let lag = bl;
    if (bl > minLag && bl < maxLag) {
      let pm = 0, p0 = 0, pp = 0;
      for (let i = 0; i + bl < n; i++) { const v = buf[i]; p0 += v * buf[i + bl]; pm += v * buf[i + bl - 1]; pp += v * buf[i + bl + 1]; }
      const denom = pm - 2 * p0 + pp;
      if (denom !== 0) { const d = (pm - pp) / (2 * denom); if (Math.abs(d) < 1) lag = bl + d; }
    }
    return sr / lag;
  }

  /* Frame the signal and track pitch. hop-aligned. Returns {pos:Uint32Array, f:Float32Array, voiced:Uint8Array, rms:Float32Array}. */
  function pitchTrack(x, sr, frame, hop, onProgress) {
    frame = frame || 2048; hop = hop || 512;
    const m = Math.max(0, Math.floor((x.length - frame) / hop) + 1);
    const pos = new Uint32Array(m), f = new Float32Array(m), voiced = new Uint8Array(m), rmsA = new Float32Array(m);
    /* adaptive silence floor: 15th percentile of frame RMS * safety */
    const rmsAll = new Float32Array(m);
    for (let j = 0; j < m; j++) {
      let e = 0; const o = j * hop;
      for (let i = 0; i < frame; i += 4) { const v = x[o + i]; e += v * v; }
      rmsAll[j] = Math.sqrt(e / (frame / 4));
    }
    const sorted = Float32Array.from(rmsAll).sort();
    const floor = Math.max(0.004, sorted[Math.floor(m * 0.15)] * 0.55);
    for (let j = 0; j < m; j++) {
      pos[j] = j * hop;
      const seg = x.subarray(pos[j], pos[j] + frame);
      const p = detectPitch(seg, sr, floor);
      if (p >= 65 && p <= 1050) { f[j] = p; voiced[j] = 1; }
      rmsA[j] = rmsAll[j];
      if (onProgress && (j & 63) === 0) onProgress(j / m);
    }
    return { pos: pos, f: f, voiced: voiced, rms: rmsA, frame: frame, hop: hop };
  }

  function medianFilter(arr, k) {
    const m = arr.length, out = new Float32Array(m), half = (k - 1) >> 1, tmp = new Float32Array(k);
    for (let i = 0; i < m; i++) {
      let c = 0;
      for (let j = Math.max(0, i - half); j <= Math.min(m - 1, i + half); j++) tmp[c++] = arr[j];
      const part = tmp.slice(0, c);
      part.sort(function (a, b) { return a - b; });
      out[i] = part[c >> 1];
    }
    return out;
  }

  /* Octave-discontinuity repair + median smoothing for a voiced flag array. */
  function smoothTrack(tr) {
    const f = tr.f, v = tr.voiced, m = f.length;
    const fs = new Float32Array(m);
    for (let i = 0; i < m; i++) fs[i] = v[i] ? f[i] : 0;
    /* repair octave jumps: if neighbour ratio ~2 or 0.5 and sudden, pull back */
    for (let i = 1; i < m; i++) {
      if (v[i] && v[i - 1]) {
        const r = f[i] / f[i - 1];
        if (r > 1.8 && r < 2.2) fs[i] = f[i] / 2;
        else if (r > 0.45 && r < 0.56) fs[i] = f[i] * 2;
      }
    }
    const sm = medianFilter(fs, 7);
    for (let i = 0; i < m; i++) if (!v[i]) sm[i] = 0;
    /* fill short unvoiced gaps (<= 6 frames ~ 70ms) from neighbours to keep the shift stable */
    let i = 0;
    while (i < m) {
      if (!v[i]) {
        let j = i; while (j < m && !v[j]) j++;
        if (i > 0 && j < m && (j - i) <= 6) {
          const a = sm[i - 1], b = sm[j];
          for (let g = i; g < j; g++) sm[g] = a + ((b - a) * (g - i + 1)) / (j - i + 1);
        }
        i = j;
      } else i++;
    }
    tr.f = sm;
    return tr;
  }

  /* Snap to nearest semitone (A440 grid). */
  function snapSemi(f) {
    const semis = Math.round(12 * Math.log2(f / 440));
    return 440 * Math.pow(2, semis / 12);
  }

  /* Build a position -> pitch-ratio function that tunes the voice. strength in [0,1].
     ratio 1 = unchanged; ratio = f_target/f_found blended by strength. */
  function buildRatioFn(tr, strength, intervalSemi) {
    const mult = Math.pow(2, (intervalSemi || 0) / 12);
    return function (samplePos) {
      const j = Math.min(tr.f.length - 1, Math.max(0, Math.floor((samplePos - tr.frame / 2) / tr.hop)));
      const f0 = tr.f[j];
      if (!f0 || !tr.voiced[j]) return mult; /* unvoiced: no shift */
      const target = snapSemi(f0);
      const r = (target / f0 - 1) * strength + 1;
      return Math.min(2.5, Math.max(0.4, r * mult));
    };
  }

  /* Granular (grain-OLA) time-varying pitch shifter. Duration preserved. */
  function granularShift(x, ratioFn, grain, hop) {
    grain = grain || 1024; hop = hop || grain >> 1;
    const w = hann(grain);
    const out = new Float32Array(x.length);
    const norm = new Float32Array(x.length);
    for (let pos = 0; pos + grain < x.length; pos += hop) {
      const r = ratioFn(pos);
      for (let i = 0; i < grain; i++) {
        const src = pos * r + i * r; /* read faster to raise pitch; grain OLA keeps duration */
        const i0 = src | 0, frac = src - i0;
        const s0 = i0 < x.length ? x[i0] : 0, s1 = i0 + 1 < x.length ? x[i0 + 1] : 0;
        const v = s0 + (s1 - s0) * frac;
        out[pos + i] += v * w[i];
        norm[pos + i] += w[i];
      }
    }
    for (let i = 0; i < out.length; i++) out[i] /= (norm[i] || 1);
    return out;
  }

  /* Simple noise gate: attenuates frames whose RMS is far below the track's active level. */
  function noiseGate(x, tr, sr) {
    const m = tr.rms.length, out = new Float32Array(x);
    const act = [];
    for (let j = 0; j < m; j++) if (tr.rms[j] > 0.01) act.push(tr.rms[j]);
    if (!act.length) return out;
    act.sort(function (a, b) { return a - b; });
    const thr = act[Math.floor(act.length * 0.25)] * 0.5;
    for (let j = 0; j < m; j++) {
      const g = tr.rms[j] < thr ? 0.12 : 1;
      const o = tr.pos[j], n = Math.min(x.length, o + tr.hop);
      for (let i = o; i < n; i++) out[i] *= g;
    }
    return out;
  }

  /* Peak normalize */
  function normalize(x, target) {
    let peak = 0;
    for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > peak) peak = a; }
    if (peak < 1e-6) return x;
    const g = (target || 0.95) / peak;
    const out = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) out[i] = x[i] * g;
    return out;
  }

  /* Mix lead + harmony channels with gains and delays. */
  function mixChannels(chans, sr) {
    let len = 0;
    for (const c of chans) len = Math.max(len, c.buf.length + Math.floor(c.delay * sr));
    const L = new Float32Array(len), R = new Float32Array(len);
    for (const c of chans) {
      const d = Math.floor(c.delay * sr), pan = c.pan || 0; /* -1 left .. +1 right */
      const lg = Math.min(1, 1 - Math.max(0, pan)) * c.gain, rg = Math.min(1, 1 + Math.min(0, pan)) * c.gain;
      for (let i = 0; i < c.buf.length; i++) {
        const v = c.buf[i];
        L[i + d] += v * lg; R[i + d] += v * rg;
      }
    }
    return [L, R];
  }

  /* Stereo reverb impulse response: exponentially decaying, slightly lowpassed noise. */
  function makeIR(sr, seconds, decay) {
    const n = Math.floor(sr * (seconds || 2.2));
    const L = new Float32Array(n), R = new Float32Array(n);
    let lpL = 0, lpR = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n, env = Math.pow(1 - t, decay || 2.5);
      lpL = lpL * 0.72 + (Math.random() * 2 - 1) * 0.28;
      lpR = lpR * 0.72 + (Math.random() * 2 - 1) * 0.28;
      L[i] = lpL * env; R[i] = lpR * env;
    }
    /* tiny pre-delay shimmer */
    for (let i = 0; i < Math.floor(sr * 0.02); i++) { L[i] = 0; R[i] = 0; }
    return [L, R];
  }

  /* 16-bit PCM WAV encoder. chans: array of Float32Array. */
  function encodeWav(chans, sr) {
    const n = chans[0].length, ch = chans.length;
    const bytes = 44 + n * ch * 2;
    const buf = new ArrayBuffer(bytes);
    const dv = new DataView(buf);
    const wstr = function (o, s) { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    wstr(0, "RIFF"); dv.setUint32(4, bytes - 8, true); wstr(8, "WAVE");
    wstr(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
    dv.setUint16(22, ch, true); dv.setUint32(24, sr, true);
    dv.setUint32(28, sr * ch * 2, true); dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true);
    wstr(36, "data"); dv.setUint32(40, n * ch * 2, true);
    let o = 44;
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < ch; c++) {
        let v = chans[c][i];
        if (v > 1) v = 1; else if (v < -1) v = -1;
        dv.setInt16(o, (v * 32767) | 0, true); o += 2;
      }
    }
    return buf;
  }


  /* ---------- KEY & SCALE: the song's own key drives everything ---------- */

  /* MIDI note number from Hz */
  function hzToMidi(f) { return 69 + 12 * Math.log2(f / 440); }
  function midiToHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* Krumhansl-Kessler major-key profile, C-relative */
  var KK_MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.44];
  var MAJ_SCALE = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];

  /* Estimate the tonic (0..11, C=0) of a track from voiced pitch classes. */
  function estimateKey(tr) {
    const hist = new Float32Array(12);
    for (let j = 0; j < tr.f.length; j++) {
      if (!tr.voiced[j] || !tr.f[j]) continue;
      const pc = ((Math.round(hzToMidi(tr.f[j])) % 12) + 12) % 12;
      hist[pc] += tr.hop;
    }
    let best = 0, bestT = 0;
    for (let t = 0; t < 12; t++) {
      let s = 0;
      for (let d = 0; d < 12; d++) s += hist[(t + d) % 12] * KK_MAJ[d];
      if (s > best) { best = s; bestT = t; }
    }
    return bestT;
  }

  /* Snap a frequency to the nearest note of a major scale (tonic 0..11, C=0). Ties prefer the lower note. */
  function snapToScale(f, tonic) {
    const m = Math.round(hzToMidi(f));
    for (let off = 0; off <= 6; off++) {
      const lo = m - off, hi = m + off;
      if (MAJ_SCALE[((lo - tonic) % 12 + 12) % 12]) return midiToHz(lo);
      if (off && MAJ_SCALE[((hi - tonic) % 12 + 12) % 12]) return midiToHz(hi);
    }
    return midiToHz(m);
  }

  /* scale-aware ratio function: scaleLock = {tonic:0..11} uses the song key, null uses chromatic snapping. */
  function buildRatioFnScale(tr, strength, intervalSemi, scaleLock) {
    const mult = Math.pow(2, (intervalSemi || 0) / 12);
    return function (samplePos) {
      const j = Math.min(tr.f.length - 1, Math.max(0, Math.floor((samplePos - tr.frame / 2) / tr.hop)));
      const f0 = tr.f[j];
      if (!f0 || !tr.voiced[j]) return mult;
      const target = scaleLock ? snapToScale(f0, scaleLock.tonic) : snapSemi(f0);
      const r = (target / f0 - 1) * strength + 1;
      return Math.min(2.5, Math.max(0.4, r * mult));
    };
  }

  /* ---------- BACKING INSTRUMENTS: generated to follow the singer's own song ---------- */

  /* One-pole lowpass state helper */
  function lpSet() { return { y: 0 }; }
  function lpTick(st, x, k) { st.y += k * (x - st.y); return st.y; }

  /* Add one synth voice (oscType: 0 triangle, 1 saw, 2 sine) into a buffer over [t0,t1) with attack/release. */
  function voiceInto(buf, sr, t0, t1, freq, gain, oscType, atkSec, relSec, detune) {
    const det = detune || 0;
    const i0 = Math.max(0, t0 | 0), i1 = Math.min(buf.length, t1 | 0);
    const atk = Math.max(1, (atkSec * sr) | 0), rel = Math.max(1, (relSec * sr) | 0);
    const st = lpSet(); const k = oscType === 1 ? 0.35 : 0.9;
    let ph = 0, ph2 = 0;
    const w1 = (2 * Math.PI * freq * (1 + det)) / sr;
    const w2 = (2 * Math.PI * freq * (1 - det)) / sr;
    for (let i = i0; i < i1; i++) {
      ph += w1; ph2 += w2;
      let v;
      if (oscType === 2) v = Math.sin(ph);
      else if (oscType === 1) v = ((ph / Math.PI) % 2) - 1; /* naive saw */
      else v = Math.asin(Math.sin(ph)) * (2 / Math.PI); /* triangle */
      let v2 = 0;
      if (det > 0) v2 = oscType === 2 ? Math.sin(ph2) : (((ph2 / Math.PI) % 2) - 1);
      let s = det > 0 ? (v + v2) * 0.5 : v;
      s = lpTick(st, s, k);
      const pos = i - i0, len = i1 - i0;
      let env = 1;
      if (pos < atk) env = pos / atk;
      else if (pos > len - rel) env = Math.max(0, (len - pos) / rel);
      buf[i] += s * env * gain;
    }
  }

  /* Soft kick + hat hit at t */
  function kickInto(buf, sr, t, gain) {
    const i0 = Math.max(0, t | 0), len = (0.16 * sr) | 0;
    let ph = 0;
    for (let i = 0; i < len && i0 + i < buf.length; i++) {
      const f = 120 * Math.pow(0.35, i / len) + 42;
      ph += (2 * Math.PI * f) / sr;
      const env = Math.pow(1 - i / len, 2.2);
      buf[i0 + i] += Math.sin(ph) * env * gain;
    }
  }
  function hatInto(buf, sr, t, gain) {
    const i0 = Math.max(0, t | 0), len = (0.05 * sr) | 0;
    let st = lpSet();
    for (let i = 0; i < len && i0 + i < buf.length; i++) {
      const n = (Math.random() * 2 - 1);
      const v = lpTick(st, n, 0.85) - lpTick(st, n, 0.35); /* crude bandpass */
      const env = Math.pow(1 - i / len, 3);
      buf[i0 + i] += v * env * gain;
    }
  }

  /* Build a backing track that follows the singer's key. styles: "pad" | "ballad" | "afro".
     Returns stereo [L,R] sized to lenSamples, peak-normalized to level. */
  function buildBacking(tr, sr, lenSamples, style, level) {
    style = style || "pad"; level = level || 0.3;
    const tonic = estimateKey(tr);
    /* chord semitone sets (relative to tonic, C=0 convention) */
    const PROG = {
      pad:    [[0, 4, 7], [5, 9, 12], [7, 11, 14], [5, 9, 12]],
      ballad: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]],
      afro:   [[0, 4, 7], [5, 9, 12], [0, 4, 7], [7, 11, 14]]
    }[style] || [[0, 4, 7], [5, 9, 12], [7, 11, 14], [5, 9, 12]];
    const chordDur = style === "afro" ? 2.0 : 2.4;
    const L = new Float32Array(lenSamples), R = new Float32Array(lenSamples);
    const bpm = style === "afro" ? 102 : 76;
    const beat = (60 / bpm) * sr;
    const nChords = Math.max(1, Math.ceil(lenSamples / sr / chordDur));
    for (let c = 0; c < nChords; c++) {
      const t0 = (c * chordDur * sr) | 0, t1 = Math.min(lenSamples, ((c + 1) * chordDur * sr) | 0);
      if (t1 <= t0) break;
      const chord = PROG[c % PROG.length];
      const rootMidi = 48 + ((tonic + chord[0]) % 12); /* bass octave: C3-ish */
      /* pad: chord tones in octave 60 (C4) with gentle detune for width */
      for (let ni = 0; ni < chord.length; ni++) {
        const m = 60 + ((tonic + chord[ni]) % 12);
        const f = midiToHz(m);
        voiceInto(L, sr, t0, t1, f, 0.16, 0, 0.35 * sr / sr, 0.35, 0.0035);
        voiceInto(R, sr, t0, t1, f, 0.16, 0, 0.35, 0.35, -0.0035);
      }
      /* bass: root with a soft rhythm */
      const bf = midiToHz(rootMidi);
      const pulses = style === "afro" ? [0, 0.75, 1.5] : [0, 1.2];
      for (const p of pulses) {
        const bt0 = t0 + p * sr, bt1 = Math.min(t1, bt0 + (style === "afro" ? 0.22 : 0.9) * sr);
        if (bt1 > bt0 && bt0 < lenSamples) { voiceInto(L, sr, bt0, bt1, bf, 0.30, 2, 0.01, 0.18, 0); voiceInto(R, sr, bt0, bt1, bf, 0.30, 2, 0.01, 0.18, 0); }
      }
      /* beat for afro style */
      if (style === "afro") {
        for (let b = 0; ; b++) {
          const t = t0 + b * beat / 2;
          if (t >= t1) break;
          if (b % 2 === 0) { kickInto(L, sr, t, 0.32); kickInto(R, sr, t, 0.32); }
          hatInto(L, sr, t, 0.05); hatInto(R, sr, t, 0.05);
        }
      }
    }
    /* normalize backing to level */
    let peak = 0;
    for (let i = 0; i < lenSamples; i++) { const a = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (a > peak) peak = a; }
    if (peak > 1e-6) {
      const g = level / peak;
      for (let i = 0; i < lenSamples; i++) { L[i] *= g; R[i] *= g; }
    }
    return [L, R];
  }

  var _extra = { hzToMidi: hzToMidi, midiToHz: midiToHz, estimateKey: estimateKey, snapToScale: snapToScale, buildRatioFnScale: buildRatioFnScale, buildBacking: buildBacking, voiceInto: voiceInto };

  const api = Object.assign({ hann: hann, detectPitch: detectPitch, pitchTrack: pitchTrack, smoothTrack: smoothTrack, medianFilter: medianFilter, snapSemi: snapSemi, buildRatioFn: buildRatioFn, granularShift: granularShift, noiseGate: noiseGate, normalize: normalize, mixChannels: mixChannels, makeIR: makeIR, encodeWav: encodeWav }, _extra);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.SVDSP = api;
})(typeof window !== "undefined" ? window : globalThis);
