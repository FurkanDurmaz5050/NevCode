#!/usr/bin/env tsx
/**
 * GlobalNest — Remotion Lambda deploy + smoke test script.
 *
 * Komutlar:
 *   tsx scripts/deploy-lambda.ts functions   → Lambda function'ı deploy et (3008MB / 240s / 2GB disk)
 *   tsx scripts/deploy-lambda.ts site        → src/index.ts bundle'ını S3'e upload et (siteName=globalnest)
 *   tsx scripts/deploy-lambda.ts all         → ikisini birden, ardından env değişkenlerini stdout'a yaz
 *   tsx scripts/deploy-lambda.ts policy      → Gereken IAM policy JSON'ını ekrana yazar
 *   tsx scripts/deploy-lambda.ts test        → SERVE_URL+FN_NAME ile küçük bir render başlatıp render id döner
 *
 * Önkoşullar (bkz. remotion/README.md):
 *   - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION (default eu-central-1)
 *   - IAM user'a remotion-user-policy.json bağlı (npm script `lambda:policy` çıktısı)
 */
import {
  deployFunction,
  deploySite,
  getOrCreateBucket,
  renderMediaOnLambda,
  getRenderProgress,
} from "@remotion/lambda";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRY = path.resolve(__dirname, "..", "src", "index.ts");
const REGION = (process.env.AWS_REGION ?? "eu-central-1") as any;
const SITE_NAME = process.env.REMOTION_SITE_NAME ?? "globalnest";

async function deployFn() {
  console.log(`[lambda] Deploying function in ${REGION}…`);
  const out = await deployFunction({
    region: REGION,
    timeoutInSeconds: 240,
    memorySizeInMb: 3008,
    diskSizeInMb: 2048,
    createCloudWatchLogGroup: true,
  });
  console.log(`[lambda] ✔ Function deployed: ${out.functionName}`);
  console.log(`[lambda]   Already existed: ${out.alreadyExisted}`);
  return out.functionName;
}

async function deploySiteCmd() {
  console.log("[lambda] Ensuring S3 bucket…");
  const { bucketName } = await getOrCreateBucket({ region: REGION });
  console.log(`[lambda]   Bucket: ${bucketName}`);
  console.log("[lambda] Bundling + uploading site…");
  const out = await deploySite({
    bucketName,
    entryPoint: ENTRY,
    region: REGION,
    siteName: SITE_NAME,
    options: { onBundleProgress: (p) => process.stdout.write(`\r[bundle] ${p}%`) },
  });
  console.log(`\n[lambda] ✔ Site deployed: ${out.siteName}`);
  console.log(`[lambda]   Serve URL: ${out.serveUrl}`);
  return out.serveUrl;
}

function printPolicy() {
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "RemotionLambdaInvoke",
        Effect: "Allow",
        Action: [
          "lambda:InvokeFunction",
          "lambda:CreateFunction",
          "lambda:DeleteFunction",
          "lambda:GetFunction",
          "lambda:ListFunctions",
          "lambda:PutFunctionEventInvokeConfig",
          "lambda:UpdateFunctionConfiguration",
          "lambda:CreateFunctionUrlConfig",
          "lambda:GetFunctionUrlConfig",
          "lambda:UpdateFunctionUrlConfig",
          "lambda:GetLayerVersion",
          "lambda:ListLayers",
          "lambda:ListLayerVersions",
          "lambda:TagResource",
          "lambda:ListTags",
        ],
        Resource: "*",
      },
      {
        Sid: "RemotionS3List",
        Effect: "Allow",
        Action: ["s3:ListAllMyBuckets", "s3:GetBucketLocation"],
        Resource: "*",
      },
      {
        Sid: "RemotionS3",
        Effect: "Allow",
        Action: [
          "s3:CreateBucket",
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:PutBucketAcl",
          "s3:PutBucketPolicy",
          "s3:PutBucketCORS",
          "s3:PutBucketWebsite",
          "s3:PutBucketOwnershipControls",
          "s3:GetBucketOwnershipControls",
          "s3:DeleteBucketOwnershipControls",
          "s3:PutBucketPublicAccessBlock",
          "s3:GetBucketPublicAccessBlock",
          "s3:PutBucketVersioning",
          "s3:GetBucketVersioning",
          "s3:PutBucketTagging",
          "s3:GetBucketTagging",
          "s3:PutBucketLogging",
          "s3:GetBucketLogging",
          "s3:PutLifecycleConfiguration",
          "s3:GetLifecycleConfiguration",
          "s3:PutObjectAcl",
          "s3:GetBucketLocation",
        ],
        Resource: ["arn:aws:s3:::remotionlambda-*", "arn:aws:s3:::remotionlambda-*/*"],
      },
      {
        Sid: "RemotionIAM",
        Effect: "Allow",
        Action: [
          "iam:CreateRole",
          "iam:AttachRolePolicy",
          "iam:PutRolePolicy",
          "iam:GetRole",
          "iam:PassRole",
        ],
        Resource: "*",
      },
      {
        Sid: "RemotionCloudWatch",
        Effect: "Allow",
        Action: [
          "logs:CreateLogGroup",
          "logs:PutRetentionPolicy",
          "logs:DescribeLogGroups",
        ],
        Resource: "*",
      },
    ],
  };
  console.log(JSON.stringify(policy, null, 2));
}

async function smokeTest() {
  const serveUrl = process.env.REMOTION_SERVE_URL;
  const functionName = process.env.REMOTION_LAMBDA_FUNCTION_NAME;
  if (!serveUrl || !functionName) {
    throw new Error("REMOTION_SERVE_URL ve REMOTION_LAMBDA_FUNCTION_NAME env'leri lazım");
  }
  console.log("[lambda] Smoke render başlatılıyor (ProductHero)…");
  const out = await renderMediaOnLambda({
    region: REGION,
    functionName,
    serveUrl,
    composition: "ProductHero",
    inputProps: {
      brandName: "Smoke Test",
      productName: "Demo",
      productImageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80",
      marketCountry: "Türkiye",
      marketFlag: "🇹🇷",
      marketplaces: ["Trendyol"],
      accentColor: "#10b981",
      language: "TR",
      hook: "Smoke",
      cta: "Test",
      bullets: ["test"],
      scenes: [],
      duration_seconds: 15,
    },
    codec: "h264",
    imageFormat: "jpeg",
    framesPerLambda: 80,
    privacy: "public",
    maxRetries: 1,
  });
  console.log(`[lambda] renderId=${out.renderId} bucketName=${out.bucketName}`);
  console.log("[lambda] Polling progress…");
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const p = await getRenderProgress({
      renderId: out.renderId,
      bucketName: out.bucketName,
      functionName,
      region: REGION,
    });
    process.stdout.write(`\r[lambda] ${Math.round((p.overallProgress ?? 0) * 100)}%`);
    if (p.done) {
      console.log(`\n[lambda] ✔ Done: ${p.outputFile}`);
      return;
    }
    if (p.fatalErrorEncountered) {
      console.error(`\n[lambda] ✗ Failed:`, p.errors);
      process.exit(1);
    }
  }
  console.log("\n[lambda] Timeout waiting for render");
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === "functions") {
    const fn = await deployFn();
    console.log(`\nexport REMOTION_LAMBDA_FUNCTION_NAME=${fn}`);
    return;
  }
  if (cmd === "site") {
    const url = await deploySiteCmd();
    console.log(`\nexport REMOTION_SERVE_URL=${url}`);
    return;
  }
  if (cmd === "all") {
    const fn = await deployFn();
    const url = await deploySiteCmd();
    console.log("\n=== Supabase secrets'a ekle ===");
    console.log(`supabase secrets set REMOTION_LAMBDA_FUNCTION_NAME=${fn}`);
    console.log(`supabase secrets set REMOTION_SERVE_URL=${url}`);
    console.log(`supabase secrets set AWS_REGION=${REGION}`);
    console.log(`supabase secrets set AWS_ACCESS_KEY_ID=...`);
    console.log(`supabase secrets set AWS_SECRET_ACCESS_KEY=...`);
    return;
  }
  if (cmd === "policy") {
    printPolicy();
    return;
  }
  if (cmd === "test") {
    await smokeTest();
    return;
  }
  console.error("Geçersiz komut. Kullanım: deploy-lambda.ts <functions|site|all|policy|test>");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
