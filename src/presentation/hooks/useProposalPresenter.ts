import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useDependencies } from '@/presentation/providers/AppDependenciesProvider';
import type { IntakeForm } from '@/domain/entities/IntakeForm';
import type { Proposal } from '@/domain/entities/Proposal';
import type { AgentState } from '@/domain/entities/AgentState';
import { AVAILABLE_EXTRAS } from '@/domain/entities/ExtraAddon';

export type PendingAction = 'select' | 'pdf' | 'email';

export function useProposalPresenter() {
  const location = useLocation();
  const navigate = useNavigate();
  const { generarPropuesta, guardarLead } = useDependencies();

  const form = (location.state as { form: IntakeForm })?.form;

  const [, setAgents] = useState<AgentState[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [leadsOpen, setLeadsOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [selectedPkg, setSelectedPkg] = useState('');

  useEffect(() => {
    if (!form) {
      navigate('/');
      return;
    }
    generarPropuesta.executeWithPipeline(form, setAgents).then((result) => {
      if (result.success) setProposal(result.data);
    });
  }, []);

  const toggleExtra = useCallback((id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handlePackageSelect = useCallback((pkgName: string) => {
    setSelectedPkg(pkgName);
    setPendingAction('select');
    setExtrasOpen(true);
  }, []);

  const proceedToGate = useCallback(() => {
    setExtrasOpen(false);
    setGateOpen(true);
  }, []);

  const openGateDirectly = useCallback((action: PendingAction, pkgName?: string) => {
    setPendingAction(action);
    setSelectedPkg(pkgName || '');
    setGateOpen(true);
  }, []);

  const handleGateSubmit = useCallback((email: string, empresa: string) => {
    if (!form || !proposal) return;
    setGateOpen(false);

    guardarLead.execute({
      form,
      email,
      empresa,
      packageSelected: selectedPkg || 'N/A',
    });

    if (pendingAction === 'pdf') {
      window.print();
    } else if (pendingAction === 'email') {
      const subject = encodeURIComponent(`Propuesta Berlioz — ${empresa}`);
      const body = encodeURIComponent(
        `Hola ${form.nombre},\n\nAdjunto nuestra propuesta de catering para ${empresa}.\n\nQuedo a tus órdenes.\n\nBerlioz\nhola@berlioz.mx`,
      );
      window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    } else if (pendingAction === 'select') {
      toast.success(`Paquete "${selectedPkg}" seleccionado. Nos pondremos en contacto contigo.`);
    }
  }, [form, proposal, pendingAction, selectedPkg, guardarLead]);

  const extraLabels = selectedExtras
    .map((id) => AVAILABLE_EXTRAS.find((e) => e.id === id)?.title)
    .filter(Boolean) as string[];

  return {
    form,
    proposal,
    gateOpen,
    setGateOpen,
    leadsOpen,
    setLeadsOpen,
    extrasOpen,
    selectedExtras,
    selectedPkg,
    extraLabels,
    toggleExtra,
    handlePackageSelect,
    proceedToGate,
    openGateDirectly,
    handleGateSubmit,
    navigateToWizard: () => navigate('/'),
  };
}
