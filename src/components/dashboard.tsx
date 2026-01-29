import { NodeCard } from "@/components/node";
import { ThemeToggle } from "@/components/theme";
import { mockNodes } from "@/data/mockData";
import type { Node } from "@/types/dashboard";

interface NodesSectionProps {
  nodes: Node[];
}

function Header() {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center mb-4">
      <h1 className="text-2xl font-bold tracking-tight font-mono">Clustil</h1>
      <ThemeToggle />
    </div>
  );
}

function NodesSection({ nodes }: NodesSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-5">
      {nodes.map((node) => (
        <NodeCard key={node.id} node={node} />
      ))}
    </div>
  );
}

export function Dashboard() {
  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-[1200px]">
        <Header />
        <NodesSection nodes={mockNodes} />
      </div>
    </div>
  );
}
