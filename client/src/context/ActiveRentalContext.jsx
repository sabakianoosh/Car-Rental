import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

const ActiveRentalContext = createContext(null);

export function ActiveRentalProvider({ children }) {
  const { isAuthed } = useAuth();
  const [data, setData] = useState({
    rental: null,
    incidents: [],
    canReportIncidents: false,
    incidentWindow: null,
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthed) {
      setData({ rental: null, incidents: [], canReportIncidents: false, incidentWindow: null });
      return null;
    }
    setLoading(true);
    try {
      const result = await api.getActiveRental();
      const next = result || {
        rental: null,
        incidents: [],
        canReportIncidents: false,
        incidentWindow: null,
      };
      setData(next);
      return next;
    } catch {
      setData({ rental: null, incidents: [], canReportIncidents: false, incidentWindow: null });
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthed]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthed) return undefined;
    const id = setInterval(refresh, 5000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [isAuthed, refresh]);

  const value = useMemo(() => ({
    rental: data.rental,
    incidents: data.incidents || [],
    hasActive: Boolean(data.rental),
    canReportIncidents: Boolean(data.canReportIncidents && data.rental),
    incidentWindow: data.incidentWindow,
    loading,
    refresh,
  }), [data, loading, refresh]);

  return (
    <ActiveRentalContext.Provider value={value}>{children}</ActiveRentalContext.Provider>
  );
}

export function useActiveRental() {
  const ctx = useContext(ActiveRentalContext);
  if (!ctx) throw new Error('useActiveRental must be used within ActiveRentalProvider');
  return ctx;
}
