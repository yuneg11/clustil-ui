export interface GPU {
  id: string;
  index: number;
  model: string;
  temperature: number;
  utilization: number;
  memory: {
    used: number;
    total: number;
  };
  memo?: {
    text: string;
    user: string;
    timestamp: Date;
  };
  isActive: boolean;
}

export interface Node {
  id: string;
  name: string;
  temperature: number;
  cpu: {
    load: number;
  };
  ram: {
    used: number;
    total: number;
  };
  status: "online" | "offline" | "warning";
  os: string;
  gpus: GPU[];
}
