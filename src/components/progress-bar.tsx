import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import {
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
}

interface ProgressBarDisabledProps {
  label: string;
  unit?: string;
}

// Override ProgressTrack background color
function ProgressCustom({ className, children, value, ...props }: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      <ProgressTrack className="bg-muted-foreground/20">
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

export function ProgressBar({ label, value, max = 100, unit }: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <ProgressCustom value={percentage} className="gap-2 mb-0.5">
      <ProgressLabel className="leading-none">{label}</ProgressLabel>
      <ProgressValue className="text-foreground leading-none">
        {() => (unit ? `${value.toFixed(1)} / ${max} ${unit}` : `${percentage} %`)}
      </ProgressValue>
    </ProgressCustom>
  );
}

export function ProgressBarDisabled({ label, unit }: ProgressBarDisabledProps) {
  return (
    <ProgressCustom value={0} className="gap-2 mb-0.5">
      <ProgressLabel className="leading-none text-muted-foreground">{label}</ProgressLabel>
      <ProgressValue className="text-muted-foreground leading-none">
        {() => (unit ? `- / - ${unit}` : "- %")}
      </ProgressValue>
    </ProgressCustom>
  );
}
