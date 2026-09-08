import { createContext, useContext, useMemo, useState } from 'react';

const RentContext = createContext(null);

export function RentProvider({ children }) {
  const [range, setRange] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [rentalId, setRentalId] = useState(null);

  const value = useMemo(() => ({
    range,
    setRange,
    vehicleId,
    setVehicleId,
    purpose,
    setPurpose,
    rentalId,
    setRentalId,
    clearFlow: () => {
      setVehicleId(null);
      setPurpose('');
      setRentalId(null);
    },
  }), [range, vehicleId, purpose, rentalId]);

  return <RentContext.Provider value={value}>{children}</RentContext.Provider>;
}

export function useRent() {
  const ctx = useContext(RentContext);
  if (!ctx) throw new Error('useRent must be used within RentProvider');
  return ctx;
}
