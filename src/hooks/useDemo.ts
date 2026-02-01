import { useEffect, useState } from "react";
import { generateDemoData } from "@/lib/demo";
import type { ConnectionStatus, Node } from "@/types";

interface UseDemoResult {
  nodes: Node[];
  connectionStatus: ConnectionStatus;
}

export function useDemo(): UseDemoResult {
  const [nodes, setNodes] = useState<Node[]>(generateDemoData);

  useEffect(() => {
    console.log("Using demo data");

    const interval = setInterval(() => {
      setNodes(generateDemoData());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return {
    nodes,
    connectionStatus: "connected",
  };
}
