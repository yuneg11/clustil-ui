import { ChevronsDownUp } from "lucide-react";
import { createContext, type ReactNode, useContext, useState } from "react";
import { Toggle } from "@/components/ui/toggle";

const STORAGE_KEY = "compact";

interface CompactContextValue {
  compact: boolean;
  setCompact: (value: boolean) => void;
}

const CompactContext = createContext<CompactContextValue | null>(null);

export function CompactProvider({ children }: { children: ReactNode }) {
  const [compact, setCompactState] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  });

  const setCompact = (value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    setCompactState(value);
  };

  return (
    <CompactContext.Provider value={{ compact, setCompact }}>{children}</CompactContext.Provider>
  );
}

function useCompactContext(): CompactContextValue {
  const context = useContext(CompactContext);
  if (!context) {
    throw new Error("useCompact must be used within a CompactProvider");
  }
  return context;
}

export function useCompact(): boolean {
  return useCompactContext().compact;
}

export function useCompactToggle() {
  return useCompactContext();
}

/**
 * Toggle component for compact mode
 * Renders a toggle button that controls compact state via localStorage
 */
export function CompactToggle() {
  const { compact, setCompact } = useCompactToggle();

  return (
    <Toggle
      aria-label="Toggle compact mode"
      size="default"
      variant="default"
      pressed={compact}
      onPressedChange={(pressed) => setCompact(pressed)}
    >
      <ChevronsDownUp className="group-aria-pressed/toggle:fill-foreground" />
    </Toggle>
  );
}
