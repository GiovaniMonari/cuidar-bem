export const SERVICE_TO_SPECIALTY: Record<string, string[]> = {
  // Idosos
  cuidado_basico_idoso: ['cuidado_idosos', 'companhia'],
  cuidado_acamado: ['cuidado_idosos', 'higiene_pessoal', 'mobilidade'],
  cuidado_alzheimer: ['cuidado_idosos', 'companhia'],
  pernoite_idoso: ['cuidado_idosos', 'companhia'],

  // PcD
  cuidado_pcd_fisico: ['cuidado_deficiencia', 'mobilidade'],
  cuidado_pcd_intelectual: ['cuidado_deficiencia', 'companhia'],

  // Enfermagem
  enfermagem_domiciliar: ['enfermagem', 'medicacao', 'higiene_pessoal'],
  pos_operatorio: ['enfermagem', 'medicacao', 'mobilidade'],

  // Acompanhamento
  acompanhante_consulta: ['companhia', 'mobilidade'],
  acompanhante_hospital: ['companhia'],
  acompanhante_passeio: ['companhia', 'mobilidade'],
};

export function deriveSpecialtiesFromServices(
  servicePrices: { serviceKey: string; isAvailable: boolean }[],
): string[] {
  const set = new Set<string>();

  servicePrices
    .filter((item) => item.isAvailable)
    .forEach((item) => {
      const mapped = SERVICE_TO_SPECIALTY[item.serviceKey] || [];
      mapped.forEach((specialty) => set.add(specialty));
    });

  return Array.from(set);
}