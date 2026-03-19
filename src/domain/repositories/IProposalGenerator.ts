import type { IntakeForm } from '@/domain/entities/IntakeForm';
import type { Proposal } from '@/domain/entities/Proposal';
import type { AgentState } from '@/domain/entities/AgentState';

export interface IProposalGenerator {
  generate(form: IntakeForm): Proposal;
  generateWithPipeline(
    form: IntakeForm,
    onAgentUpdate: (agents: AgentState[]) => void,
  ): Promise<Proposal>;
}
