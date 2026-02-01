import { generateDemoData } from "../src/lib/demo";
import type { DeltaData, GPUDelta, Node, SSEMessage } from "../src/types";

let nodes = generateDemoData();
const memos: Map<string, { memo: string }> = new Map();

const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
const encoder = new TextEncoder();

// Broadcast a message to all connected clients
function broadcast(message: SSEMessage) {
  const data = `data: ${JSON.stringify(message)}\n\n`;
  const encoded = encoder.encode(data);
  for (const controller of clients) {
    try {
      controller.enqueue(encoded);
    } catch {
      clients.delete(controller);
    }
  }
}

function applyMemos(nodes: Node[], memos: Map<string, { memo: string }>): Node[] {
  return nodes.map((node) => ({
    ...node,
    gpus: node.gpus.map((gpu) => ({
      ...gpu,
      memo: memos.get(`${node.id}/${gpu.id}`)?.memo,
    })),
  }));
}

// Extract delta (only changing metrics) from full nodes
function extractDelta(nodes: Node[], memos: Map<string, { memo: string }>): DeltaData {
  const delta: DeltaData = { nodes: {} };

  for (const node of nodes) {
    const gpuDeltas: Record<string, GPUDelta> = {};

    for (const gpu of node.gpus) {
      if (gpu.active) {
        gpuDeltas[gpu.id] = {
          temp: gpu.temp,
          util: gpu.util,
          memory: { used: gpu.memory.used },
          memo: memos.get(`${node.id}/${gpu.id}`)?.memo,
        };
      }
    }

    if (node.active) {
      delta.nodes[node.id] = {
        temp: node.temp,
        util: node.util,
        memory: { used: node.memory.used },
        gpus: gpuDeltas,
      };
    }
  }

  return delta;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Single broadcast loop for all clients
let lastFullUpdate = 0;

setInterval(() => {
  if (clients.size === 0) return;

  const now = Date.now();
  nodes = generateDemoData();

  if (now - lastFullUpdate >= 60000) {
    broadcast({ type: "full", data: applyMemos(nodes, memos) });
    lastFullUpdate = now;
  } else {
    broadcast({ type: "delta", data: extractDelta(nodes, memos) });
  }
}, 2000);

const server = Bun.serve({
  port: 3001,
  fetch(req) {
    const url = new URL(req.url);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // SSE endpoint
    if (url.pathname === "/stream" && req.method === "GET") {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          // Add this client to the set
          clients.add(controller);

          // Send initial full update immediately
          const message: SSEMessage = { type: "full", data: applyMemos(nodes, memos) };
          const data = `data: ${JSON.stringify(message)}\n\n`;
          controller.enqueue(encoder.encode(data));
        },
        cancel(controller) {
          clients.delete(controller);
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // POST /api/memo
    if (url.pathname === "/api/memo" && req.method === "POST") {
      return (async () => {
        const { nodeId, gpuId, text } = (await req.json()) as {
          nodeId: string;
          gpuId: string;
          text: string;
        };

        if (!nodeId || !gpuId || typeof text !== "string") {
          return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Store or delete memo
        if (text.trim() === "") {
          memos.delete(`${nodeId}/${gpuId}`);
        } else {
          memos.set(`${nodeId}/${gpuId}`, { memo: text });
        }

        // Broadcast delta update with new memo data
        broadcast({ type: "delta", data: extractDelta(nodes, memos) });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      })();
    }

    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders,
    });
  },
});

console.log(`SSE server running on http://localhost:${server.port}`);
