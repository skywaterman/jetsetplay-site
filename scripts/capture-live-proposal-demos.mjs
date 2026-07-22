import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ENDPOINT = "/.netlify/functions/claude";
const PDF_ENDPOINT = "/api/proposal/pdf";
const MODEL = "claude-sonnet-4-6";
const MAX_STREAM_BYTES = 196_608;
const MAX_PDF_BYTES = 4_000_000;
const EVIDENCE_DIRECTORY = path.join(
  process.cwd(),
  "outputs",
  "evidence",
  "phase-4",
);
const LOCAL_HOSTS = new Set(["127.0.0.1", "[::1]", "localhost"]);
const LOCAL_LEDGER_PATH = path.join(EVIDENCE_DIRECTORY, "proposal-runs.ndjson");
const MAX_LOCAL_LEDGER_BYTES = 5_000_000;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const HEX = /^#[0-9A-F]{6}$/u;
const UNSAFE_COPY = /[\u2013\u2014\x21]|\b(?:heirloom|handmade|hand[ -]?crafted|artisanal|bespoke)\b/iu;
const RESTRICTED_COPY =
  /(?:https?:\/\/|www\.|data:|jet\s*set\s*play|\bJSP\b|\bSIGNAL\b|Thoughtfulness Layer|AGENTS\.md|MANIFESTO\.md)/iu;

const DEMOS = [
  {
    fileSlug: "cobalt-house",
    input: {
      brand: "Cobalt House",
      occasion: "Centennial dinner",
      recipient: "Selected clients",
    },
  },
  {
    fileSlug: "northstar",
    input: {
      brand: "Northstar",
      occasion: "Annual retreat",
      recipient: "Leadership team",
    },
  },
];

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
}

function safeText(value, maximum) {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= maximum &&
    value === value.normalize("NFC") &&
    value === value.replace(/\s+/gu, " ").trim() &&
    !/[\p{Cc}\p{Cf}\p{Cs}]/u.test(value) &&
    !UNSAFE_COPY.test(value) &&
    !RESTRICTED_COPY.test(value)
  );
}

function relativeLuminance(color) {
  const channels = [1, 3, 5].map((index) => {
    const channel = Number.parseInt(color.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

function safeTriple(value, maximum) {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((entry) => safeText(entry, maximum)) &&
    new Set(value).size === value.length
  );
}

function validateProposal(value, input, runId) {
  if (
    !exactKeys(value, [
      "brandName",
      "concept",
      "materials",
      "note",
      "occasion",
      "palette",
      "recipient",
      "runId",
      "schemaVersion",
      "thesis",
      "title",
      "tldr",
    ])
  ) {
    throw new Error("Live proposal has an unexpected shape.");
  }

  if (
    value.schemaVersion !== "proposal.v1" ||
    value.runId !== runId ||
    value.brandName !== input.brand ||
    value.recipient !== input.recipient ||
    value.occasion !== input.occasion ||
    !safeText(value.title, 120) ||
    !safeText(value.concept, 700) ||
    !safeTriple(value.materials, 220) ||
    !safeText(value.note, 420) ||
    !safeText(value.thesis, 220) ||
    !safeTriple(value.tldr, 220)
  ) {
    throw new Error("Live proposal did not pass its copy contract.");
  }

  if (!exactKeys(value.palette, ["dark", "field", "light"])) {
    throw new Error("Live proposal palette has an unexpected shape.");
  }

  const colors = [value.palette.dark, value.palette.field, value.palette.light];
  if (
    !colors.every((color) => typeof color === "string" && HEX.test(color)) ||
    new Set(colors).size !== 3 ||
    colors.includes("#C8235F") ||
    colors.includes("#DD0F4C") ||
    relativeLuminance(value.palette.dark) >= relativeLuminance(value.palette.light) ||
    contrastRatio(value.palette.dark, value.palette.light) < 4.5 ||
    contrastRatio(value.palette.dark, value.palette.field) < 1.2 ||
    contrastRatio(value.palette.field, value.palette.light) < 1.2
  ) {
    throw new Error("Live proposal palette did not pass its client-skin contract.");
  }

  return value;
}

function parseEvents(text, input) {
  const lines = text.split("\n").filter((line) => line.trim());
  const events = lines.map((line) => JSON.parse(line));
  let runId = "";
  let proposal = null;
  let completed = false;
  let phase = "init";

  for (const event of events) {
    if (!event || typeof event !== "object" || typeof event.type !== "string") {
      throw new Error("Live proposal returned an invalid event.");
    }

    if (event.type === "error") {
      throw new Error(`Live proposal returned ${String(event.code)}.`);
    }

    if (event.type === "started") {
      if (
        !exactKeys(event, ["runId", "type"]) ||
        phase !== "init" ||
        runId ||
        !UUID.test(event.runId)
      ) {
        throw new Error("Live proposal returned an invalid start event.");
      }
      runId = event.runId;
      phase = "streaming";
      continue;
    }

    if (event.type === "progress") {
      if (
        !exactKeys(event, ["received", "type"]) ||
        phase !== "streaming" ||
        !runId ||
        !Number.isSafeInteger(event.received) ||
        event.received < 0
      ) {
        throw new Error("Live proposal returned an invalid progress event.");
      }
      continue;
    }

    if (event.type === "proposal") {
      if (
        !exactKeys(event, ["proposal", "type"]) ||
        phase !== "streaming" ||
        !runId ||
        proposal
      ) {
        throw new Error("Live proposal returned an invalid result event.");
      }
      proposal = validateProposal(event.proposal, input, runId);
      phase = "proposed";
      continue;
    }

    if (event.type === "complete") {
      if (
        !exactKeys(event, ["runId", "type"]) ||
        phase !== "proposed" ||
        !proposal ||
        completed ||
        event.runId !== runId
      ) {
        throw new Error("Live proposal returned an invalid completion event.");
      }
      completed = true;
      phase = "complete";
      continue;
    }

    throw new Error("Live proposal returned an unknown event type.");
  }

  if (!runId || !proposal || !completed || phase !== "complete") {
    throw new Error("Live proposal stream was incomplete.");
  }

  return {
    eventTypes: events.map((event) => event.type),
    proposal,
    runId,
  };
}

async function readLimitedResponse(response, maximum) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Live response has no body.");
  }

  const chunks = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    total += value.byteLength;
    if (total > maximum) {
      await reader.cancel();
      throw new Error("Live response exceeded its evidence limit.");
    }
    chunks.push(value);
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

async function captureProposal(baseUrl, input) {
  const endpoint = new URL(ENDPOINT, baseUrl);
  const response = await fetch(endpoint, {
    body: JSON.stringify(input),
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      origin: baseUrl.origin,
    },
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(95_000),
  });

  const mediaType = response.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (!response.ok || mediaType !== "application/x-ndjson") {
    throw new Error(`Live proposal endpoint returned status ${response.status}.`);
  }

  const body = await readLimitedResponse(response, MAX_STREAM_BYTES);
  const parsed = parseEvents(new TextDecoder().decode(body), input);
  return {
    ...parsed,
    response: {
      contentType: response.headers.get("content-type"),
      date: response.headers.get("date"),
      requestId: response.headers.get("x-vercel-id"),
      status: response.status,
    },
  };
}

async function capturePdf(baseUrl, proposal) {
  const endpoint = new URL(PDF_ENDPOINT, baseUrl);
  const response = await fetch(endpoint, {
    body: JSON.stringify(proposal),
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      origin: baseUrl.origin,
    },
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(45_000),
  });

  const mediaType = response.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (!response.ok || mediaType !== "application/pdf") {
    throw new Error(`Live one-sheet endpoint returned status ${response.status}.`);
  }

  const pdf = await readLimitedResponse(response, MAX_PDF_BYTES);
  if (new TextDecoder("ascii").decode(pdf.slice(0, 5)) !== "%PDF-") {
    throw new Error("Live one-sheet response was not a PDF.");
  }

  return {
    bytes: pdf,
    sha256: createHash("sha256").update(pdf).digest("hex"),
  };
}

function selfTest() {
  const demo = DEMOS[0];
  const runId = "2f2fc3a2-e628-4de8-9a38-ece56112c921";
  const proposal = {
    brandName: demo.input.brand,
    concept: "A client-colored board designed for a shared table.",
    materials: ["Deep blue field.", "Warm ivory points.", "Brass hardware."],
    note: "For the conversations still ahead.",
    occasion: demo.input.occasion,
    palette: { dark: "#18233F", field: "#6E86A6", light: "#F3EEDD" },
    recipient: demo.input.recipient,
    runId,
    schemaVersion: "proposal.v1",
    thesis: "A lasting reason to return to the table.",
    title: "The long table",
    tldr: ["A private edition.", "Built for clients.", "Made for return play."],
  };
  const stream = [
    { runId, type: "started" },
    { received: 240, type: "progress" },
    { proposal, type: "proposal" },
    { runId, type: "complete" },
  ]
    .map((event) => JSON.stringify(event))
    .join("\n");

  const parsed = parseEvents(`${stream}\n`, demo.input);
  if (parsed.runId !== runId || parsed.proposal.title !== "The long table") {
    throw new Error("Live evidence capture self-test failed.");
  }

  const localTarget = resolveTarget([
    "--allow-localhost",
    "--base-url=http://127.0.0.1:3000",
  ]);
  const previewTarget = resolveTarget([
    "--base-url=https://preview.example.com/ignored/path",
  ]);
  if (
    localTarget.proofType !== "credentialed-local-claude" ||
    localTarget.baseUrl.href !== "http://127.0.0.1:3000/" ||
    previewTarget.proofType !== "credentialed-live-claude" ||
    previewTarget.baseUrl.href !== "https://preview.example.com/"
  ) {
    throw new Error("Live evidence capture target self-test failed.");
  }
  process.stdout.write("Live proposal evidence capture self-test passed.\n");
}

function resolveTarget(argumentsList) {
  const baseUrlArgument = argumentsList.find((argument) =>
    argument.startsWith("--base-url="),
  );
  if (!baseUrlArgument) {
    throw new Error(
      "Pass --base-url=https://example.vercel.app or use explicit localhost mode.",
    );
  }

  const baseUrl = new URL(baseUrlArgument.slice("--base-url=".length));
  const allowLocalhost = argumentsList.includes("--allow-localhost");
  const isLocalhost = LOCAL_HOSTS.has(baseUrl.hostname);

  if (baseUrl.username || baseUrl.password) {
    throw new Error("The evidence target must not contain credentials.");
  }
  if (isLocalhost) {
    if (!allowLocalhost || baseUrl.protocol !== "http:") {
      throw new Error(
        "Local evidence requires HTTP localhost and the --allow-localhost flag.",
      );
    }
  } else if (allowLocalhost || baseUrl.protocol !== "https:") {
    throw new Error(
      "Hosted evidence requires a credential-free HTTPS preview URL.",
    );
  }

  baseUrl.pathname = "/";
  baseUrl.search = "";
  baseUrl.hash = "";

  return {
    baseUrl,
    isLocalhost,
    outputDirectory: path.join(
      EVIDENCE_DIRECTORY,
      isLocalhost ? "credentialed-local" : "credentialed-live",
    ),
    proofType: isLocalhost
      ? "credentialed-local-claude"
      : "credentialed-live-claude",
  };
}

async function verifyLocalLedger(captures) {
  const ledgerStat = await stat(LOCAL_LEDGER_PATH);
  if (!ledgerStat.isFile() || ledgerStat.size > MAX_LOCAL_LEDGER_BYTES) {
    throw new Error("The local proposal ledger is unavailable or oversized.");
  }

  const records = (await readFile(LOCAL_LEDGER_PATH, "utf8"))
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
  const generatedContext = await readFile(
    path.join(process.cwd(), "server", "generated", "proposal-system-context.ts"),
    "utf8",
  );
  const generatedHash = generatedContext.match(
    /PROPOSAL_SYSTEM_CONTEXT_SHA256 = "([0-9a-f]{64})"/u,
  )?.[1];
  if (!generatedHash) {
    throw new Error("The generated proposal context hash is unavailable.");
  }

  const proofs = new Map();
  for (const capture of captures) {
    const matchingRecords = records.filter(
      (record) => record && record.runId === capture.live.runId,
    );
    const statuses = matchingRecords.map((record) => record.status);
    if (
      matchingRecords.length !== 2 ||
      statuses[0] !== "started" ||
      statuses[1] !== "completed"
    ) {
      throw new Error(`Local ledger is incomplete for ${capture.demo.fileSlug}.`);
    }

    const contextHashes = new Set(
      matchingRecords.map((record) => record.proposalSystemContextSha256),
    );
    const [startedRecord, completedRecord] = matchingRecords;
    if (
      matchingRecords.some(
        (record) =>
          record.event !== record.status ||
          record.model !== MODEL ||
          record.proposalForm !== "proposal-runs" ||
          record.schemaVersion !== "proposal-run.v1" ||
          record.trackerStorageKey !== "jsp-proposal-tracker-v4" ||
          typeof record.occurredAt !== "string" ||
          Number.isNaN(Date.parse(record.occurredAt)),
      ) ||
      startedRecord.input?.brand !== capture.demo.input.brand ||
      startedRecord.input?.occasion !== capture.demo.input.occasion ||
      startedRecord.input?.recipient !== capture.demo.input.recipient ||
      completedRecord.proposal?.runId !== capture.live.runId ||
      completedRecord.proposal?.title !== capture.live.proposal.title ||
      contextHashes.size !== 1 ||
      !/^[0-9a-f]{64}$/u.test([...contextHashes][0]) ||
      [...contextHashes][0] !== generatedHash
    ) {
      throw new Error(`Local ledger contract failed for ${capture.demo.fileSlug}.`);
    }

    proofs.set(capture.live.runId, {
      eventTypes: statuses,
      proposalSystemContextSha256: [...contextHashes][0],
      recordCount: matchingRecords.length,
      schemaVersion: "proposal-run.v1",
    });
  }

  return proofs;
}

async function main() {
  if (process.argv.includes("--self-test")) {
    selfTest();
    return;
  }

  const { baseUrl, isLocalhost, outputDirectory, proofType } =
    resolveTarget(process.argv);

  const capturedAt = new Date().toISOString();
  const captures = [];

  for (const demo of DEMOS) {
    const live = await captureProposal(baseUrl, demo.input);
    if (!isLocalhost && !live.response.requestId) {
      throw new Error("Hosted proposal evidence is missing its Vercel request ID.");
    }
    const pdf = await capturePdf(baseUrl, live.proposal);
    captures.push({ demo, live, pdf });
  }

  const localLedgerProofs = isLocalhost
    ? await verifyLocalLedger(captures)
    : null;

  const temporaryDirectory = `${outputDirectory}.pending-${process.pid}-${Date.now()}`;
  await mkdir(temporaryDirectory);
  for (const capture of captures) {
    const evidence = {
      capturedAt,
      endpoint: new URL(ENDPOINT, baseUrl).toString(),
      eventTypes: capture.live.eventTypes,
      input: capture.demo.input,
      ...(localLedgerProofs
        ? { ledger: localLedgerProofs.get(capture.live.runId) }
        : {}),
      modelContract: MODEL,
      oneSheet: {
        bytes: capture.pdf.bytes.byteLength,
        sha256: capture.pdf.sha256,
      },
      proofType,
      proposal: capture.live.proposal,
      response: capture.live.response,
      runId: capture.live.runId,
      schemaVersion: "phase-4-live-demo.v1",
    };
    await Promise.all([
      writeFile(
        path.join(temporaryDirectory, `${capture.demo.fileSlug}.json`),
        `${JSON.stringify(evidence, null, 2)}\n`,
        "utf8",
      ),
      writeFile(
        path.join(temporaryDirectory, `${capture.demo.fileSlug}-one-sheet.pdf`),
        capture.pdf.bytes,
      ),
    ]);
  }

  await writeFile(
    path.join(temporaryDirectory, "manifest.json"),
    `${JSON.stringify(
      {
        capturedAt,
        demos: captures.map((capture) => capture.demo.fileSlug),
        proofType,
        schemaVersion: "phase-4-live-demo-manifest.v1",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  try {
    await stat(outputDirectory);
    await rename(
      outputDirectory,
      `${outputDirectory}.previous-${process.pid}-${Date.now()}`,
    );
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
  await rename(temporaryDirectory, outputDirectory);

  process.stdout.write(`${outputDirectory}\n`);
}

await main();
