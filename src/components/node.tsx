import { useCompact } from "@/components/compact";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { GPU, Node } from "@/types";
import { GPUItem } from "./gpu";
import { ProgressBar, ProgressBarDisabled } from "./progress-bar";

interface NodeProps {
  node: Node;
}

interface GPUListProps {
  nodeId: string;
  gpus: GPU[];
}

export function NodeHeader({ node }: NodeProps) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center">
      <h3 className="text-sm font-bold tracking-wide font-mono">{node.name}</h3>
      {node.active ? (
        <Badge variant={node.temp >= 70 ? "destructive" : "secondary"} className="text-[.6rem]">
          {node.temp}°C
        </Badge>
      ) : (
        <Badge variant="destructive" className="text-[.6rem]">
          Offline
        </Badge>
      )}
    </div>
  );
}

export function NodeInfo({ node }: NodeProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <NodeHeader node={node} />
      <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
        {node.active ? (
          <>
            <ProgressBar label="CPU" value={node.util} />
            <ProgressBar label="RAM" value={node.memory.used} max={node.memory.total} unit="GB" />
          </>
        ) : (
          <>
            <ProgressBarDisabled label="CPU" />
            <ProgressBarDisabled label="RAM" unit="GB" />
          </>
        )}
      </div>
    </div>
  );
}

export function GPUList({ nodeId, gpus }: GPUListProps) {
  const compact = useCompact();
  return (
    <div className="grid grid-cols-1 gap-3 p-4">
      {gpus.map((gpu, index) => (
        <div key={gpu.id}>
          <GPUItem nodeId={nodeId} gpu={gpu} />
          {index < gpus.length - 1 && !compact && <Separator className="mt-3" />}
        </div>
      ))}
    </div>
  );
}

export function NodeCard({ node }: NodeProps) {
  return (
    <Card className="p-0 ring-black ring-1 shadow-md">
      <CardContent className="grid grid-cols-1 md:grid-cols-[12rem_1fr] lg:grid-cols-[14rem_1fr] p-0">
        <div className="border-b md:border-b-0 md:border-r p-4 bg-muted/50">
          <NodeInfo node={node} />
        </div>
        <div className="border-b md:border-b-0 md:border-r p-0">
          <GPUList nodeId={node.id} gpus={node.gpus} />
        </div>
      </CardContent>
    </Card>
  );
}
