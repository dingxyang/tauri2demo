export interface ScenarioRole {
  name: string;
  title: string;
  personality: string;
  language: 'es' | 'zh';
}

export interface DialogueTurn {
  role: 'user' | 'assistant';
  content: string;
  note?: string;
}

export interface Scenario {
  id: string;
  title: string;
  titleEs: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  setting: string;
  situation: string;
  userRole: ScenarioRole;
  aiRole: ScenarioRole;
  openingMessage: string;
  referenceDialogue: DialogueTurn[];
}

const difficultyLabels: Record<Scenario['difficulty'], string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
};

export { difficultyLabels };

export const scenarioCategories = ['能源', '建筑', '物流', '日常'];

export const scenarios: Scenario[] = [
  {
    id: 'solar-inverter-emergency',
    title: '逆变器紧急故障',
    titleEs: 'Emergencia del inversor solar',
    description:
      '智利光伏电站夜间逆变器突发停机，你需协助本地技术员向中方负责人请示授权切换备用设备。',
    difficulty: 'intermediate',
    category: '能源',
    setting: '晚上 11:45，智利光伏电站中控室旁休息区',
    situation:
      '第三排太阳能逆变器突然停机，显示"MPPT-2 模块过热"报警，但风扇正常、气温仅 12°C。如不尽快切换备用逆变器，电池组将在凌晨 2 点前耗光，导致 Toconao 社区水泵系统断电。其他技术员联系不上，Carlos 需要你立刻向王总请示授权切换。',
    userRole: {
      name: '李明',
      title: '中方企业驻智利光伏电站翻译',
      personality: '冷静、有条理、双语能力',
      language: 'zh',
    },
    aiRole: {
      name: 'Carlos Gutiérrez',
      title: '智利本地夜班技术员',
      personality: '急躁、经验丰富、说话快、压力大时会催促',
      language: 'es',
    },
    openingMessage:
      'Li Ming, por favor, ayúdame. El inversor de la fila 3 se paró. La pantalla dice "sobrecalentamiento en módulo MPPT-2", pero los ventiladores funcionan bien y afuera hace solo 12 grados. Si no cambiamos al inversor de respaldo antes de las 2 a. m., las baterías se descargan y mañana la comunidad de Toconao se queda sin agua. Los demás técnicos no contestan. Necesito que le digas a Wang Zong que autorice el cambio ahora.',
    referenceDialogue: [
      {
        role: 'assistant',
        content:
          'Li Ming, por favor, ayúdame. El inversor de la fila 3 se paró. La pantalla dice "sobrecalentamiento en módulo MPPT-2", pero los ventiladores funcionan bien y afuera hace solo 12 grados. Si no cambiamos al inversor de respaldo antes de las 2 a. m., las baterías se descargan y mañana la comunidad de Toconao se queda sin agua. Los demás técnicos no contestan. Necesito que le digas a Wang Zong que autorice el cambio ahora.',
        note: 'AI 开场，描述紧急情况',
      },
      {
        role: 'user',
        content: 'Tranquilo, Carlos. ¿A qué hora exactamente se paró?',
        note: '确认细节，安抚对方',
      },
      {
        role: 'assistant',
        content: 'Hace unos diez minutos. No tengo tiempo para tranquilizarme.',
      },
      {
        role: 'user',
        content: 'Está bien. ¿Ya probaste a reiniciarlo?',
        note: '询问已尝试的操作',
      },
      {
        role: 'assistant',
        content: 'Sí, dos veces. No funciona. El error sigue saliendo.',
      },
      {
        role: 'user',
        content: 'Entiendo. ¿El inversor de respaldo está listo para usar?',
        note: '确认备用方案',
      },
      {
        role: 'assistant',
        content: 'Sí, solo necesita autorización. Pero Wang Zong tiene que decidir ya.',
      },
      {
        role: 'user',
        content: '¿Cuánto tardaría el cambio?',
        note: '评估时间',
      },
      {
        role: 'assistant',
        content: 'Cinco minutos. Pero tengo que preparar unas herramientas primero.',
      },
      {
        role: 'user',
        content: 'Voy a hablar con Wang Zong ahora. ¿Algo más que deba decirle?',
        note: '承诺行动，收集信息',
      },
      {
        role: 'assistant',
        content: 'Dile que esto ya pasó dos veces el mes pasado. Con el mismo modelo.',
      },
      {
        role: 'user',
        content: '¿Problema de fábrica?',
        note: '追问根因',
      },
      {
        role: 'assistant',
        content: 'Eso creo. Pero ahora solo importa cambiar al respaldo.',
      },
      {
        role: 'user',
        content: 'De acuerdo. En tres minutos vuelvo con su respuesta.',
        note: '给出明确时间承诺',
      },
      {
        role: 'assistant',
        content: 'Gracias, Li Ming. Por favor, corre.',
      },
    ],
  },
  {
    id: 'construction-material-delivery',
    title: '建材延迟到货交涉',
    titleEs: 'Negociación por retraso en materiales de construcción',
    description:
      '圣地亚哥建筑工地建材延迟到货，你需协助中方项目经理与智利供应商沟通加急发货。',
    difficulty: 'intermediate',
    category: '建筑',
    setting: '工作日上午 10:00，圣地亚哥建筑工地临时办公室',
    situation:
      '项目关键阶段的水泥和钢筋比约定日期晚了 5 天，智利供应商说物流出了问题。中方项目经理张工要求你联系供应商代表 Pedro，确认最快发货时间并争取加急处理。延误可能导致工期罚款。',
    userRole: {
      name: '李明',
      title: '中方建筑项目翻译',
      personality: '耐心、善于斡旋、注意措辞',
      language: 'zh',
    },
    aiRole: {
      name: 'Pedro Morales',
      title: '智利建材供应商客户经理',
      personality: '礼貌但推脱、强调不可抗力、不愿承担责任',
      language: 'es',
    },
    openingMessage:
      'Buenos días. Entiendo su preocupación por el retraso. Lamentablemente, hubo un problema con el transporte que estaba fuera de nuestro control. Estamos haciendo todo lo posible para acelerar la entrega.',
    referenceDialogue: [
      {
        role: 'assistant',
        content:
          'Buenos días. Entiendo su preocupación por el retraso. Lamentablemente, hubo un problema con el transporte que estaba fuera de nuestro control. Estamos haciendo todo lo posible para acelerar la entrega.',
        note: '供应商先发制人，推卸责任',
      },
      {
        role: 'user',
        content: 'Buenos días, Pedro. Agradezco su respuesta rápida. Pero necesitamos fechas concretas, no promesas generales.',
        note: '礼貌施压，要求具体信息',
      },
      {
        role: 'assistant',
        content: 'Comprendo. Según nuestra información, el cargamento podría llegar el jueves.',
      },
      {
        role: 'user',
        content: '¿Podría ser antes? El jueves sería una semana de retraso.',
        note: '要求加急',
      },
      {
        role: 'assistant',
        content: 'Haré una gestión especial. Puedo intentar para el martes, pero tiene un costo adicional.',
      },
      {
        role: 'user',
        content: '¿Cuánto sería el costo adicional? Necesito informar a mi jefe.',
        note: '收集具体数据汇报',
      },
      {
        role: 'assistant',
        content: 'Un quince por ciento sobre el precio original. Es lo mínimo que puedo ofrecer.',
      },
      {
        role: 'user',
        content: '¿Y si dividimos el costo adicional? Después de todo, el retraso no fue culpa nuestra.',
        note: '协商分摊',
      },
      {
        role: 'assistant',
        content: 'Mire, puedo hablar con mi gerente. Tal vez podemos cubrir la mitad. Pero necesito su confirmación hoy.',
      },
      {
        role: 'user',
        content: 'De acuerdo. Voy a consultar con mi jefe ahora mismo y le confirmo en una hora.',
        note: '承诺回复时间',
      },
      {
        role: 'assistant',
        content: 'Perfecto. Le espero. Y disculpe de nuevo por los inconvenientes.',
      },
    ],
  },
  {
    id: 'warehouse-inventory-dispute',
    title: '仓库库存差异核对',
    titleEs: 'Revisión de discrepancia en inventario',
    description:
      '瓦尔帕莱索港口仓库实物库存与系统记录不一致，你需协助中方物流经理与智利仓库主管核实差异原因。',
    difficulty: 'advanced',
    category: '物流',
    setting: '工作日下午 3:00，瓦尔帕莱索港口仓库办公室',
    situation:
      '月度盘点发现 200 箱电子配件在系统中显示已入库但实物不在仓库。中方物流经理赵总怀疑入库记录有误或货物被错放。你需要与仓库主管 Sofía 核对出入库记录，找出差异原因。',
    userRole: {
      name: '李明',
      title: '中方物流公司翻译',
      personality: '细致、注重数据、不放过细节',
      language: 'zh',
    },
    aiRole: {
      name: 'Sofía Contreras',
      title: '智利仓库主管',
      personality: '专业、严谨、对系统很熟悉、有时会表现出防御性',
      language: 'es',
    },
    openingMessage:
      'Ya revisé los registros del sistema. Las doscientas cajas fueron registradas el lunes pasado según el documento de recepción. Si no están en la ubicación asignada, puede que las hayan movido durante el reetiquetado del martes.',
    referenceDialogue: [
      {
        role: 'assistant',
        content:
          'Ya revisé los registros del sistema. Las doscientas cajas fueron registradas el lunes pasado según el documento de recepción. Si no están en la ubicación asignada, puede que las hayan movido durante el reetiquetado del martes.',
        note: '给出系统记录，提出假设',
      },
      {
        role: 'user',
        content: '¿Tiene el documento de recepción firmado? Necesitamos verificar que la mercancía llegó físicamente.',
        note: '要求看实物凭证',
      },
      {
        role: 'assistant',
        content: 'Sí, está firmado por el supervisor de turno. Pero reconozco que no se hizo una verificación física completa ese día.',
      },
      {
        role: 'user',
        content: 'Eso es precisamente lo que necesitamos aclarar. ¿Se puede revisar las cámaras de la zona de recepción del lunes?',
        note: '提议查监控',
      },
      {
        role: 'assistant',
        content: 'Las cámaras de esa zona se desconectaron por una falla eléctrica el lunes en la tarde. Solo tenemos registro hasta las tres de la tarde.',
      },
      {
        role: 'user',
        content: '¿Y el reetiquetado del martes? ¿Quién autorizó el traslado y a qué ubicación fueron?',
        note: '追踪搬运记录',
      },
      {
        role: 'assistant',
        content: 'Fue autorizado por mi asistente, pero él ya no está en turno. Las trasladaron al pasillo C, pero ahí no están ahora.',
      },
      {
        role: 'user',
        content: '¿Puede verificar si hubo alguna salida registrada desde el pasillo C entre el martes y hoy?',
        note: '查出货记录',
      },
      {
        role: 'assistant',
        content: 'Déjeme revisar... Sí, hay una orden de salida el miércoles a nombre de otra empresa. Parece un error de etiquetado.',
      },
      {
        role: 'user',
        content: 'Entonces las cajas probablemente se entregaron por error. Necesitamos contactar a esa empresa inmediatamente.',
        note: '确认原因，采取行动',
      },
      {
        role: 'assistant',
        content: 'Tiene razón. Voy a buscar el número de contacto de la empresa receptora ahora mismo.',
      },
    ],
  },
  {
    id: 'hotel-checkin-issue',
    title: '酒店入住问题',
    titleEs: 'Problema con el check-in del hotel',
    description:
      '中方代表团抵达智利酒店后发现预订信息有误，你需协助与前台沟通解决入住问题。',
    difficulty: 'beginner',
    category: '日常',
    setting: '晚上 9:00，圣地亚哥市中心酒店大堂',
    situation:
      '中方代表团一行 5 人抵达酒店，但前台只找到 3 间房的预订，实际应该是 5 间。代表团团长很疲惫，希望尽快解决。你需要与前台接待员沟通，确认预订信息并安排额外房间。',
    userRole: {
      name: '李明',
      title: '中方代表团翻译',
      personality: '礼貌、耐心、善于沟通',
      language: 'zh',
    },
    aiRole: {
      name: 'María Fernández',
      title: '酒店前台接待员',
      personality: '友好、愿意帮忙、但需要按流程办事',
      language: 'es',
    },
    openingMessage:
      'Buenas noches. Tengo una reserva a nombre del señor Wang, pero solo aparecen tres habitaciones. ¿Puede confirmarme los detalles de la reserva, por favor?',
    referenceDialogue: [
      {
        role: 'assistant',
        content:
          'Buenas noches. Tengo una reserva a nombre del señor Wang, pero solo aparecen tres habitaciones. ¿Puede confirmarme los detalles de la reserva, por favor?',
        note: '前台主动提出问题',
      },
      {
        role: 'user',
        content: 'Sí, la reserva es para cinco habitaciones, no tres. Tenemos la confirmación por correo electrónico.',
        note: '纠正信息，提供证据',
      },
      {
        role: 'assistant',
        content: '¿Puede mostrarme el correo de confirmación? Así puedo buscar en el sistema.',
      },
      {
        role: 'user',
        content: 'Claro, aquí está. El número de confirmación es CN-20250422-WANG.',
        note: '提供预订号',
      },
      {
        role: 'assistant',
        content: 'Lo tengo. Efectivamente, la reserva original era para cinco habitaciones. Parece que hubo un error al ingresar los datos en nuestro sistema.',
      },
      {
        role: 'user',
        content: '¿Puede arreglarlo ahora? Estamos muy cansados del viaje.',
        note: '表达紧迫性',
      },
      {
        role: 'assistant',
        content: 'Por supuesto. Voy a asignar las dos habitaciones adicionales ahora mismo. ¿Prefieren habitaciones individuales o dobles?',
      },
      {
        role: 'user',
        content: 'Dos individuales, por favor. ¿Están en el mismo piso que las otras tres?',
        note: '确认安排',
      },
      {
        role: 'assistant',
        content: 'Sí, tengo dos disponibles en el cuarto piso, al lado de las otras. Aquí tienen las tarjetas. ¿Necesitan ayuda con el equipaje?',
      },
      {
        role: 'user',
        content: 'Sí, por favor. Y gracias por resolverlo tan rápido.',
        note: '感谢并接受帮助',
      },
      {
        role: 'assistant',
        content: 'De nada. Que tengan una buena noche y bienvenidos a Chile.',
      },
    ],
  },
];
