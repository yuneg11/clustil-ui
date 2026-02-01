import type { DeltaData, GPUDelta, Node, SSEMessage } from "../src/types";

// Store memos separately so they persist across SSE updates
const memos: Map<string, { memo: string }> = new Map();

// Track all connected SSE clients
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

function randomBetween(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max));
}

function generateMockNodes(): Node[] {
  const nodes: Node[] = [
    {
      id: "node-01",
      name: "Node-01",
      active: true,
      temp: randomInt(40, 100),
      util: randomInt(10, 95),
      memory: { used: randomInt(64, 450), total: 512 },
      gpus: [
        {
          id: "gpu-1-0",
          index: 0,
          name: "RTX 4090",
          active: true,
          temp: randomInt(30, 85),
          util: randomInt(0, 100),
          memory: { used: randomBetween(0.2, 24), total: 24 },
        },
        {
          id: "gpu-1-1",
          index: 1,
          name: "RTX 4090",
          active: true,
          temp: randomInt(25, 45),
          util: randomInt(0, 10),
          memory: { used: randomBetween(0.1, 2), total: 24 },
        },
        {
          id: "gpu-1-2",
          index: 2,
          name: "RTX 4090",
          active: true,
          temp: randomInt(25, 45),
          util: randomInt(0, 10),
          memory: { used: randomBetween(0.1, 2), total: 24 },
        },
        {
          id: "gpu-1-3",
          index: 3,
          name: "RTX 4090",
          active: true,
          temp: randomInt(25, 45),
          util: randomInt(0, 10),
          memory: { used: randomBetween(0.1, 2), total: 24 },
        },
      ],
    },
    {
      id: "node-02",
      name: "Node-02",
      active: true,
      temp: randomInt(40, 70),
      util: randomInt(50, 100),
      memory: { used: randomInt(40, 64), total: 64 },
      gpus: [
        {
          id: "gpu-2-0",
          index: 0,
          name: "A100",
          active: true,
          temp: randomInt(60, 85),
          util: randomInt(80, 100),
          memory: { used: randomBetween(60, 80), total: 80 },
        },
        {
          id: "gpu-2-1",
          index: 1,
          name: "A100",
          active: true,
          temp: randomInt(60, 85),
          util: randomInt(80, 100),
          memory: { used: randomBetween(60, 80), total: 80 },
        },
        {
          id: "gpu-2-2",
          index: 2,
          name: "A100 80GB",
          active: true,
          temp: randomInt(25, 50),
          util: randomInt(30, 70),
          memory: { used: randomBetween(10, 40), total: 80 },
        },
      ],
    },
    {
      id: "node-03",
      name: "Node-03",
      active: true,
      temp: randomInt(30, 50),
      util: randomInt(5, 30),
      memory: { used: randomInt(4, 20), total: 64 },
      gpus: [
        {
          id: "gpu-3-0",
          index: 0,
          name: "RTX 3090",
          active: true,
          temp: randomInt(30, 50),
          util: randomInt(0, 15),
          memory: { used: randomBetween(0.5, 5), total: 24 },
        },
        {
          id: "gpu-3-1",
          index: 1,
          name: "RTX 3090",
          active: true,
          temp: randomInt(25, 45),
          util: randomInt(0, 5),
          memory: { used: randomBetween(0, 2), total: 24 },
        },
      ],
    },
    {
      id: "node-04",
      name: "Node-04",
      active: true,
      temp: randomInt(30, 50),
      util: randomInt(5, 30),
      memory: { used: randomInt(4, 20), total: 64 },
      gpus: [
        {
          id: "gpu-4-0",
          index: 0,
          name: "RTX 3090",
          active: true,
          temp: randomInt(30, 50),
          util: randomInt(0, 15),
          memory: { used: randomBetween(0.5, 5), total: 24 },
        },
        {
          id: "gpu-4-1",
          index: 1,
          name: "RTX 3090",
          active: true,
          temp: randomInt(25, 45),
          util: randomInt(0, 5),
          memory: { used: randomBetween(0, 2), total: 24 },
        },
      ],
    },
    {
      id: "node-05",
      name: "Node-05",
      active: false,
      gpus: [
        {
          id: "gpu-5-0",
          index: 0,
          name: "RTX 4090",
          active: false,
        },
        {
          id: "gpu-5-1",
          index: 1,
          name: "RTX 4090",
          active: false,
        },
      ],
    },
  ];

  // Apply persisted memos
  for (const node of nodes) {
    for (const gpu of node.gpus) {
      const memoData = memos.get(`${node.id}/${gpu.id}`);
      if (memoData) {
        gpu.memo = memoData.memo;
      }
    }
  }

  return nodes;
}

// Extract delta (only changing metrics) from full nodes
function extractDelta(nodes: Node[]): DeltaData {
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
  const nodes = generateMockNodes();

  if (now - lastFullUpdate >= 60000) {
    broadcast({ type: "full", data: nodes });
    lastFullUpdate = now;
  } else {
    broadcast({ type: "delta", data: extractDelta(nodes) });
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
          const nodes = generateMockNodes();
          const message: SSEMessage = { type: "full", data: nodes };
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
        const body = (await req.json()) as {
          nodeId: string;
          gpuId: string;
          text: string;
        };
        const { nodeId, gpuId, text } = body;

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

        // Broadcast full update with new memo data
        const nodes = generateMockNodes();
        broadcast({ type: "full", data: nodes });

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
