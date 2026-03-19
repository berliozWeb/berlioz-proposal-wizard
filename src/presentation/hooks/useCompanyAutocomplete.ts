import { useState, useCallback, useEffect, useRef } from 'react';
import { useDependencies } from '@/presentation/providers/AppDependenciesProvider';

export function useCompanyAutocomplete(initialValue: string) {
  const { buscarEmpresas } = useDependencies();
  const [value, setValue] = useState(initialValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onChange = useCallback((newValue: string) => {
    setValue(newValue);
    const result = buscarEmpresas.execute(newValue);
    if (result.success) {
      setSuggestions(result.data);
    }
    setShowDropdown(newValue.trim().length > 0);
  }, [buscarEmpresas]);

  const selectCompany = useCallback((name: string) => {
    setValue(name);
    setShowDropdown(false);
  }, []);

  const saveNew = useCallback(() => {
    if (value.trim()) {
      buscarEmpresas.save(value.trim());
      setShowDropdown(false);
    }
  }, [value, buscarEmpresas]);

  const exactMatch = suggestions.some(
    (s) => s.toLowerCase() === value.trim().toLowerCase(),
  );

  const onFocus = useCallback(() => {
    if (value.trim()) onChange(value);
  }, [value, onChange]);

  return {
    value,
    setValue,
    showDropdown,
    suggestions,
    exactMatch,
    dropdownRef,
    onChange,
    selectCompany,
    saveNew,
    onFocus,
  };
}
