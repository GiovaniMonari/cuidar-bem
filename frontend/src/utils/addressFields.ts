export interface ParsedAddressFields {
  baseAddress: string;
  number: string;
  complement: string;
  fullAddress: string;
}

const NUMBER_SEGMENT_PATTERN =
  /^(?:n[ºo°]?\s*)?(?:s\/?n|sn|(?:km|lote|quadra|qd|casa|bloco|bl)\s*[\w-]+|\d[\w/-]*)(?:\s+.*)?$/i;

function normalizeAddressFragment(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ', ')
    .replace(/,\s*$/, '')
    .trim();
}

function looksLikeNumberSegment(value: string) {
  return NUMBER_SEGMENT_PATTERN.test(normalizeAddressFragment(value));
}

export function buildFullAddress(
  baseAddress: string,
  number = '',
  complement = '',
) {
  const trimmedBase = normalizeAddressFragment(baseAddress);
  const trimmedNumber = normalizeAddressFragment(number);
  const trimmedComplement = normalizeAddressFragment(complement);

  if (!trimmedBase) {
    return '';
  }

  const parts = trimmedBase
    .split(',')
    .map((part) => normalizeAddressFragment(part))
    .filter(Boolean);

  const street = parts[0] || trimmedBase;
  const remainder = parts.slice(1).join(', ');
  let streetLine = street;

  if (trimmedNumber) {
    streetLine = `${streetLine}, ${trimmedNumber}`;
  }

  if (trimmedComplement) {
    streetLine = `${streetLine} - ${trimmedComplement}`;
  }

  return remainder ? `${streetLine}, ${remainder}` : streetLine;
}

export function parseFullAddress(fullAddress: string): ParsedAddressFields {
  const normalizedFullAddress = normalizeAddressFragment(fullAddress);

  if (!normalizedFullAddress) {
    return {
      baseAddress: '',
      number: '',
      complement: '',
      fullAddress: '',
    };
  }

  const parts = normalizedFullAddress
    .split(',')
    .map((part) => normalizeAddressFragment(part))
    .filter(Boolean);

  if (parts.length < 2) {
    return {
      baseAddress: normalizedFullAddress,
      number: '',
      complement: '',
      fullAddress: normalizedFullAddress,
    };
  }

  const [street, possibleNumber, ...remainderParts] = parts;

  if (!looksLikeNumberSegment(possibleNumber)) {
    return {
      baseAddress: normalizedFullAddress,
      number: '',
      complement: '',
      fullAddress: normalizedFullAddress,
    };
  }

  const [rawNumber, rawComplement = ''] = possibleNumber.split(/\s+-\s+/, 2);
  const number = normalizeAddressFragment(rawNumber);
  const complement = normalizeAddressFragment(rawComplement);
  const baseAddress = normalizeAddressFragment(
    [street, ...remainderParts].join(', '),
  );

  return {
    baseAddress: baseAddress || normalizedFullAddress,
    number,
    complement,
    fullAddress:
      buildFullAddress(baseAddress, number, complement) || normalizedFullAddress,
  };
}
