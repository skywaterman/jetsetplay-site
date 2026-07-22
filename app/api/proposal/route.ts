import { randomUUID } from "node:crypto";

import {
  ProposalRequestSchema,
  ProposalStreamEventSchema,
  type InternalSignalMap,
  type ProposalDocument,
  type ProposalErrorCode,
  type ProposalStreamEvent,
} from "@/lib/proposal";
import {
  parseProposalGeneration,
  ProviderOutputError,
  streamAnthropicProposal,
} from "@/server/proposal/anthropic";
import {
  logCatalogueRequest,
  logProposalEvent,
} from "@/server/proposal/ledger";
import {
  enforceProposalGlobalRateLimit,
  enforceProposalRateLimit,
} from "@/server/proposal/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;
const MAX_REQUEST_BYTES = 4_096;

const NDJSON_HEADERS = {
  "cache-control": "no-store, max-age=0",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "content-type": "application/x-ndjson; charset=utf-8",
  "x-content-type-options": "nosniff",
} as const;

class RequestBodyTooLargeError extends Error {}

function encodeEvent(event: ProposalStreamEvent) {
  return `${JSON.stringify(ProposalStreamEventSchema.parse(event))}\n`;
}

function errorResponse(
  code: ProposalErrorCode,
  status: number,
  retryAfterSeconds?: number,
) {
  const headers = new Headers(NDJSON_HEADERS);

  if (status === 429) {
    headers.set("retry-after", String(retryAfterSeconds ?? 900));
  }

  return new Response(encodeEvent({ code, type: "error" }), {
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

function eventStream(
  input: ReturnType<typeof ProposalRequestSchema.parse>,
  runId: string,
  requestSignal: AbortSignal,
) {
  const encoder = new TextEncoder();
  const providerAbortController = new AbortController();
  const timeoutSignal = AbortSignal.timeout(75_000);
  const signal = AbortSignal.any([
    requestSignal,
    timeoutSignal,
    providerAbortController.signal,
  ]);

  return new ReadableStream<Uint8Array>({
    cancel() {
      providerAbortController.abort();
    },
    async start(controller) {
      const send = (event: ProposalStreamEvent) => {
        try {
          controller.enqueue(encoder.encode(encodeEvent(event)));
          return true;
        } catch {
          providerAbortController.abort();
          return false;
        }
      };

      const close = () => {
        try {
          controller.close();
        } catch {
          return;
        }
      };

      const fail = async (code: ProposalErrorCode) => {
        try {
          await logProposalEvent({ runId }, { code, status: "failed" });
          send({ code, type: "error" });
        } catch {
          send({ code: "logging_unavailable", type: "error" });
        }
      };

      send({ runId, type: "started" });
      let received = 0;
      let progressSentAt = 0;
      let proposal: ProposalDocument | null = null;
      let signalMap: InternalSignalMap | null = null;

      try {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          signal.throwIfAborted();
          let rawJson = "";

          try {
            for await (const chunk of streamAnthropicProposal(input, signal)) {
              rawJson += chunk;
              received += chunk.length;

              if (received - progressSentAt >= 256) {
                progressSentAt = received;
                send({ received, type: "progress" });
              }
            }

            const generation = parseProposalGeneration(rawJson, input, runId);
            proposal = generation.proposal;
            signalMap = generation.signal;
            break;
          } catch (error) {
            if (error instanceof ProviderOutputError && attempt === 0) {
              continue;
            }
            throw error;
          }
        }
      } catch (error) {
        const code: ProposalErrorCode = signal.aborted
          ? "request_aborted"
          : error instanceof ProviderOutputError
            ? "provider_output_invalid"
            : "provider_unavailable";
        await fail(code);
        close();
        return;
      }

      if (!proposal || !signalMap) {
        await fail("provider_output_invalid");
        close();
        return;
      }

      try {
        await logProposalEvent(
          { runId },
          { proposal, signal: signalMap, status: "completed" },
        );
      } catch {
        await fail("logging_unavailable");
        close();
        return;
      }

      send({ proposal, type: "proposal" });
      send({ runId, type: "complete" });
      close();
    },
  });
}

export async function POST(request: Request) {
  if (!requestIsSameOrigin(request)) {
    return errorResponse("origin_rejected", 403);
  }

  if (!requestIsJson(request)) {
    return errorResponse("unsupported_content_type", 415);
  }

  const rateLimit = await enforceProposalRateLimit(request);
  if (!rateLimit.allowed) {
    return errorResponse(
      rateLimit.reason,
      rateLimit.reason === "rate_limited" ? 429 : 503,
      rateLimit.retryAfterSeconds,
    );
  }

  const logFailure = async (code: ProposalErrorCode) => {
    const runId = randomUUID();
    try {
      await logProposalEvent({ runId }, { code, status: "failed" });
      return errorResponse(
        code,
        code === "invalid_request" || code === "body_unreadable" ? 400 : 503,
      );
    } catch {
      return errorResponse("logging_unavailable", 503);
    }
  };

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return logFailure("invalid_request");
  }

  let body: unknown;
  try {
    const rawBody = await readRequestBody(request);
    body = JSON.parse(rawBody);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return logFailure("invalid_request");
    }

    return logFailure("body_unreadable");
  }

  const inputResult = ProposalRequestSchema.safeParse(body);
  if (!inputResult.success) {
    return logFailure("invalid_request");
  }

  const globalRateLimit = await enforceProposalGlobalRateLimit(request);
  if (!globalRateLimit.allowed) {
    return errorResponse(
      globalRateLimit.reason,
      globalRateLimit.reason === "rate_limited" ? 429 : 503,
      globalRateLimit.retryAfterSeconds,
    );
  }

  const runId = randomUUID();

  try {
    await Promise.all([
      logProposalEvent(
        { runId },
        { input: inputResult.data, status: "started" },
      ),
      logCatalogueRequest({ runId }, inputResult.data),
    ]);
  } catch {
    try {
      await logProposalEvent(
        { runId },
        { code: "logging_unavailable", status: "failed" },
      );
    } catch {
      return errorResponse("logging_unavailable", 503);
    }
    return errorResponse("logging_unavailable", 503);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    try {
      await logProposalEvent(
        { runId },
        { code: "server_misconfigured", status: "failed" },
      );
    } catch {
      return errorResponse("logging_unavailable", 503);
    }
    return errorResponse("server_misconfigured", 503);
  }

  return new Response(
    eventStream(
      inputResult.data,
      runId,
      request.signal,
    ),
    { headers: NDJSON_HEADERS, status: 200 },
  );
}
