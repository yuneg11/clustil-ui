import { NodeCard } from "@/components/node";
import { ThemeToggle } from "@/components/theme";
import { Badge } from "@/components/ui/badge";
import { useSSE } from "@/hooks/useSSE";
import type { ConnectionStatus, Node } from "@/types";

interface HeaderProps {
  connectionStatus: ConnectionStatus;
}

interface NodeListProps {
  nodes: Node[];
}

function Header({ connectionStatus }: HeaderProps) {
  const isOnline = connectionStatus === "connected";
  const isError = connectionStatus === "error";

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center mb-4">
      <h1 className="text-2xl font-bold tracking-tight font-mono mr-3">
        {import.meta.env.CLUSTIL_NAME}
      </h1>
      {isOnline ? (
        <Badge variant="default" className="gap-1.5">
          <span className="size-2 rounded-full bg-green-400 animate-pulse" />
          Online
        </Badge>
      ) : (
        <Badge variant="destructive" className="gap-1.5">
          <span className="size-2 rounded-full bg-red-400 animate-pulse" />
          {isError ? "Error" : "Offline"}
        </Badge>
      )}
      <ThemeToggle />
    </div>
  );
}

function NodeList({ nodes }: NodeListProps) {
  return (
    <div className="grid grid-cols-1 gap-5">
      {nodes.map((node) => (
        <NodeCard key={node.id} node={node} />
      ))}
    </div>
  );
}

export function Dashboard() {
  const { nodes, connectionStatus } = useSSE();

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-[1200px]">
        <Header connectionStatus={connectionStatus} />
        <NodeList nodes={nodes} />
      </div>
    </div>
  );
}
