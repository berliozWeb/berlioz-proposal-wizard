import type { IntakeForm } from '@/domain/entities/IntakeForm';
import type { Proposal } from '@/domain/entities/Proposal';
import type { AgentState } from '@/domain/entities/AgentState';
import type { IProposalGenerator } from '@/domain/repositories/IProposalGenerator';
import type { Result } from '@/domain/shared/Result';
import { ok, fail } from '@/domain/shared/Result';
import { ValidationError } from '@/domain/errors';

export class GenerarPropuestaUseCase {
  constructor(private readonly generator: IProposalGenerator) {}

  execute(form: IntakeForm): Result<Proposal, ValidationError> {
    if (!form.eventType) {
      return fail(new ValidationError('Tipo de evento requerido', 'eventType'));
    }
    if (!form.nivelEsperado) {
      return fail(new ValidationError('Nivel esperado requerido', 'nivelEsperado'));
    }
    if (form.personas <= 0) {
      return fail(new ValidationError('Número de personas debe ser mayor a 0', 'personas'));
    }

    const proposal = this.generator.generate(form);
    return ok(proposal);
  }

  async executeWithPipeline(
    form: IntakeForm,
    onAgentUpdate: (agents: AgentState[]) => void,
  ): Promise<Result<Proposal, ValidationError>> {
    if (!form.eventType || !form.nivelEsperado || form.personas <= 0) {
      return fail(new ValidationError('Formulario incompleto'));
    }

    const proposal = await this.generator.generateWithPipeline(form, onAgentUpdate);
    return ok(proposal);
  }
}
