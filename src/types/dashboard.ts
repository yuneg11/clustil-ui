export interface Node {
  id: string;
  name: string;
  temperature: number;
  utilization: number;
  memory: {
    used: number;
    total: number;
  };
  gpus: GPU[];
}

export interface GPU {
  id: string;
  index: number;
  name: string;
  temperature: number;
  utilization: number;
  memory: {
    used: number;
    total: number;
  };
  user?: {
    name: string;
    timestamp: Date;
  };
  memo?: string;
}

export type ConnectionStatus = "connected" | "disconnected";

interface NodeDelta {
  temperature: number;
  utilization: number;
  memory: { used: number };
  gpus: Record<string, GPUDelta>;
}

interface GPUDelta {
  temperature: number;
  utilization: number;
  memory: { used: number };
  user?: {
    name: string;
    timestamp: Date;
  };
  memo?: string;
}

export interface DeltaData {
  nodes: Record<string, NodeDelta>;
}

export interface SSEMessage {
  type: "full" | "delta";
  data: Node[] | DeltaData;
}
