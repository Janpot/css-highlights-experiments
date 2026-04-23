#!/usr/bin/env node
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import {
  gunzipSync,
  inflateSync,
  brotliDecompressSync,
} from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const PATHS = [
  '/plain-text',
  '/build-time',
  '/build-time-compressed',
  '/html-string',
  '/html-string-hydrated',
  '/jsx-spans',
  '/mui',
];

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');

const argBase = process.argv[2] || process.env.BASE_URL || null;
const argPort = Number(process.env.PORT || 3100);

function fetchMeasured(url) {
  return new Promise((resolvePromise, reject) => {
    const u = new URL(url);
    const transport = u.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = transport(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: 'GET',
        headers: {
          'accept-encoding': 'gzip, deflate, br',
          accept: 'text/html',
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks);
          const encoding = res.headers['content-encoding'] ?? null;
          let decoded = raw;
          try {
            if (encoding === 'gzip') decoded = gunzipSync(raw);
            else if (encoding === 'deflate') decoded = inflateSync(raw);
            else if (encoding === 'br') decoded = brotliDecompressSync(raw);
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
        res.on('error', reject);
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function runStep(cmd, args, opts = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      ...opts,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
    });
  });
}

function startServer(port) {
  const child = spawn('pnpm', ['exec', 'next', 'start', '-p', String(port)], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  child.stdout.on('data', (buf) => process.stdout.write(buf));
  return child;
}

async function waitForReady(base, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetchMeasured(base + '/');
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
    base = argBase.replace(/\/$/, '');
    console.log(`using existing server at ${base}`);
  } else {
    console.log('> next build');
    await runStep('pnpm', ['exec', 'next', 'build']);
    base = `http://localhost:${argPort}`;
    console.log(`> next start -p ${argPort}`);
    server = startServer(argPort);
    process.on('SIGINT', () => server?.kill('SIGTERM'));
    process.on('SIGTERM', () => server?.kill('SIGTERM'));
    await waitForReady(base);
  }

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
          `${r.uncompressed} B raw, ${r.compressed} B ${r.encoding ?? 'identity'}`,
        );
      } catch (err) {
        console.log(`error: ${err.message}`);
      }
    }

    const out = resolve(projectRoot, 'data', 'pageSizes.json');
    mkdirSync(dirname(out), { recursive: true });
    const payload = {
      base,
      measuredAt: new Date().toISOString(),
      pages: results,
    };
    writeFileSync(out, JSON.stringify(payload, null, 2) + '\n');
    console.log(`\nwrote ${out}`);
  } finally {
    if (server) {
      server.kill('SIGTERM');
      await new Promise((r) => server.once('exit', r));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
