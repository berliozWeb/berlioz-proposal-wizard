export type AgentStatus = 'idle' | 'running' | 'done' | 'error';

export interface AgentState {
  id: string;
  name: string;
  icon: string;
  status: AgentStatus;
  logs: string[];
}
