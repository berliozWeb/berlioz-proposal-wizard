import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IntakeForm } from '@/domain/entities/IntakeForm';
import type { MenuItem, CartItem, MenuCategory } from '@/domain/entities/MenuItem';
import { DEFAULT_INTAKE } from '@/domain/entities/IntakeForm';
import { analytics } from '@/lib/mixpanel';
import { DEFAULT_INTAKE } from '@/domain/entities/IntakeForm';

export type AppPath = 'landing' | 'cotiza' | 'menu';

export interface LandingState {
  nombre: string;
  empresa: string;
  celular: string;
  path: AppPath;
  // Cotiza path
  eventType: IntakeForm['eventType'];
  wizardForm: IntakeForm;
  // Menu path
  cart: CartItem[];
  activeCategory: MenuCategory | null;
}

const INITIAL: LandingState = {
  nombre: '',
  empresa: '',
  celular: '',
  path: 'landing',
  eventType: '',
  wizardForm: { ...DEFAULT_INTAKE },
  cart: [],
  activeCategory: null,
};

export function useLandingPresenter() {
  const [state, setState] = useState<LandingState>(INITIAL);
  const navigate = useNavigate();

  const updateLead = useCallback((field: 'nombre' | 'empresa' | 'celular', value: string) => {
    setState((s) => ({
      ...s,
      [field]: value,
      wizardForm: { ...s.wizardForm, [field]: value },
    }));
  }, []);

  const goToCotiza = useCallback(() => {
    setState((s) => ({ ...s, path: 'cotiza' }));
  }, []);

  const goToMenu = useCallback(() => {
    setState((s) => ({ ...s, path: 'menu', activeCategory: null }));
  }, []);

  const goToLanding = useCallback(() => {
    setState((s) => ({ ...s, path: 'landing' }));
  }, []);

  const selectEventType = useCallback((eventType: IntakeForm['eventType']) => {
    analytics.track('event_type_selected', { eventType });
    setState((s) => ({
      ...s,
      eventType,
      wizardForm: { ...s.wizardForm, eventType },
    }));
  }, []);

  const setWizardForm = useCallback((form: IntakeForm) => {
    setState((s) => ({ ...s, wizardForm: form }));
  }, []);

  const setCategory = useCallback((cat: MenuCategory | null) => {
    setState((s) => ({ ...s, activeCategory: cat }));
  }, []);

  const addToCart = useCallback((item: MenuItem) => {
    setState((s) => {
      const existing = s.cart.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return {
          ...s,
          cart: s.cart.map((c) =>
            c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
          ),
        };
      }
      return { ...s, cart: [...s.cart, { menuItem: item, quantity: 1 }] };
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setState((s) => ({
      ...s,
      cart: s.cart.filter((c) => c.menuItem.id !== itemId),
    }));
  }, []);

  const cartTotal = state.cart.reduce(
    (sum, c) => sum + c.menuItem.pricePerPerson * c.quantity,
    0,
  );
  const cartCount = state.cart.reduce((sum, c) => sum + c.quantity, 0);

  // Navigate to proposal with cotiza path
  const submitCotiza = useCallback(() => {
    const form = {
      ...state.wizardForm,
      nombre: state.nombre,
      empresa: state.empresa,
      celular: state.celular,
      nivelEsperado: 'balanceado' as const, // auto-set, no longer asked
    };
    navigate('/propuesta', { state: { form, path: 'cotiza' } });
  }, [state, navigate]);

  // Navigate to proposal with menu path
  const submitMenu = useCallback(() => {
    const form: IntakeForm = {
      ...DEFAULT_INTAKE,
      nombre: state.nombre,
      empresa: state.empresa,
      celular: state.celular,
      eventType: 'otro',
      personas: 1,
      nivelEsperado: 'balanceado',
    };
    navigate('/propuesta', { state: { form, path: 'menu', cart: state.cart } });
  }, [state, navigate]);

  const canSubmitCotiza =
    state.wizardForm.personas > 0 &&
    state.wizardForm.fechaInicio !== '' &&
    state.wizardForm.horasEntrega.length > 0 &&
    state.eventType !== '';

  return {
    state,
    updateLead,
    goToCotiza,
    goToMenu,
    goToLanding,
    selectEventType,
    setWizardForm,
    setCategory,
    addToCart,
    removeFromCart,
    cartTotal,
    cartCount,
    submitCotiza,
    submitMenu,
    canSubmitCotiza,
  };
}
