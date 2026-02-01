import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import type { ConnectionStatus, GPU, GPUOffline, GPUOnline, Node } from "@/types";

const SAIGE_URL = import.meta.env.CLUSTIL_HOST as string;

interface UseSaigeResult {
  nodes: Node[];
  connectionStatus: ConnectionStatus;
}

// Module-level row index map for memo updates
// Key: `${nodeId}:${gpuId}`, Value: legacy row index
export const rowIndexMap = new Map<string, number>();

// Legacy data row type (12 fields)
type LegacyRow = [
  string, // [0] timestamp
  string, // [1] server name
  string, // [2] CPU temp
  string, // [3] GPU index
  string, // [4] GPU name
  string, // [5] memory bar
  string, // [6] memory usage (e.g., "12.5/24GB")
  string, // [7] GPU util (e.g., "95%")
  string, // [8] clock speed
  string, // [9] GPU temp
  string, // [10] fan speed
  string, // [11] user/memo
];

interface LegacyMessage {
  status_data: LegacyRow[];
}

// Parse temperature string (e.g., "82C" -> 82)
function parseTemp(tempStr: string): number {
  if (tempStr === "-" || !tempStr) return 0;
  // Remove HTML tags if present (legacy server wraps high temps in HTML)
  const cleaned = tempStr.replace(/<[^>]*>/g, "");
  const match = cleaned.match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

// Parse utilization string (e.g., "95%" -> 95)
function parsePercent(percentStr: string): number {
  if (percentStr === "-" || !percentStr) return 0;
  const match = percentStr.match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

// Parse memory string (e.g., "12.5/24GB" -> { used: 12.5, total: 24 })
function parseMemory(memoryStr: string): { used: number; total: number } {
  if (memoryStr === "-" || !memoryStr) return { used: 0, total: 0 };
  const match = memoryStr.match(/(\d+\.?\d*)\/(\d+\.?\d*)/);
  if (!match) return { used: 0, total: 0 };
  return {
    used: Number.parseFloat(match[1]),
    total: Number.parseFloat(match[2]),
  };
}

// Clean GPU name by removing "GeForce", "PCIE", and "-"
function cleanGpuName(gpuName: string): string {
  return gpuName
    .replace(/GeForce/i, "")
    .replace(/-PCIE-/i, " ")
    .replace(/-SXM4-/i, " ")
    .trim();
}

// Transform legacy rows to Clustil Node[] format
function transformLegacyData(rows: LegacyRow[]): Node[] {
  const nodesMap = new Map<
    string,
    { cpuTemp: string; gpuRows: Array<{ row: LegacyRow; rowIndex: number }> }
  >();

  // Clear and rebuild row index map
  rowIndexMap.clear();

  let currentServerName = "";

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const serverName = row[1].trim();

    // If server name is non-empty (after trim), update current server
    if (serverName) {
      currentServerName = serverName;
    }

    if (!currentServerName) continue;

    if (!nodesMap.has(currentServerName)) {
      nodesMap.set(currentServerName, {
        cpuTemp: row[2], // CPU temp from first row of server
        gpuRows: [],
      });
    }

    nodesMap.get(currentServerName)?.gpuRows.push({ row, rowIndex: i });
  }

  const nodes: Node[] = [];

  for (const [serverName, { cpuTemp, gpuRows }] of nodesMap) {
    const gpus: GPU[] = [];
    let hasOnlineGPU = false;

    for (let idx = 0; idx < gpuRows.length; idx++) {
      const { row, rowIndex } = gpuRows[idx];
      // GPU index might be "-" for offline servers, fall back to array position
      const gpuIndexStr = row[3].trim();
      const gpuIndex = gpuIndexStr === "-" ? idx : Number.parseInt(gpuIndexStr, 10) || idx;
      const gpuName = row[4];
      const isOnline = gpuName !== "-";
      const gpuId = `gpu-${gpuIndex}`;

      // Skip DGX Display GPUs
      if (gpuName.includes("DGX Display")) {
        continue;
      }

      // Update row index map for memo updates
      rowIndexMap.set(`${serverName}:${gpuId}`, rowIndex);

      if (isOnline) {
        hasOnlineGPU = true;
        const gpu: GPUOnline = {
          id: gpuId,
          index: gpuIndex,
          name: cleanGpuName(gpuName),
          active: true,
          temp: parseTemp(row[9]),
          util: parsePercent(row[7]),
          memory: parseMemory(row[6]),
          memo: row[11] || undefined,
        };
        gpus.push(gpu);
      } else {
        const gpu: GPUOffline = {
          id: gpuId,
          index: gpuIndex,
          name: "Unknown",
          active: false,
          memo: row[11] || undefined,
        };
        gpus.push(gpu);
      }
    }

    if (hasOnlineGPU) {
      nodes.push({
        id: serverName,
        name: serverName,
        active: true,
        temp: parseTemp(cpuTemp),
        util: 0, // Not provided by legacy server
        memory: { used: 0, total: 0 }, // Not provided by legacy server
        gpus,
      });
    } else {
      nodes.push({
        id: serverName,
        name: serverName,
        active: false,
        gpus: gpus as GPUOffline[],
      });
    }
  }

  return nodes;
}

export function useSaige(): UseSaigeResult {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const socketRef = useRef<SocketIOClient.Socket | null>(null);

  useEffect(() => {
    console.log("Connecting to SAIGE server...");

    const socket = io(`${SAIGE_URL}/test`, {
      transports: ["polling"],
      reconnection: true,
      reconnectionDelay: 10000,
      reconnectionAttempts: Number.POSITIVE_INFINITY,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to SAIGE server");
      setConnectionStatus("connected");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from SAIGE server");
      setConnectionStatus("disconnected");
    });

    socket.on("connect_error", (error: Error) => {
      console.error("SAIGE server connection error:", error);
      setConnectionStatus("error");
    });

    socket.on("newstatus", (message: LegacyMessage) => {
      try {
        const transformedNodes = transformLegacyData(message.status_data);
        setNodes(transformedNodes);
        setConnectionStatus("connected");
      } catch (error) {
        console.error("Failed to parse SAIGE server data:", error);
        setConnectionStatus("error");
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return {
    nodes,
    connectionStatus,
  };
}
