// Local Remotion render webhook
// Edge function POST eder: { video_id, composition, props, callback_url }
// Bu server hemen 200 döner, arkada renderMedia çalıştırır,
// MP4'i Supabase Storage 'videos' bucket'ına yükler ve callback_url'i çağırır.

import express from "express";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.RENDER_PORT ?? 5174);
const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const TOKEN = process.env.REMOTION_RENDER_WEBHOOK_TOKEN; // opsiyonel

const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const app = express();
app.use(express.json({ limit: "5mb" }));

let bundleUrl: string | null = null;
let bundling: Promise<string> | null = null;

async function getBundle(): Promise<string> {
  if (bundleUrl) return bundleUrl;
  if (bundling) return bundling;
  console.log("[renderer] Bundling Remotion compositions…");
  bundling = bundle({
    entryPoint: path.resolve(__dirname, "index.ts"),
    webpackOverride: (config) => config,
  }).then((url) => {
    bundleUrl = url;
    console.log("[renderer] Bundle ready:", url);
    return url;
  });
  return bundling;
}

app.get("/health", (_req, res) => res.json({ ok: true, bundled: !!bundleUrl }));

app.post("/render", async (req, res) => {
  if (TOKEN) {
    const auth = req.header("authorization") ?? "";
    if (auth !== `Bearer ${TOKEN}`) return res.status(401).json({ error: "unauthorized" });
  }
  const { video_id, composition, props, callback_url } = req.body ?? {};
  if (!video_id || !composition || !props) {
    return res.status(400).json({ error: "video_id, composition, props zorunlu" });
  }
  const renderId = crypto.randomBytes(8).toString("hex");
  res.json({ render_id: renderId, status: "accepted" });

  // Background render
  renderJob({ video_id, composition, props, callback_url, renderId }).catch((e) => {
    console.error("[renderer] Job failed:", e);
    if (callback_url) {
      void fetch(callback_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "failed", error: e instanceof Error ? e.message : String(e) }),
      }).catch(() => {});
    }
  });
});

interface Job {
  video_id: string;
  composition: string;
  props: Record<string, unknown>;
  callback_url?: string;
  renderId: string;
}

async function renderJob(job: Job) {
  const { video_id, composition, props, callback_url, renderId } = job;
  console.log(`[renderer] ▶ ${renderId} start ${composition} for video ${video_id}`);

  const url = await getBundle();
  const comp = await selectComposition({
    serveUrl: url,
    id: composition,
    inputProps: props as Record<string, unknown>,
  });

  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), `nevcode-${renderId}-`));
  const outPath = path.join(outDir, `${composition}.mp4`);

  let lastReportedProgress = 0;
  await renderMedia({
    composition: comp,
    serveUrl: url,
    codec: "h264",
    outputLocation: outPath,
    inputProps: props as Record<string, unknown>,
    concurrency: Math.max(1, Math.min(4, os.cpus().length - 1)),
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 95) + 5; // 5..100
      if (pct - lastReportedProgress >= 10 && callback_url) {
        lastReportedProgress = pct;
        void fetch(callback_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ progress: pct }),
        }).catch(() => {});
      }
    },
  });

  console.log(`[renderer] ✔ ${renderId} encoded → ${outPath}`);

  // Upload to Supabase Storage
  const buf = await fs.readFile(outPath);
  const storagePath = `${video_id}/${composition}-${renderId}.mp4`;
  const upload = await supa.storage.from("videos").upload(storagePath, buf, {
    contentType: "video/mp4",
    upsert: true,
  });
  if (upload.error) throw new Error(`storage upload: ${upload.error.message}`);
  const pub = supa.storage.from("videos").getPublicUrl(storagePath);
  const publicUrl = pub.data.publicUrl;
  console.log(`[renderer] ☁ ${renderId} uploaded → ${publicUrl}`);

  // Callback
  if (callback_url) {
    const r = await fetch(callback_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "ready",
        url: publicUrl,
        storage_path: storagePath,
        render_id: renderId,
      }),
    });
    console.log(`[renderer] ↩ ${renderId} callback ${r.status}`);
  }

  // cleanup
  await fs.rm(outDir, { recursive: true, force: true }).catch(() => {});
}

app.listen(PORT, () => {
  console.log(`[renderer] Listening on http://0.0.0.0:${PORT}`);
  console.log(`[renderer] Edge fn webhook URL (from docker): http://host.docker.internal:${PORT}/render`);
  // pre-warm bundle
  void getBundle().catch((e) => console.error("[renderer] initial bundle failed", e));
});
