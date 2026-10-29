import type {
  CategorySlug,
  ProfessionalFilterParams,
  ProfessionalProfile,
} from "@/types/domain";

export const DEMO_PROFESSIONALS: ProfessionalProfile[] = [
  {
    id: "pro-demo-01",
    slug: "martin-echeverria-gas-electricidad",
    isDemoProfile: true,
    fullName: "Martín Echeverría",
    avatarUrl:
      "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=600&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
    country: "AR",
    city: "Buenos Aires (CABA)",
    neighborhood: "Palermo",
    coverageZones: ["Palermo", "Belgrano", "Colegiales", "Recoleta", "Villa Crespo"],
    categorySlug: "electricidad-y-gas",
    primarySpecialty: {
      "es-AR": "Gasista Matriculado y Electricista Domiciliario",
      "pt-BR": "Instalador de Gás e Eletricista Residencial",
    },
    secondarySpecialties: {
      "es-AR": [
        "Revisión de estufas y calefones",
        "Tableros eléctricos y disyuntores",
        "Detección de fugas",
      ],
      "pt-BR": [
        "Manutenção de aquecedores a gás",
        "Quadros elétricos e disjuntores",
        "Detecção de vazamentos",
      ],
    },
    bio: {
      "es-AR":
        "Perfil demostrativo de Fase 1: Especialista en instalaciones sanitarias de gas y adecuación de tableros eléctricos para departamentos y PH en CABA. Trabajo con instrumental de medición digital y presupuesto detallado por escrito antes de intervenir.",
      "pt-BR":
        "Perfil demonstrativo da Fase 1: Especialista em instalações de gás e adequação de quadros elétricos para apartamentos e residências em Buenos Aires. Trabalho com equipamentos de medição digital e orçamento detalhado antes da execução.",
    },
    yearsOfExperience: 12,
    languages: ["Español", "Português básico"],
    matriculaInfo: {
      "es-AR": "Matrícula de ejemplo (Demo Fase 1 — Sin validación real aún)",
      "pt-BR": "Registro de exemplo (Demo Fase 1 — Sem validação real ainda)",
    },
    hiringModels: ["direct_contact", "quote_request"],
    availabilitySummary: {
      "es-AR": "Lunes a sábados · Atención programada",
      "pt-BR": "Segunda a sábado · Atendimento agendado",
    },
    scheduleDays: {
      "es-AR": "Lun a Vie 08:30 a 19:00 · Sáb 09:00 a 14:00",
      "pt-BR": "Seg a Sex 08:30 às 19:00 · Sáb 09:00 às 14:00",
    },
    referenceStartingPrice: {
      amount: 28000,
      currency: "ARS",
      unitLabel: {
        "es-AR": "visita de diagnóstico técnico",
        "pt-BR": "visita de diagnóstico técnico",
      },
    },
    demoMetrics: {
      sampleRating: 4.9,
      sampleReviewCount: 34,
      completedJobsNote: {
        "es-AR": "Muestra ilustrativa de interfaz",
        "pt-BR": "Amostra ilustrativa de interface",
      },
    },
    services: [
      {
        id: "srv-01",
        title: {
          "es-AR": "Limpieza y puesta a punto de calefón o termotanque",
          "pt-BR": "Limpeza e revisão de aquecedor a gás",
        },
        description: {
          "es-AR": "Desarme de quemadores, control de tiraje, termocupla y prueba de estanqueidad.",
          "pt-BR": "Limpeza de queimadores, controle de exaustão, termopar e teste de vedação.",
        },
        referencePriceAmount: 42000,
        currency: "ARS",
        priceUnitLabel: {
          "es-AR": "por artefacto (referencia demo)",
          "pt-BR": "por equipamento (referência demo)",
        },
      },
      {
        id: "srv-02",
        title: {
          "es-AR": "Actualización de tablero eléctrico monofásico",
          "pt-BR": "Atualização de quadro elétrico monofásico",
        },
        description: {
          "es-AR": "Recambio de llaves térmicas, disyuntor diferencial y peinado de cables.",
          "pt-BR": "Substituição de disjuntores, DR diferencial e organização de cabos.",
        },
        referencePriceAmount: 65000,
        currency: "ARS",
        priceUnitLabel: {
          "es-AR": "mano de obra base (sin materiales)",
          "pt-BR": "mão de obra base (sem materiais)",
        },
      },
    ],
    portfolio: [
      {
        id: "port-01",
        title: {
          "es-AR": "Recambio de tablero seccional en PH Palermo",
          "pt-BR": "Modernização de quadro elétrico em Palermo",
        },
        zoneLabel: "Palermo, CABA",
        year: 2026,
        imageUrl:
          "https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&w=800&q=80",
        categoryLabel: { "es-AR": "Electricidad", "pt-BR": "Elétrica" },
      },
      {
        id: "port-02",
        title: {
          "es-AR": "Instalación de calefón tiro balanceado",
          "pt-BR": "Instalação de aquecedor de exaustão forçada",
        },
        zoneLabel: "Belgrano, CABA",
        year: 2026,
        imageUrl:
          "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        categoryLabel: { "es-AR": "Gas", "pt-BR": "Gás" },
      },
    ],
    sampleReviews: [
      {
        id: "rev-01",
        authorName: "Santiago R. (Muestra)",
        authorZone: "Colegiales, CABA",
        dateISO: "2026-09-14",
        rating: 5,
        serviceProvided: {
          "es-AR": "Revisión de estufas de tiro balanceado",
          "pt-BR": "Revisão de aquecedores a gás",
        },
        comment: {
          "es-AR":
            "Comentario de demostración: Muy puntual y prolijo. Explicó el presupuesto antes de empezar y dejó todo funcionando.",
          "pt-BR":
            "Comentário demonstrativo: Muito pontual e organizado. Explicou o orçamento antes de iniciar e deixou tudo funcionando.",
        },
        isDemoSample: true,
      },
      {
        id: "rev-02",
        authorName: "Valeria M. (Muestra)",
        authorZone: "Palermo, CABA",
        dateISO: "2026-08-22",
        rating: 5,
        serviceProvided: {
          "es-AR": "Cambio de disyuntor y térmicas",
          "pt-BR": "Troca de disjuntores no quadro",
        },
        comment: {
          "es-AR":
            "Comentario de demostración: Resolvió un corte intermitente en el departamento y etiquetó cada circuito del tablero.",
          "pt-BR":
            "Comentário demonstrativo: Resolveu uma queda de energia intermitente no apartamento e identificou cada circuito.",
        },
        isDemoSample: true,
      },
    ],
  },
  {
    id: "pro-demo-02",
    slug: "carolina-peralta-arquitectura-pintura",
    isDemoProfile: true,
    fullName: "Carolina Peralta",
    avatarUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80",
    country: "AR",
    city: "Córdoba Capital",
    neighborhood: "Nueva Córdoba",
    coverageZones: ["Nueva Córdoba", "Cerro de las Rosas", "General Paz", "Centro"],
    categorySlug: "construccion",
    primarySpecialty: {
      "es-AR": "Pintura de Interiores, Microcemento y Durlock",
      "pt-BR": "Pintura Residencial, Cimento Queimado e Drywall",
    },
    secondarySpecialties: {
      "es-AR": [
        "Pintura látex y satinado",
        "Cielorrasos y tabiques Durlock",
        "Terminaciones en microcemento",
      ],
      "pt-BR": [
        "Pintura acrílica e acetinada",
        "Forros e divisórias em Drywall",
        "Acabamento em cimento queimado",
      ],
    },
    bio: {
      "es-AR":
        "Perfil demostrativo de Fase 1: Coordinamos equipos de pintura fina, enduido completo y reformas secas sin escombros en Córdoba Capital. Protegemos pisos y mobiliario en cada obra.",
      "pt-BR":
        "Perfil demonstrativo da Fase 1: Coordenamos serviços de pintura fina, massa corrida e reformas a seco em Córdoba. Proteção completa de pisos e móveis em cada projeto.",
    },
    yearsOfExperience: 8,
    languages: ["Español", "Português"],
    hiringModels: ["quote_request", "direct_contact"],
    availabilitySummary: {
      "es-AR": "Presupuestos sin cargo en Córdoba Capital",
      "pt-BR": "Orçamentos sem custo em Córdoba Capital",
    },
    scheduleDays: {
      "es-AR": "Lun a Vie 08:00 a 18:00",
      "pt-BR": "Seg a Sex 08:00 às 18:00",
    },
    referenceStartingPrice: {
      amount: 9500,
      currency: "ARS",
      unitLabel: {
        "es-AR": "por m² de pintura interior (mano de obra ref.)",
        "pt-BR": "por m² de pintura interna (mão de obra ref.)",
      },
    },
    demoMetrics: {
      sampleRating: 4.8,
      sampleReviewCount: 27,
      completedJobsNote: {
        "es-AR": "Muestra ilustrativa de interfaz",
        "pt-BR": "Amostra ilustrativa de interface",
      },
    },
    services: [
      {
        id: "srv-03",
        title: {
          "es-AR": "Pintura integral de departamento 2 ambientes",
          "pt-BR": "Pintura completa de apartamento de 1 dormitório",
        },
        description: {
          "es-AR": "Preparación de superficies, fijador y dos manos de látex lavable primera línea.",
          "pt-BR": "Preparação de paredes, selador e duas demãos de tinta acrílica lavável.",
        },
        referencePriceAmount: 380000,
        currency: "ARS",
        priceUnitLabel: {
          "es-AR": "mano de obra estimada (demo)",
          "pt-BR": "mão de obra estimada (demo)",
        },
      },
      {
        id: "srv-04",
        title: {
          "es-AR": "Tabique divisorio en construcción en seco (Durlock)",
          "pt-BR": "Parede divisória em Drywall com isolamento acústico",
        },
        description: {
          "es-AR": "Estructura de perfiles galvanizados, placas de 12.5mm, lana de vidrio y tomado de juntas.",
          "pt-BR": "Estrutura metálica galvanizada, chapas de 12.5mm, lã de vidro e tratamento de juntas.",
        },
        referencePriceAmount: 32000,
        currency: "ARS",
        priceUnitLabel: {
          "es-AR": "por m² lineal (referencia demo)",
          "pt-BR": "por m² (referência demo)",
        },
      },
    ],
    portfolio: [
      {
        id: "port-03",
        title: {
          "es-AR": "Renovación de estar comedor en Nueva Córdoba",
          "pt-BR": "Renovação de sala de estar em Nueva Córdoba",
        },
        zoneLabel: "Nueva Córdoba",
        year: 2026,
        imageUrl:
          "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
        categoryLabel: { "es-AR": "Pintura y Diseño", "pt-BR": "Pintura e Acabamento" },
      },
    ],
    sampleReviews: [
      {
        id: "rev-03",
        authorName: "Julián T. (Muestra)",
        authorZone: "General Paz, Córdoba",
        dateISO: "2026-09-02",
        rating: 5,
        serviceProvided: {
          "es-AR": "Pintura completa antes de mudanza",
          "pt-BR": "Pintura completa antes da mudança",
        },
        comment: {
          "es-AR":
            "Comentario de demostración: Cumplieron el plazo de 3 días pactado y entregaron el departamento impecable.",
          "pt-BR":
            "Comentário demonstrativo: Cumpriram o prazo de 3 dias combinado e entregaram o apartamento impecável.",
        },
        isDemoSample: true,
      },
    ],
  },
  {
    id: "pro-demo-03",
    slug: "diego-santoro-plomeria-hogar",
    isDemoProfile: true,
    fullName: "Diego Santoro",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80",
    country: "AR",
    city: "GBA Zona Norte",
    neighborhood: "Vicente López",
    coverageZones: ["Vicente López", "Olivos", "Florida", "San Isidro", "Núñez"],
    categorySlug: "hogar",
    primarySpecialty: {
      "es-AR": "Plomería por Termofusión, Bombas Presurizadoras y Sanitarios",
      "pt-BR": "Hidráulica por Termofusão, Pressurizadores e Louças Sanitárias",
    },
    secondarySpecialties: {
      "es-AR": [
        "Instalación de bombas Rowa",
        "Cambio de griferías monocomando",
        "Reparación de pérdidas de agua",
      ],
      "pt-BR": [
        "Instalação de pressurizadores",
        "Troca de torneiras gourmet e monocomando",
        "Reparo de vazamentos hidráulicos",
      ],
    },
    bio: {
      "es-AR":
        "Perfil demostrativo de Fase 1: Más de 15 años solucionando filtraciones, baja presión de agua y remodelación de cocinas y baños en Zona Norte y CABA.",
      "pt-BR":
        "Perfil demonstrativo da Fase 1: Mais de 15 anos solucionando infiltrações, baixa pressão de água e reforma hidráulica de cozinhas e banheiros.",
    },
    yearsOfExperience: 15,
    languages: ["Español"],
    hiringModels: ["direct_contact", "quote_request"],
    availabilitySummary: {
      "es-AR": "Lunes a sábados · Atención en el día según zona",
      "pt-BR": "Segunda a sábado · Atendimento rápido conforme região",
    },
    scheduleDays: {
      "es-AR": "Lun a Sáb 08:00 a 19:30",
      "pt-BR": "Seg a Sáb 08:00 às 19:30",
    },
    referenceStartingPrice: {
      amount: 25000,
      currency: "ARS",
      unitLabel: {
        "es-AR": "visita e inspección hidráulica",
        "pt-BR": "visita e inspeção hidráulica",
      },
    },
    demoMetrics: {
      sampleRating: 4.9,
      sampleReviewCount: 41,
      completedJobsNote: {
        "es-AR": "Muestra ilustrativa de interfaz",
        "pt-BR": "Amostra ilustrativa de interface",
      },
    },
    services: [
      {
        id: "srv-05",
        title: {
          "es-AR": "Colocación de grifería de cocina o baño",
          "pt-BR": "Instalação de torneira ou misturador de cozinha/banheiro",
        },
        description: {
          "es-AR": "Desmontaje de grifería anterior, colocación de flexibles mallados y prueba de presión.",
          "pt-BR": "Retirada da peça antiga, instalação de flexíveis malha de aço e teste de vedação.",
        },
        referencePriceAmount: 34000,
        currency: "ARS",
        priceUnitLabel: {
          "es-AR": "por unidad instalada (demo)",
          "pt-BR": "por unidade instalada (demo)",
        },
      },
    ],
    portfolio: [
      {
        id: "port-04",
        title: {
          "es-AR": "Instalación de bomba presurizadora bajo tanque",
          "pt-BR": "Instalação de bomba pressurizadora residencial",
        },
        zoneLabel: "Olivos, GBA Norte",
        year: 2026,
        imageUrl:
          "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80",
        categoryLabel: { "es-AR": "Plomería", "pt-BR": "Hidráulica" },
      },
    ],
    sampleReviews: [
      {
        id: "rev-04",
        authorName: "Mariana G. (Muestra)",
        authorZone: "Olivos, GBA Norte",
        dateISO: "2026-10-01",
        rating: 5,
        serviceProvided: {
          "es-AR": "Instalación de bomba presurizadora",
          "pt-BR": "Instalação de pressurizador de água",
        },
        comment: {
          "es-AR":
            "Comentario de demostración: Excelente asesoramiento sobre qué modelo comprar para nuestra casa.",
          "pt-BR":
            "Comentário demonstrativo: Excelente orientação sobre qual equipamento escolher para nossa residência.",
        },
        isDemoSample: true,
      },
    ],
  },
  {
    id: "pro-demo-04",
    slug: "rafael-mendes-marcenaria-reparos",
    isDemoProfile: true,
    fullName: "Rafael Mendes",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=1200&q=80",
    country: "BR",
    city: "São Paulo, SP",
    neighborhood: "Pinheiros",
    coverageZones: ["Pinheiros", "Vila Mariana", "Moema", "Perdizes", "Itaim Bibi"],
    categorySlug: "hogar",
    primarySpecialty: {
      "es-AR": "Carpintería a Medida, Restauración y Montaje de Muebles",
      "pt-BR": "Marcenaria Sob Medida, Reparos e Montagem de Móveis",
    },
    secondarySpecialties: {
      "es-AR": [
        "Ajuste de puertas y bisagras",
        "Muebles para home office",
        "Instalación de cerraduras digitales",
      ],
      "pt-BR": [
        "Ajuste de portas e dobradiças",
        "Bancadas para home office",
        "Instalação de fechaduras digitais",
      ],
    },
    bio: {
      "es-AR":
        "Perfil demostrativo de Fase 1: Carpintero y especialista en mantenimiento residencial en São Paulo. Diseño de mobiliario compacto, reparación de herrajes e instalación de cerraduras electrónicas.",
      "pt-BR":
        "Perfil demonstrativo da Fase 1: Marceneiro e especialista em manutenção residencial em São Paulo. Criação de móveis compactos, troca de ferragens e instalação de fechaduras digitais com acabamento limpo.",
    },
    yearsOfExperience: 10,
    languages: ["Português", "Español"],
    hiringModels: ["direct_contact", "quote_request"],
    availabilitySummary: {
      "es-AR": "Lunes a sábados en Zona Oeste y Sur de SP",
      "pt-BR": "Segunda a sábado na Zona Oeste e Sul de SP",
    },
    scheduleDays: {
      "es-AR": "Lun a Vie 08:30 a 18:30 · Sáb 09:00 a 13:00",
      "pt-BR": "Seg a Sex 08:30 às 18:30 · Sáb 09:00 às 13:00",
    },
    referenceStartingPrice: {
      amount: 160,
      currency: "BRL",
      unitLabel: {
        "es-AR": "visita técnica o ajuste inicial",
        "pt-BR": "visita técnica ou reparo inicial",
      },
    },
    demoMetrics: {
      sampleRating: 4.9,
      sampleReviewCount: 29,
      completedJobsNote: {
        "es-AR": "Muestra ilustrativa de interfaz",
        "pt-BR": "Amostra ilustrativa de interface",
      },
    },
    services: [
      {
        id: "srv-06",
        title: {
          "es-AR": "Instalación de cerradura digital en puerta de madera",
          "pt-BR": "Instalação de fechadura digital em porta de madeira",
        },
        description: {
          "es-AR": "Fresado de precisión, nivelación y configuración inicial del dispositivo.",
          "pt-BR": "Furação com gabarito de precisão, alinhamento de batente e configuração.",
        },
        referencePriceAmount: 240,
        currency: "BRL",
        priceUnitLabel: {
          "es-AR": "por cerradura instalada (demo)",
          "pt-BR": "por fechadura instalada (demo)",
        },
      },
      {
        id: "srv-07",
        title: {
          "es-AR": "Regulación de alacenas y cambio de correderas telescópicas",
          "pt-BR": "Regulagem de armários e troca de corrediças telescópicas",
        },
        description: {
          "es-AR": "Recambio de bisagras con cierre suave y alineación de frentes de cocina.",
          "pt-BR": "Substituição de dobradiças com amortecimento e alinhamento de portas.",
        },
        referencePriceAmount: 190,
        currency: "BRL",
        priceUnitLabel: {
          "es-AR": "servicio base (referencia demo)",
          "pt-BR": "serviço base (referência demo)",
        },
      },
    ],
    portfolio: [
      {
        id: "port-05",
        title: {
          "es-AR": "Estación de trabajo en madera natural",
          "pt-BR": "Bancada suspensa para home office em Pinheiros",
        },
        zoneLabel: "Pinheiros, São Paulo",
        year: 2026,
        imageUrl:
          "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
        categoryLabel: { "es-AR": "Carpintería", "pt-BR": "Marcenaria" },
      },
    ],
    sampleReviews: [
      {
        id: "rev-05",
        authorName: "Fernanda L. (Amostra)",
        authorZone: "Vila Mariana, SP",
        dateISO: "2026-09-19",
        rating: 5,
        serviceProvided: {
          "es-AR": "Instalación de cerradura electrónica y ajuste de puertas",
          "pt-BR": "Instalação de fechadura digital e ajuste de portas",
        },
        comment: {
          "es-AR":
            "Comentario de demostración: Trabajo impecable y muy cuidadoso con la limpieza del departamento.",
          "pt-BR":
            "Comentário demonstrativo: Trabalho impecável e muito cuidadoso com a limpeza do apartamento.",
        },
        isDemoSample: true,
      },
    ],
  },
  {
    id: "pro-demo-05",
    slug: "camila-rocha-paisagismo-jardinagem",
    isDemoProfile: true,
    fullName: "Camila Rocha",
    avatarUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1200&q=80",
    country: "BR",
    city: "Curitiba, PR",
    neighborhood: "Batel",
    coverageZones: ["Batel", "Água Verde", "Santa Felicidade", "Centro Cívico", "Ecoville"],
    categorySlug: "jardineria",
    primarySpecialty: {
      "es-AR": "Paisajismo, Jardines Verticales y Mantenimiento Verde",
      "pt-BR": "Paisagismo, Jardins Verticais e Manutenção de Áreas Verdes",
    },
    secondarySpecialties: {
      "es-AR": [
        "Diseño de balcones y terrazas",
        "Poda formativa y fertilización orgánica",
        "Riego automatizado por goteo",
      ],
      "pt-BR": [
        "Projetos para varandas e terraços",
        "Poda formativa e adubação orgânica",
        "Irrigação automatizada por gotejamento",
      ],
    },
    bio: {
      "es-AR":
        "Perfil demostrativo de Fase 1: Técnica en paisajismo y mantenimiento de jardines residenciales y balcones en Curitiba. Selección de especies adaptadas al clima del sur.",
      "pt-BR":
        "Perfil demonstrativo da Fase 1: Técnica em paisagismo e manutenção de jardins residenciais e varandas em Curitiba. Escolha de espécies adaptadas à iluminação e ao clima local.",
    },
    yearsOfExperience: 7,
    languages: ["Português", "Español"],
    hiringModels: ["quote_request", "direct_contact"],
    availabilitySummary: {
      "es-AR": "Visitas programadas de martes a sábado",
      "pt-BR": "Visitas agendadas de terça a sábado",
    },
    scheduleDays: {
      "es-AR": "Mar a Sáb 08:00 a 17:30",
      "pt-BR": "Ter a Sáb 08:00 às 17:30",
    },
    referenceStartingPrice: {
      amount: 180,
      currency: "BRL",
      unitLabel: {
        "es-AR": "mantenimiento de jardín pequeño / balcón",
        "pt-BR": "manutenção de jardim compacto / varanda",
      },
    },
    demoMetrics: {
      sampleRating: 4.9,
      sampleReviewCount: 22,
      completedJobsNote: {
        "es-AR": "Muestra ilustrativa de interfaz",
        "pt-BR": "Amostra ilustrativa de interface",
      },
    },
    services: [
      {
        id: "srv-08",
        title: {
          "es-AR": "Mantenimiento mensual de jardín o terraza verde",
          "pt-BR": "Manutenção mensal de jardim ou varanda gourmet",
        },
        description: {
          "es-AR": "Poda de limpieza, control orgánico de plagas, abonado y revisión de drenajes.",
          "pt-BR": "Poda de limpeza, controle orgânico de pragas, adubação e revisão de vasos.",
        },
        referencePriceAmount: 220,
        currency: "BRL",
        priceUnitLabel: {
          "es-AR": "por jornada de visita (demo)",
          "pt-BR": "por visita técnica (demo)",
        },
      },
    ],
    portfolio: [
      {
        id: "port-06",
        title: {
          "es-AR": "Revitalización de terraza con especies nativas",
          "pt-BR": "Revitalização de varanda com espécies tropicais resistentes",
        },
        zoneLabel: "Água Verde, Curitiba",
        year: 2026,
        imageUrl:
          "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
        categoryLabel: { "es-AR": "Jardinería", "pt-BR": "Jardinagem" },
      },
    ],
    sampleReviews: [
      {
        id: "rev-06",
        authorName: "Henrique B. (Amostra)",
        authorZone: "Batel, Curitiba",
        dateISO: "2026-09-28",
        rating: 5,
        serviceProvided: {
          "es-AR": "Renovación de maceteros en balcón",
          "pt-BR": "Renovação de vasos e paisagismo em varanda",
        },
        comment: {
          "es-AR":
            "Comentario de demostración: Nos recomendó plantas ideales para media sombra y dejó una guía práctica de riego.",
          "pt-BR":
            "Comentário demonstrativo: Recomendou plantas ideais para meia-sombra e deixou um guia prático de rega.",
        },
        isDemoSample: true,
      },
    ],
  },
  {
    id: "pro-demo-06",
    slug: "lucas-pereyra-fletes-mudanzas",
    isDemoProfile: true,
    fullName: "Lucas Pereyra",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=1200&q=80",
    country: "AR",
    city: "Rosario, Santa Fe",
    neighborhood: "Pichincha",
    coverageZones: ["Centro", "Pichincha", "Fisherton", "Echesortu", "Funes"],
    categorySlug: "transporte",
    primarySpecialty: {
      "es-AR": "Mudanzas Residenciales, Fletes y Traslado con Embalaje",
      "pt-BR": "Mudanças Residenciais, Fretes e Transporte com Embalagem",
    },
    secondarySpecialties: {
      "es-AR": [
        "Mudanzas con operarios de carga",
        "Protección con mantas y film stretch",
        "Traslado de muebles y electrodomésticos",
      ],
      "pt-BR": [
        "Mudanças com equipe de carga",
        "Proteção com mantas e plástico filme",
        "Transporte de móveis e eletrodomésticos",
      ],
    },
    bio: {
      "es-AR":
        "Perfil demostrativo de Fase 1: Servicio de fletes y mudanzas organizadas en Rosario y alrededores. Unidades cerradas equipadas con carros de carga, mantas acolchadas y sujeción segura.",
      "pt-BR":
        "Perfil demonstrativo da Fase 1: Serviço de fretes e mudanças organizadas em Rosario e região. Veículos fechados equipados com carrinhos de carga, mantas protetoras e fixação segura.",
    },
    yearsOfExperience: 9,
    languages: ["Español"],
    hiringModels: ["quote_request", "direct_contact"],
    availabilitySummary: {
      "es-AR": "Todos los días con reserva previa",
      "pt-BR": "Todos os dias mediante agendamento",
    },
    scheduleDays: {
      "es-AR": "Lun a Dom 07:30 a 20:00",
      "pt-BR": "Seg a Dom 07:30 às 20:00",
    },
    referenceStartingPrice: {
      amount: 32000,
      currency: "ARS",
      unitLabel: {
        "es-AR": "por hora de flete urbano (mín. 2 hs)",
        "pt-BR": "por hora de frete urbano (mín. 2h)",
      },
    },
    demoMetrics: {
      sampleRating: 4.8,
      sampleReviewCount: 31,
      completedJobsNote: {
        "es-AR": "Muestra ilustrativa de interfaz",
        "pt-BR": "Amostra ilustrativa de interface",
      },
    },
    services: [
      {
        id: "srv-09",
        title: {
          "es-AR": "Miniflete urbano para muebles o electrodomésticos",
          "pt-BR": "Frete rápido para móveis ou eletrodomésticos",
        },
        description: {
          "es-AR": "Traslado punto a punto dentro del radio urbano con ayuda de carga en planta baja.",
          "pt-BR": "Transporte ponto a ponto dentro do perímetro urbano com auxílio no carregamento.",
        },
        referencePriceAmount: 36000,
        currency: "ARS",
        priceUnitLabel: {
          "es-AR": "tarifa base de referencia (demo)",
          "pt-BR": "tarifa base de referência (demo)",
        },
      },
    ],
    portfolio: [
      {
        id: "port-07",
        title: {
          "es-AR": "Embalaje y mudanza familiar a Funes",
          "pt-BR": "Embalagem e mudança residencial completa",
        },
        zoneLabel: "Rosario / Funes",
        year: 2026,
        imageUrl:
          "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=800&q=80",
        categoryLabel: { "es-AR": "Transporte", "pt-BR": "Transporte" },
      },
    ],
    sampleReviews: [
      {
        id: "rev-07",
        authorName: "Federico N. (Muestra)",
        authorZone: "Centro, Rosario",
        dateISO: "2026-10-08",
        rating: 5,
        serviceProvided: {
          "es-AR": "Mudanza de departamento con subida por escalera",
          "pt-BR": "Mudança de apartamento",
        },
        comment: {
          "es-AR":
            "Comentario de demostración: Cuidaron la heladera y el sillón con mantas y llegaron a la hora exacta.",
          "pt-BR":
            "Comentário demonstrativo: Protegeram a geladeira e o sofá com mantas e chegaram no horário exato.",
        },
        isDemoSample: true,
      },
    ],
  },
];

export type { ProfessionalFilterParams };

export function filterProfessionals(
  params: ProfessionalFilterParams
): ProfessionalProfile[] {
  const normalizedQuery = (params.query ?? "").trim().toLowerCase();

  const filtered = DEMO_PROFESSIONALS.filter((pro) => {
    if (
      params.categorySlug &&
      params.categorySlug !== "all" &&
      pro.categorySlug !== params.categorySlug
    ) {
      return false;
    }

    if (params.country && params.country !== "ALL" && pro.country !== params.country) {
      return false;
    }

    if (params.city && params.city !== "all") {
      const cityLower = params.city.toLowerCase();
      const matchesCity =
        pro.city.toLowerCase().includes(cityLower) ||
        pro.neighborhood.toLowerCase().includes(cityLower) ||
        pro.coverageZones.some((z) => z.toLowerCase().includes(cityLower));
      if (!matchesCity) {
        return false;
      }
    }

    if (normalizedQuery.length > 0) {
      const searchableFields = [
        pro.fullName,
        pro.city,
        pro.neighborhood,
        pro.primarySpecialty["es-AR"],
        pro.primarySpecialty["pt-BR"],
        ...pro.secondarySpecialties["es-AR"],
        ...pro.secondarySpecialties["pt-BR"],
        ...pro.coverageZones,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableFields.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });

  if (params.sortBy === "rating") {
    return [...filtered].sort(
      (a, b) => b.demoMetrics.sampleRating - a.demoMetrics.sampleRating
    );
  }

  if (params.sortBy === "experience") {
    return [...filtered].sort(
      (a, b) => b.yearsOfExperience - a.yearsOfExperience
    );
  }

  return filtered;
}

export function getProfessionalBySlug(
  slug: string
): ProfessionalProfile | undefined {
  return DEMO_PROFESSIONALS.find((pro) => pro.slug === slug);
}

export function getProfessionalsByCategory(
  categorySlug: CategorySlug
): ProfessionalProfile[] {
  return DEMO_PROFESSIONALS.filter((pro) => pro.categorySlug === categorySlug);
}
