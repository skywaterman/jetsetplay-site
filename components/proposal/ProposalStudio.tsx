"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import Link from "next/link";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { BoardFace } from "@/components/board/BoardFace";
import { HOUSE_BOARD_COLORWAYS, type BoardBrand } from "@/lib/board-face";
import type { ProposalDocument, ProposalStreamEvent } from "@/lib/proposal/types";
import { SITE_COPY } from "@/lib/site-copy";

const LEAD_STORAGE_KEY = "jsp-live-leads";
const PROPOSAL_ENDPOINT = "/.netlify/functions/claude";
const bannedCopy = /\b(?:heirloom|handmade|hand[ -]?crafted|artisanal|bespoke)\b/iu;
const forbiddenGeneratedCopy =
  /(?:https?:\/\/|www\.|data:|\.(?:gif|jpe?g|png|svg|webp)\b|jet\s*set\s*play|\bJSP\b)/iu;
const forbiddenSignalCopy = /\bSIGNAL\b|Thoughtfulness Layer/u;
const unsafePunctuation = /[\u2013\u2014\x21]/u;
const controlCharacters = /[\p{Cc}\p{Cf}\p{Cs}]/u;
const proposalErrorCodes = new Set([
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

type ProposalState = "error" | "idle" | "loading" | "ready";
type DownloadState = "error" | "idle" | "loading";

type ProposalStyle = CSSProperties &
  Record<
    "--proposal-dark" | "--proposal-field" | "--proposal-light",
    string
  >;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function isSafeInputText(value: unknown, limit: number): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= limit &&
    value === value.normalize("NFC") &&
    value === value.replace(/\s+/gu, " ").trim() &&
    !controlCharacters.test(value) &&
    !unsafePunctuation.test(value)
  );
}

function isSafeGeneratedText(value: unknown, limit: number): value is string {
  return (
    isSafeInputText(value, limit) &&
    !bannedCopy.test(value) &&
    !forbiddenGeneratedCopy.test(value) &&
    !forbiddenSignalCopy.test(value)
  );
}

function isUuid(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(
      value,
    )
  );
}

function isHex(value: unknown): value is `#${string}` {
  return typeof value === "string" && /^#[\dA-F]{6}$/u.test(value);
}

function relativeLuminance(color: `#${string}`) {
  const channels = [1, 3, 5].map((index) => {
    const channel = Number.parseInt(color.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first: `#${string}`, second: `#${string}`) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function isSafePalette(value: unknown) {
  if (!isRecord(value) || !hasExactKeys(value, ["dark", "field", "light"])) {
    return false;
  }

  const colors = [value.dark, value.field, value.light];
  const forbidden = new Set(["#C8235F", "#DD0F4C"]);

  if (!colors.every(isHex)) {
    return false;
  }

  const [dark, field, light] = colors;

  return (
    colors.every((color) => !forbidden.has(color.toUpperCase())) &&
    new Set(colors.map((color) => color.toUpperCase())).size === 3 &&
    relativeLuminance(dark) < relativeLuminance(light) &&
    contrastRatio(dark, light) >= 4.5 &&
    contrastRatio(dark, field) >= 1.2 &&
    contrastRatio(field, light) >= 1.2
  );
}

function isTriple(value: unknown, limit: number) {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((entry) => isSafeGeneratedText(entry, limit)) &&
    new Set(value).size === value.length
  );
}

function isProposalDocument(value: unknown): value is ProposalDocument {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
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
    return false;
  }

  return (
    value.schemaVersion === "proposal.v1" &&
    isUuid(value.runId) &&
    isSafeInputText(value.brandName, 80) &&
    isSafeInputText(value.recipient, 120) &&
    isSafeInputText(value.occasion, 120) &&
    isSafePalette(value.palette) &&
    isSafeGeneratedText(value.title, 120) &&
    isSafeGeneratedText(value.concept, 700) &&
    isTriple(value.materials, 220) &&
    isSafeGeneratedText(value.note, 420) &&
    isSafeGeneratedText(value.thesis, 220) &&
    isTriple(value.tldr, 220)
  );
}

function parseStreamEvent(line: string): ProposalStreamEvent {
  const value: unknown = JSON.parse(line);

  if (!isRecord(value) || typeof value.type !== "string") {
    throw new Error("Invalid proposal event");
  }

  if (value.type === "started" || value.type === "complete") {
    if (!hasExactKeys(value, ["runId", "type"]) || !isUuid(value.runId)) {
      throw new Error("Invalid proposal run event");
    }

    return { runId: value.runId, type: value.type } as ProposalStreamEvent;
  }

  if (value.type === "progress") {
    if (
      !hasExactKeys(value, ["received", "type"]) ||
      typeof value.received !== "number" ||
      !Number.isSafeInteger(value.received) ||
      value.received < 0
    ) {
      throw new Error("Invalid proposal progress event");
    }

    return { received: value.received, type: "progress" };
  }

  if (value.type === "proposal") {
    if (
      !hasExactKeys(value, ["proposal", "type"]) ||
      !isProposalDocument(value.proposal)
    ) {
      throw new Error("Invalid proposal result event");
    }

    return { proposal: value.proposal, type: "proposal" };
  }

  if (value.type === "error") {
    if (
      !hasExactKeys(value, ["code", "type"]) ||
      typeof value.code !== "string" ||
      !proposalErrorCodes.has(value.code)
    ) {
      throw new Error("Invalid proposal error event");
    }

    return { code: "provider_unavailable", type: "error" };
  }

  throw new Error("Unknown proposal event");
}

async function readProposalStream(
  response: Response,
  callbacks: {
    onProgress: (received: number) => void;
    onProposal: (proposal: ProposalDocument) => void;
  },
) {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("Proposal stream is unavailable");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;
  let runId = "";
  let total = 0;
  let proposal: ProposalDocument | null = null;

  const acceptEvent = async (event: ProposalStreamEvent) => {
    if (event.type === "started") {
      if (runId) {
        throw new Error("Proposal stream started more than once");
      }
      runId = event.runId;
      return;
    }

    if (event.type === "proposal") {
      if (!isProposalDocument(event.proposal)) {
        throw new Error("Proposal response failed validation");
      }

      if (!runId || event.proposal.runId !== runId || proposal) {
        throw new Error("Proposal response did not match its run");
      }

      proposal = event.proposal;
      callbacks.onProposal(event.proposal);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      return;
    }

    if (event.type === "complete") {
      if (!runId || event.runId !== runId) {
        throw new Error("Proposal completion did not match its run");
      }

      completed = true;
      return;
    }

    if (event.type === "error") {
      throw new Error("Proposal generation failed");
    }

    if (event.type !== "progress" || !runId) {
      throw new Error("Unknown proposal event");
    }

    callbacks.onProgress(event.received);
  };

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      buffer += decoder.decode();
      break;
    }

    total += value.byteLength;

    if (total > 196_608) {
      throw new Error("Proposal stream exceeded its limit");
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const event = parseStreamEvent(line);
      await acceptEvent(event);
    }
  }

  if (buffer.trim()) {
    await acceptEvent(parseStreamEvent(buffer));
  }

  if (!proposal || !completed) {
    throw new Error("Proposal response was incomplete");
  }

  return proposal;
}

function xmlEscape(value: string) {
  return value.replace(/[&<>"']/gu, (character) => {
    const entities: Record<string, string> = {
      '"': "&quot;",
      "&": "&amp;",
      "'": "&apos;",
      "<": "&lt;",
      ">": "&gt;",
    };

    return entities[character];
  });
}

function logoDataUri(proposal: ProposalDocument) {
  const name = xmlEscape(proposal.brandName);
  const characterCount = Array.from(proposal.brandName).length;
  const fontSize = characterCount > 22 ? 26 : characterCount > 14 ? 34 : 44;
  const letterSpacing = characterCount > 18 ? 0.5 : 1.5;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 70"><text x="180" y="49" fill="${proposal.palette.dark}" font-family="Instrument Sans,Arial,sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="${letterSpacing}" text-anchor="middle">${name}</text></svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function boardBrand(proposal: ProposalDocument): BoardBrand {
  const { dark, field, light } = proposal.palette;
  if (!isHex(dark) || !isHex(field) || !isHex(light)) {
    throw new Error("Proposal palette was invalid");
  }

  return {
    field,
    logo: {
      alt: proposal.brandName,
      background: light,
      src: logoDataUri(proposal),
    },
    motif: proposal.brandName,
    name: proposal.brandName,
    primary: dark,
    secondary: light,
  };
}

async function downloadOneSheet(proposal: ProposalDocument) {
  const response = await fetch("/api/proposal/pdf", {
    body: JSON.stringify(proposal),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("One-sheet generation failed");
  }

  const blob = await response.blob();
  if (blob.type !== "application/pdf" || blob.size > 4_000_000) {
    throw new Error("One-sheet response was invalid");
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const slug = proposal.brandName
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "") || "brand";

  anchor.download = `${slug}-proposal-one-sheet.pdf`;
  anchor.href = url;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function storeLead(proposal: ProposalDocument, email: string) {
  if (!email) {
    return;
  }

  let existing: unknown = [];

  try {
    existing = JSON.parse(localStorage.getItem(LEAD_STORAGE_KEY) ?? "[]");
  } catch {
    existing = [];
  }

  const leads = Array.isArray(existing) ? existing.slice(-24) : [];

  leads.push({
    brand: proposal.brandName,
    capturedAt: new Date().toISOString(),
    email,
    runId: proposal.runId,
  });
  try {
    localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(leads));
  } catch {
    return;
  }
}

export function ProposalStudio() {
  const reduceMotion = useReducedMotion();
  const [catalogue, setCatalogue] = useState(false);
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const [progress, setProgress] = useState(0);
  const [proposal, setProposal] = useState<ProposalDocument | null>(null);
  const [state, setState] = useState<ProposalState>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const brand = useMemo(
    () => (proposal ? boardBrand(proposal) : HOUSE_BOARD_COLORWAYS.salonOxblood),
    [proposal],
  );
  const stageStyle: ProposalStyle | undefined = proposal
    ? ({
        "--proposal-dark": proposal.palette.dark,
        "--proposal-field": proposal.palette.field,
        "--proposal-light": proposal.palette.light,
      } satisfies ProposalStyle)
    : undefined;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state === "loading") {
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = catalogue ? String(form.get("email") ?? "").trim() : "";
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setDownloadState("idle");
    setProposal(null);
    setProgress(0);
    setState("loading");

    try {
      const response = await fetch(PROPOSAL_ENDPOINT, {
        body: JSON.stringify({
          brand: String(form.get("brand") ?? ""),
          email: email || undefined,
          occasion: String(form.get("occasion") ?? ""),
          recipient: String(form.get("recipient") ?? ""),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Proposal request failed with ${response.status}`);
      }

      if (
        response.headers
          .get("content-type")
          ?.split(";", 1)[0]
          ?.trim()
          .toLowerCase() !== "application/x-ndjson"
      ) {
        throw new Error("Proposal response type was invalid");
      }

      const nextProposal = await readProposalStream(response, {
        onProgress: setProgress,
        onProposal: (streamedProposal) => {
          setProposal(streamedProposal);
          setState("ready");
        },
      });
      setProposal(nextProposal);
      setState("ready");
      storeLead(nextProposal, email);
      requestAnimationFrame(() => {
        window.scrollTo({ left: 0, top: 0 });
        resultRef.current?.focus({ preventScroll: true });
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setProposal(null);
      setState("error");
      requestAnimationFrame(() => statusRef.current?.focus());
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }

  async function downloadProposalOneSheet() {
    if (!proposal || downloadState === "loading") {
      return;
    }

    setDownloadState("loading");
    try {
      await downloadOneSheet(proposal);
      setDownloadState("idle");
    } catch {
      setDownloadState("error");
    }
  }

  return (
    <section className="proposal-studio" data-proposal-state={state}>
      <div className="proposal-studio__form">
        {proposal ? null : (
          <h1 className="page-title" data-copy-id="proposal.h1">
            {SITE_COPY.proposal.h1}
          </h1>
        )}
        <p className="proposal-studio__sub" data-copy-id="proposal.sub">
          {SITE_COPY.proposal.sub}
        </p>
        <p className="proposal-studio__thoughtfulness">
          {SITE_COPY.proposal.thoughtfulness}
        </p>
        <form
          className="proposal-form"
          data-netlify="true"
          name="proposal-runs"
          onSubmit={submit}
        >
          <input name="form-name" type="hidden" value="proposal-runs" />
          <label>
            <span data-copy-id="proposal.fields.brand">
              {SITE_COPY.proposal.fields.brand}
            </span>
            <input
              autoComplete="organization"
              maxLength={80}
              name="brand"
              required
              type="text"
            />
          </label>
          <label>
            <span data-copy-id="proposal.fields.recipient">
              {SITE_COPY.proposal.fields.recipient}
            </span>
            <input
              autoComplete="off"
              maxLength={120}
              name="recipient"
              required
              type="text"
            />
          </label>
          <label>
            <span data-copy-id="proposal.fields.occasion">
              {SITE_COPY.proposal.fields.occasion}
            </span>
            <input
              autoComplete="off"
              maxLength={120}
              name="occasion"
              required
              type="text"
            />
          </label>
          <label className="proposal-form__catalogue">
            <input
              checked={catalogue}
              name="catalogue"
              onChange={(event) => setCatalogue(event.currentTarget.checked)}
              type="checkbox"
            />
            <span>{SITE_COPY.proposal.catalogue}</span>
          </label>
          <AnimatePresence initial={false}>
            {catalogue ? (
              <m.label
                animate={{ height: "auto", opacity: 1 }}
                className="proposal-form__email"
                exit={
                  reduceMotion
                    ? undefined
                    : { height: 0, marginTop: 0, opacity: 0 }
                }
                initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <span>{SITE_COPY.proposal.email}</span>
                <input
                  autoComplete="email"
                  maxLength={254}
                  name="email"
                  required
                  type="email"
                />
              </m.label>
            ) : null}
          </AnimatePresence>
          <button disabled={state === "loading"} type="submit">
            <span>
              {state === "loading"
                ? SITE_COPY.proposal.loading
                : SITE_COPY.proposal.button}
            </span>
          </button>
        </form>
        <form data-netlify="true" hidden name="catalogue-requests">
          <input name="form-name" type="hidden" value="catalogue-requests" />
          <input name="email" type="email" />
        </form>
      </div>

      <div
        aria-busy={state === "loading"}
        className="proposal-studio__stage"
        style={stageStyle}
      >
        <m.div
          className="proposal-board-frame"
          layout={reduceMotion ? false : "position"}
          transition={{
            layout: {
              damping: 24,
              mass: 0.82,
              stiffness: 135,
              type: "spring",
            },
          }}
        >
          <BoardFace
            brand={brand}
            className="board-face--proposal"
            decorative={false}
            variant={proposal ? "client" : "house"}
          />
        </m.div>

        <div aria-hidden="true" className="proposal-materials">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        {state === "loading" ? (
          <progress
            aria-label={SITE_COPY.proposal.loading}
            className="proposal-progress"
            max={1_800}
            value={Math.min(progress, 1_800)}
          />
        ) : null}

        {proposal ? (
          <m.article
            animate={{ opacity: 1, y: 0 }}
            className="proposal-output"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            ref={resultRef}
            tabIndex={-1}
            transition={{
              delay: 0.1,
              duration: 0.58,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <header className="proposal-output__header">
              <p className="eyebrow">{proposal.brandName}</p>
              <h1>{proposal.title}</h1>
              <p className="proposal-output__thesis">{proposal.thesis}</p>
            </header>
            <div aria-hidden="true" className="proposal-output__palette">
              <span style={{ background: proposal.palette.dark }} />
              <span style={{ background: proposal.palette.field }} />
              <span style={{ background: proposal.palette.light }} />
            </div>
            <p className="proposal-output__concept">{proposal.concept}</p>
            <ul className="proposal-output__materials">
              {proposal.materials.map((material) => (
                <li key={material}>{material}</li>
              ))}
            </ul>
            <blockquote>{proposal.note}</blockquote>
            <section className="proposal-output__tldr">
              <h2>{SITE_COPY.proposal.tldr}</h2>
              <ul>
                {proposal.tldr.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <footer className="proposal-output__footer">
              <p>{SITE_COPY.proposal.footer}</p>
              <div className="proposal-output__actions">
                <div className="proposal-output__download">
                  <button
                    aria-busy={downloadState === "loading"}
                    disabled={downloadState === "loading"}
                    onClick={downloadProposalOneSheet}
                    type="button"
                  >
                    <span>{SITE_COPY.proposal.oneSheet}</span>
                  </button>
                  {downloadState === "error" ? (
                    <p
                      aria-live="assertive"
                      className="proposal-output__download-status"
                      role="alert"
                    >
                      {SITE_COPY.proposal.error}
                    </p>
                  ) : null}
                </div>
                <Link className="proposal-output__link" href="/commission">
                  <span>{SITE_COPY.proposal.postProposalCta}</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </footer>
          </m.article>
        ) : (
          <p
            aria-live="polite"
            className="proposal-empty"
            ref={statusRef}
            tabIndex={state === "error" ? -1 : undefined}
          >
            {state === "loading"
              ? SITE_COPY.proposal.loading
              : state === "error"
                ? SITE_COPY.proposal.error
                : SITE_COPY.proposal.empty}
          </p>
        )}

        {!proposal ? (
          <p className="proposal-close">{SITE_COPY.proposal.footer}</p>
        ) : null}
      </div>
    </section>
  );
}
