import { z } from "zod";

const JSP_FUCHSIA_RGB = new Set(["#C8235F", "#DD0F4C"]);
const BANNED_FILLER = /\b(?:heirloom|handmade|hand[ -]?crafted|artisanal|bespoke)\b/giu;
const CONTROL_CHARACTERS = /[\p{Cc}\p{Cf}\p{Cs}]/gu;
const CONTROL_CHARACTERS_PRESENT = /[\p{Cc}\p{Cf}\p{Cs}]/u;
const EXTERNAL_RESOURCE_REFERENCE =
  /(?:https?:\/\/|www\.|data:|\.(?:gif|jpe?g|png|svg|webp)\b)/iu;
const INTERNAL_BRAND_REFERENCE = /\b(?:jet\s*set\s*play|jsp)\b/iu;
const INTERNAL_SIGNAL_REFERENCE = /\bSIGNAL\b|Thoughtfulness Layer/u;
const INTERNAL_SYSTEM_REFERENCE =
  /(?:AGENTS\.md|MANIFESTO\.md|The Vault|World Engine|Render Foundry|Signal Engine|Dream Master List|ANTHROPIC_API_KEY|jsp-asset-vault-v1|jsp-proposal-tracker-v4)/iu;
const INTERNAL_OPERATING_REFERENCE =
  /(?:Sky Waterman|Steve Waterman|\$?10M\s+ARR|Paddock Line|Wake Babalu|Kid Moguls|Vaultbreakers|Battery Rev)/iu;

export const PROPOSAL_SCHEMA_VERSION = "proposal.v1" as const;
export const PROPOSAL_SOURCE_PATH = "/.netlify/functions/claude" as const;
export const PROPOSAL_RUNS_ID = "proposal-runs" as const;
export const CATALOGUE_REQUESTS_ID = "catalogue-requests" as const;
export const LIVE_LEADS_STORAGE_KEY = "jsp-live-leads" as const;
export const PROPOSAL_TRACKER_STORAGE_KEY = "jsp-proposal-tracker-v4" as const;

export function normalizeSubmittedText(value: string) {
  return value
    .normalize("NFC")
    .replace(CONTROL_CHARACTERS, "")
    .replace(/[\u2013\u2014]/gu, "-")
    .replace(/!/gu, ".")
    .replace(/\s+/gu, " ")
    .replace(/\.{2,}/gu, ".")
    .trim();
}

export function sanitizeProposalText(value: string) {
  return normalizeSubmittedText(value).replace(BANNED_FILLER, "custom");
}

function fitProposalText(value: string, maximum: number) {
  if (CONTROL_CHARACTERS_PRESENT.test(value)) {
    return value;
  }

  const sanitized = sanitizeProposalText(value);
  if (sanitized.length <= maximum) {
    return sanitized;
  }

  const clipped = sanitized.slice(0, maximum + 1);
  const sentenceEnds = [...clipped.matchAll(/[.?](?=\s|$)/gu)];
  const sentenceEnd = sentenceEnds.at(-1)?.index;
  if (sentenceEnd !== undefined && sentenceEnd >= Math.floor(maximum * 0.55)) {
    return clipped.slice(0, sentenceEnd + 1).trim();
  }

  const wordEnd = clipped.lastIndexOf(" ");
  return clipped
    .slice(0, wordEnd > 0 ? wordEnd : maximum)
    .replace(/[,;:]+$/gu, "")
    .trim();
}

const submittedText = (label: string, maximum: number) =>
  z
    .string({ error: `${label} must be text.` })
    .min(1, { error: `${label} is required.` })
    .max(maximum, { error: `${label} is too long.` })
    .transform(normalizeSubmittedText)
    .pipe(
      z
        .string()
        .min(1, { error: `${label} is required.` })
        .max(maximum, { error: `${label} is too long.` }),
    );

export const ProposalRequestSchema = z
  .object({
    brand: submittedText("Brand name", 80),
    email: z
      .union([z.email().max(254), z.literal("")])
      .optional()
      .transform((value) => value || undefined),
    occasion: submittedText("Occasion", 120),
    recipient: submittedText("Recipient", 120),
  })
  .strict();

export type ProposalRequest = z.infer<typeof ProposalRequestSchema>;

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9A-F]{6}$/u, "Use a six-digit uppercase hex color.");

const UuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    "Use a lowercase UUID.",
  );

export const ProposalPaletteSchema = z
  .object({
    dark: HexColorSchema,
    field: HexColorSchema,
    light: HexColorSchema,
  })
  .strict();

const proposalCopy = (label: string, maximum: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" ? fitProposalText(value, maximum) : value,
    z
      .string({ error: `${label} must be text.` })
      .min(1, { error: `${label} is required.` })
      .max(maximum, { error: `${label} is too long.` })
      .refine((value) => !CONTROL_CHARACTERS_PRESENT.test(value), {
        error: `${label} contains unsupported characters.`,
      })
      .refine(
        (value) =>
          !INTERNAL_BRAND_REFERENCE.test(value) &&
          !INTERNAL_SIGNAL_REFERENCE.test(value) &&
          !INTERNAL_SYSTEM_REFERENCE.test(value) &&
          !INTERNAL_OPERATING_REFERENCE.test(value) &&
          !EXTERNAL_RESOURCE_REFERENCE.test(value),
        { error: `${label} contains internal language.` },
      ),
  );

const proposalTriple = (
  label: string,
  maximum: number,
  distinctError: string,
) =>
  z.preprocess(
    (value) => (Array.isArray(value) ? value.slice(0, 3) : value),
    z
      .tuple([
        proposalCopy(label, maximum),
        proposalCopy(label, maximum),
        proposalCopy(label, maximum),
      ])
      .refine((lines) => new Set(lines).size === lines.length, {
        error: distinctError,
      }),
  );

export const ModelProposalSchema = z
  .object({
    concept: proposalCopy("Concept", 700),
    materials: proposalTriple(
      "Material",
      220,
      "Materials must be distinct.",
    ),
    note: proposalCopy("Note", 420),
    palette: ProposalPaletteSchema,
    thesis: proposalCopy("Thesis", 220),
    title: proposalCopy("Title", 120),
    tldr: proposalTriple(
      "TLDR line",
      220,
      "TLDR lines must be distinct.",
    ),
  })
  .strict();

export type ModelProposal = z.infer<typeof ModelProposalSchema>;

const SignalAnchorSchema = z
  .object({
    evidence: proposalCopy("Anchor evidence", 320),
    score: z.number().int().min(1).max(5),
  })
  .strict();

export const InternalSignalMapSchema = z
  .object({
    anchorTaxonomy: z
      .object({
        aspiration: SignalAnchorSchema,
        devotion: SignalAnchorSchema,
        identity: SignalAnchorSchema,
        nostalgia: SignalAnchorSchema,
        status: SignalAnchorSchema,
      })
      .strict(),
    feltConsiderationScore: z.number().int().min(20).max(100),
    gift: proposalCopy("Gift", 480),
    meaningMap: proposalCopy("Meaning map", 800),
    methodVersion: z.literal("v2"),
    move: proposalCopy("Move", 480),
    object: proposalCopy("Object", 480),
    rawSignalObserved: z.preprocess(
      (value) => (Array.isArray(value) ? value.slice(0, 5) : value),
      z.array(proposalCopy("Observed signal", 320)).min(3).max(5),
    ),
    stakes: proposalCopy("Stakes", 480),
    story: proposalCopy("Story", 800),
    subjectSnapshot: proposalCopy("Subject snapshot", 480),
  })
  .strict();

export type InternalSignalMap = z.infer<typeof InternalSignalMapSchema>;

export function signalMapIsCalibrated(signal: InternalSignalMap) {
  const anchors = signal.anchorTaxonomy;
  const total =
    anchors.aspiration.score +
    anchors.devotion.score +
    anchors.identity.score +
    anchors.nostalgia.score +
    anchors.status.score;

  return signal.feltConsiderationScore === Math.round((total / 25) * 100);
}

export const ModelProposalGenerationSchema = ModelProposalSchema.extend({
  signal: InternalSignalMapSchema,
}).strict();

export type ModelProposalGeneration = z.infer<
  typeof ModelProposalGenerationSchema
>;

export const ProposalDocumentSchema = ModelProposalSchema.extend({
  brandName: submittedText("Brand name", 80),
  occasion: submittedText("Occasion", 120),
  recipient: submittedText("Recipient", 120),
  runId: UuidSchema,
  schemaVersion: z.literal(PROPOSAL_SCHEMA_VERSION),
})
  .strict()
  .refine((document) => paletteIsSafeForClientProduct(document.palette), {
    error: "Client palette is not safe.",
    path: ["palette"],
  });

export type ProposalDocument = z.infer<typeof ProposalDocumentSchema>;

export const ProposalErrorCodeSchema = z.enum([
  "body_unreadable",
  "invalid_request",
  "logging_unavailable",
  "origin_rejected",
  "provider_output_invalid",
  "provider_unavailable",
  "rate_limit_unavailable",
  "rate_limited",
  "request_aborted",
  "server_misconfigured",
  "unsupported_content_type",
]);

export type ProposalErrorCode = z.infer<typeof ProposalErrorCodeSchema>;

export const ProposalStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ runId: UuidSchema, type: z.literal("started") }).strict(),
  z
    .object({ received: z.number().int().min(0), type: z.literal("progress") })
    .strict(),
  z
    .object({ proposal: ProposalDocumentSchema, type: z.literal("proposal") })
    .strict(),
  z.object({ runId: UuidSchema, type: z.literal("complete") }).strict(),
  z.object({ code: ProposalErrorCodeSchema, type: z.literal("error") }).strict(),
]);

export type ProposalStreamEvent = z.infer<typeof ProposalStreamEventSchema>;

function hexToRgb(hex: string) {
  return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
}

function relativeLuminance(hex: string) {
  const channels = hexToRgb(hex).map((value) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first: string, second: string) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function paletteIsSafeForClientProduct(
  palette: z.infer<typeof ProposalPaletteSchema>,
) {
  const colors = [palette.dark, palette.field, palette.light];

  if (colors.some((color) => JSP_FUCHSIA_RGB.has(color))) {
    return false;
  }

  if (new Set(colors).size !== colors.length) {
    return false;
  }

  if (relativeLuminance(palette.dark) >= relativeLuminance(palette.light)) {
    return false;
  }

  return (
    contrastRatio(palette.dark, palette.light) >= 4.5 &&
    contrastRatio(palette.dark, palette.field) >= 1.2 &&
    contrastRatio(palette.field, palette.light) >= 1.2
  );
}

export const ANTHROPIC_PROPOSAL_JSON_SCHEMA = {
  additionalProperties: false,
  properties: {
    concept: { maxLength: 700, minLength: 1, type: "string" },
    materials: {
      items: { maxLength: 220, minLength: 1, type: "string" },
      minItems: 1,
      type: "array",
    },
    note: { maxLength: 420, minLength: 1, type: "string" },
    palette: {
      additionalProperties: false,
      properties: {
        dark: { pattern: "^#[0-9A-F]{6}$", type: "string" },
        field: { pattern: "^#[0-9A-F]{6}$", type: "string" },
        light: { pattern: "^#[0-9A-F]{6}$", type: "string" },
      },
      required: ["dark", "field", "light"],
      type: "object",
    },
    signal: {
      additionalProperties: false,
      properties: {
        anchorTaxonomy: {
          additionalProperties: false,
          properties: {
            aspiration: {
              additionalProperties: false,
              properties: {
                evidence: { maxLength: 320, minLength: 1, type: "string" },
                score: { type: "integer" },
              },
              required: ["score", "evidence"],
              type: "object",
            },
            devotion: {
              additionalProperties: false,
              properties: {
                evidence: { maxLength: 320, minLength: 1, type: "string" },
                score: { type: "integer" },
              },
              required: ["score", "evidence"],
              type: "object",
            },
            identity: {
              additionalProperties: false,
              properties: {
                evidence: { maxLength: 320, minLength: 1, type: "string" },
                score: { type: "integer" },
              },
              required: ["score", "evidence"],
              type: "object",
            },
            nostalgia: {
              additionalProperties: false,
              properties: {
                evidence: { maxLength: 320, minLength: 1, type: "string" },
                score: { type: "integer" },
              },
              required: ["score", "evidence"],
              type: "object",
            },
            status: {
              additionalProperties: false,
              properties: {
                evidence: { maxLength: 320, minLength: 1, type: "string" },
                score: { type: "integer" },
              },
              required: ["score", "evidence"],
              type: "object",
            },
          },
          required: [
            "identity",
            "aspiration",
            "devotion",
            "status",
            "nostalgia",
          ],
          type: "object",
        },
        feltConsiderationScore: { type: "integer" },
        gift: { maxLength: 480, minLength: 1, type: "string" },
        meaningMap: { maxLength: 800, minLength: 1, type: "string" },
        methodVersion: { const: "v2", type: "string" },
        move: { maxLength: 480, minLength: 1, type: "string" },
        object: { maxLength: 480, minLength: 1, type: "string" },
        rawSignalObserved: {
          items: { maxLength: 320, minLength: 1, type: "string" },
          minItems: 1,
          type: "array",
        },
        stakes: { maxLength: 480, minLength: 1, type: "string" },
        story: { maxLength: 800, minLength: 1, type: "string" },
        subjectSnapshot: { maxLength: 480, minLength: 1, type: "string" },
      },
      required: [
        "methodVersion",
        "subjectSnapshot",
        "rawSignalObserved",
        "meaningMap",
        "anchorTaxonomy",
        "story",
        "stakes",
        "object",
        "gift",
        "feltConsiderationScore",
        "move",
      ],
      type: "object",
    },
    thesis: { maxLength: 220, minLength: 1, type: "string" },
    title: { maxLength: 120, minLength: 1, type: "string" },
    tldr: {
      items: { maxLength: 220, minLength: 1, type: "string" },
      minItems: 1,
      type: "array",
    },
  },
  required: [
    "palette",
    "signal",
    "title",
    "concept",
    "materials",
    "note",
    "thesis",
    "tldr",
  ],
  type: "object",
} as const;
