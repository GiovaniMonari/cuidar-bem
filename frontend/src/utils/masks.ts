export function maskCep(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2');
}

export function maskPhone(value: string) {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);

  if (cleaned.length <= 10) {
    return cleaned.replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return cleaned.replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}