/* Studio Voice render worker — all heavy DSP off the UI thread, on the user's own phone.
   importScripts path is relative to this file (libs/). */
importScripts("sv_dsp.js");

self.onmessage = function (e) {
  const d = e.data;
  if (d.cmd !== "render") return;
  try {
    const SR = d.sr;
    const x = new Float32Array(d.x);
    const o = d.opts;
    post({ stage: "analyse", pct: 0 });
    /* 1. track the singer's voice */
    const tr = SVDSP.pitchTrack(x, SR, 2048, 512, function (p) { post({ stage: "analyse", pct: p * 0.7 }); });
    SVDSP.smoothTrack(tr);
    post({ stage: "analyse", pct: 0.75 });
    /* 2. the song's own key */
    const tonic = SVDSP.estimateKey(tr);
    post({ stage: "analyse", pct: 1, tonic: tonic });
    /* 3. clean: gate the room noise */
    post({ stage: "clean", pct: 0.2 });
    const gated = SVDSP.noiseGate(x, tr, SR);
    /* 4. tune: the singer's own voice pulled onto the notes of their key */
    post({ stage: "tune", pct: 0.1 });
    const lock = o.lockKey ? { tonic: tonic } : null;
    const lead = SVDSP.granularShift(gated, SVDSP.buildRatioFnScale(tr, o.strength, 0, lock), 1024, 512);
    post({ stage: "tune", pct: 1 });
    /* 5. harmonies: choir voices made from the singer's own tuned voice */
    const chans = [{ buf: lead, gain: 1, delay: 0, pan: 0 }];
    const harms = o.harmonies || [];
    for (let i = 0; i < harms.length; i++) {
      const h = harms[i];
      post({ stage: "harmonize", pct: (i + 1) / (harms.length + 1) });
      const v = SVDSP.granularShift(lead, function () { return h.mult; }, 1024, 512);
      chans.push({ buf: v, gain: h.gain, delay: h.delay, pan: h.pan });
    }
    post({ stage: "harmonize", pct: 1 });
    /* 6. backing instruments generated to follow the song */
    let backing = null;
    if (o.backingStyle && o.backingStyle !== "off") {
      post({ stage: "instruments", pct: 0.2 });
      const len = lead.length;
      backing = SVDSP.buildBacking(tr, SR, len, o.backingStyle, o.backingLevel || 0.3);
    }
    post({ stage: "instruments", pct: 1 });
    /* 7. mix everything */
    post({ stage: "mix", pct: 0.3 });
    let chansAll = chans.slice();
    if (backing) {
      chansAll = chansAll.concat([
        { buf: backing[0], gain: 0.92, delay: 0, pan: -0.15 },
        { buf: backing[1], gain: 0.92, delay: 0, pan: 0.15 }
      ]);
    }
    const mixed = SVDSP.mixChannels(chansAll, SR);
    post({ stage: "mix", pct: 0.7 });
    const L = SVDSP.normalize(mixed[0], 0.95), R = SVDSP.normalize(mixed[1], 0.95);
    post({ stage: "mix", pct: 1 });
    /* 8. ship to the page for studio mastering + WAV */
    post({ stage: "done", L: L.buffer, R: R.buffer, sr: SR, tonic: tonic });
  } catch (err) {
    post({ stage: "error", message: String(err && err.message ? err.message : err) });
  }
};
function post(m) { self.postMessage(m); }
