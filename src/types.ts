// Node types
interface NodeBase {
  id: string;
  name: string;
  active: boolean;
  gpus: GPU[];
}

export interface NodeOnline extends NodeBase {
  active: true;
  temp: number;
  util: number;
  memory: {
    used: number;
    total: number;
  };
}

export interface NodeOffline extends NodeBase {
  active: false;
  gpus: GPUOffline[];
}

export type Node = NodeOnline | NodeOffline;

// GPU types
interface GPUBase {
  id: string;
  index: number;
  name: string;
  active: boolean;
}

export interface GPUOnline extends GPUBase {
  active: true;
  temp: number;
  util: number;
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

export interface GPUOffline extends GPUBase {
  active: false;
  user?: {
    name: string;
    timestamp: Date;
  };
  memo?: string;
}

export type GPU = GPUOnline | GPUOffline;

// Connection status types
export type ConnectionStatus = "connected" | "disconnected" | "error";

// SSE message types
// `active: true` should be updated via a full update
export interface NodeDelta {
  active?: false;
  temp?: number;
  util?: number;
  memory?: { used: number };
  gpus?: Record<string, GPUDelta>;
}

export interface GPUDelta {
  active?: false;
  temp?: number;
  util?: number;
  memory?: { used: number };
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
