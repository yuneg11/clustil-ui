import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "@/lib/utils";
import type { GPU } from "@/types/dashboard";
import { ProgressBar } from "./progress-bar";

interface GPUProps {
  gpu: GPU;
  onMemoChange?: (id: string, text: string) => void;
}

export function GPUHeader({ gpu }: GPUProps) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
      <div className="flex size-7 items-center justify-center rounded bg-muted font-mono text-xs font-bold">
        {gpu.index}
      </div>
      <div className="text-sm font-bold font-mono truncate">{gpu.model}</div>
      <div className="justify-self-end">
        <Badge
          variant={gpu.temperature >= 70 ? "destructive" : "secondary"}
          className="text-[.6rem] hidden lg:block"
        >
          {gpu.temperature}°C
        </Badge>
      </div>
    </div>
  );
}

export function GPUInfo({ gpu }: GPUProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ProgressBar label="UTIL" value={gpu.utilization} />
      <ProgressBar
        label="MEM"
        value={gpu.memory.used}
        max={gpu.memory.total}
        unit="GB"
      />
    </div>
  );
}

export function GPUMetaInfo({ gpu, onMemoChange }: GPUProps) {
  return (
    <div className="grid md:gird-cols-1 lg:grid-cols-[auto_1fr] gap-1 lg:gap-4 items-center">
      <div className="w-20 grid grid-cols-1">
        {gpu.memo ? (
          <>
            <span className="text-xs font-medium font-mono">{gpu.memo.user}</span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(gpu.memo.timestamp)}
            </span>
          </>
        ) : (
          <>
            <span className="text-xs font-medium text-muted-foreground font-mono">
              Idle
            </span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              -
            </span>
          </>
        )}
      </div>
      <div className="w-full justify-self-end">
        <Input
          placeholder="Add memo..."
          defaultValue={gpu.memo?.text}
          onChange={(e) => onMemoChange?.(gpu.id, e.target.value)}
          className="w-full h-8 text-xs"
        />
      </div>
    </div>
  );
}

export function GPUItem({ gpu, onMemoChange }: GPUProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[9rem_3fr_2fr] lg:grid-cols-[11rem_1fr_1fr] gap-3 lg:gap-6 items-center md:max-lg:items-start">
      <GPUHeader gpu={gpu} />
      <GPUInfo gpu={gpu} />
      <GPUMetaInfo gpu={gpu} onMemoChange={onMemoChange} />
    </div>
  );
}
