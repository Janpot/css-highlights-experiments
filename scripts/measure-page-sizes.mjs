#!/usr/bin/env node
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { gunzipSync, inflateSync, brotliDecompressSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PATHS = [
  "/plain-text",
  "/build-time",
  "/build-time-compressed",
  "/html-string",
  "/html-string-hydrated",
  "/jsx-spans",
  "/mui",
];

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");

const argBase = process.argv[2] || process.env.BASE_URL || null;
const argPort = Number(process.env.PORT || 3100);
const RUNS = Math.max(1, Number(process.env.RUNS || 20));

function fetchMeasured(url) {
  return new Promise((resolvePromise, reject) => {
    const u = new URL(url);
    const transport = u.protocol === "https:" ? httpsRequest : httpRequest;
    const req = transport(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        path: u.pathname + u.search,
        method: "GET",
        headers: {
          "accept-encoding": "gzip, deflate, br",
          accept: "text/html",
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks);
          const encoding = res.headers["content-encoding"] ?? null;
          let decoded = raw;
          try {
            if (encoding === "gzip") decoded = gunzipSync(raw);
            else if (encoding === "deflate") decoded = inflateSync(raw);
            else if (encoding === "br") decoded = brotliDecompressSync(raw);
          } catch (err) {
            reject(err);
            return;
          }
          resolvePromise({
            status: res.statusCode ?? 0,
            encoding,
            compressed: raw.byteLength,
            uncompressed: decoded.byteLength,
          });
        });
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function runStep(cmd, args, opts = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, {
      cwd: projectRoot,
      stdio: "inherit",
      ...opts,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function startServer(port) {
  const child = spawn("pnpm", ["exec", "next", "start", "-p", String(port)], {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "inherit"],
  });
  child.stdout.on("data", (buf) => process.stdout.write(buf));
  return child;
}

async function waitForReady(base, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetchMeasured(base + "/");
      if (r.status > 0) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`server did not become ready within ${timeoutMs}ms`);
}

async function main() {
  let server = null;
  let base;

  if (argBase) {
    base = argBase.replace(/\/$/, "");
    console.log(`using existing server at ${base}`);
  } else {
    console.log("> next build");
    await runStep("pnpm", ["exec", "next", "build"]);
    base = `http://localhost:${argPort}`;
    console.log(`> next start -p ${argPort}`);
    server = startServer(argPort);
    process.on("SIGINT", () => server?.kill("SIGTERM"));
    process.on("SIGTERM", () => server?.kill("SIGTERM"));
    await waitForReady(base);
  }

  let browser = null;
  try {
    const results = {};
    for (const path of PATHS) {
      const url = base + path;
      process.stdout.write(`fetching ${url} ... `);
      try {
        const r = await fetchMeasured(url);
        if (r.status !== 200) {
          console.log(`status ${r.status}`);
          continue;
        }
        results[path] = {
          compressed: r.compressed,
          uncompressed: r.uncompressed,
          encoding: r.encoding,
        };
        console.log(
          `${r.uncompressed} B raw, ${r.compressed} B ${r.encoding ?? "identity"}`,
        );
      } catch (err) {
        console.log(`error: ${err.message}`);
      }
    }

    console.log("\nlaunching Playwright chromium for web-vitals ...");
    browser = await chromium.launch();

    console.log("warmup pass ...");
    for (const path of PATHS) {
      if (!results[path]) continue;
      const url = base + path;
      process.stdout.write(`warmup ${url} ... `);
      try {
        await collectWebVitals(browser, url);
        console.log("ok");
      } catch (err) {
        console.log(`error: ${err.message}`);
      }
    }

    console.log("");
    console.log(`web-vitals pass (p75 of ${RUNS}) ...`);
    for (const path of PATHS) {
      if (!results[path]) continue;
      const url = base + path;
      process.stdout.write(`web-vitals ${url} ... `);
      try {
        const samples = [];
        for (let i = 0; i < RUNS; i++) {
          samples.push(await collectWebVitals(browser, url));
        }
        const wv = p75WebVitals(samples);
        results[path].webVitals = wv;
        console.log(
          `ttfb=${fmt(wv.ttfb)} fcp=${fmt(wv.fcp)} lcp=${fmt(wv.lcp)} ` +
            `inp=${fmt(wv.inp)} cls=${wv.cls?.toFixed(3) ?? "—"}`,
        );
      } catch (err) {
        console.log(`error: ${err.message}`);
      }
    }

    console.log(`\ntracing pass (p75 of ${RUNS}) ...`);
    for (const path of PATHS) {
      if (!results[path]) continue;
      const url = base + path;
      process.stdout.write(`tracing ${url} ... `);
      try {
        const samples = [];
        for (let i = 0; i < RUNS; i++) {
          samples.push(await collectTimingBreakdown(browser, url));
        }
        const tr = p75Timings(samples);
        results[path].timings = tr;
        console.log(
          `before[s=${fmt(tr.before.scripting)} l=${fmt(tr.before.layout)} p=${fmt(tr.before.paint)}] ` +
            `after[s=${fmt(tr.after.scripting)} l=${fmt(tr.after.layout)} p=${fmt(tr.after.paint)}]`,
        );
      } catch (err) {
        console.log(`error: ${err.message}`);
      }
    }

    const out = resolve(projectRoot, "data", "pageSizes.json");
    mkdirSync(dirname(out), { recursive: true });
    const payload = {
      base,
      measuredAt: new Date().toISOString(),
      pages: results,
    };
    writeFileSync(out, JSON.stringify(payload, null, 2) + "\n");
    console.log(`\nwrote ${out}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    if (server) {
      server.kill("SIGTERM");
      await new Promise((r) => server.once("exit", r));
    }
  }
}

function percentile(xs, p) {
  const arr = xs.filter((x) => x != null && Number.isFinite(x));
  if (arr.length === 0) return null;
  arr.sort((a, b) => a - b);
  // Linear interpolation between closest ranks.
  const rank = (arr.length - 1) * p;
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return arr[lo];
  return arr[lo] + (arr[hi] - arr[lo]) * (rank - lo);
}

function p75(xs) {
  return percentile(xs, 0.75);
}

function p75WebVitals(samples) {
  return {
    ttfb: p75(samples.map((s) => s.ttfb)),
    fcp: p75(samples.map((s) => s.fcp)),
    lcp: p75(samples.map((s) => s.lcp)),
    inp: p75(samples.map((s) => s.inp)),
    cls: p75(samples.map((s) => s.cls)),
  };
}

function p75Timings(samples) {
  const pick = (phase, key) =>
    p75(samples.map((s) => s[phase]?.[key] ?? null));
  return {
    before: {
      scripting: pick("before", "scripting"),
      layout: pick("before", "layout"),
      paint: pick("before", "paint"),
    },
    after: {
      scripting: pick("after", "scripting"),
      layout: pick("after", "layout"),
      paint: pick("after", "paint"),
    },
  };
}

function fmt(n) {
  if (n == null) return "—";
  return Math.round(n).toString();
}

async function collectWebVitals(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const collected = [];
  await context.exposeBinding("__reportWebVital", (_src, payload) => {
    collected.push(payload);
  });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "load" });
    // Let LCP/CLS settle after load.
    await page.waitForTimeout(500);
    await scrollThroughPage(page);
    await page.waitForTimeout(500);
    // Synthetic interaction so web-vitals reports INP.
    try {
      await page.mouse.click(200, 200);
      await page.waitForTimeout(100);
      await page.keyboard.press("Tab");
      await page.waitForTimeout(200);
    } catch {}
    // Trigger visibilitychange to flush final LCP/CLS/INP from web-vitals.
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("pagehide"));
    });
    await page.waitForTimeout(200);
  } finally {
    await context.close();
  }

  const byName = {};
  for (const m of collected) {
    if (m.name === "CLS") {
      byName.CLS = (byName.CLS ?? 0) + m.value;
    } else {
      const prev = byName[m.name];
      if (prev === undefined || m.value > prev) byName[m.name] = m.value;
    }
  }
  return {
    ttfb: byName.TTFB ?? null,
    fcp: byName.FCP ?? null,
    lcp: byName.LCP ?? null,
    inp: byName.INP ?? null,
    cls: byName.CLS ?? null,
  };
}

async function scrollThroughPage(page) {
  const { total, viewport } = await page.evaluate(() => ({
    total: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
  }));
  const step = Math.max(200, Math.floor(viewport * 0.75));
  for (let y = 0; y < total; y += step) {
    await page.evaluate((ty) => window.scrollTo(0, ty), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(120);
}

async function collectTimingBreakdown(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  const events = [];
  cdp.on("Tracing.dataCollected", (payload) => {
    if (Array.isArray(payload.value)) events.push(...payload.value);
  });

  const completePromise = new Promise((resolvePromise) => {
    cdp.once("Tracing.tracingComplete", () => resolvePromise());
  });

  await cdp.send("Tracing.start", {
    transferMode: "ReportEvents",
    categories:
      "-*,devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,blink.user_timing,v8.execute",
  });

  try {
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(300);
    await page.evaluate(() => performance.mark("measure:before-scroll"));
    await page.waitForTimeout(50);
    await scrollThroughPage(page);
    await page.waitForTimeout(500);
    await page.evaluate(() => performance.mark("measure:after-scroll"));
    await page.waitForTimeout(50);
  } finally {
    await cdp.send("Tracing.end");
    await completePromise;
    await context.close();
  }

  return aggregateTimings(events);
}

const SCRIPTING_NAMES = new Set([
  "EvaluateScript",
  "FunctionCall",
  "v8.compile",
  "V8.Execute",
  "TimerFire",
  "EventDispatch",
  "GCEvent",
  "MinorGC",
  "MajorGC",
  "XHRLoad",
  "XHRReadyStateChange",
  "CompileScript",
  "CacheScript",
  "ParseScriptOnBackground",
  "RunMicrotasks",
  "RunTask",
]);
const LAYOUT_NAMES = new Set([
  "Layout",
  "UpdateLayoutTree",
  "RecalculateStyles",
  "ParseHTML",
  "ParseAuthorStyleSheet",
  "HitTest",
  "InvalidateLayout",
  "ScheduleStyleRecalculation",
]);
const PAINT_NAMES = new Set([
  "Paint",
  "CompositeLayers",
  "PaintImage",
  "RasterTask",
  "DecodeImage",
  "ResizeImage",
  "DrawLazyPixelRef",
  "PaintSetup",
  "UpdateLayer",
  "UpdateLayerTree",
  "Rasterize",
]);

function aggregateTimings(events) {
  const mainTidKeys = new Set();
  for (const ev of events) {
    if (
      ev.name === "thread_name" &&
      ev.args &&
      ev.args.name === "CrRendererMain"
    ) {
      mainTidKeys.add(`${ev.pid}:${ev.tid}`);
    }
  }

  let beforeMarkTs = null;
  let afterMarkTs = null;
  for (const ev of events) {
    if (ev.cat && ev.cat.includes("blink.user_timing")) {
      if (ev.name === "measure:before-scroll" && beforeMarkTs === null) {
        beforeMarkTs = ev.ts;
      } else if (ev.name === "measure:after-scroll") {
        afterMarkTs = ev.ts;
      }
    }
  }

  const byThread = new Map();
  for (const ev of events) {
    if (ev.ph !== "X" || typeof ev.dur !== "number") continue;
    const key = `${ev.pid}:${ev.tid}`;
    if (!mainTidKeys.has(key)) continue;
    let list = byThread.get(key);
    if (!list) {
      list = [];
      byThread.set(key, list);
    }
    list.push(ev);
  }

  // selfByName: Map<phase, Record<name, us>>, where phase = 'before' | 'after'
  const selfByName = {
    before: Object.create(null),
    after: Object.create(null),
  };

  function phaseFor(ts) {
    if (beforeMarkTs !== null && ts < beforeMarkTs) return "before";
    if (afterMarkTs !== null && ts >= afterMarkTs) return null;
    return "after";
  }

  for (const list of byThread.values()) {
    list.sort((a, b) => a.ts - b.ts || b.dur - a.dur);
    const stack = [];
    const flush = (frame) => {
      const self = Math.max(0, frame.dur - frame.childTotal);
      // Use the frame's start timestamp to assign phase; skips frames
      // outside either window (e.g., post-scroll settle).
      const phase = phaseFor(frame.ts);
      if (!phase) return;
      const bucket = selfByName[phase];
      bucket[frame.name] = (bucket[frame.name] ?? 0) + self;
    };
    for (const ev of list) {
      while (stack.length && stack[stack.length - 1].end <= ev.ts) {
        flush(stack.pop());
      }
      if (stack.length) stack[stack.length - 1].childTotal += ev.dur;
      stack.push({
        name: ev.name,
        ts: ev.ts,
        end: ev.ts + ev.dur,
        dur: ev.dur,
        childTotal: 0,
      });
    }
    while (stack.length) flush(stack.pop());
  }

  const bucketize = (phaseMap) => {
    let scripting = 0;
    let layout = 0;
    let paint = 0;
    for (const [name, us] of Object.entries(phaseMap)) {
      if (SCRIPTING_NAMES.has(name)) scripting += us;
      else if (LAYOUT_NAMES.has(name)) layout += us;
      else if (PAINT_NAMES.has(name)) paint += us;
    }
    return {
      scripting: scripting / 1000,
      layout: layout / 1000,
      paint: paint / 1000,
    };
  };

  return {
    before: bucketize(selfByName.before),
    after: bucketize(selfByName.after),
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
