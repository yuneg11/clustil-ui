import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { GPU, Node } from "@/types/dashboard";
import { GPUItem } from "./gpu";
import { ProgressBar } from "./progress-bar";

interface NodeProps {
  node: Node;
}

interface GPUListProps {
  gpus: GPU[];
  onMemoChange?: (id: string, text: string) => void;
}

export function NodeHeader({ node }: NodeProps) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center">
      <h3 className="text-sm font-bold tracking-wide font-mono">{node.name}</h3>
      <Badge
        variant={node.temperature >= 70 ? "destructive" : "secondary"}
        className="text-[.6rem]"
      >
        {node.temperature}°C
      </Badge>
    </div>
  );
}

export function NodeInfo({ node }: NodeProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <NodeHeader node={node} />
      <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
        <ProgressBar label="CPU" value={node.cpu.load} />
        <ProgressBar
          label="RAM"
          value={node.ram.used}
          max={node.ram.total}
          unit="GB"
        />
      </div>
    </div>
  );
}

export function GPUList({ gpus, onMemoChange }: GPUListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 p-4">
      {gpus.map((gpu, index) => (
        <div key={gpu.id}>
          <GPUItem gpu={gpu} onMemoChange={onMemoChange} />
          {index < gpus.length - 1 && <Separator className="mt-3" />}
        </div>
      ))}
    </div>
  );
}

export function NodeCard({ node }: NodeProps) {
  return (
    <Card className="p-0 ring-black ring-1 shadow-md">
      <CardContent className="grid grid-cols-1 md:grid-cols-[14rem_1fr] lg:grid-cols-[14rem_1fr] p-0">
        <div className="border-b md:border-b-0 md:border-r p-4 bg-muted/50">
          <NodeInfo node={node} />
        </div>
        <div className="border-b md:border-b-0 md:border-r p-0">
          <GPUList gpus={node.gpus} />
        </div>
      </CardContent>
    </Card>
  );
}
