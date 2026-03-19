import { cn } from "@/lib/utils";

interface RadioCardProps {
  icon: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

const RadioCard = ({ icon, label, selected, onClick }: RadioCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-2 p-5 rounded-lg border-2 transition-all duration-200 cursor-pointer text-center",
      "hover:border-primary/40 hover:shadow-md",
      selected
        ? "border-primary bg-primary/5 shadow-md"
        : "border-border bg-card"
    )}
  >
    <span className="text-3xl">{icon}</span>
    <span className="text-sm font-body font-medium text-foreground">{label}</span>
  </button>
);

export default RadioCard;
