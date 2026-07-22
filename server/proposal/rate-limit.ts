import { checkRateLimit } from "@vercel/firewall";
import { createHash } from "node:crypto";

import { PROPOSAL_RUNS_ID } from "@/lib/proposal";

const LOCAL_WINDOW_MS = 15 * 60 * 1000;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const LOCAL_MAXIMUM = 3;
const GLOBAL_LOCAL_MAXIMUM = 120;
const PDF_LOCAL_MAXIMUM = 6;
const PROPOSAL_PDFS_ID = "proposal-pdfs";
const PROPOSAL_GLOBAL_ID = "proposal-global";

type LocalRateEntry = {
  count: number;
  windowStartedAt: number;
};

const localRateEntries = new Map<string, LocalRateEntry>();
const localGlobalRateEntries = new Map<string, LocalRateEntry>();
const localPdfRateEntries = new Map<string, LocalRateEntry>();

export type ProposalRateLimitResult =
  | { allowed: true; fingerprint: string }
  | {
      allowed: false;
      fingerprint: string;
      reason: "rate_limit_unavailable" | "rate_limited";
      retryAfterSeconds?: number;
    };

function isVercelRuntime() {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

function usesVercelFirewall() {
  return process.env.NODE_ENV === "production" && isVercelRuntime();
}

function sourceIp(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local"
  );
}

export function fingerprintIp(
  request: Request,
  rateLimitId: string = PROPOSAL_RUNS_ID,
) {
  return createHash("sha256")
    .update(`${rateLimitId}:v1:${sourceIp(request)}`, "utf8")
    .digest("hex");
}

function checkLocalRateLimit(
  entries: Map<string, LocalRateEntry>,
  fingerprint: string,
  maximum: number,
  windowMilliseconds: number,
  now: number,
) {
  const current = entries.get(fingerprint);

  if (!current || now - current.windowStartedAt >= windowMilliseconds) {
    entries.set(fingerprint, { count: 1, windowStartedAt: now });
    return true;
  }

  if (current.count >= maximum) {
    return false;
  }

  current.count += 1;
  return true;
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Rate limit check timed out.")),
      milliseconds,
    );

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

export async function enforceProposalRateLimit(
  request: Request,
  now = Date.now(),
): Promise<ProposalRateLimitResult> {
  const fingerprint = fingerprintIp(request);

  if (!usesVercelFirewall()) {
    const ipAllowed = checkLocalRateLimit(
      localRateEntries,
      fingerprint,
      LOCAL_MAXIMUM,
      LOCAL_WINDOW_MS,
      now,
    );

    if (!ipAllowed) {
      return {
        allowed: false,
        fingerprint,
        reason: "rate_limited",
        retryAfterSeconds: LOCAL_WINDOW_MS / 1_000,
      };
    }

    return { allowed: true, fingerprint };
  }

  try {
    const ipResult = await withTimeout(
      checkRateLimit(PROPOSAL_RUNS_ID, { request }),
      5_000,
    );

    if (ipResult.rateLimited) {
      return {
        allowed: false,
        fingerprint,
        reason: "rate_limited",
        retryAfterSeconds: LOCAL_WINDOW_MS / 1_000,
      };
    }

    if (ipResult.error) {
      return {
        allowed: false,
        fingerprint,
        reason: "rate_limit_unavailable",
      };
    }

    return { allowed: true, fingerprint };
  } catch {
    return {
      allowed: false,
      fingerprint,
      reason: "rate_limit_unavailable",
    };
  }
}

export async function enforceProposalGlobalRateLimit(
  request: Request,
  now = Date.now(),
): Promise<ProposalRateLimitResult> {
  const fingerprint = fingerprintIp(request);

  if (!usesVercelFirewall()) {
    return checkLocalRateLimit(
      localGlobalRateEntries,
      "site-global",
      GLOBAL_LOCAL_MAXIMUM,
      GLOBAL_WINDOW_MS,
      now,
    )
      ? { allowed: true, fingerprint }
      : {
          allowed: false,
          fingerprint,
          reason: "rate_limited",
          retryAfterSeconds: GLOBAL_WINDOW_MS / 1_000,
        };
  }

  try {
    const result = await withTimeout(
      checkRateLimit(PROPOSAL_GLOBAL_ID, {
        rateLimitKey: "site-global",
        request,
      }),
      5_000,
    );

    if (result.rateLimited) {
      return {
        allowed: false,
        fingerprint,
        reason: "rate_limited",
        retryAfterSeconds: GLOBAL_WINDOW_MS / 1_000,
      };
    }

    if (result.error) {
      return {
        allowed: false,
        fingerprint,
        reason: "rate_limit_unavailable",
      };
    }

    return { allowed: true, fingerprint };
  } catch {
    return {
      allowed: false,
      fingerprint,
      reason: "rate_limit_unavailable",
    };
  }
}

export async function enforceProposalPdfRateLimit(
  request: Request,
  now = Date.now(),
): Promise<ProposalRateLimitResult> {
  const fingerprint = fingerprintIp(request, PROPOSAL_PDFS_ID);

  if (!usesVercelFirewall()) {
    return checkLocalRateLimit(
      localPdfRateEntries,
      fingerprint,
      PDF_LOCAL_MAXIMUM,
      LOCAL_WINDOW_MS,
      now,
    )
      ? { allowed: true, fingerprint }
      : {
          allowed: false,
          fingerprint,
          reason: "rate_limited",
          retryAfterSeconds: LOCAL_WINDOW_MS / 1_000,
        };
  }

  try {
    const result = await withTimeout(
      checkRateLimit(PROPOSAL_PDFS_ID, { request }),
      5_000,
    );

    if (result.rateLimited) {
      return {
        allowed: false,
        fingerprint,
        reason: "rate_limited",
        retryAfterSeconds: LOCAL_WINDOW_MS / 1_000,
      };
    }

    if (result.error) {
      return {
        allowed: false,
        fingerprint,
        reason: "rate_limit_unavailable",
      };
    }

    return { allowed: true, fingerprint };
  } catch {
    return {
      allowed: false,
      fingerprint,
      reason: "rate_limit_unavailable",
    };
  }
}

export function resetLocalProposalRateLimitForTests() {
  localRateEntries.clear();
  localGlobalRateEntries.clear();
  localPdfRateEntries.clear();
}
