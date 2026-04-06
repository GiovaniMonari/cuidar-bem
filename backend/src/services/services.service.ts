import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceType, ServiceTypeDocument } from './schemas/service-type.schema';

@Injectable()
export class ServicesService implements OnModuleInit {
  constructor(
    @InjectModel(ServiceType.name)
    private serviceTypeModel: Model<ServiceTypeDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.serviceTypeModel.countDocuments();
    if (count === 0) {
      await this.seedServiceTypes();
    }
  }

  private async seedServiceTypes() {
    // Durações padrão simplificadas
    const defaultDurations = [
      { 
        key: '1h', 
        label: '1 Hora', 
        description: 'Visita rápida ou procedimento pontual',
        hours: 1, 
        multiplier: 1.5 // Preço premium por ser curto
      },
      { 
        key: 'turno', 
        label: 'Turno (6h)', 
        description: 'Meio período - manhã ou tarde',
        hours: 6, 
        multiplier: 1 
      },
      { 
        key: 'diaria', 
        label: 'Diária (12h)', 
        description: 'Dia inteiro ou noite',
        hours: 12, 
        multiplier: 0.9 // 10% desconto
      },
      { 
        key: 'semanal', 
        label: 'Semanal', 
        description: '7 dias consecutivos (12h/dia)',
        hours: 84, // 7 x 12h
        multiplier: 0.8 // 20% desconto
      },
      { 
        key: 'mensal', 
        label: 'Mensal', 
        description: '30 dias (12h/dia)',
        hours: 360, // 30 x 12h
        multiplier: 0.7 // 30% desconto
      },
    ];

    // Durações para serviços de visita/procedimento
    const visitDurations = [
      { 
        key: '1h', 
        label: '1 Hora', 
        description: 'Procedimento único',
        hours: 1, 
        multiplier: 1 
      },
      { 
        key: '2h', 
        label: '2 Horas', 
        description: 'Visita com mais tempo',
        hours: 2, 
        multiplier: 0.95
      },
      { 
        key: 'turno', 
        label: 'Turno (6h)', 
        description: 'Meio período',
        hours: 6, 
        multiplier: 0.85 
      },
    ];

    // Durações para pernoite
    const nightDurations = [
      { 
        key: 'noite', 
        label: 'Pernoite (10h)', 
        description: '21h às 7h',
        hours: 10, 
        multiplier: 1 
      },
      { 
        key: 'semanal_noite', 
        label: 'Semanal Noturno', 
        description: '7 noites consecutivas',
        hours: 70, // 7 x 10h
        multiplier: 0.8 
      },
      { 
        key: 'mensal_noite', 
        label: 'Mensal Noturno', 
        description: '30 noites',
        hours: 300, // 30 x 10h
        multiplier: 0.7 
      },
    ];

    const serviceTypes = [
      // CUIDADO DE IDOSOS
      {
        key: 'cuidado_basico_idoso',
        name: 'Cuidado Básico para Idosos',
        description: 'Acompanhamento, companhia, auxílio em atividades diárias e supervisão geral.',
        icon: 'heart',
        category: 'idoso',
        durations: defaultDurations,
        basePriceMin: 25,
        basePriceMax: 50,
        suggestedPrice: 35,
        includes: [
          'Companhia e conversação',
          'Auxílio na alimentação',
          'Auxílio na locomoção interna',
          'Lembrete de medicamentos',
          'Atividades recreativas leves',
          'Supervisão geral',
        ],
        requirements: ['Experiência com idosos'],
        order: 1,
      },
      {
        key: 'cuidado_acamado',
        name: 'Cuidado de Idoso Acamado',
        description: 'Cuidado completo para idosos acamados, incluindo higiene, mudança de decúbito e alimentação.',
        icon: 'bed',
        category: 'idoso',
        durations: defaultDurations,
        basePriceMin: 40,
        basePriceMax: 80,
        suggestedPrice: 55,
        includes: [
          'Higiene pessoal completa',
          'Banho no leito',
          'Mudança de decúbito (2/2h)',
          'Prevenção de escaras',
          'Troca de fraldas',
          'Alimentação assistida',
          'Controle de sinais vitais',
        ],
        requirements: [
          'Curso de cuidador de idosos',
          'Experiência com acamados',
        ],
        order: 2,
      },
      {
        key: 'cuidado_alzheimer',
        name: 'Cuidado Especializado - Alzheimer/Demência',
        description: 'Acompanhamento especializado para pacientes com Alzheimer, demência ou outras condições cognitivas.',
        icon: 'brain',
        category: 'idoso',
        durations: defaultDurations,
        basePriceMin: 50,
        basePriceMax: 100,
        suggestedPrice: 70,
        includes: [
          'Estimulação cognitiva',
          'Prevenção de fuga/desorientação',
          'Manejo de agitação e ansiedade',
          'Rotina estruturada',
          'Comunicação adaptada',
          'Atividades terapêuticas',
          'Relatório diário para família',
        ],
        requirements: [
          'Especialização em Alzheimer/demência',
          'Mínimo 2 anos de experiência',
        ],
        order: 3,
      },
      {
        key: 'pernoite_idoso',
        name: 'Cuidado Noturno para Idosos',
        description: 'Acompanhamento noturno com vigília, atendimento a chamados e cuidados durante a noite.',
        icon: 'moon',
        category: 'idoso',
        durations: nightDurations,
        basePriceMin: 100,
        basePriceMax: 180,
        suggestedPrice: 130,
        includes: [
          'Vigília noturna',
          'Atendimento a chamados',
          'Auxílio para ir ao banheiro',
          'Troca de fraldas se necessário',
          'Medicação noturna',
          'Posicionamento no leito',
          'Relatório matinal',
        ],
        requirements: [
          'Disponibilidade noturna',
          'Experiência com idosos',
        ],
        order: 4,
      },

      // CUIDADO PCD
      {
        key: 'cuidado_pcd_fisico',
        name: 'Cuidado para PcD Física',
        description: 'Assistência para pessoas com deficiência física, auxiliando na mobilidade, transferências e rotina diária.',
        icon: 'accessibility',
        category: 'pcd',
        durations: defaultDurations,
        basePriceMin: 35,
        basePriceMax: 70,
        suggestedPrice: 50,
        includes: [
          'Auxílio na mobilidade',
          'Transferência cama/cadeira',
          'Auxílio em exercícios de fisioterapia',
          'Acompanhamento em atividades',
          'Higiene pessoal',
          'Apoio emocional',
        ],
        requirements: [
          'Experiência com PcD física',
          'Conhecimento de técnicas de transferência',
        ],
        order: 5,
      },
      {
        key: 'cuidado_pcd_intelectual',
        name: 'Cuidado para PcD Intelectual/TEA',
        description: 'Cuidado especializado para pessoas com deficiência intelectual, autismo ou síndromes.',
        icon: 'heart-handshake',
        category: 'pcd',
        durations: defaultDurations,
        basePriceMin: 45,
        basePriceMax: 90,
        suggestedPrice: 65,
        includes: [
          'Rotina estruturada e previsível',
          'Atividades adaptadas',
          'Comunicação alternativa (se necessário)',
          'Manejo comportamental',
          'Estimulação sensorial',
          'Acompanhamento em terapias',
        ],
        requirements: [
          'Especialização em TEA/DI',
          'Formação em ABA (diferencial)',
        ],
        order: 6,
      },

      // ENFERMAGEM
      {
        key: 'enfermagem_domiciliar',
        name: 'Enfermagem Domiciliar',
        description: 'Serviços de enfermagem em domicílio: curativos, sondas, medicação injetável, sinais vitais.',
        icon: 'syringe',
        category: 'enfermagem',
        durations: visitDurations,
        basePriceMin: 80,
        basePriceMax: 150,
        suggestedPrice: 100,
        includes: [
          'Curativos simples e complexos',
          'Administração de medicamentos injetáveis',
          'Troca/manutenção de sondas',
          'Verificação de sinais vitais',
          'Coleta de exames (se habilitado)',
          'Orientação à família',
          'Evolução de enfermagem',
        ],
        requirements: [
          'Enfermeiro(a) ou Técnico de Enfermagem',
          'Registro COREN ativo',
        ],
        order: 7,
      },
      {
        key: 'pos_operatorio',
        name: 'Cuidado Pós-Operatório',
        description: 'Assistência especializada na recuperação após cirurgias, incluindo curativos e medicação.',
        icon: 'stethoscope',
        category: 'enfermagem',
        durations: defaultDurations.filter(d => !['semanal', 'mensal'].includes(d.key)),
        basePriceMin: 50,
        basePriceMax: 100,
        suggestedPrice: 70,
        includes: [
          'Auxílio na mobilidade pós-cirúrgica',
          'Troca de curativos',
          'Administração de medicamentos',
          'Controle de dor',
          'Prevenção de complicações',
          'Exercícios prescritos',
          'Relatório para médico',
        ],
        requirements: [
          'Técnico de Enfermagem ou superior',
          'Experiência em pós-operatório',
        ],
        order: 8,
      },

      // ACOMPANHAMENTO
      {
        key: 'acompanhante_consulta',
        name: 'Acompanhante para Consultas/Exames',
        description: 'Acompanhamento em consultas médicas, exames, internações ou procedimentos.',
        icon: 'hospital',
        category: 'acompanhamento',
        durations: [
          { key: 'turno', label: 'Turno (até 6h)', description: 'Consulta ou exame', hours: 6, multiplier: 1 },
          { key: 'diaria', label: 'Diária (até 12h)', description: 'Procedimento mais longo', hours: 12, multiplier: 0.9 },
        ],
        basePriceMin: 40,
        basePriceMax: 80,
        suggestedPrice: 55,
        includes: [
          'Transporte junto ao paciente',
          'Auxílio na locomoção',
          'Acompanhamento na consulta/exame',
          'Anotação de orientações médicas',
          'Retirada de medicamentos na farmácia',
          'Relatório para família',
        ],
        requirements: [],
        order: 9,
      },
      {
        key: 'acompanhante_hospital',
        name: 'Acompanhante Hospitalar',
        description: 'Acompanhamento de pacientes internados em hospitais ou clínicas.',
        icon: 'hospital',
        category: 'acompanhamento',
        durations: [
          { key: 'turno', label: 'Turno (6h)', description: 'Manhã, tarde ou noite', hours: 6, multiplier: 1 },
          { key: 'diaria', label: 'Diária (12h)', description: 'Período diurno ou noturno', hours: 12, multiplier: 0.9 },
          { key: '24h', label: '24 Horas', description: 'Plantão completo', hours: 24, multiplier: 0.85 },
        ],
        basePriceMin: 45,
        basePriceMax: 90,
        suggestedPrice: 60,
        includes: [
          'Companhia ao paciente internado',
          'Comunicação com equipe médica',
          'Auxílio na alimentação',
          'Auxílio na higiene (quando permitido)',
          'Apoio emocional',
          'Relatório diário para família',
        ],
        requirements: [
          'Experiência hospitalar',
        ],
        order: 10,
      },
      {
        key: 'acompanhante_passeio',
        name: 'Acompanhante para Passeios/Lazer',
        description: 'Companhia para passeios, atividades de lazer, compras ou eventos sociais.',
        icon: 'car',
        category: 'acompanhamento',
        durations: [
          { key: 'turno', label: 'Turno (até 6h)', description: 'Passeio ou atividade', hours: 6, multiplier: 1 },
          { key: 'diaria', label: 'Dia inteiro', description: 'Passeio mais longo ou viagem', hours: 10, multiplier: 0.9 },
        ],
        basePriceMin: 35,
        basePriceMax: 70,
        suggestedPrice: 45,
        includes: [
          'Companhia durante o passeio',
          'Auxílio na locomoção',
          'Atenção às necessidades',
          'Segurança e bem-estar',
          'Flexibilidade de roteiro',
        ],
        requirements: [],
        order: 11,
      },
    ];

    await this.serviceTypeModel.insertMany(serviceTypes);
    console.log('✅ Tipos de serviço criados com sucesso!');
  }

  async findAll(category?: string) {
    const query: any = { isActive: true };
    if (category) {
      query.category = category;
    }
    return this.serviceTypeModel.find(query).sort({ order: 1 });
  }

  async findByKey(key: string) {
    return this.serviceTypeModel.findOne({ key, isActive: true });
  }

  async calculatePrice(
    serviceKey: string,
    durationKey: string,
    caregiverPricePerHour?: number,
  ) {
    const service = await this.findByKey(serviceKey);
    if (!service) {
      throw new Error('Tipo de serviço não encontrado');
    }

    const duration = service.durations.find((d) => d.key === durationKey);
    if (!duration) {
      throw new Error('Duração não encontrada');
    }

    const pricePerHour = caregiverPricePerHour || service.suggestedPrice;
    const baseTotal = pricePerHour * duration.hours;
    const discount = baseTotal * (1 - duration.multiplier);
    const totalAmount = baseTotal - discount;

    return {
      service: {
        key: service.key,
        name: service.name,
        description: service.description,
      },
      duration: {
        key: duration.key,
        label: duration.label,
        description: duration.description,
        hours: duration.hours,
      },
      pricePerHour,
      hours: duration.hours,
      baseTotal: Math.round(baseTotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      discountPercent: Math.round((1 - duration.multiplier) * 100),
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  // Método para resetar e recriar os serviços (útil para desenvolvimento)
  async resetServices() {
    await this.serviceTypeModel.deleteMany({});
    await this.seedServiceTypes();
    return { message: 'Serviços recriados com sucesso!' };
  }
}