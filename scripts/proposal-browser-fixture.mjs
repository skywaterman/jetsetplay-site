import http from "node:http";

const target = new URL(process.env.PROPOSAL_FIXTURE_TARGET ?? "http://127.0.0.1:3010");
const port = Number(process.env.PROPOSAL_FIXTURE_PORT ?? "3011");
const sourceOrigin = `http://127.0.0.1:${port}`;
const endpoint = "/.netlify/functions/claude";
const requestLimit = 4_096;

const fixtures = {
  cobalt: {
    palette: { dark: "#18233F", field: "#6E86A6", light: "#F3EEDD" },
    runId: "2f2fc3a2-e628-4de8-9a38-ece56112c921",
    title: "The evening begins with one move.",
  },
  northstar: {
    palette: { dark: "#173E2C", field: "#78927E", light: "#F5F1E8" },
    runId: "10f2fc3a-e628-4de8-9a38-ece56112c922",
    title: "The next move travels with you.",
  },
};

function proposalFor(input) {
  const fixture = String(input.brand ?? "").toLowerCase().includes("north")
    ? fixtures.northstar
    : fixtures.cobalt;

  return {
    brandName: String(input.brand ?? "Cobalt House"),
    concept:
      "A travel backgammon set that turns the occasion into a reason to gather again.",
    materials: [
      "Client color field with warm ivory points",
      "Tone-on-tone leather presentation tube",
      "Solid brass hardware with a restrained finish",
    ],
    note:
      "For the people who made the journey matter. Keep this close and keep the game going.",
    occasion: String(input.occasion ?? "Anniversary"),
    palette: fixture.palette,
    recipient: String(input.recipient ?? "Members"),
    runId: fixture.runId,
    schemaVersion: "proposal.v1",
    thesis: "A considered object for the conversations that continue after the occasion.",
    title: fixture.title,
    tldr: [
      "A travel backgammon set shaped around the occasion.",
      "A restrained palette drawn from the brand.",
      "A note that makes the gift personal without overexplaining it.",
    ],
  };
}

function sendFixture(request, response) {
  const chunks = [];
  let received = 0;

  request.on("data", (chunk) => {
    received += chunk.length;
    if (received > requestLimit) {
      request.destroy();
      return;
    }
    chunks.push(chunk);
  });

  request.on("end", () => {
    let input;
    try {
      input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      response.writeHead(400, { "content-type": "application/json" });
      response.end('{"error":"invalid_request"}');
      return;
    }

    const proposal = proposalFor(input);
    const events = [
      { runId: proposal.runId, type: "started" },
      { received: 420, type: "progress" },
      { proposal, type: "proposal" },
      { runId: proposal.runId, type: "complete" },
    ];

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": "application/x-ndjson; charset=utf-8",
      "x-content-type-options": "nosniff",
    });

    events.forEach((event, index) => {
      setTimeout(() => {
        response.write(`${JSON.stringify(event)}\n`);
        if (index === events.length - 1) {
          response.end();
        }
      }, index * 120);
    });
  });
}

function proxyRequest(request, response) {
  const headers = { ...request.headers, host: target.host };
  if (headers.origin === sourceOrigin) {
    headers.origin = target.origin;
  }
  if (headers.referer?.startsWith(sourceOrigin)) {
    headers.referer = `${target.origin}${headers.referer.slice(sourceOrigin.length)}`;
  }

  const upstream = http.request(
    {
      headers,
      hostname: target.hostname,
      method: request.method,
      path: request.url,
      port: target.port,
    },
    (upstreamResponse) => {
      response.writeHead(
        upstreamResponse.statusCode ?? 502,
        upstreamResponse.headers,
      );
      upstreamResponse.pipe(response);
    },
  );

  upstream.on("error", () => {
    if (!response.headersSent) {
      response.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    }
    response.end("Fixture proxy unavailable");
  });
  request.pipe(upstream);
}

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === endpoint) {
    sendFixture(request, response);
    return;
  }
  proxyRequest(request, response);
});

server.listen(port, "127.0.0.1", () => {
  process.stderr.write(`Proposal fixture listening on ${sourceOrigin}\n`);
});
