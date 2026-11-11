import { useEffect, useRef, useState } from "react";

/** A decoded frame is either an ImageBitmap (fast path) or an <img> fallback. */
type Frame =
  | { kind: "bitmap"; img: ImageBitmap }
  | { kind: "element"; img: HTMLImageElement; url: string };

/**
 * Decode a WebP blob into something ctx.drawImage can use.
 * createImageBitmap is the fast, off-main-thread path — but it can throw
 * "The source image could not be decoded" in backgrounded/hidden tabs and
 * some embedded webviews. When it does, fall back to a plain HTMLImageElement,
 * which decodes reliably everywhere. Both are valid drawImage sources.
 */
async function decodeBlob(blob: Blob): Promise<Frame> {
  try {
    const img = await createImageBitmap(blob);
    return { kind: "bitmap", img };
  } catch {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("img decode failed"));
      img.src = url;
    });
    return { kind: "element", img, url };
  }
}

function releaseFrame(f: Frame) {
  if (f.kind === "bitmap") f.img.close();
  else URL.revokeObjectURL(f.url);
}

/**
 * Loads a WebP frame sequence (public/frames/<name>/) and exposes a
 * draw(canvas, progress) scrubber.
 *
 * Memory strategy: compressed blobs stay resident (a few MB), decoded
 * frames live only in a sliding window around the playhead so scrubbing
 * stays 60fps without holding hundreds of MB of pixels.
 */
export function useFrameSequence(name: string) {
  const blobs = useRef<(Blob | null)[]>([]);
  const frames = useRef<Map<number, Frame>>(new Map());
  const decoding = useRef<Set<number>>(new Set());
  const countRef = useRef(0);
  const patternRef = useRef("");
  const generationRef = useRef(0);
  const fetchQueue = useRef<number[]>([]);
  const fetching = useRef<Set<number>>(new Set());
  const activeFetches = useRef(0);
  const lastProgress = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!name) return;
    const generation = ++generationRef.current;
    setReady(false);
    let alive = true;
    fetchQueue.current = [];
    (async () => {
      const response = await fetch(`/frames/${name}/manifest.json`);
      if (!response.ok) throw new Error("Unable to load the hero animation manifest");
      const m = await response.json();
      if (!alive) return;
      countRef.current = m.count;
      patternRef.current = m.pattern;
      blobs.current = new Array(m.count).fill(null);
      const firstUrl = `/${m.pattern.replace("%03d", "001")}`;
      const firstResponse = await fetch(firstUrl);
      if (!firstResponse.ok) throw new Error("Unable to load the opening hero frame");
      const firstBlob = await firstResponse.blob();
      if (!alive || generation !== generationRef.current) return;
      blobs.current[0] = firstBlob;
      const firstFrame = await decodeBlob(firstBlob);
      if (!alive || generation !== generationRef.current) return releaseFrame(firstFrame);
      frames.current.set(0, firstFrame);
      setReady(true);
    })();
    return () => {
      alive = false;
      if (generation === generationRef.current) fetchQueue.current = [];
      frames.current.forEach(releaseFrame);
      frames.current.clear();
    };
  }, [name]);

  function scheduleFetchWindow(center: number) {
    const generation = generationRef.current;
    if (!patternRef.current || countRef.current === 0) return;

    const desired: number[] = [];
    const start = Math.max(0, center - 4);
    const end = Math.min(countRef.current - 1, center + 36);
    for (let index = Math.max(start, center); index <= end; index++) desired.push(index);
    for (let index = Math.min(center - 1, end); index >= start; index--) desired.push(index);
    fetchQueue.current = desired.filter(
      (index) => !blobs.current[index] && !fetching.current.has(index),
    );

    const pump = () => {
      while (
        generation === generationRef.current &&
        activeFetches.current < 4 &&
        fetchQueue.current.length > 0
      ) {
        const index = fetchQueue.current.shift();
        if (index === undefined || blobs.current[index] || fetching.current.has(index)) continue;
        fetching.current.add(index);
        activeFetches.current += 1;
        const url = `/${patternRef.current.replace("%03d", String(index + 1).padStart(3, "0"))}`;
        void fetch(url)
          .then(async (response) => {
            if (!response.ok) throw new Error(`Unable to load hero frame ${index + 1}`);
            const blob = await response.blob();
            if (generation === generationRef.current) blobs.current[index] = blob;
          })
          .catch(() => {
            // A nearby decoded frame remains available if an individual frame fails.
          })
          .finally(() => {
            fetching.current.delete(index);
            activeFetches.current = Math.max(0, activeFetches.current - 1);
            if (generation === generationRef.current) pump();
          });
      }
    };
    pump();
  }

  function decode(i: number) {
    if (frames.current.has(i) || decoding.current.has(i) || !blobs.current[i]) return;
    decoding.current.add(i);
    const blob = blobs.current[i];
    if (!blob) return;
    decodeBlob(blob)
      .then((f) => frames.current.set(i, f))
      .catch(() => {})
      .finally(() => decoding.current.delete(i));
  }

  /** decode ahead of the playhead, evict far-away frames */
  function manageWindow(center: number) {
    const AHEAD = 24;
    const KEEP = 30;
    for (let d = 0; d <= AHEAD; d++) {
      const a = center + d;
      const b = center - d;
      if (a < countRef.current) decode(a);
      if (b >= 0) decode(b);
    }
    if (frames.current.size > KEEP * 2) {
      for (const [idx, f] of frames.current) {
        if (Math.abs(idx - center) > KEEP) {
          releaseFrame(f);
          frames.current.delete(idx);
        }
      }
    }
  }

  function nearestDecoded(i: number): Frame | null {
    const current = frames.current.get(i);
    if (current) return current;
    for (let d = 1; d <= 30; d++) {
      const before = frames.current.get(i - d);
      if (before) return before;
      const after = frames.current.get(i + d);
      if (after) return after;
    }
    return null;
  }

  /** progress ∈ [0,1] → cover-fit canvas draw, cross-blending neighbouring frames
   *  so 12fps stills scrub like continuous video */
  function draw(canvas: HTMLCanvasElement | null, progress: number, focusX = 0.5) {
    if (!canvas || countRef.current === 0) return;
    lastProgress.current = progress;
    const f = Math.min(1, Math.max(0, progress)) * (countRef.current - 1);
    const i0 = Math.floor(f);
    const i1 = Math.min(countRef.current - 1, i0 + 1);
    const t = f - i0;
    const center = Math.round(f);
    scheduleFetchWindow(center);
    manageWindow(center);
    const a = nearestDecoded(i0);
    if (!a) return;
    const b = t > 0.02 ? nearestDecoded(i1) : null;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const cw = Math.round(canvas.clientWidth * dpr);
    const ch = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const put = (fr: Frame, alpha: number) => {
      const src = fr.img;
      const s = Math.max(cw / src.width, ch / src.height); // cover-fit
      const w = src.width * s;
      const h = src.height * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(src, (cw - w) * focusX, (ch - h) / 2, w, h);
    };
    put(a, 1);
    if (b && b !== a) put(b, t);
    ctx.globalAlpha = 1;
  }

  return { ready, draw, lastProgress };
}
