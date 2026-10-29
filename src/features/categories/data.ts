import type { CategorySlug, ServiceCategory } from "@/types/domain";

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "cat-construccion",
    slug: "construccion",
    iconName: "Hammer",
    name: {
      "es-AR": "Construcción",
      "pt-BR": "Construção",
    },
    shortDescription: {
      "es-AR": "Obras, remodelaciones, pintura, construcción en seco y revestimientos.",
      "pt-BR": "Obras, reformas, pintura, drywall, gesso e revestimentos cerâmicos.",
    },
    examples: {
      "es-AR": ["Albañil", "Pintor de obra", "Durlero / Yesero", "Colocador de pisos"],
      "pt-BR": ["Pedreiro", "Pintor", "Gesseiro / Drywall", "Assentador de pisos"],
    },
    subcategories: [
      { id: "sub-albanileria", name: { "es-AR": "Albañilería general", "pt-BR": "Alvenaria geral" } },
      { id: "sub-pintura", name: { "es-AR": "Pintura e impermeabilización", "pt-BR": "Pintura e impermeabilização" } },
      { id: "sub-durlock", name: { "es-AR": "Construcción en seco y yesería", "pt-BR": "Gesso e Drywall" } },
      { id: "sub-pisos", name: { "es-AR": "Colocación de pisos y porcelanatos", "pt-BR": "Pisos e porcelanatos" } },
    ],
    demoProfessionalCount: { AR: 18, BR: 14 },
  },
  {
    id: "cat-hogar",
    slug: "hogar",
    iconName: "Wrench",
    name: {
      "es-AR": "Hogar",
      "pt-BR": "Casa e Reparos",
    },
    shortDescription: {
      "es-AR": "Soluciones rápidas y mantenimiento integral para viviendas y comercios.",
      "pt-BR": "Soluções rápidas e manutenção residencial ou comercial sob medida.",
    },
    examples: {
      "es-AR": ["Plomero", "Carpintero", "Cerrajero 24h", "Reparaciones del hogar"],
      "pt-BR": ["Encanador", "Marceneiro", "Chaveiro", "Marido de aluguel / Reparos"],
    },
    subcategories: [
      { id: "sub-plomeria", name: { "es-AR": "Plomería y destapaciones", "pt-BR": "Hidráulica e encanamento" } },
      { id: "sub-carpinteria", name: { "es-AR": "Carpintería a medida", "pt-BR": "Marcenaria sob medida" } },
      { id: "sub-cerrajeria", name: { "es-AR": "Cerrajería y herrajes", "pt-BR": "Chaveiro e fechaduras" } },
    ],
    demoProfessionalCount: { AR: 24, BR: 19 },
  },
  {
    id: "cat-electricidad-y-gas",
    slug: "electricidad-y-gas",
    iconName: "Zap",
    name: {
      "es-AR": "Electricidad y Gas",
      "pt-BR": "Elétrica e Gás",
    },
    shortDescription: {
      "es-AR": "Instalaciones seguras, tableros, artefactos de gas y climatización.",
      "pt-BR": "Instalações seguras, quadros elétricos, tubulação de gás e climatização.",
    },
    examples: {
      "es-AR": ["Electricista", "Gasista matriculado", "Instalación de aire acondicionado"],
      "pt-BR": ["Eletricista", "Instalador de gás", "Ar-condicionado e climatização"],
    },
    subcategories: [
      { id: "sub-electricidad", name: { "es-AR": "Instalaciones eléctricas y tableros", "pt-BR": "Instalações e quadros elétricos" } },
      { id: "sub-gas", name: { "es-AR": "Gasista matriculado y calefacción", "pt-BR": "Instalação e manutenção de gás" } },
      { id: "sub-climatizacion", name: { "es-AR": "Aires acondicionados", "pt-BR": "Climatização e Split" } },
    ],
    demoProfessionalCount: { AR: 21, BR: 16 },
  },
  {
    id: "cat-belleza-y-bienestar",
    slug: "belleza-y-bienestar",
    iconName: "Sparkles",
    name: {
      "es-AR": "Belleza y Bienestar",
      "pt-BR": "Beleza e Bem-estar",
    },
    shortDescription: {
      "es-AR": "Atención personal a domicilio o en estudio con turno acordado.",
      "pt-BR": "Atendimento personalizado em domicílio ou estúdio com horário marcado.",
    },
    examples: {
      "es-AR": ["Esteticista", "Peluquero/a", "Manicura", "Masajista profesional"],
      "pt-BR": ["Esteticista", "Cabeleireiro(a)", "Manicure e pedicure", "Massoterapeuta"],
    },
    subcategories: [
      { id: "sub-peluqueria", name: { "es-AR": "Peluquería y barbería", "pt-BR": "Cabelo e barbearia" } },
      { id: "sub-manicura", name: { "es-AR": "Manicura y estética", "pt-BR": "Manicure e estética" } },
      { id: "sub-masajes", name: { "es-AR": "Masajes descontracturantes", "pt-BR": "Massoterapia e relaxamento" } },
    ],
    demoProfessionalCount: { AR: 15, BR: 17 },
  },
  {
    id: "cat-jardineria",
    slug: "jardineria",
    iconName: "Trees",
    name: {
      "es-AR": "Jardinería",
      "pt-BR": "Jardinagem",
    },
    shortDescription: {
      "es-AR": "Diseño de parques, corte de césped, poda en altura y riego automático.",
      "pt-BR": "Paisagismo, corte de grama, poda segura e manutenção de áreas verdes.",
    },
    examples: {
      "es-AR": ["Jardinero", "Poda y desmalezado", "Mantenimiento de espacios verdes"],
      "pt-BR": ["Jardineiro", "Poda e limpeza de terrenos", "Manutenção de jardins"],
    },
    subcategories: [
      { id: "sub-mantenimiento-verde", name: { "es-AR": "Mantenimiento de jardines", "pt-BR": "Manutenção de jardins" } },
      { id: "sub-poda", name: { "es-AR": "Poda y control fitosanitario", "pt-BR": "Poda e controle de pragas" } },
      { id: "sub-riego", name: { "es-AR": "Sistemas de riego y paisajismo", "pt-BR": "Irrigação e paisagismo" } },
    ],
    demoProfessionalCount: { AR: 12, BR: 11 },
  },
  {
    id: "cat-transporte",
    slug: "transporte",
    iconName: "Truck",
    name: {
      "es-AR": "Transporte",
      "pt-BR": "Transporte e Mudanças",
    },
    shortDescription: {
      "es-AR": "Fletes por hora, minifletes, mudanzas con peones y traslados urbanos.",
      "pt-BR": "Fretes rápidos, mudanças residenciais com ajudantes e entregas urbanas.",
    },
    examples: {
      "es-AR": ["Fletes y minifletes", "Mudanzas completas", "Entregas programadas"],
      "pt-BR": ["Fretes e carretos", "Mudanças residenciais", "Entregas programadas"],
    },
    subcategories: [
      { id: "sub-fletes", name: { "es-AR": "Fletes y minifletes", "pt-BR": "Fretes e pequenos carretos" } },
      { id: "sub-mudanzas", name: { "es-AR": "Mudanzas con embalaje", "pt-BR": "Mudanças com embalagem" } },
    ],
    demoProfessionalCount: { AR: 14, BR: 12 },
  },
  {
    id: "cat-salud",
    slug: "salud",
    iconName: "HeartPulse",
    name: {
      "es-AR": "Salud",
      "pt-BR": "Saúde e Cuidado",
    },
    shortDescription: {
      "es-AR": "Servicios domiciliarios permitidos conforme habilitación y normas aplicables.",
      "pt-BR": "Serviços domiciliares permitidos conforme habilitação e normas aplicáveis.",
    },
    examples: {
      "es-AR": ["Acompañante terapéutico", "Cuidado de adultos mayores", "Kinesiología a domicilio"],
      "pt-BR": ["Cuidador(a) de idosos", "Fisioterapia domiciliar", "Acompanhamento domiciliar"],
    },
    subcategories: [
      { id: "sub-cuidados", name: { "es-AR": "Asistencia y cuidado domiciliario", "pt-BR": "Cuidado e assistência domiciliar" } },
      { id: "sub-rehabilitacion", name: { "es-AR": "Rehabilitación con matrícula vigente", "pt-BR": "Fisioterapia com registro ativo" } },
    ],
    demoProfessionalCount: { AR: 9, BR: 10 },
  },
  {
    id: "cat-otros",
    slug: "otros",
    iconName: "Layers",
    name: {
      "es-AR": "Otros",
      "pt-BR": "Outros Serviços",
    },
    shortDescription: {
      "es-AR": "Soporte técnico, limpieza profunda de tapizados, eventos y especialidades a demanda.",
      "pt-BR": "Suporte técnico, higienização de estofados, eventos e especialidades sob demanda.",
    },
    examples: {
      "es-AR": ["Técnico de PC y redes", "Limpieza de tapizados", "Armado de muebles"],
      "pt-BR": ["Técnico de informática", "Limpeza de estofados", "Montador de móveis"],
    },
    subcategories: [
      { id: "sub-tecnologia", name: { "es-AR": "Soporte técnico y redes Wi-Fi", "pt-BR": "Suporte técnico e redes Wi-Fi" } },
      { id: "sub-limpieza", name: { "es-AR": "Limpieza técnica de tapizados", "pt-BR": "Higienização de estofados" } },
    ],
    demoProfessionalCount: { AR: 11, BR: 9 },
  },
];

export function getCategoryBySlug(slug: string): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find((cat) => cat.slug === (slug as CategorySlug));
}
