import { buildFullAddress, parseFullAddress } from '@/utils/addressFields';

export interface SavedAddress {
  label: string;
  address: string;
  baseAddress?: string;
  number?: string;
  complement?: string;
  cep?: string;
  lat?: string;
  lon?: string;
}

const STORAGE_KEY = 'cuidarbem_saved_addresses';

function sanitizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeSavedAddress(
  rawAddress: Partial<SavedAddress> | null | undefined,
): SavedAddress | null {
  const rawFullAddress = sanitizeString(rawAddress?.address);

  if (!rawFullAddress) {
    return null;
  }

  const parsedAddress = parseFullAddress(rawFullAddress);
  const baseAddress =
    sanitizeString(rawAddress?.baseAddress) || parsedAddress.baseAddress;
  const number = sanitizeString(rawAddress?.number) || parsedAddress.number;
  const complement =
    sanitizeString(rawAddress?.complement) || parsedAddress.complement;
  const fullAddress =
    buildFullAddress(baseAddress, number, complement) || rawFullAddress;

  return {
    label: sanitizeString(rawAddress?.label) || 'Endereço salvo',
    address: fullAddress,
    baseAddress: baseAddress || fullAddress,
    number,
    complement,
    cep: sanitizeString(rawAddress?.cep),
    lat: sanitizeString(rawAddress?.lat),
    lon: sanitizeString(rawAddress?.lon),
  } satisfies SavedAddress;
}

export function getSavedAddresses(): SavedAddress[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const parsedData = JSON.parse(data);

    if (!Array.isArray(parsedData)) {
      return [];
    }

    const normalized = parsedData
      .map((item) => normalizeSavedAddress(item))
      .filter((item): item is SavedAddress => Boolean(item));
    const normalizedSerialized = JSON.stringify(normalized);

    if (normalizedSerialized !== data) {
      localStorage.setItem(STORAGE_KEY, normalizedSerialized);
    }

    return normalized;
  } catch {
    return [];
  }
}

export function saveAddress(address: SavedAddress) {
  if (typeof window === 'undefined') return;

  const normalizedAddress = normalizeSavedAddress(address);

  if (!normalizedAddress) {
    return;
  }

  const current = getSavedAddresses();
  const updated = [
    normalizedAddress,
    ...current.filter(
      (item) =>
        item.address.trim().toLowerCase() !==
        normalizedAddress.address.trim().toLowerCase(),
    ),
  ].slice(0, 5);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removeSavedAddress(address: string) {
  if (typeof window === 'undefined') return;

  const current = getSavedAddresses();
  const normalizedAddress = normalizeSavedAddress({ label: '', address });
  const updated = current.filter(
    (item) =>
      item.address.trim().toLowerCase() !==
      (normalizedAddress?.address || address).trim().toLowerCase(),
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
