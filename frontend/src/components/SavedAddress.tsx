'use client';

import { useEffect, useState } from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import {
  getSavedAddresses,
  removeSavedAddress,
  SavedAddress,
} from '@/utils/savedAddresses';

interface Props {
  onSelect: (address: SavedAddress) => void;
}

export function SavedAddresses({ onSelect }: Props) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    setAddresses(getSavedAddresses());
  }, []);

  const handleRemove = (address: string) => {
    removeSavedAddress(address);
    setAddresses(getSavedAddresses());
  };

  if (addresses.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Endereços frequentes
      </h4>

      <div className="space-y-2">
        {addresses.map((item) => (
          <div
            key={item.address}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-3"
          >
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="flex items-start gap-3 text-left flex-1"
            >
              <MapPin className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {item.label || 'Endereço salvo'}
                </p>
                {item.baseAddress && item.baseAddress !== item.address && (
                  <p className="text-xs text-gray-700">
                    {item.number
                      ? `${item.baseAddress}, ${item.number}`
                      : item.baseAddress}
                    {item.complement ? ` - ${item.complement}` : ''}
                  </p>
                )}
                <p className="text-xs text-gray-500">{item.address}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRemove(item.address)}
              className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
