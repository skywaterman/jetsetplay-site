import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import {
  CATALOGUE_REQUESTS_ID,
  LIVE_LEADS_STORAGE_KEY,
  PROPOSAL_RUNS_ID,
  PROPOSAL_SOURCE_PATH,
  PROPOSAL_TRACKER_STORAGE_KEY,
  type InternalSignalMap,
  type ProposalDocument,
  type ProposalErrorCode,
  type ProposalRequest,
} from "@/lib/proposal";
import { PROPOSAL_SYSTEM_CONTEXT_SHA256 } from "@/server/generated/proposal-system-context";

type ProposalLedgerEvent =
  | {
      input: ProposalRequest;
      status: "started";
    }
  | {
      proposal: ProposalDocument;
      signal: InternalSignalMap;
      status: "completed";
    }
  | {
      code: ProposalErrorCode;
      status: "failed";
    };

type LedgerContext = {
  runId: string;
};

const LOCAL_LEDGER_DIRECTORY = path.join(
  process.cwd(),
  "outputs",
  "evidence",
  "phase-4",
);
const LOCAL_LEDGER_PATH = path.join(
  LOCAL_LEDGER_DIRECTORY,
  "proposal-runs.ndjson",
);
const LOCAL_CATALOGUE_PATH = path.join(
  LOCAL_LEDGER_DIRECTORY,
  "catalogue-requests.ndjson",
);

function isVercelRuntime() {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

function recordFor(
  context: LedgerContext,
  event: ProposalLedgerEvent,
  occurredAt: string,
) {
  const recordEvent =
    event.status === "started"
      ? {
          input: {
            brand: event.input.brand,
            occasion: event.input.occasion,
            recipient: event.input.recipient,
          },
          status: event.status,
        }
      : event;

  return {
    catalogueForm: CATALOGUE_REQUESTS_ID,
    event: event.status,
    leadStorageKey: LIVE_LEADS_STORAGE_KEY,
    model: "claude-sonnet-4-6",
    occurredAt,
    proposalForm: PROPOSAL_RUNS_ID,
    proposalSystemContextSha256: PROPOSAL_SYSTEM_CONTEXT_SHA256,
    runId: context.runId,
    schemaVersion: "proposal-run.v1",
    sourcePath: PROPOSAL_SOURCE_PATH,
    trackerStorageKey: PROPOSAL_TRACKER_STORAGE_KEY,
    ...recordEvent,
  };
}

async function writePrivateBlob(
  context: LedgerContext,
  event: ProposalLedgerEvent,
  occurredAt: string,
) {
  const date = occurredAt.slice(0, 10).replace(/-/gu, "/");
  const status = event.status;
  const pathname = `${PROPOSAL_RUNS_ID}/${date}/${context.runId}/${status}-${randomUUID()}.json`;
  await put(pathname, JSON.stringify(recordFor(context, event, occurredAt)), {
    access: "private",
    abortSignal: AbortSignal.timeout(8_000),
    addRandomSuffix: false,
    contentType: "application/json; charset=utf-8",
  });
}

async function writeLocalLedger(
  context: LedgerContext,
  event: ProposalLedgerEvent,
  occurredAt: string,
) {
  await mkdir(LOCAL_LEDGER_DIRECTORY, { recursive: true });
  await appendFile(
    LOCAL_LEDGER_PATH,
    `${JSON.stringify(recordFor(context, event, occurredAt))}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
}

function catalogueRecord(
  context: LedgerContext,
  input: ProposalRequest & { email: string },
  occurredAt: string,
) {
  return {
    brand: input.brand,
    capturedAt: occurredAt,
    email: input.email,
    formName: CATALOGUE_REQUESTS_ID,
    leadStorageKey: LIVE_LEADS_STORAGE_KEY,
    runId: context.runId,
    schemaVersion: "catalogue-request.v1",
    trackerStorageKey: PROPOSAL_TRACKER_STORAGE_KEY,
  };
}

async function writeCatalogueBlob(
  context: LedgerContext,
  input: ProposalRequest & { email: string },
  occurredAt: string,
) {
  const date = occurredAt.slice(0, 10).replace(/-/gu, "/");
  const pathname = `${CATALOGUE_REQUESTS_ID}/${date}/${context.runId}-${randomUUID()}.json`;
  await put(pathname, JSON.stringify(catalogueRecord(context, input, occurredAt)), {
    access: "private",
    abortSignal: AbortSignal.timeout(8_000),
    addRandomSuffix: false,
    contentType: "application/json; charset=utf-8",
  });
}

async function writeLocalCatalogue(
  context: LedgerContext,
  input: ProposalRequest & { email: string },
  occurredAt: string,
) {
  await mkdir(LOCAL_LEDGER_DIRECTORY, { recursive: true });
  await appendFile(
    LOCAL_CATALOGUE_PATH,
    `${JSON.stringify(catalogueRecord(context, input, occurredAt))}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
}

export async function logProposalEvent(
  context: LedgerContext,
  event: ProposalLedgerEvent,
) {
  const occurredAt = new Date().toISOString();

  if (isVercelRuntime()) {
    await writePrivateBlob(context, event, occurredAt);
    return;
  }

  await writeLocalLedger(context, event, occurredAt);
}

export async function logCatalogueRequest(
  context: LedgerContext,
  input: ProposalRequest,
) {
  if (!input.email) {
    return;
  }

  const catalogueInput = { ...input, email: input.email };
  const occurredAt = new Date().toISOString();

  if (isVercelRuntime()) {
    await writeCatalogueBlob(context, catalogueInput, occurredAt);
    return;
  }

  await writeLocalCatalogue(context, catalogueInput, occurredAt);
}
