import { useEffect, useRef, useState } from "react";
import type { ConnectionStatus, DeltaData, Node, SSEMessage } from "@/types";

const SSE_URL = `${import.meta.env.CLUSTIL_HOST}/stream`;
const RECONNECT_DELAY = 10000;

interface UseSSEResult {
  nodes: Node[];
  connectionStatus: ConnectionStatus;
}

// Parse full nodes from server, converting timestamp strings to Date objects
function parseFullNodes(
  rawNodes: Node[],
  pendingMemos: Map<string, { memo?: string; user?: { name: string; timestamp: Date } }>,
): Node[] {
  return rawNodes.map((node) => ({
    ...node,
    gpus: node.gpus.map((gpu) => {
      // If this GPU is being edited, preserve its original memo/user
      const pending = pendingMemos.get(gpu.id);
      if (pending) {
        return {
          ...gpu,
          memo: pending.memo,
          user: pending.user,
        };
      }
      return {
        ...gpu,
        user: gpu.user
          ? {
              ...gpu.user,
              timestamp: new Date(gpu.user.timestamp as unknown as string),
            }
          : undefined,
      };
    }),
  }));
}

// Apply delta updates to existing nodes
function applyDelta(
  prevNodes: Node[],
  delta: DeltaData,
  pendingMemos: Map<string, { memo?: string; user?: { name: string; timestamp: Date } }>,
): Node[] {
  return prevNodes.map((node) => {
    const nodeDelta = delta.nodes[node.id];
    const updatedNode = nodeDelta
      ? {
          ...node,
          temperature: nodeDelta.temperature,
          utilization: nodeDelta.utilization,
          memory: { ...node.memory, used: nodeDelta.memory.used },
        }
      : node;

    return {
      ...updatedNode,
      gpus: updatedNode.gpus.map((gpu) => {
        // Skip delta updates for GPUs being edited
        if (pendingMemos.has(gpu.id)) {
          return gpu;
        }

        const gpuDelta = nodeDelta?.gpus[gpu.id];

        return {
          ...gpu,
          temperature: gpuDelta?.temperature ?? gpu.temperature,
          utilization: gpuDelta?.utilization ?? gpu.utilization,
          memory: { ...gpu.memory, used: gpuDelta?.memory.used ?? gpu.memory.used },
          user: gpuDelta?.user
            ? {
                ...gpuDelta.user,
                timestamp: new Date(gpuDelta.user.timestamp as unknown as string),
              }
            : undefined,
          memo: gpuDelta?.memo ?? gpu.memo,
        };
      }),
    };
  });
}

export function useSSE(): UseSSEResult {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");

  // Store memos for GPUs being edited so SSE doesn't overwrite them
  const pendingMemosRef = useRef<
    Map<string, { memo?: string; user?: { name: string; timestamp: Date } }>
  >(new Map());

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
              setNodes(parseFullNodes(message.data as Node[], pendingMemosRef.current));
              break;
            case "delta":
              setNodes((prev) =>
                applyDelta(prev, message.data as DeltaData, pendingMemosRef.current),
              );
              break;
          }

          setConnectionStatus("connected");
        } catch (error) {
          console.error("Failed to parse SSE data:", error);
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
