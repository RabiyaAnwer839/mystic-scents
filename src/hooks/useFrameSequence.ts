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
  const lastProgress = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!name) return;
    setReady(false);
    let alive = true;
    (async () => {
      const m = await fetch(`/frames/${name}/manifest.json`).then((r) => r.json());
      if (!alive) return;
      countRef.current = m.count;
      blobs.current = new Array(m.count).fill(null);
      const url = (i: number) =>
        m.pattern.replace("%03d", String(i + 1).padStart(3, "0"));

      const grab = async (i: number) => {
        try {
          const bl = await fetch(`/${url(i)}`).then((r) => r.blob());
          if (alive) blobs.current[i] = bl;
        } catch {
          /* nearestDecoded covers gaps */
        }
      };
      // lazy: gate "ready" on the opening frames only, stream the rest in order
      const HEAD = Math.min(m.count, 72);
      await Promise.all(Array.from({ length: HEAD }, (_, i) => grab(i)));
      if (!alive) return;
      const firstBlob = blobs.current[0];
      if (firstBlob) {
        try {
          const f = await decodeBlob(firstBlob);
          if (!alive) return releaseFrame(f);
          frames.current.set(0, f);
        } catch {
          /* retried by the draw loop */
        }
      }
      setReady(true);
      let next = HEAD;
      const worker = async () => {
        while (alive && next < m.count) await grab(next++);
      };
      await Promise.all(Array.from({ length: 6 }, worker));
    })();
    return () => {
      alive = false;
      frames.current.forEach(releaseFrame);
      frames.current.clear();
    };
  }, [name]);

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
    for (let d = 1; d < countRef.current; d++) {
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
    manageWindow(Math.round(f));
    const a = nearestDecoded(i0);
    if (!a) return;
    const b = t > 0.02 ? nearestDecoded(i1) : null;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
