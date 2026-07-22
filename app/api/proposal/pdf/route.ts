import { createHmac } from "node:crypto";

import { ProposalDocumentSchema } from "@/lib/proposal";
import { enforceProposalPdfRateLimit } from "@/server/proposal/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_REQUEST_BYTES = 24_000;
const MAX_PDF_BYTES = 4_000_000;

class RequestBodyTooLargeError extends Error {}

function errorResponse(status: number, retryAfter?: string) {
  const headers = new Headers({
    "cache-control": "no-store, max-age=0",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
  });

  if (retryAfter) {
    headers.set("retry-after", retryAfter);
  }

  return new Response(JSON.stringify({ error: "one_sheet_unavailable" }), {
    headers,
    status,
  });
}

function requestIsSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  let requestUrl: URL;
  try {
    requestUrl = new URL(request.url);
  } catch {
    return false;
  }

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProtocol || requestUrl.protocol.slice(0, -1);

  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(`${protocol}://${host}`).origin;
  } catch {
    return false;
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  return origin === expectedOrigin && (!fetchSite || fetchSite === "same-origin");
}

function requestIsJson(request: Request) {
  return (
    request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ===
    "application/json"
  );
}

async function readRequestBody(request: Request) {
  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      body += decoder.decode();
      return body;
    }

    received += value.byteLength;
    if (received > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new RequestBodyTooLargeError();
    }

    body += decoder.decode(value, { stream: true });
  }
}

async function readPdf(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("PDF response has no body.");
  }

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    total += value.byteLength;
    if (total > MAX_PDF_BYTES) {
      await reader.cancel();
      throw new Error("PDF response exceeded its limit.");
    }

    chunks.push(value);
  }

  const pdf = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    pdf.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return pdf;
}

function filenameFor(brandName: string) {
  const slug =
    brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, "-")
      .replace(/^-|-$/gu, "") || "brand";
  return `${slug}-proposal-one-sheet.pdf`;
}

export async function POST(request: Request) {
  if (!requestIsSameOrigin(request)) {
    return errorResponse(403);
  }

  if (!requestIsJson(request)) {
    return errorResponse(415);
  }

  const rateLimit = await enforceProposalPdfRateLimit(request);
  if (!rateLimit.allowed) {
    return errorResponse(
      rateLimit.reason === "rate_limited" ? 429 : 503,
      rateLimit.reason === "rate_limited" ? "900" : undefined,
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return errorResponse(400);
  }

  let rawRequest: string;
  try {
    rawRequest = await readRequestBody(request);
  } catch {
    return errorResponse(400);
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(rawRequest);
  } catch {
    return errorResponse(400);
  }

  const proposal = ProposalDocumentSchema.safeParse(decoded);
  if (!proposal.success) {
    return errorResponse(400);
  }

  const rendererUrl = process.env.PDF_RENDERER_URL;
  const rendererSecret = process.env.PDF_RENDERER_SECRET;
  if (!rendererUrl || !rendererSecret) {
    return errorResponse(503);
  }

  const timestamp = Math.floor(Date.now() / 1_000).toString();
  const rendererBody = JSON.stringify(proposal.data);
  const signature = createHmac("sha256", rendererSecret)
    .update(`${timestamp}.${rendererBody}`, "utf8")
    .digest("hex");

  let rendererResponse: Response;
  try {
    rendererResponse = await fetch(
      new URL("/render/one-sheet", rendererUrl),
      {
        body: rendererBody,
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          "x-jsp-signature": signature,
          "x-jsp-timestamp": timestamp,
        },
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      },
    );
  } catch {
    return errorResponse(503);
  }

  if (
    !rendererResponse.ok ||
    rendererResponse.headers.get("content-type")?.split(";", 1)[0] !==
      "application/pdf"
  ) {
    return errorResponse(503);
  }

  let pdf: Uint8Array;
  try {
    pdf = await readPdf(rendererResponse);
  } catch {
    return errorResponse(503);
  }

  const pdfBody = pdf.buffer.slice(
    pdf.byteOffset,
    pdf.byteOffset + pdf.byteLength,
  ) as ArrayBuffer;

  return new Response(pdfBody, {
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-disposition": `attachment; filename="${filenameFor(
        proposal.data.brandName,
      )}"`,
      "content-length": pdf.byteLength.toString(),
      "content-type": "application/pdf",
      "x-content-type-options": "nosniff",
    },
    status: 200,
  });
}
