import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { updateMemo } from "@/lib/memo";
import { formatDistanceToNow } from "@/lib/utils";
import type { GPU } from "@/types";
import { ProgressBar, ProgressBarDisabled } from "./progress-bar";

interface GPUProps {
  gpu: GPU;
}

interface GPUNodeProps {
  nodeId: string;
  gpu: GPU;
}

type EditingState = "idle" | "editing" | "saving" | "error";

export function GPUHeader({ gpu }: GPUProps) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
      <div className="flex size-7 items-center justify-center rounded bg-muted font-mono text-xs font-bold">
        {gpu.index}
      </div>
      <div className="text-sm font-bold font-mono truncate">{gpu.name}</div>
      <div className="justify-self-end">
        {gpu.active ? (
          <Badge
            variant={gpu.temp >= 70 ? "destructive" : "secondary"}
            className="text-[.6rem] hidden lg:block"
          >
            {gpu.temp}°C
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-[.6rem]">
            Offline
          </Badge>
        )}
      </div>
    </div>
  );
}

export function GPUInfo({ gpu }: GPUProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {gpu.active ? (
        <>
          <ProgressBar label="UTIL" value={gpu.util} />
          <ProgressBar label="MEM" value={gpu.memory.used} max={gpu.memory.total} unit="GB" />
        </>
      ) : (
        <>
          <ProgressBarDisabled label="UTIL" />
          <ProgressBarDisabled label="MEM" unit="GB" />
        </>
      )}
    </div>
  );
}

export function GPUUser({ gpu }: GPUProps) {
  return (
    <div className="w-20 grid grid-cols-1">
      {gpu.user ? (
        <>
          <span className="text-xs font-medium font-mono">{gpu.user.name}</span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(gpu.user.timestamp)}
          </span>
        </>
      ) : (
        <>
          <span className="text-xs font-medium text-muted-foreground font-mono">Idle</span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">-</span>
        </>
      )}
    </div>
  );
}

export function GPUMemo({ nodeId, gpu }: GPUNodeProps) {
  const memoValue = gpu.memo ?? "";
  const [inputValue, setInputValue] = useState<string>(memoValue);
  const [committedValue, setCommittedValue] = useState<string>(memoValue);
  const [editingState, setEditingState] = useState<EditingState>("idle");
  const [hasLocalOverride, setHasLocalOverride] = useState(false);

  // Sync with external value when not editing or saving
  useEffect(() => {
    if (hasLocalOverride) {
      if (memoValue === committedValue) {
        setHasLocalOverride(false);
      }
      return;
    }
    if (editingState === "idle") {
      setCommittedValue(memoValue);
      setInputValue(memoValue);
    }
  }, [memoValue, editingState, hasLocalOverride, committedValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (editingState === "error") {
      setEditingState("editing");
    }
    // Mark as editing when user starts typing and value differs
    if (newValue !== committedValue && editingState === "idle") {
      setEditingState("editing");
    } else if (newValue === committedValue && editingState === "editing") {
      setEditingState("idle");
    }
  };

  const handleSave = async () => {
    if (editingState === "saving") {
      return;
    }
    setEditingState("saving");
    try {
      await updateMemo({
        nodeId: nodeId,
        gpuId: gpu.id,
        text: inputValue,
      });
      setCommittedValue(inputValue);
      setHasLocalOverride(true);
      setEditingState("idle");
    } catch {
      setEditingState("error");
    }
  };

  const handleCancel = () => {
    setInputValue(committedValue);
    setEditingState("idle");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && editingState === "editing") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <InputGroup>
      <InputGroupInput
        placeholder="Add memo..."
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="h-8 text-xs"
      />
      {editingState !== "idle" && (
        <InputGroupAddon align="inline-end">
          {editingState === "saving" ? (
            <Spinner className="size-3" />
          ) : (
            <InputGroupButton
              size="icon-xs"
              onClick={handleSave}
              className="hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
              aria-label="Save memo"
            >
              <Check className="size-3" />
            </InputGroupButton>
          )}
          <InputGroupButton
            size="icon-xs"
            onClick={handleCancel}
            className="hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
            aria-label="Cancel memo edit"
            disabled={editingState === "saving"}
          >
            <X className="size-3" />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

export function GPUMetaInfo({ nodeId, gpu }: GPUNodeProps) {
  return (
    <div className="grid md:grid-cols-1 lg:grid-cols-[auto_1fr] gap-1 lg:gap-4 items-center">
      <GPUUser gpu={gpu} />
      <GPUMemo nodeId={nodeId} gpu={gpu} />
    </div>
  );
}

export function GPUItem({ nodeId, gpu }: GPUNodeProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[9rem_5fr_4fr] lg:grid-cols-[11rem_1fr_1fr] gap-3 lg:gap-6 items-center md:max-lg:items-start">
      <GPUHeader gpu={gpu} />
      <GPUInfo gpu={gpu} />
      <GPUMetaInfo nodeId={nodeId} gpu={gpu} />
    </div>
  );
}
