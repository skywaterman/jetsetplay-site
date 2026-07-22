import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const ROOT = process.cwd();
const read = (relativePath) => readFile(path.join(ROOT, relativePath), "utf8");

execFileSync(process.execPath, ["scripts/sync-proposal-context.mjs", "--check"], {
  cwd: ROOT,
  stdio: "pipe",
});

const [
  shared,
  anthropic,
  ledger,
  rateLimit,
  route,
  pdfRoute,
  renderer,
  generatedContext,
  gitignore,
  rendererRequirements,
  rendererDockerfile,
  proposalClient,
  globalStyles,
] = await Promise.all([
  read("lib/proposal.ts"),
  read("server/proposal/anthropic.ts"),
  read("server/proposal/ledger.ts"),
  read("server/proposal/rate-limit.ts"),
  read("app/api/proposal/route.ts"),
  read("app/api/proposal/pdf/route.ts"),
  read("services/pdf-renderer/renderer.py"),
  read("server/generated/proposal-system-context.ts"),
  read(".gitignore"),
  read("services/pdf-renderer/requirements.txt"),
  read("services/pdf-renderer/Dockerfile.vercel"),
  read("components/proposal/ProposalStudio.tsx"),
  read("app/globals.css"),
]);

for (const contract of [
  "/.netlify/functions/claude",
  "proposal-runs",
  "catalogue-requests",
  "jsp-live-leads",
  "jsp-proposal-tracker-v4",
]) {
  assert.ok(shared.includes(contract), `Missing contract: ${contract}`);
}

assert.ok(anthropic.includes('"claude-sonnet-4-6"'));
assert.ok(anthropic.includes('process.env.ANTHROPIC_API_KEY'));
assert.ok(anthropic.includes("MAX_SSE_EVENT_CHARACTERS"));
assert.ok(anthropic.includes("await reader.cancel()"));
assert.ok(anthropic.includes("reader.releaseLock()"));
assert.ok(anthropic.includes('"text/event-stream"'));
assert.ok(anthropic.includes('"output_config"') || anthropic.includes("output_config"));
assert.ok(anthropic.includes('type: "json_schema"'));
assert.ok(anthropic.includes("SIGNAL Report Standard v2"));
assert.ok(anthropic.includes("Identity, Aspiration, Devotion, Status, and Nostalgia"));
assert.ok(anthropic.includes("the score total divided by 25, multiplied by 100"));
assert.ok(anthropic.includes("signalMapIsCalibrated"));
assert.ok(anthropic.includes('"anthropic-version": "2023-06-01"'));
assert.ok(!anthropic.includes("image_url"));
assert.ok(!anthropic.includes("dangerouslySetInnerHTML"));
assert.ok(ledger.includes('access: "private"'));
assert.ok(ledger.includes('"catalogue-requests.ndjson"'));
assert.ok(ledger.includes("logCatalogueRequest"));
assert.ok(ledger.includes("type InternalSignalMap"));
assert.ok(ledger.includes("outputs"));
assert.ok(rateLimit.includes("checkRateLimit(PROPOSAL_RUNS_ID"));
assert.ok(rateLimit.includes('PROPOSAL_GLOBAL_ID = "proposal-global"'));
assert.ok(rateLimit.includes('rateLimitKey: "site-global"'));
assert.ok(route.includes("enforceProposalGlobalRateLimit(request)"));
assert.ok(
  route.indexOf("ProposalRequestSchema.safeParse") <
    route.indexOf("enforceProposalGlobalRateLimit(request)"),
);
assert.ok(
  route.indexOf("enforceProposalGlobalRateLimit(request)") <
    route.lastIndexOf("const runId = randomUUID()"),
);
assert.ok(route.includes('.split(";", 1)'));
assert.ok(route.includes('"application/json"'));
assert.ok(route.includes('fetchSite === "same-origin"'));
assert.ok(route.includes('"application/x-ndjson; charset=utf-8"'));
assert.ok(route.includes("ProposalStreamEventSchema.parse(event)"));
assert.ok(route.includes("parseProposalGeneration"));
assert.ok(route.includes("signal: signalMap"));
assert.ok(route.includes('send({ proposal, type: "proposal" })'));
assert.ok(route.includes("AbortSignal.timeout(75_000)"));
assert.ok(route.includes("await Promise.all(["));
assert.ok(route.includes("cancel()"));
assert.ok(anthropic.includes('redirect: "error"'));
assert.ok(pdfRoute.includes("process.env.PDF_RENDERER_URL"));
assert.ok(pdfRoute.includes("process.env.PDF_RENDERER_SECRET"));
assert.ok(pdfRoute.includes('new URL("/render/one-sheet", rendererUrl)'));
assert.ok(pdfRoute.includes('"application/pdf"'));
assert.ok(!pdfRoute.includes("ANTHROPIC_API_KEY"));
assert.ok(pdfRoute.includes('redirect: "error"'));
assert.ok(renderer.includes('WEASYPRINT_VERSION = "69.0"'));
assert.ok(renderer.includes("len(document.pages) != 1"));
assert.ok(rendererRequirements.includes("WeasyPrint==69.0"));
assert.ok(!rendererRequirements.includes(">="));
assert.ok(!rendererRequirements.includes("~="));
assert.ok(rendererDockerfile.includes("AS verify"));
assert.ok(rendererDockerfile.includes("python -m unittest discover -s tests -v"));
assert.ok(rendererDockerfile.includes("AS runtime"));
assert.ok(proposalClient.includes("<h1>{proposal.title}</h1>"));
assert.ok(proposalClient.includes('className="proposal-output__download-status"'));
assert.ok(proposalClient.includes("window.scrollTo({ left: 0, top: 0 })"));
assert.ok(proposalClient.includes("focus({ preventScroll: true })"));
assert.ok(!proposalClient.includes("InternalSignalMap"));
assert.ok(!proposalClient.includes("ModelProposalGeneration"));
assert.ok(!proposalClient.includes('<span className="sr-only">{SITE_COPY.proposal.email}</span>'));
assert.ok(
  globalStyles.includes(
    'body:has(.proposal-studio[data-proposal-state="ready"]) .site-header',
  ),
);
assert.ok(gitignore.includes(".env*"));
assert.ok(gitignore.includes("!.env.example"));

for (const requiredContextReference of [
  "SOURCE: AGENTS.md",
  "SOURCE: docs/MANIFESTO.md",
  "## 8 · THE ENGINE FLEET",
  "## 9 · PEOPLE AND CONTEXT",
  "Sky Waterman",
  "jsp-proposal-tracker-v4",
]) {
  assert.ok(
    generatedContext.includes(requiredContextReference),
    `Generated proposal context is incomplete: ${requiredContextReference}`,
  );
}

const compiledShared = ts.transpileModule(shared, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: "proposal.ts",
});
const sharedModule = { exports: {} };
const require = createRequire(import.meta.url);
const executeShared = new Function(
  "require",
  "module",
  "exports",
  compiledShared.outputText,
);
executeShared(require, sharedModule, sharedModule.exports);

const proposal = sharedModule.exports;
assert.equal(
  proposal.sanitizeProposalText(`A\u2014hand${"made"}!`),
  "A-custom.",
);
assert.throws(() =>
  proposal.ProposalRequestSchema.parse({
    brand: "A",
    extra: "rejected",
    occasion: "Launch",
    recipient: "Clients",
  }),
);
assert.equal(
  proposal.ProposalRequestSchema.parse({
    brand: "Bespoke House",
    occasion: "Launch",
    recipient: "Clients",
  }).brand,
  "Bespoke House",
);
const safeModelProposal = {
  concept: "A tailored board for a shared table.",
  materials: ["Deep green field.", "Cream points.", "Brass hardware."],
  note: "For the conversations still ahead.",
  palette: {
    dark: "#1A1A1A",
    field: "#557A66",
    light: "#F5F1E8",
  },
  thesis: "A lasting reason to return to the table.",
  title: "The long table",
  tldr: ["A private edition.", "Built for clients.", "Made for return play."],
};
const safeSignalMap = {
  anchorTaxonomy: {
    aspiration: { evidence: "The anniversary marks continued progress.", score: 4 },
    devotion: { evidence: "The gift recognizes an ongoing member relationship.", score: 5 },
    identity: { evidence: "The house and its members share a named community.", score: 5 },
    nostalgia: { evidence: "An anniversary carries memory across time.", score: 4 },
    status: { evidence: "A private member gift carries selective recognition.", score: 3 },
  },
  feltConsiderationScore: 84,
  gift: "A board turns the anniversary into a repeatable gathering ritual.",
  meaningMap: "Membership, continuity, and return play form the central meaning.",
  methodVersion: "v2",
  move: "Create a member edition that returns to the table after the anniversary.",
  object: "A travel backgammon board holds the relationship in active use.",
  rawSignalObserved: [
    "The submitted brand is Cobalt House.",
    "The recipients are members.",
    "The occasion is an anniversary.",
  ],
  stakes: "A generic anniversary gift would miss the value of continued belonging.",
  story: "The board recognizes the time already shared and the games still ahead.",
  subjectSnapshot: "Cobalt House is marking an anniversary for its members.",
};
const safeModelGeneration = { ...safeModelProposal, signal: safeSignalMap };
assert.ok(proposal.ModelProposalSchema.parse(safeModelProposal));
assert.ok(proposal.InternalSignalMapSchema.parse(safeSignalMap));
assert.equal(proposal.signalMapIsCalibrated(safeSignalMap), true);
assert.ok(proposal.ModelProposalGenerationSchema.parse(safeModelGeneration));
assert.throws(() => proposal.ModelProposalGenerationSchema.parse(safeModelProposal));
assert.throws(() =>
  proposal.InternalSignalMapSchema.parse({
    ...safeSignalMap,
    anchorTaxonomy: {
      ...safeSignalMap.anchorTaxonomy,
      identity: { evidence: "Unsupported score.", score: 6 },
    },
  }),
);
assert.equal(
  proposal.signalMapIsCalibrated({
    ...safeSignalMap,
    feltConsiderationScore: 83,
  }),
  false,
);
assert.ok(
  proposal.ModelProposalSchema.parse({
    ...safeModelProposal,
    concept: "A quiet signal of appreciation.",
  }),
);
assert.throws(() =>
  proposal.ModelProposalSchema.parse({
    ...safeModelProposal,
    title: "A private SIGNAL edition.",
  }),
);
assert.throws(() =>
  proposal.ModelProposalSchema.parse({
    ...safeModelProposal,
    title: "A private\u202E edition.",
  }),
);
assert.throws(() =>
  proposal.ModelProposalSchema.parse({
    ...safeModelProposal,
    tldr: ["A private edition.", "A private edition.", "Made for return play."],
  }),
);
assert.throws(() =>
  proposal.ModelProposalSchema.parse({
    ...safeModelProposal,
    concept: "Read the system at https://example.com.",
  }),
);
assert.throws(() =>
  proposal.ModelProposalSchema.parse({
    ...safeModelProposal,
    concept: "JetSetPlay appears in the client concept.",
  }),
);
assert.equal(
  proposal.paletteIsSafeForClientProduct({
    dark: "#1A1A1A",
    field: "#557A66",
    light: "#F5F1E8",
  }),
  true,
);
assert.equal(
  proposal.paletteIsSafeForClientProduct({
    dark: "#1A1A1A",
    field: "#C8235F",
    light: "#F5F1E8",
  }),
  false,
);
assert.throws(() =>
  proposal.ProposalDocumentSchema.parse({
    ...safeModelProposal,
    brandName: "Cobalt House",
    occasion: "Anniversary",
    palette: {
      dark: "#1A1A1A",
      field: "#C8235F",
      light: "#F5F1E8",
    },
    recipient: "Members",
    runId: "2f2fc3a2-e628-4de8-9a38-ece56112c921",
    schemaVersion: "proposal.v1",
  }),
);
assert.throws(() =>
  proposal.ProposalStreamEventSchema.parse({
    received: 1,
    type: "progress",
    unexpected: true,
  }),
);
assert.throws(() =>
  proposal.ProposalStreamEventSchema.parse({
    runId: "2F2FC3A2-E628-4DE8-9A38-ECE56112C921",
    type: "started",
  }),
);

const compiledAnthropic = ts.transpileModule(anthropic, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: "anthropic.ts",
});
const anthropicModule = { exports: {} };
const executeAnthropic = new Function(
  "require",
  "module",
  "exports",
  compiledAnthropic.outputText,
);
executeAnthropic(
  (specifier) => {
    if (specifier === "@/lib/proposal") {
      return proposal;
    }
    if (specifier === "@/server/generated/proposal-system-context") {
      return { PROPOSAL_SYSTEM_CONTEXT: "test context" };
    }
    return require(specifier);
  },
  anthropicModule,
  anthropicModule.exports,
);

const provider = anthropicModule.exports;
const providerJson = JSON.stringify(safeModelGeneration);
const providerEvents = [
  {
    delta: { text: providerJson.slice(0, 211), type: "text_delta" },
    type: "content_block_delta",
  },
  {
    delta: { text: providerJson.slice(211), type: "text_delta" },
    type: "content_block_delta",
  },
  { delta: { stop_reason: "end_turn" }, type: "message_delta" },
  { type: "message_stop" },
];
const providerSse = providerEvents
  .map((event) => `data: ${JSON.stringify(event)}\r\n\r\n`)
  .join("");
const providerBytes = new TextEncoder().encode(providerSse);
const originalFetch = globalThis.fetch;
const originalApiKey = process.env.ANTHROPIC_API_KEY;
let capturedProviderRequest;

try {
  process.env.ANTHROPIC_API_KEY = "server-test-key";
  globalThis.fetch = async (url, init) => {
    capturedProviderRequest = { init, url };
    return new Response(
      new ReadableStream({
        start(controller) {
          for (const byte of providerBytes) {
            controller.enqueue(Uint8Array.of(byte));
          }
          controller.close();
        },
      }),
      { headers: { "content-type": "text/event-stream" }, status: 200 },
    );
  };

  const streamed = [];
  for await (const chunk of provider.streamAnthropicProposal(
    { brand: "Cobalt House", occasion: "Anniversary", recipient: "Members" },
    new AbortController().signal,
  )) {
    streamed.push(chunk);
  }

  assert.equal(streamed.join(""), providerJson);
  const capturedBody = JSON.parse(capturedProviderRequest.init.body);
  assert.equal(capturedProviderRequest.url, "https://api.anthropic.com/v1/messages");
  assert.equal(capturedBody.model, "claude-sonnet-4-6");
  assert.equal(capturedBody.output_config.format.type, "json_schema");
  assert.ok(capturedBody.output_config.format.schema.required.includes("signal"));
  assert.equal(capturedBody.stream, true);
  assert.ok(capturedBody.system.includes("test context"));
  assert.ok(capturedBody.system.includes("TASK RULES"));
  assert.ok(capturedBody.system.includes("private signal object"));
  assert.ok(capturedBody.system.includes("Return only the JSON object"));
  const parsedGeneration = provider.parseProposalGeneration(
    streamed.join(""),
    { brand: "Cobalt House", occasion: "Anniversary", recipient: "Members" },
    "2f2fc3a2-e628-4de8-9a38-ece56112c921",
  );
  assert.equal(parsedGeneration.signal.feltConsiderationScore, 84);
  assert.equal("signal" in parsedGeneration.proposal, false);
  assert.ok(parsedGeneration.proposal.title);
  const recalibratedGeneration = provider.parseProposalGeneration(
    JSON.stringify({
      ...safeModelGeneration,
      signal: { ...safeSignalMap, feltConsiderationScore: 83 },
    }),
    { brand: "Cobalt House", occasion: "Anniversary", recipient: "Members" },
    "2f2fc3a2-e628-4de8-9a38-ece56112c921",
  );
  assert.equal(recalibratedGeneration.signal.feltConsiderationScore, 84);

  let oversizedStreamCancelled = false;
  globalThis.fetch = async () =>
    new Response(
      new ReadableStream({
        cancel() {
          oversizedStreamCancelled = true;
        },
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${"x".repeat(65_537)}`),
          );
        },
      }),
      { headers: { "content-type": "text/event-stream" }, status: 200 },
    );

  let oversizedStreamRejected = false;
  try {
    for await (const _chunk of provider.streamAnthropicProposal(
      { brand: "Cobalt House", occasion: "Anniversary", recipient: "Members" },
      new AbortController().signal,
    )) {
      assert.fail("Oversized provider stream yielded proposal text.");
    }
  } catch (error) {
    oversizedStreamRejected = true;
    assert.ok(error instanceof provider.ProviderRequestError);
  }
  assert.equal(oversizedStreamRejected, true);
  assert.equal(oversizedStreamCancelled, true);
} finally {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) {
    delete process.env.ANTHROPIC_API_KEY;
  } else {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  }
}

const compiledRateLimit = ts.transpileModule(rateLimit, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: "rate-limit.ts",
});
const rateLimitModule = { exports: {} };
const executeRateLimit = new Function(
  "require",
  "module",
  "exports",
  compiledRateLimit.outputText,
);
executeRateLimit(
  (specifier) => {
    if (specifier === "@vercel/firewall") {
      return { checkRateLimit: async () => ({ rateLimited: false }) };
    }
    if (specifier === "@/lib/proposal") {
      return proposal;
    }
    return require(specifier);
  },
  rateLimitModule,
  rateLimitModule.exports,
);

const limiter = rateLimitModule.exports;
limiter.resetLocalProposalRateLimitForTests();
const rateRequest = new Request("http://localhost/api/proposal", {
  headers: { "x-forwarded-for": "203.0.113.9" },
});
for (let index = 0; index < 3; index += 1) {
  const result = await limiter.enforceProposalRateLimit(rateRequest, 1_000);
  assert.equal(result.allowed, true);
  assert.equal(result.fingerprint.includes("203.0.113.9"), false);
}
assert.deepEqual(await limiter.enforceProposalRateLimit(rateRequest, 1_000), {
  allowed: false,
  fingerprint: limiter.fingerprintIp(rateRequest),
  reason: "rate_limited",
  retryAfterSeconds: 900,
});

limiter.resetLocalProposalRateLimitForTests();
for (let index = 0; index < 120; index += 1) {
  const result = await limiter.enforceProposalGlobalRateLimit(rateRequest, 1_000);
  assert.equal(result.allowed, true);
}
assert.deepEqual(
  await limiter.enforceProposalGlobalRateLimit(rateRequest, 1_000),
  {
    allowed: false,
    fingerprint: limiter.fingerprintIp(rateRequest),
    reason: "rate_limited",
    retryAfterSeconds: 3_600,
  },
);

process.stdout.write("Proposal server audit passed.\n");
