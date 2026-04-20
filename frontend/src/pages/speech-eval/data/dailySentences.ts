export interface WordAnalysis {
  word: string
  pos: string          // 词性，如 "tr." / "intr." / "adj." / "adv."
  definition: string   // 中文释义
  example: string      // 西班牙语例句
  example_translation: string
}

export interface DailySentence {
  date: string
  sentence_original: string
  sentence_translation: string
  analysis?: WordAnalysis[]
}

export const dailySentences: DailySentence[] = [
  {
    date: '01.abr',
    sentence_original: '¿Puedes confirmar si el equipo ya llegó al sitio?',
    sentence_translation: '你能确认设备是否已经到现场了吗？',
    analysis: [
      {
        word: 'confirmar',
        pos: 'tr.',
        definition: '确认，证实',
        example: 'Por favor, confirma tu asistencia antes del lunes.',
        example_translation: '请在周一前确认您的出席情况。',
      },
      {
        word: 'equipo',
        pos: 'm.',
        definition: '设备；团队',
        example: 'El equipo llegó en perfectas condiciones.',
        example_translation: '设备完好无损地抵达了。',
      },
    ],
  },
  {
    date: '02.abr',
    sentence_original: 'Todavía estamos esperando la aprobación del cliente.',
    sentence_translation: '我们还在等待客户的批准。',
    analysis: [
      {
        word: 'aprobación',
        pos: 'f.',
        definition: '批准，认可',
        example: 'Necesitamos la aprobación del director para proceder.',
        example_translation: '我们需要主任的批准才能继续。',
      },
    ],
  },
  {
    date: '03.abr',
    sentence_original: 'Hay que revisar este punto antes de continuar.',
    sentence_translation: '这个问题需要在继续之前检查一下。',
    analysis: [
      {
        word: 'revisar',
        pos: 'tr.',
        definition: '检查，审查，复核',
        example: 'Hay que revisar el contrato antes de firmarlo.',
        example_translation: '合同签署前需要仔细审查。',
      },
    ],
  },
  {
    date: '04.abr',
    sentence_original: 'El cronograma se ha retrasado por problemas logísticos.',
    sentence_translation: '由于物流问题，进度已经延误。',
    analysis: [
      {
        word: 'cronograma',
        pos: 'm.',
        definition: '进度表，时间表',
        example: 'El cronograma del proyecto fue aprobado ayer.',
        example_translation: '项目进度表昨天已获批准。',
      },
      {
        word: 'retrasar',
        pos: 'tr.',
        definition: '推迟，延误',
        example: 'La lluvia retrasó la entrega de materiales.',
        example_translation: '雨水延误了材料的交付。',
      },
    ],
  },
  {
    date: '05.abr',
    sentence_original: '¿Quién se encarga de esta parte del proyecto?',
    sentence_translation: '这部分项目由谁负责？',
    analysis: [
      {
        word: 'encargarse',
        pos: 'prnl.',
        definition: '负责，承担',
        example: 'Me encargo de coordinar con los proveedores.',
        example_translation: '我负责与供应商协调。',
      },
    ],
  },
  {
    date: '06.abr',
    sentence_original: 'Necesitamos actualizar los datos lo antes posible.',
    sentence_translation: '我们需要尽快更新数据。',
    analysis: [
      {
        word: 'actualizar',
        pos: 'tr.',
        definition: '更新，升级',
        example: 'Actualiza el sistema antes de la reunión.',
        example_translation: '会议前请更新系统。',
      },
    ],
  },
  {
    date: '07.abr',
    sentence_original: 'Esto no coincide con el diseño original.',
    sentence_translation: '这与原始设计不一致。',
    analysis: [
      {
        word: 'coincidir',
        pos: 'intr.',
        definition: '一致，吻合，符合',
        example: 'Los resultados no coinciden con las expectativas.',
        example_translation: '结果与预期不符。',
      },
    ],
  },
  {
    date: '08.abr',
    sentence_original: 'Vamos a coordinar una reunión con el equipo local.',
    sentence_translation: '我们来和当地团队协调一次会议。',
    analysis: [
      {
        word: 'coordinar',
        pos: 'tr.',
        definition: '协调，统筹',
        example: 'Es importante coordinar bien los horarios.',
        example_translation: '合理协调时间安排非常重要。',
      },
    ],
  },
  {
    date: '09.abr',
    sentence_original: 'El proveedor aún no ha entregado los materiales.',
    sentence_translation: '供应商还没有交付材料。',
    analysis: [
      {
        word: 'proveedor',
        pos: 'm.',
        definition: '供应商，供货商',
        example: 'Buscamos un nuevo proveedor de componentes.',
        example_translation: '我们正在寻找新的零部件供应商。',
      },
    ],
  },
  {
    date: '10.abr',
    sentence_original: 'Hay un problema con la conexión eléctrica.',
    sentence_translation: '电力连接出现了问题。',
    analysis: [
      {
        word: 'conexión',
        pos: 'f.',
        definition: '连接，接线',
        example: 'La conexión a Internet es inestable.',
        example_translation: '网络连接不稳定。',
      },
    ],
  },
  {
    date: '11.abr',
    sentence_original: 'Por favor, envíame el informe actualizado.',
    sentence_translation: '请把更新后的报告发给我。',
    analysis: [
      {
        word: 'informe',
        pos: 'm.',
        definition: '报告，报表',
        example: 'El informe final estará listo mañana.',
        example_translation: '最终报告明天就绪。',
      },
    ],
  },
  {
    date: '12.abr',
    sentence_original: 'Este cambio requiere la aprobación del supervisor.',
    sentence_translation: '这个变更需要主管批准。',
    analysis: [
      {
        word: 'supervisor',
        pos: 'm.',
        definition: '主管，监督员',
        example: 'El supervisor revisó el informe antes de enviarlo.',
        example_translation: '主管在发送前审阅了报告。',
      },
    ],
  },
  {
    date: '13.abr',
    sentence_original: 'La instalación ya está en su fase final.',
    sentence_translation: '安装已经进入最后阶段。',
    analysis: [
      {
        word: 'instalación',
        pos: 'f.',
        definition: '安装，装置',
        example: 'La instalación del equipo tomó tres días.',
        example_translation: '设备安装花了三天时间。',
      },
    ],
  },
  {
    date: '14.abr',
    sentence_original: '¿Puedes verificar estos datos otra vez?',
    sentence_translation: '你能再核对一下这些数据吗？',
    analysis: [
      {
        word: 'verificar',
        pos: 'tr.',
        definition: '核实，核对，验证',
        example: 'Verifica los datos antes de enviar el formulario.',
        example_translation: '提交表单前请核实数据。',
      },
    ],
  },
  {
    date: '15.abr',
    sentence_original: 'El equipo técnico llegará mañana por la mañana.',
    sentence_translation: '技术团队明天上午到达。',
    analysis: [
      {
        word: 'técnico',
        pos: 'adj.',
        definition: '技术的，专业的',
        example: 'Necesitamos apoyo técnico urgente.',
        example_translation: '我们需要紧急的技术支持。',
      },
    ],
  },
  {
    date: '16.abr',
    sentence_original: 'Hay que ajustar el plan según la situación actual.',
    sentence_translation: '需要根据当前情况调整计划。',
    analysis: [
      {
        word: 'ajustar',
        pos: 'tr.',
        definition: '调整，校准',
        example: 'Ajustamos el presupuesto según las nuevas condiciones.',
        example_translation: '我们根据新情况调整了预算。',
      },
    ],
  },
  {
    date: '17.abr',
    sentence_original: 'El cliente ha solicitado algunos cambios adicionales.',
    sentence_translation: '客户提出了一些额外的修改要求。',
    analysis: [
      {
        word: 'solicitar',
        pos: 'tr.',
        definition: '请求，申请，要求',
        example: 'Solicité más información al respecto.',
        example_translation: '我就此事请求了更多信息。',
      },
      {
        word: 'adicional',
        pos: 'adj.',
        definition: '额外的，附加的',
        example: 'Se requiere un costo adicional para este servicio.',
        example_translation: '此项服务需要额外费用。',
      },
    ],
  },
  {
    date: '18.abr',
    sentence_original: 'Necesitamos más tiempo para completar esta tarea.',
    sentence_translation: '我们需要更多时间来完成这项任务。',
    analysis: [
      {
        word: 'completar',
        pos: 'tr.',
        definition: '完成，补全',
        example: 'Completamos la instalación sin problemas.',
        example_translation: '我们顺利完成了安装工作。',
      },
    ],
  },
  {
    date: '19.abr',
    sentence_original: 'Esto ya fue discutido en la reunión anterior.',
    sentence_translation: '这个问题在上一次会议中已经讨论过了。',
    analysis: [
      {
        word: 'discutir',
        pos: 'tr.',
        definition: '讨论，商议',
        example: 'Discutimos el tema durante dos horas.',
        example_translation: '我们就该议题讨论了两个小时。',
      },
    ],
  },
  {
    date: '20.abr',
    sentence_original: 'El progreso del proyecto es satisfactorio hasta ahora.',
    sentence_translation: '到目前为止，项目进展令人满意。',
    analysis: [
      {
        word: 'progreso',
        pos: 'm.',
        definition: '进展，进步',
        example: 'El progreso de las obras va según lo previsto.',
        example_translation: '工程进展符合预期。',
      },
      {
        word: 'satisfactorio',
        pos: 'adj.',
        definition: '令人满意的，满足的',
        example: 'Los resultados fueron muy satisfactorios.',
        example_translation: '结果非常令人满意。',
      },
    ],
  },
  {
    date: '21.abr',
    sentence_original: 'Por favor, mantennos informados sobre cualquier novedad.',
    sentence_translation: '如有任何新情况，请及时通知我们。',
    analysis: [
      {
        word: 'novedad',
        pos: 'f.',
        definition: '新情况，新消息，变化',
        example: 'Avísame si hay alguna novedad.',
        example_translation: '如有任何新动态，请告诉我。',
      },
    ],
  },
  {
    date: '22.abr',
    sentence_original: 'Vamos a priorizar las tareas más urgentes.',
    sentence_translation: '我们优先处理最紧急的任务。',
    analysis: [
      {
        word: 'priorizar',
        pos: 'tr.',
        definition: '优先处理，排列优先级',
        example: 'Hay que priorizar la seguridad del personal.',
        example_translation: '必须优先保障人员安全。',
      },
    ],
  },
  {
    date: '23.abr',
    sentence_original: 'El sistema aún no está completamente operativo.',
    sentence_translation: '系统尚未完全投入运行。',
    analysis: [
      {
        word: 'operativo',
        pos: 'adj.',
        definition: '运行的，可操作的，投入使用的',
        example: 'La nueva planta ya está operativa.',
        example_translation: '新工厂已经投入运行。',
      },
    ],
  },
  {
    date: '24.abr',
    sentence_original: 'Hay que mejorar la comunicación entre los equipos.',
    sentence_translation: '需要加强团队之间的沟通。',
    analysis: [
      {
        word: 'comunicación',
        pos: 'f.',
        definition: '沟通，交流，通讯',
        example: 'Una buena comunicación evita muchos malentendidos.',
        example_translation: '良好的沟通可以避免很多误解。',
      },
    ],
  },
  {
    date: '25.abr',
    sentence_original: 'Esto puede afectar el plazo de entrega.',
    sentence_translation: '这可能会影响交付期限。',
    analysis: [
      {
        word: 'afectar',
        pos: 'tr.',
        definition: '影响，波及',
        example: 'El retraso afectó a toda la cadena de suministro.',
        example_translation: '延误影响了整个供应链。',
      },
      {
        word: 'plazo',
        pos: 'm.',
        definition: '期限，截止日期',
        example: 'El plazo de entrega es el próximo viernes.',
        example_translation: '交货期限是下周五。',
      },
    ],
  },
  {
    date: '26.abr',
    sentence_original: 'Estamos trabajando en una solución alternativa.',
    sentence_translation: '我们正在制定一个替代方案。',
    analysis: [
      {
        word: 'solución',
        pos: 'f.',
        definition: '解决方案，办法',
        example: 'Encontramos una solución rápida al problema.',
        example_translation: '我们找到了一个快速解决问题的方案。',
      },
      {
        word: 'alternativo',
        pos: 'adj.',
        definition: '替代的，备选的',
        example: 'Buscamos una ruta alternativa.',
        example_translation: '我们寻找了一条替代路线。',
      },
    ],
  },
  {
    date: '27.abr',
    sentence_original: 'El informe será entregado antes del viernes.',
    sentence_translation: '报告将在周五之前提交。',
    analysis: [
      {
        word: 'entregar',
        pos: 'tr.',
        definition: '提交，交付，递交',
        example: 'Entrega el formulario antes de las cinco.',
        example_translation: '请在五点前递交表格。',
      },
    ],
  },
  {
    date: '28.abr',
    sentence_original: 'Por favor, confirma la recepción de este mensaje.',
    sentence_translation: '请确认收到此信息。',
    analysis: [
      {
        word: 'recepción',
        pos: 'f.',
        definition: '接收，收到；前台',
        example: 'Confirma la recepción del paquete.',
        example_translation: '请确认收到包裹。',
      },
    ],
  },
  {
    date: '29.abr',
    sentence_original: 'Vamos a revisar los detalles técnicos más tarde.',
    sentence_translation: '我们稍后再审查技术细节。',
    analysis: [
      {
        word: 'detalle',
        pos: 'm.',
        definition: '细节，详情',
        example: 'Presta atención a los detalles del contrato.',
        example_translation: '注意合同的细节。',
      },
    ],
  },
  {
    date: '30.abr',
    sentence_original: 'El proyecto entra en una etapa crítica.',
    sentence_translation: '项目进入关键阶段。',
    analysis: [
      {
        word: 'etapa',
        pos: 'f.',
        definition: '阶段，阶段性',
        example: 'Estamos en la etapa de pruebas.',
        example_translation: '我们正处于测试阶段。',
      },
      {
        word: 'crítico',
        pos: 'adj.',
        definition: '关键的，决定性的',
        example: 'Este momento es crítico para el proyecto.',
        example_translation: '这个时刻对项目至关重要。',
      },
    ],
  },
  {
    date: '31.abr',
    sentence_original: 'Hemos superado todos los obstáculos del mes.',
    sentence_translation: '我们克服了这个月的所有困难。',
    analysis: [
      {
        word: 'superar',
        pos: 'tr.',
        definition: '克服，超越，战胜',
        example: 'Superamos las dificultades gracias al trabajo en equipo.',
        example_translation: '凭借团队协作，我们克服了重重困难。',
      },
      {
        word: 'obstáculo',
        pos: 'm.',
        definition: '障碍，困难',
        example: 'No hay obstáculo que no se pueda superar.',
        example_translation: '没有克服不了的障碍。',
      },
    ],
  },
]
