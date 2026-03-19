import { cn } from "@/lib/utils";
import type { AgentState } from "@/domain/entities/AgentState";

interface AgentCardProps {
  agent: AgentState;
}

const AgentCard = ({ agent }: AgentCardProps) => {
  const statusColors = {
    idle: 'bg-muted',
    running: 'bg-accent animate-pulse-soft',
    done: 'bg-success',
    error: 'bg-destructive',
  };

  return (
    <div className={cn(
      "rounded-lg border border-border p-4 transition-all duration-300",
      agent.status === 'running' && "border-accent/50 bg-accent/5",
      agent.status === 'done' && "border-success/30 bg-success/5",
    )}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-lg">{agent.icon}</span>
        <span className="text-sm font-medium text-foreground flex-1">{agent.name}</span>
        <span className={cn("w-2.5 h-2.5 rounded-full", statusColors[agent.status])} />
      </div>
      {agent.logs.length > 0 && (
        <div className="space-y-1 ml-8">
          {agent.logs.slice(-3).map((log, i) => (
            <p key={i} className="text-xs font-mono text-muted-foreground">
              {log}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentCard;
