import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useDependencies } from '@/presentation/providers/AppDependenciesProvider';
import type { IntakeForm } from '@/domain/entities/IntakeForm';
import type { Proposal } from '@/domain/entities/Proposal';
import type { AgentState } from '@/domain/entities/AgentState';
import type { CartItem } from '@/domain/entities/MenuItem';
import { ADDONS } from '@/domain/entities/Addon';
import { analytics } from '@/lib/mixpanel';

export type PendingAction = 'select' | 'pdf' | 'email';
export type ProposalPath = 'cotiza' | 'menu';

export function useProposalPresenter() {
  const location = useLocation();
  const navigate = useNavigate();
  const { generarPropuesta, guardarLead } = useDependencies();

  const locState = location.state as {
    form: IntakeForm;
    path?: ProposalPath;
    cart?: CartItem[];
  } | null;

  const form = locState?.form ?? null;
  const proposalPath: ProposalPath = locState?.path || 'cotiza';
  const cart: CartItem[] = locState?.cart || [];

  const [, setAgents] = useState<AgentState[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [leadsOpen, setLeadsOpen] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [selectedPkg, setSelectedPkg] = useState('');

  useEffect(() => {
    if (!form) {
      navigate('/');
      return;
    }
    if (proposalPath === 'cotiza') {
      generarPropuesta.executeWithPipeline(form, setAgents).then((result) => {
        if (result.success) {
          setProposal(result.data);
          analytics.track('proposal_generated', {
            personas: form.personas,
            eventType: form.eventType,
            packagesShown: result.data.packages.length,
          });
        }
      });
    }
  }, []);

  const toggleAddon = useCallback((id: string) => {
    setSelectedAddons((prev) => {
      const removing = prev.includes(id);
      analytics.track('addon_toggled', {
        addon: ADDONS.find((a) => a.id === id)?.title ?? id,
        action: removing ? 'removed' : 'added',
      });
      return removing ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }, []);

  const handlePackageSelect = useCallback((pkgName: string) => {
    setSelectedPkg(pkgName);
    setPendingAction('select');
    setGateOpen(true);
    const pkg = proposal?.packages.find((p) => p.displayName === pkgName);
    analytics.track('package_selected', {
      packageName: pkgName,
      totalPrice: pkg?.total ?? 0,
      personas: form?.personas ?? 0,
    });
  }, [proposal, form]);

  const openGateDirectly = useCallback((action: PendingAction, pkgName?: string) => {
    setPendingAction(action);
    setSelectedPkg(pkgName || '');
    setGateOpen(true);
  }, []);

  const handleGateSubmit = useCallback((email: string, empresa: string) => {
    if (!form) return;
    setGateOpen(false);

    guardarLead.execute({
      form,
      email,
      empresa,
      packageSelected: selectedPkg || 'N/A',
    });

    if (pendingAction === 'pdf') {
      analytics.track('pdf_downloaded', { packageName: selectedPkg || 'N/A', empresa });
      window.print();
    } else if (pendingAction === 'email') {
      const subject = encodeURIComponent(`Propuesta Berlioz — ${empresa}`);
      const body = encodeURIComponent(
        `Hola ${form.nombre},\n\nAdjunto nuestra propuesta de catering para ${empresa}.\n\nBerlioz\nhola@berlioz.mx`,
      );
      window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    } else if (pendingAction === 'select') {
      toast.success(`Paquete "${selectedPkg}" seleccionado. Nos pondremos en contacto.`);
    }
  }, [form, pendingAction, selectedPkg, guardarLead]);

  const addonLabels = selectedAddons
    .map((id) => ADDONS.find((a) => a.id === id)?.title)
    .filter(Boolean) as string[];

  return {
    form,
    proposal,
    proposalPath,
    cart,
    gateOpen,
    setGateOpen,
    leadsOpen,
    setLeadsOpen,
    selectedAddons,
    selectedPkg,
    addonLabels,
    toggleAddon,
    handlePackageSelect,
    openGateDirectly,
    handleGateSubmit,
    navigateToWizard: () => navigate('/'),
  };
}
