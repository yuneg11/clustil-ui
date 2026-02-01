import { useEffect, useState } from "react";
import type { ConnectionStatus, DeltaData, GPU, Node, SSEMessage } from "@/types";

const SSE_URL = `${import.meta.env.CLUSTIL_HOST}/stream`;
const RECONNECT_DELAY = 10000;

interface UseSSEResult {
  nodes: Node[];
  connectionStatus: ConnectionStatus;
}

// Parse full nodes from server, converting timestamp strings to Date objects
function parseFullNodes(rawNodes: unknown): Node[] {
  const nodes = rawNodes as Array<
    Omit<Node, "gpus"> & {
      gpus: Array<
        Omit<GPU, "user"> & {
          user?: { name: string; timestamp: string };
        }
      >;
    }
  >;

  return nodes.map((node) => ({
    ...node,
    gpus: node.gpus.map((gpu) => ({
      ...gpu,
      user: gpu.user
        ? {
            ...gpu.user,
            timestamp: new Date(gpu.user.timestamp),
          }
        : undefined,
    })),
  })) as Node[];
}

// Apply delta updates to existing nodes
function applyDelta(prevNodes: Node[], delta: DeltaData): Node[] {
  return prevNodes.map((node) => {
    const nodeDelta = delta.nodes[node.id];

    // If no delta for this node, return unchanged
    if (!nodeDelta) return node;

    // Handle online nodes
    if (node.active) {
      return {
        ...node,
        temp: nodeDelta.temp ?? node.temp,
        util: nodeDelta.util ?? node.util,
        memory: {
          ...node.memory,
          used: nodeDelta.memory?.used ?? node.memory.used,
        },
        gpus: node.gpus.map((gpu) => {
          const gpuDelta = nodeDelta?.gpus?.[gpu.id];
          if (!gpuDelta) return gpu;

          if (gpu.active) {
            // GPU is online - can update all properties
            return {
              ...gpu,
              temp: gpuDelta.temp ?? gpu.temp,
              util: gpuDelta.util ?? gpu.util,
              memory: {
                ...gpu.memory,
                used: gpuDelta.memory?.used ?? gpu.memory.used,
              },
              user: gpuDelta.user ?? gpu.user,
              memo: gpuDelta.memo ?? gpu.memo,
            };
          }

          // GPU is offline - only update user and memo
          return {
            ...gpu,
            user: gpuDelta.user ?? gpu.user,
            memo: gpuDelta.memo ?? gpu.memo,
          };
        }),
      };
    }

    // Handle offline nodes - only update GPUs' user and memo
    return {
      ...node,
      gpus: node.gpus.map((gpu) => {
        const gpuDelta = nodeDelta?.gpus?.[gpu.id];
        if (!gpuDelta) return gpu;

        return {
          ...gpu,
          user: gpuDelta.user ?? gpu.user,
          memo: gpuDelta.memo ?? gpu.memo,
        };
      }),
    };
  });
}

export function useSSE(): UseSSEResult {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      eventSource = new EventSource(SSE_URL);

      eventSource.onopen = () => {
        setConnectionStatus("connected");
      };

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as SSEMessage;

          switch (message.type) {
            case "full":
              setNodes(parseFullNodes(message.data as Node[]));
              break;
            case "delta":
              setNodes((prev) => applyDelta(prev, message.data as DeltaData));
              break;
          }

          setConnectionStatus("connected");
        } catch (error) {
          console.error("Failed to parse SSE data:", error);
          setConnectionStatus("error");
        }
      };

      eventSource.onerror = () => {
        setConnectionStatus("disconnected");
        eventSource?.close();
        eventSource = null;

        // Attempt reconnection
        reconnectTimeout = setTimeout(connect, RECONNECT_DELAY);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  return {
    nodes,
    connectionStatus,
  };
}
