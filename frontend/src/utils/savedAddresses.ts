export interface SavedAddress {
  label: string;
  address: string;
  cep?: string;
  lat?: string;
  lon?: string;
}

const STORAGE_KEY = 'cuidarbem_saved_addresses';

export function getSavedAddresses(): SavedAddress[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveAddress(address: SavedAddress) {
  if (typeof window === 'undefined') return;

  const current = getSavedAddresses();

  const exists = current.find((item) => item.address === address.address);
  if (exists) return;

  const updated = [address, ...current].slice(0, 5); // guarda até 5
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removeSavedAddress(address: string) {
  if (typeof window === 'undefined') return;

  const current = getSavedAddresses();
  const updated = current.filter((item) => item.address !== address);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}