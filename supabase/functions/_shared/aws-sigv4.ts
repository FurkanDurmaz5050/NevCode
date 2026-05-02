// Minimal AWS Signature V4 imzalama (Deno, web-crypto kullanır).
// Sadece JSON body POST için. Lambda Invoke API'sini imzalar.
// Referans: https://docs.aws.amazon.com/general/latest/gr/sigv4-signed-request-examples.html

const enc = new TextEncoder();

async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const buf = typeof data === "string" ? enc.encode(data) : data;
  const h = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(key: ArrayBuffer | Uint8Array, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey(
    "raw",
    key as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", k, enc.encode(msg));
}

async function deriveKey(
  secret: string,
  date: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const k1 = await hmac(enc.encode(`AWS4${secret}`), date);
  const k2 = await hmac(k1, region);
  const k3 = await hmac(k2, service);
  return await hmac(k3, "aws4_request");
}

export interface SignOptions {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
  service: string; // "lambda"
  method: string;
  url: string; // full URL incl. query
  body: string;
  contentType?: string;
}

export async function signRequest(opts: SignOptions): Promise<Headers> {
  const url = new URL(opts.url);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = await sha256Hex(opts.body);

  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
  };
  if (opts.sessionToken) headers["x-amz-security-token"] = opts.sessionToken;
  if (opts.contentType) headers["content-type"] = opts.contentType;

  const sortedKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedKeys.map((k) => `${k}:${headers[k].trim()}\n`).join("");
  const signedHeaders = sortedKeys.join(";");

  const canonicalRequest = [
    opts.method.toUpperCase(),
    url.pathname || "/",
    url.searchParams.toString(),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${opts.region}/${opts.service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = await deriveKey(opts.secretAccessKey, dateStamp, opts.region, opts.service);
  const sigBuf = await hmac(signingKey, stringToSign);
  const signature = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, "0")).join("");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${opts.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const out = new Headers();
  for (const [k, v] of Object.entries(headers)) out.set(k, v);
  out.set("Authorization", authorization);
  return out;
}

/**
 * AWS Lambda Invoke API çağrısı (SigV4 imzalı).
 * RequestResponse mode → senkron, Lambda'nın response body'sini döner.
 * Event mode → asenkron, sadece 202 ack.
 */
export async function invokeLambda(input: {
  region: string;
  functionName: string;
  payload: unknown;
  invocationType?: "RequestResponse" | "Event";
}): Promise<{ status: number; body: any }> {
  // Supabase Edge Functions reserves the `AWS_*` prefix for the platform
  // (and rejects `supabase secrets set AWS_*`). Renderer credentials must be
  // stored under `LAMBDA_AWS_*`. Fall back to the legacy names for backward
  // compatibility when the function is invoked from a non-Supabase host.
  const accessKeyId =
    Deno.env.get("LAMBDA_AWS_ACCESS_KEY_ID") ?? Deno.env.get("AWS_ACCESS_KEY_ID");
  const secretAccessKey =
    Deno.env.get("LAMBDA_AWS_SECRET_ACCESS_KEY") ?? Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const sessionToken =
    Deno.env.get("LAMBDA_AWS_SESSION_TOKEN") ??
    Deno.env.get("AWS_SESSION_TOKEN") ??
    undefined;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "LAMBDA_AWS_ACCESS_KEY_ID / LAMBDA_AWS_SECRET_ACCESS_KEY tanımlı değil",
    );
  }
  const url =
    `https://lambda.${input.region}.amazonaws.com/2015-03-31/functions/${encodeURIComponent(input.functionName)}/invocations`;
  const body = JSON.stringify(input.payload);
  const headers = await signRequest({
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region: input.region,
    service: "lambda",
    method: "POST",
    url,
    body,
    contentType: "application/json",
  });
  if (input.invocationType) headers.set("X-Amz-Invocation-Type", input.invocationType);

  const res = await fetch(url, { method: "POST", headers, body });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: res.status, body: parsed };
}
