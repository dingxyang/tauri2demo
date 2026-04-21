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
  // ─── 2025年11月 ───
  {
    date: '01.nov',
    sentence_original: '¿En qué estado se encuentra esta tarea?',
    sentence_translation: '这项任务目前处于什么状态？',
    analysis: [
      { word: 'estado', pos: 'm.', definition: '状态，状况', example: 'El sistema está en buen estado de funcionamiento.', example_translation: '系统运行状态良好。' },
      { word: 'encontrarse', pos: 'prnl.', definition: '处于，位于，处在', example: 'La obra se encuentra en la fase de cimentación.', example_translation: '工程目前处于基础施工阶段。' },
    ],
  },
  {
    date: '02.nov',
    sentence_original: 'Estamos revisando la documentación técnica.',
    sentence_translation: '我们正在审核技术文件。',
    analysis: [
      { word: 'documentación', pos: 'f.', definition: '文件，文档，资料', example: 'Prepara la documentación antes de la auditoría.', example_translation: '审计前请准备好相关文件。' },
      { word: 'revisar', pos: 'tr.', definition: '审核，检查，复查', example: 'Revisamos los planos antes de iniciar la obra.', example_translation: '施工开始前我们审核了图纸。' },
    ],
  },
  {
    date: '03.nov',
    sentence_original: 'Hace falta confirmar los recursos disponibles.',
    sentence_translation: '需要确认可用资源。',
    analysis: [
      { word: 'recurso', pos: 'm.', definition: '资源，资产；手段', example: 'Los recursos humanos son escasos en esta fase.', example_translation: '这一阶段人力资源较为紧缺。' },
      { word: 'disponible', pos: 'adj.', definition: '可用的，可获取的，空闲的', example: '¿Tienes personal disponible para esta semana?', example_translation: '本周你有可调配的人员吗？' },
    ],
  },
  {
    date: '04.nov',
    sentence_original: 'El transporte se ha visto afectado.',
    sentence_translation: '运输受到了影响。',
    analysis: [
      { word: 'transporte', pos: 'm.', definition: '运输，运送，交通', example: 'El transporte de materiales se coordina con el proveedor.', example_translation: '材料运输与供应商协调进行。' },
      { word: 'afectar', pos: 'tr.', definition: '影响，波及，损害', example: 'Las lluvias afectaron el cronograma de entrega.', example_translation: '降雨影响了交付进度表。' },
    ],
  },
  {
    date: '05.nov',
    sentence_original: '¿Quién supervisa este proceso?',
    sentence_translation: '这个流程由谁监督？',
    analysis: [
      { word: 'supervisar', pos: 'tr.', definition: '监督，监管，督导', example: 'El ingeniero jefe supervisa la instalación.', example_translation: '总工程师负责监督安装工作。' },
      { word: 'proceso', pos: 'm.', definition: '流程，过程，工序', example: 'El proceso de fabricación cumple con los estándares.', example_translation: '生产工序符合相关标准。' },
    ],
  },
  {
    date: '06.nov',
    sentence_original: 'Necesitamos validar el plan de ejecución.',
    sentence_translation: '我们需要验证执行方案。',
    analysis: [
      { word: 'validar', pos: 'tr.', definition: '验证，确认有效，核准', example: 'Hay que validar los datos antes de enviarlos.', example_translation: '发送数据前需要先验证。' },
      { word: 'ejecución', pos: 'f.', definition: '执行，实施，施工', example: 'El plan de ejecución fue aprobado por el cliente.', example_translation: '施工执行方案已获客户批准。' },
    ],
  },
  {
    date: '07.nov',
    sentence_original: 'Esto no se ajusta a lo acordado.',
    sentence_translation: '这不符合既定约定。',
    analysis: [
      { word: 'ajustarse', pos: 'prnl.', definition: '符合，适应，遵守', example: 'El trabajo debe ajustarse a las especificaciones técnicas.', example_translation: '工作必须符合技术规格要求。' },
      { word: 'acordado', pos: 'adj.', definition: '商定的，约定的，协议的', example: 'Seguimos el precio acordado en el contrato.', example_translation: '我们遵循合同中约定的价格。' },
    ],
  },
  {
    date: '08.nov',
    sentence_original: 'Vamos a coordinar con el equipo técnico.',
    sentence_translation: '我们来和技术团队协调。',
    analysis: [
      { word: 'coordinar', pos: 'tr.', definition: '协调，统筹，配合', example: 'Coordina con el departamento de logística para el envío.', example_translation: '请与物流部门协调安排发货。' },
    ],
  },
  {
    date: '09.nov',
    sentence_original: 'El proveedor está retrasado en la entrega.',
    sentence_translation: '供应商交付延迟了。',
    analysis: [
      { word: 'proveedor', pos: 'm.', definition: '供应商，供货商', example: 'El proveedor firmó un nuevo acuerdo de suministro.', example_translation: '供应商签署了新的供货协议。' },
      { word: 'entrega', pos: 'f.', definition: '交付，交货，递交', example: 'La entrega de materiales está programada para el lunes.', example_translation: '材料交付定于周一进行。' },
    ],
  },
  {
    date: '10.nov',
    sentence_original: 'Hay un problema en la red eléctrica.',
    sentence_translation: '电网出现了问题。',
    analysis: [
      { word: 'red', pos: 'f.', definition: '网络，电网，管网', example: 'La red de tuberías necesita mantenimiento urgente.', example_translation: '管道网络需要紧急维护。' },
      { word: 'eléctrico', pos: 'adj.', definition: '电的，电气的，电力的', example: 'El sistema eléctrico fue revisado por un técnico.', example_translation: '电气系统由技术人员进行了检查。' },
    ],
  },
  {
    date: '11.nov',
    sentence_original: 'Envíame la versión actualizada del archivo.',
    sentence_translation: '把更新后的文件发给我。',
    analysis: [
      { word: 'versión', pos: 'f.', definition: '版本，版次', example: 'Comparte la versión definitiva del plano.', example_translation: '请分享图纸的最终版本。' },
      { word: 'actualizado', pos: 'adj.', definition: '最新的，已更新的', example: 'Necesito el listado actualizado de materiales.', example_translation: '我需要最新版的材料清单。' },
    ],
  },
  {
    date: '12.nov',
    sentence_original: 'Este cambio debe ser aprobado previamente.',
    sentence_translation: '这个变更需要提前批准。',
    analysis: [
      { word: 'cambio', pos: 'm.', definition: '变更，修改，改动', example: 'Todo cambio en el diseño debe documentarse.', example_translation: '所有设计变更都必须记录在案。' },
      { word: 'previamente', pos: 'adv.', definition: '事先，提前，预先', example: 'El material debe ser inspeccionado previamente.', example_translation: '材料必须提前进行检验。' },
    ],
  },
  {
    date: '13.nov',
    sentence_original: 'La obra está avanzando lentamente.',
    sentence_translation: '工程进展较慢。',
    analysis: [
      { word: 'obra', pos: 'f.', definition: '工程，施工，工地', example: 'La obra fue suspendida por condiciones climáticas.', example_translation: '工程因天气原因被暂停。' },
      { word: 'avanzar', pos: 'intr.', definition: '推进，前进，进展', example: 'El proyecto avanza según el cronograma previsto.', example_translation: '项目按预定进度表推进。' },
    ],
  },
  {
    date: '14.nov',
    sentence_original: '¿Puedes revisar este cálculo?',
    sentence_translation: '你可以检查一下这个计算吗？',
    analysis: [
      { word: 'cálculo', pos: 'm.', definition: '计算，核算，估算', example: 'El cálculo estructural fue verificado por el ingeniero.', example_translation: '结构计算经工程师验证无误。' },
    ],
  },
  {
    date: '15.nov',
    sentence_original: 'El equipo técnico está en camino.',
    sentence_translation: '技术团队正在途中。',
    analysis: [
      { word: 'equipo', pos: 'm.', definition: '团队；设备，仪器', example: 'El equipo de instalación llegará mañana por la mañana.', example_translation: '安装团队明天上午抵达。' },
      { word: 'en camino', pos: 'adv.', definition: '在途中，正在赶来', example: 'Los repuestos ya están en camino.', example_translation: '备用零件已经在运输途中了。' },
    ],
  },
  {
    date: '16.nov',
    sentence_original: 'Tenemos que redefinir esta estrategia.',
    sentence_translation: '我们需要重新制定这一策略。',
    analysis: [
      { word: 'redefinir', pos: 'tr.', definition: '重新定义，重新确定', example: 'Redefinimos el alcance del proyecto tras la reunión.', example_translation: '会议后我们重新确定了项目范围。' },
      { word: 'estrategia', pos: 'f.', definition: '策略，战略，方案', example: 'La estrategia de compras debe revisarse cada trimestre.', example_translation: '采购策略应每季度审查一次。' },
    ],
  },
  {
    date: '17.nov',
    sentence_original: 'El cliente está solicitando ajustes.',
    sentence_translation: '客户正在要求调整。',
    analysis: [
      { word: 'solicitar', pos: 'tr.', definition: '请求，要求，申请', example: 'El cliente solicitó un plazo de entrega más corto.', example_translation: '客户要求缩短交货期。' },
      { word: 'ajuste', pos: 'm.', definition: '调整，校准，修正', example: 'Se realizaron ajustes menores al diseño.', example_translation: '对设计进行了小幅调整。' },
    ],
  },
  {
    date: '18.nov',
    sentence_original: 'Nos falta información clave.',
    sentence_translation: '我们缺少关键信息。',
    analysis: [
      { word: 'faltar', pos: 'intr.', definition: '缺少，欠缺，还差', example: 'Falta la firma del responsable en el documento.', example_translation: '文件上缺少负责人的签名。' },
      { word: 'clave', pos: 'adj.', definition: '关键的，核心的，决定性的', example: 'Este dato es clave para el informe final.', example_translation: '这个数据对最终报告至关重要。' },
    ],
  },
  {
    date: '19.nov',
    sentence_original: 'Este asunto aún no se ha resuelto.',
    sentence_translation: '这个问题尚未解决。',
    analysis: [
      { word: 'asunto', pos: 'm.', definition: '事项，问题，议题', example: 'Este asunto debe tratarse en la próxima reunión.', example_translation: '该事项应在下次会议中处理。' },
      { word: 'resolver', pos: 'tr.', definition: '解决，处理，解答', example: 'Resolvimos el problema técnico en pocas horas.', example_translation: '我们在几小时内解决了技术问题。' },
    ],
  },
  {
    date: '20.nov',
    sentence_original: 'El proyecto sigue según lo previsto.',
    sentence_translation: '项目按计划推进。',
    analysis: [
      { word: 'previsto', pos: 'adj.', definition: '预定的，计划内的，预期的', example: 'La entrega se realizó en el plazo previsto.', example_translation: '交货在预定期限内完成。' },
    ],
  },
  {
    date: '21.nov',
    sentence_original: 'Avísanos si hay novedades.',
    sentence_translation: '有新情况请告知我们。',
    analysis: [
      { word: 'avisar', pos: 'tr.', definition: '通知，告知，提醒', example: 'Avisa al equipo cuando lleguen los materiales.', example_translation: '材料到达时请通知团队。' },
      { word: 'novedad', pos: 'f.', definition: '新情况，新动态，变化', example: 'Sin novedades por el momento en obra.', example_translation: '目前工地暂无新动态。' },
    ],
  },
  {
    date: '22.nov',
    sentence_original: 'Vamos a redistribuir las tareas.',
    sentence_translation: '我们将重新分配任务。',
    analysis: [
      { word: 'redistribuir', pos: 'tr.', definition: '重新分配，重新分发', example: 'Redistribuimos las responsabilidades entre los técnicos.', example_translation: '我们在技术人员之间重新分配了职责。' },
      { word: 'tarea', pos: 'f.', definition: '任务，工作，作业', example: 'Cada miembro del equipo tiene una tarea asignada.', example_translation: '团队每位成员都有指定任务。' },
    ],
  },
  {
    date: '23.nov',
    sentence_original: 'El sistema está siendo probado.',
    sentence_translation: '系统正在测试中。',
    analysis: [
      { word: 'sistema', pos: 'm.', definition: '系统，体系，装置', example: 'El sistema de control fue instalado correctamente.', example_translation: '控制系统已正确安装完毕。' },
      { word: 'probar', pos: 'tr.', definition: '测试，试验，检验', example: 'Probamos el software antes de la puesta en marcha.', example_translation: '在系统启动前我们对软件进行了测试。' },
    ],
  },
  {
    date: '24.nov',
    sentence_original: 'Hace falta mejorar la gestión.',
    sentence_translation: '需要加强管理。',
    analysis: [
      { word: 'mejorar', pos: 'tr.', definition: '改善，提升，加强', example: 'Hay que mejorar el proceso de control de calidad.', example_translation: '需要改善质量控制流程。' },
      { word: 'gestión', pos: 'f.', definition: '管理，经营，处理', example: 'La gestión de residuos cumple con la normativa.', example_translation: '废弃物管理符合相关法规。' },
    ],
  },
  {
    date: '25.nov',
    sentence_original: 'Esto puede implicar riesgos adicionales.',
    sentence_translation: '这可能带来额外风险。',
    analysis: [
      { word: 'implicar', pos: 'tr.', definition: '意味着，涉及，带来', example: 'Este cambio implica un coste adicional.', example_translation: '这一变更意味着额外成本。' },
      { word: 'riesgo', pos: 'm.', definition: '风险，危险', example: 'Evaluamos el riesgo antes de tomar la decisión.', example_translation: '做决定前我们评估了风险。' },
    ],
  },
  {
    date: '26.nov',
    sentence_original: 'Estamos evaluando esta opción.',
    sentence_translation: '我们正在评估这个方案。',
    analysis: [
      { word: 'evaluar', pos: 'tr.', definition: '评估，评价，衡量', example: 'Evaluamos distintas ofertas antes de elegir al proveedor.', example_translation: '在选择供应商之前，我们评估了多份报价。' },
      { word: 'opción', pos: 'f.', definition: '选项，方案，可能性', example: 'Hay varias opciones para resolver este problema.', example_translation: '解决这个问题有几种方案。' },
    ],
  },
  {
    date: '27.nov',
    sentence_original: 'El informe será revisado por el equipo.',
    sentence_translation: '报告将由团队审核。',
    analysis: [
      { word: 'informe', pos: 'm.', definition: '报告，报表，汇报', example: 'El informe de progreso se entrega cada semana.', example_translation: '进度报告每周提交一次。' },
    ],
  },
  {
    date: '28.nov',
    sentence_original: 'Confirma la recepción de los datos.',
    sentence_translation: '请确认收到数据。',
    analysis: [
      { word: 'confirmar', pos: 'tr.', definition: '确认，证实', example: 'Confirma la recepción del pedido por escrito.', example_translation: '请以书面形式确认收到订单。' },
      { word: 'recepción', pos: 'f.', definition: '接收，收到；接待', example: 'La recepción del equipo está programada para el viernes.', example_translation: '设备接收定于周五进行。' },
    ],
  },
  {
    date: '29.nov',
    sentence_original: 'Luego analizamos los detalles.',
    sentence_translation: '细节我们之后再分析。',
    analysis: [
      { word: 'analizar', pos: 'tr.', definition: '分析，研究，解析', example: 'Analizamos las causas del retraso en la reunión.', example_translation: '我们在会议上分析了延误的原因。' },
      { word: 'detalle', pos: 'm.', definition: '细节，详情', example: 'Revisa los detalles del contrato antes de firmar.', example_translation: '签署前请仔细查看合同细节。' },
    ],
  },
  {
    date: '30.nov',
    sentence_original: 'Estamos finalizando esta etapa.',
    sentence_translation: '我们正在完成这一阶段。',
    analysis: [
      { word: 'finalizar', pos: 'tr.', definition: '完成，结束，收尾', example: 'Finalizamos las pruebas del sistema con éxito.', example_translation: '我们成功完成了系统测试。' },
      { word: 'etapa', pos: 'f.', definition: '阶段，阶段性，环节', example: 'La primera etapa del proyecto ya está cerrada.', example_translation: '项目第一阶段已经结束。' },
    ],
  },
  // ─── 2025年12月 ───
  {
    date: '01.dic',
    sentence_original: '¿Cómo va el progreso en esta etapa?',
    sentence_translation: '这一阶段进展如何？',
    analysis: [
      { word: 'progreso', pos: 'm.', definition: '进展，进步', example: 'El progreso de las obras es notable esta semana.', example_translation: '本周工程进展显著。' },
      { word: 'etapa', pos: 'f.', definition: '阶段，步骤', example: 'Pasamos a la siguiente etapa del proyecto.', example_translation: '我们进入了项目的下一阶段。' },
    ],
  },
  {
    date: '02.dic',
    sentence_original: 'Estamos ajustando los parámetros del sistema.',
    sentence_translation: '我们正在调整系统参数。',
    analysis: [
      { word: 'ajustar', pos: 'tr.', definition: '调整，校准，微调', example: 'Hay que ajustar la presión del equipo.', example_translation: '需要调整设备的压力。' },
      { word: 'parámetro', pos: 'm.', definition: '参数，参量', example: 'Los parámetros del sistema deben configurarse correctamente.', example_translation: '系统参数必须正确配置。' },
    ],
  },
  {
    date: '03.dic',
    sentence_original: 'Es necesario confirmar la disponibilidad del equipo.',
    sentence_translation: '需要确认设备的可用性。',
    analysis: [
      { word: 'disponibilidad', pos: 'f.', definition: '可用性，可得性，空闲状态', example: 'Confirma la disponibilidad del personal antes del turno.', example_translation: '轮班前请确认人员的到岗情况。' },
    ],
  },
  {
    date: '04.dic',
    sentence_original: 'El envío sufrió un retraso inesperado.',
    sentence_translation: '运输出现了意外延误。',
    analysis: [
      { word: 'envío', pos: 'm.', definition: '运输，发货，寄送', example: 'El envío de materiales fue confirmado ayer.', example_translation: '材料的发货昨天已确认。' },
      { word: 'retraso', pos: 'm.', definition: '延误，延迟，滞后', example: 'El retraso fue causado por problemas aduaneros.', example_translation: '延误是由海关问题造成的。' },
    ],
  },
  {
    date: '05.dic',
    sentence_original: '¿Quién está a cargo de esta tarea?',
    sentence_translation: '这项任务由谁负责？',
    analysis: [
      { word: 'cargo', pos: 'm.', definition: '负责，职责；职务', example: 'El ingeniero está a cargo del montaje.', example_translation: '工程师负责组装工作。' },
    ],
  },
  {
    date: '06.dic',
    sentence_original: 'Necesitamos revisar el contrato nuevamente.',
    sentence_translation: '我们需要重新审核合同。',
    analysis: [
      { word: 'revisar', pos: 'tr.', definition: '审核，检查，复查', example: 'Revisamos el contrato antes de la firma.', example_translation: '我们在签署前审核了合同。' },
      { word: 'contrato', pos: 'm.', definition: '合同，合约', example: 'El contrato fue firmado por ambas partes.', example_translation: '合同已由双方签署。' },
    ],
  },
  {
    date: '07.dic',
    sentence_original: 'Esto no cumple con los requisitos técnicos.',
    sentence_translation: '这不符合技术要求。',
    analysis: [
      { word: 'cumplir', pos: 'tr.', definition: '符合，满足，遵守', example: 'El producto cumple con los estándares internacionales.', example_translation: '该产品符合国际标准。' },
      { word: 'requisito', pos: 'm.', definition: '要求，条件，规范', example: 'Hay que verificar todos los requisitos antes de la entrega.', example_translation: '交货前需核实所有要求。' },
    ],
  },
  {
    date: '08.dic',
    sentence_original: 'Vamos a programar una reunión técnica.',
    sentence_translation: '我们来安排一次技术会议。',
    analysis: [
      { word: 'programar', pos: 'tr.', definition: '安排，计划；编程', example: 'Programamos la visita para el miércoles.', example_translation: '我们把参观安排在周三。' },
    ],
  },
  {
    date: '09.dic',
    sentence_original: 'El proveedor está gestionando la entrega.',
    sentence_translation: '供应商正在安排交付。',
    analysis: [
      { word: 'gestionar', pos: 'tr.', definition: '处理，管理，安排', example: 'El departamento gestiona todos los pedidos.', example_translation: '该部门负责处理所有订单。' },
      { word: 'entrega', pos: 'f.', definition: '交付，交货，递交', example: 'La entrega está programada para el viernes.', example_translation: '交付计划在周五进行。' },
    ],
  },
  {
    date: '10.dic',
    sentence_original: 'Hay fallos en la conexión del sistema.',
    sentence_translation: '系统连接存在故障。',
    analysis: [
      { word: 'fallo', pos: 'm.', definition: '故障，失效，错误', example: 'Se detectó un fallo en el módulo de control.', example_translation: '控制模块中发现了一个故障。' },
      { word: 'conexión', pos: 'f.', definition: '连接，接线，通信', example: 'Verificamos la conexión de todos los cables.', example_translation: '我们检查了所有电缆的连接。' },
    ],
  },
  {
    date: '11.dic',
    sentence_original: 'Envíanos la documentación requerida.',
    sentence_translation: '请把所需文件发给我们。',
    analysis: [
      { word: 'documentación', pos: 'f.', definition: '文件，文档，资料', example: 'La documentación técnica debe estar actualizada.', example_translation: '技术文档必须保持更新。' },
      { word: 'requerido', pos: 'adj.', definition: '所需的，必要的', example: 'Adjunta los documentos requeridos al correo.', example_translation: '请将所需文件附在邮件中。' },
    ],
  },
  {
    date: '12.dic',
    sentence_original: 'Este cambio debe ser evaluado.',
    sentence_translation: '这个变更需要评估。',
    analysis: [
      { word: 'cambio', pos: 'm.', definition: '变更，修改，变化', example: 'Cualquier cambio debe ser aprobado por el supervisor.', example_translation: '任何变更都必须经主管批准。' },
      { word: 'evaluar', pos: 'tr.', definition: '评估，评价，衡量', example: 'Hay que evaluar el impacto antes de proceder.', example_translation: '推进前必须评估影响。' },
    ],
  },
  {
    date: '13.dic',
    sentence_original: 'La instalación está casi terminada.',
    sentence_translation: '安装工作接近完成。',
    analysis: [
      { word: 'instalación', pos: 'f.', definition: '安装，装置，设施', example: 'La instalación eléctrica fue completada sin incidencias.', example_translation: '电气安装顺利完成，未发生任何问题。' },
    ],
  },
  {
    date: '14.dic',
    sentence_original: '¿Puedes validar estos resultados?',
    sentence_translation: '你可以确认这些结果吗？',
    analysis: [
      { word: 'validar', pos: 'tr.', definition: '验证，确认，核实', example: 'El ingeniero debe validar los datos antes del informe.', example_translation: '工程师在出报告前需核实数据。' },
    ],
  },
  {
    date: '15.dic',
    sentence_original: 'El equipo llegará en las próximas horas.',
    sentence_translation: '设备将在数小时内到达。',
    analysis: [
      { word: 'equipo', pos: 'm.', definition: '设备；团队', example: 'El equipo de medición llegó al sitio esta mañana.', example_translation: '测量设备今天上午到达了现场。' },
      { word: 'próximo', pos: 'adj.', definition: '即将的，下一个，临近的', example: 'La próxima revisión está programada para el lunes.', example_translation: '下一次检查计划在周一进行。' },
    ],
  },
  {
    date: '16.dic',
    sentence_original: 'Tenemos que optimizar este plan.',
    sentence_translation: '我们需要优化这个计划。',
    analysis: [
      { word: 'optimizar', pos: 'tr.', definition: '优化，改善，提升效率', example: 'Optimizamos el proceso para reducir el tiempo de ciclo.', example_translation: '我们优化了流程以缩短循环时间。' },
    ],
  },
  {
    date: '17.dic',
    sentence_original: 'El cliente aprobó la propuesta.',
    sentence_translation: '客户已批准该方案。',
    analysis: [
      { word: 'aprobar', pos: 'tr.', definition: '批准，通过，认可', example: 'El comité aprobó el presupuesto del proyecto.', example_translation: '委员会批准了项目预算。' },
      { word: 'propuesta', pos: 'f.', definition: '方案，提案，建议', example: 'Presentamos la propuesta técnica al cliente.', example_translation: '我们向客户提交了技术方案。' },
    ],
  },
  {
    date: '18.dic',
    sentence_original: 'Falta información para cerrar esta fase.',
    sentence_translation: '缺少完成这一阶段所需的信息。',
    analysis: [
      { word: 'faltar', pos: 'intr.', definition: '缺少，欠缺，不足', example: 'Faltan dos firmas para completar el contrato.', example_translation: '合同还差两个签名才能完成。' },
      { word: 'cerrar', pos: 'tr.', definition: '关闭，结束，收尾', example: 'Cerramos la fase de pruebas con éxito.', example_translation: '我们成功结束了测试阶段。' },
    ],
  },
  {
    date: '19.dic',
    sentence_original: 'Este punto sigue en revisión.',
    sentence_translation: '这一点仍在审核中。',
    analysis: [
      { word: 'revisión', pos: 'f.', definition: '审核，审查，复核', example: 'El plano está en revisión por parte del equipo técnico.', example_translation: '图纸正在由技术团队审核中。' },
    ],
  },
  {
    date: '20.dic',
    sentence_original: 'El proyecto mantiene un buen ritmo.',
    sentence_translation: '项目保持良好进度。',
    analysis: [
      { word: 'mantener', pos: 'tr.', definition: '保持，维持，维护', example: 'Debemos mantener el ritmo de producción.', example_translation: '我们必须保持生产节奏。' },
      { word: 'ritmo', pos: 'm.', definition: '节奏，进度，速率', example: 'El ritmo de avance supera las expectativas.', example_translation: '推进速度超出预期。' },
    ],
  },
  {
    date: '21.dic',
    sentence_original: 'Notifícanos cualquier incidencia.',
    sentence_translation: '如有任何问题请通知我们。',
    analysis: [
      { word: 'notificar', pos: 'tr.', definition: '通知，告知，报告', example: 'Notifica al supervisor si hay algún fallo.', example_translation: '如有故障请通知主管。' },
      { word: 'incidencia', pos: 'f.', definition: '事故，问题，突发情况', example: 'Registra todas las incidencias en el sistema.', example_translation: '将所有事故记录在系统中。' },
    ],
  },
  {
    date: '22.dic',
    sentence_original: 'Vamos a reasignar las responsabilidades.',
    sentence_translation: '我们将重新分配职责。',
    analysis: [
      { word: 'reasignar', pos: 'tr.', definition: '重新分配，重新指派', example: 'Reasignamos las tareas tras la salida de un miembro.', example_translation: '成员离开后，我们重新分配了任务。' },
      { word: 'responsabilidad', pos: 'f.', definition: '职责，责任', example: 'Cada miembro tiene responsabilidades bien definidas.', example_translation: '每位成员都有明确的职责分工。' },
    ],
  },
  {
    date: '23.dic',
    sentence_original: 'El sistema requiere mantenimiento.',
    sentence_translation: '系统需要维护。',
    analysis: [
      { word: 'requerir', pos: 'tr.', definition: '需要，要求', example: 'Este equipo requiere revisión cada seis meses.', example_translation: '该设备每六个月需要检修一次。' },
      { word: 'mantenimiento', pos: 'm.', definition: '维护，维修，保养', example: 'El mantenimiento preventivo reduce los fallos.', example_translation: '预防性维护可以减少故障。' },
    ],
  },
  {
    date: '24.dic',
    sentence_original: 'Hace falta reforzar la coordinación.',
    sentence_translation: '需要加强协调。',
    analysis: [
      { word: 'reforzar', pos: 'tr.', definition: '加强，强化，巩固', example: 'Reforzamos el equipo con dos ingenieros más.', example_translation: '我们又增加了两名工程师来强化团队。' },
      { word: 'coordinación', pos: 'f.', definition: '协调，统筹，配合', example: 'La coordinación entre equipos es clave para el éxito.', example_translation: '团队之间的协调是成功的关键。' },
    ],
  },
  {
    date: '25.dic',
    sentence_original: 'Esto puede tener impacto en el plazo.',
    sentence_translation: '这可能会对工期产生影响。',
    analysis: [
      { word: 'impacto', pos: 'm.', definition: '影响，冲击，作用', example: 'El fallo tuvo un impacto directo en la producción.', example_translation: '故障对生产产生了直接影响。' },
      { word: 'plazo', pos: 'm.', definition: '工期，期限，截止日', example: 'El plazo de entrega del proyecto es el 31 de enero.', example_translation: '项目交付期限是1月31日。' },
    ],
  },
  {
    date: '26.dic',
    sentence_original: 'Estamos preparando una solución técnica.',
    sentence_translation: '我们正在准备一个技术解决方案。',
    analysis: [
      { word: 'preparar', pos: 'tr.', definition: '准备，制定，起草', example: 'Preparamos el informe para la reunión de mañana.', example_translation: '我们为明天的会议准备了报告。' },
      { word: 'solución', pos: 'f.', definition: '解决方案，办法', example: 'La solución propuesta reduce los costos operativos.', example_translation: '所提出的方案降低了运营成本。' },
    ],
  },
  {
    date: '27.dic',
    sentence_original: 'El informe final se entregará pronto.',
    sentence_translation: '最终报告将很快提交。',
    analysis: [
      { word: 'informe', pos: 'm.', definition: '报告，报表', example: 'El informe de avance se presentará el lunes.', example_translation: '进度报告将在周一提交。' },
      { word: 'final', pos: 'adj.', definition: '最终的，结束的', example: 'La versión final del documento fue aprobada.', example_translation: '文件的最终版本已获批准。' },
    ],
  },
  {
    date: '28.dic',
    sentence_original: 'Confirma si los datos son correctos.',
    sentence_translation: '请确认数据是否正确。',
    analysis: [
      { word: 'confirmar', pos: 'tr.', definition: '确认，证实', example: 'Confirma la recepción del material por escrito.', example_translation: '请书面确认材料的收货情况。' },
      { word: 'dato', pos: 'm.', definition: '数据，数值，信息', example: 'Los datos del sistema deben ser verificados diariamente.', example_translation: '系统数据须每日核查。' },
    ],
  },
  {
    date: '29.dic',
    sentence_original: 'Luego analizamos los resultados.',
    sentence_translation: '之后我们再分析结果。',
    analysis: [
      { word: 'analizar', pos: 'tr.', definition: '分析，研究，解析', example: 'Analizamos las causas del fallo en detalle.', example_translation: '我们对故障原因进行了详细分析。' },
      { word: 'resultado', pos: 'm.', definition: '结果，成果，效果', example: 'Los resultados de la prueba fueron satisfactorios.', example_translation: '测试结果令人满意。' },
    ],
  },
  {
    date: '30.dic',
    sentence_original: 'Estamos cerrando esta fase del proyecto.',
    sentence_translation: '我们正在收尾这一阶段的项目。',
    analysis: [
      { word: 'cerrar', pos: 'tr.', definition: '关闭，结束，收尾', example: 'Cerramos el ciclo de pruebas antes de la entrega.', example_translation: '我们在交付前完成了测试周期的收尾。' },
      { word: 'fase', pos: 'f.', definition: '阶段，期，相位', example: 'La fase de diseño fue completada a tiempo.', example_translation: '设计阶段按时完成。' },
    ],
  },
  {
    date: '31.dic',
    sentence_original: 'Agradecemos el esfuerzo de todo el equipo.',
    sentence_translation: '感谢整个团队的努力。',
    analysis: [
      { word: 'agradecer', pos: 'tr.', definition: '感谢，致谢', example: 'Agradecemos tu colaboración en este proyecto.', example_translation: '感谢你在这个项目中的配合。' },
      { word: 'esfuerzo', pos: 'm.', definition: '努力，付出，奋斗', example: 'El esfuerzo del equipo fue clave para cumplir el plazo.', example_translation: '团队的努力是按期完成的关键。' },
    ],
  },
  // ─── 2026年1月 ───
  {
    date: '01.ene',
    sentence_original: '¿Puedes compartir el estado actual del proyecto?',
    sentence_translation: '你可以分享一下项目当前进展吗？',
    analysis: [
      { word: 'compartir', pos: 'tr.', definition: '分享，共享', example: 'Comparte el documento con el equipo antes de la reunión.', example_translation: '会议前请把文件分享给团队。' },
      { word: 'estado', pos: 'm.', definition: '状态，状况', example: 'El estado del sistema es estable en este momento.', example_translation: '目前系统状态稳定。' },
    ],
  },
  {
    date: '02.ene',
    sentence_original: 'Estamos revisando los planos técnicos.',
    sentence_translation: '我们正在审核技术图纸。',
    analysis: [
      { word: 'plano', pos: 'm.', definition: '图纸，平面图，方案', example: 'Los planos del edificio deben ser aprobados antes de construir.', example_translation: '楼房图纸在施工前必须获得批准。' },
    ],
  },
  {
    date: '03.ene',
    sentence_original: 'Hace falta definir el calendario de trabajo.',
    sentence_translation: '需要确定工作时间表。',
    analysis: [
      { word: 'definir', pos: 'tr.', definition: '确定，定义，明确', example: 'Hay que definir los responsables de cada tarea.', example_translation: '需要明确每项任务的负责人。' },
      { word: 'calendario', pos: 'm.', definition: '日历，时间表，日程安排', example: 'Enviamos el calendario de entregas al cliente.', example_translation: '我们把交付时间表发给了客户。' },
    ],
  },
  {
    date: '04.ene',
    sentence_original: 'El equipo aún no ha salido de origen.',
    sentence_translation: '设备还没有从出发地发出。',
    analysis: [
      { word: 'origen', pos: 'm.', definition: '起点，出发地，来源', example: 'El material salió de origen esta mañana.', example_translation: '材料今天上午已从起运地出发。' },
    ],
  },
  {
    date: '05.ene',
    sentence_original: '¿Quién aprobó esta modificación?',
    sentence_translation: '这个修改是谁批准的？',
    analysis: [
      { word: 'aprobar', pos: 'tr.', definition: '批准，通过，认可', example: 'El director aprobó el presupuesto del proyecto.', example_translation: '主任批准了项目预算。' },
      { word: 'modificación', pos: 'f.', definition: '修改，变更，调整', example: 'La modificación del diseño requiere nueva documentación.', example_translation: '设计变更需要重新提交文件。' },
    ],
  },
  {
    date: '06.ene',
    sentence_original: 'Necesitamos validar estos resultados.',
    sentence_translation: '我们需要验证这些结果。',
    analysis: [
      { word: 'validar', pos: 'tr.', definition: '验证，确认有效性', example: 'El ingeniero validó los datos antes de publicar el informe.', example_translation: '工程师在发布报告前验证了数据。' },
    ],
  },
  {
    date: '07.ene',
    sentence_original: 'Esto no estaba incluido en el contrato.',
    sentence_translation: '这个不在合同范围内。',
    analysis: [
      { word: 'incluir', pos: 'tr.', definition: '包含，纳入，包括', example: 'El presupuesto no incluye los gastos de transporte.', example_translation: '预算不包含运输费用。' },
      { word: 'contrato', pos: 'm.', definition: '合同，合约', example: 'Ambas partes firmaron el contrato ayer.', example_translation: '双方昨天签署了合同。' },
    ],
  },
  {
    date: '08.ene',
    sentence_original: 'Vamos a discutir este tema más tarde.',
    sentence_translation: '这个问题我们稍后再讨论。',
    analysis: [
      { word: 'discutir', pos: 'tr.', definition: '讨论，商议', example: 'Discutimos el cronograma con el equipo esta mañana.', example_translation: '今天上午我们和团队讨论了进度安排。' },
    ],
  },
  {
    date: '09.ene',
    sentence_original: 'El proveedor confirmó la entrega.',
    sentence_translation: '供应商已经确认交付。',
    analysis: [
      { word: 'proveedor', pos: 'm.', definition: '供应商，供货商', example: 'El proveedor envió la factura por correo electrónico.', example_translation: '供应商通过电子邮件发送了发票。' },
      { word: 'entrega', pos: 'f.', definition: '交付，交货', example: 'La entrega de materiales está prevista para el jueves.', example_translation: '材料交付计划在周四。' },
    ],
  },
  {
    date: '10.ene',
    sentence_original: 'Hay dificultades con el suministro eléctrico.',
    sentence_translation: '电力供应方面存在问题。',
    analysis: [
      { word: 'suministro', pos: 'm.', definition: '供应，供给', example: 'El suministro de agua fue interrumpido durante la obra.', example_translation: '施工期间供水被中断了。' },
      { word: 'eléctrico', pos: 'adj.', definition: '电气的，电力的', example: 'Revisamos el panel eléctrico antes de la puesta en marcha.', example_translation: '启动前我们检查了配电盘。' },
    ],
  },
  {
    date: '11.ene',
    sentence_original: 'Envíame los detalles por correo, por favor.',
    sentence_translation: '请通过邮件把详细信息发给我。',
    analysis: [
      { word: 'detalle', pos: 'm.', definition: '细节，详情', example: 'Necesitamos los detalles técnicos del equipo.', example_translation: '我们需要设备的技术详情。' },
    ],
  },
  {
    date: '12.ene',
    sentence_original: 'Este ajuste es necesario para continuar.',
    sentence_translation: '这个调整是继续推进所必须的。',
    analysis: [
      { word: 'ajuste', pos: 'm.', definition: '调整，校准，修正', example: 'Se realizaron ajustes al plan de trabajo.', example_translation: '对工作计划进行了调整。' },
      { word: 'continuar', pos: 'intr.', definition: '继续，持续', example: 'Podemos continuar con la instalación mañana.', example_translation: '我们明天可以继续安装工作。' },
    ],
  },
  {
    date: '13.ene',
    sentence_original: 'La obra aún no ha comenzado.',
    sentence_translation: '工程尚未开始。',
    analysis: [
      { word: 'obra', pos: 'f.', definition: '工程，施工，工地', example: 'La obra está paralizada por falta de materiales.', example_translation: '工程因缺少材料而停工。' },
    ],
  },
  {
    date: '14.ene',
    sentence_original: '¿Puedes comprobar esta información?',
    sentence_translation: '你可以核实一下这个信息吗？',
    analysis: [
      { word: 'comprobar', pos: 'tr.', definition: '核实，查证，检验', example: 'Comprueba que los valores del sensor sean correctos.', example_translation: '请核查传感器数值是否正确。' },
    ],
  },
  {
    date: '15.ene',
    sentence_original: 'El equipo llegará con retraso.',
    sentence_translation: '设备将延迟到达。',
    analysis: [
      { word: 'retraso', pos: 'm.', definition: '延误，延迟，迟到', example: 'El retraso en la entrega afectó el cronograma.', example_translation: '交货延误影响了进度安排。' },
    ],
  },
  {
    date: '16.ene',
    sentence_original: 'Tenemos que modificar el diseño.',
    sentence_translation: '我们需要修改设计。',
    analysis: [
      { word: 'modificar', pos: 'tr.', definition: '修改，变更，调整', example: 'Modificamos el esquema eléctrico según las observaciones.', example_translation: '我们根据意见修改了电气图。' },
      { word: 'diseño', pos: 'm.', definition: '设计，图样', example: 'El diseño del sistema fue aprobado por el cliente.', example_translation: '系统设计已获客户批准。' },
    ],
  },
  {
    date: '17.ene',
    sentence_original: 'El cliente está evaluando la propuesta.',
    sentence_translation: '客户正在评估方案。',
    analysis: [
      { word: 'evaluar', pos: 'tr.', definition: '评估，评价', example: 'Evaluamos el riesgo técnico antes de tomar una decisión.', example_translation: '我们在做决定前先评估了技术风险。' },
      { word: 'propuesta', pos: 'f.', definition: '方案，提案，建议', example: 'Presentamos la propuesta al cliente la semana pasada.', example_translation: '上周我们向客户提交了方案。' },
    ],
  },
  {
    date: '18.ene',
    sentence_original: 'Nos falta confirmar varios datos.',
    sentence_translation: '我们还需要确认多个数据。',
    analysis: [
      { word: 'confirmar', pos: 'tr.', definition: '确认，证实', example: 'Confirma la fecha de inicio antes del viernes.', example_translation: '请在周五前确认开工日期。' },
      { word: 'dato', pos: 'm.', definition: '数据，信息，参数', example: 'Los datos del informe deben ser actualizados.', example_translation: '报告中的数据需要更新。' },
    ],
  },
  {
    date: '19.ene',
    sentence_original: 'Este asunto sigue pendiente.',
    sentence_translation: '这个问题仍未解决。',
    analysis: [
      { word: 'asunto', pos: 'm.', definition: '事项，问题，事务', example: 'Hay varios asuntos pendientes que resolver esta semana.', example_translation: '本周有几个待解决的事项。' },
      { word: 'pendiente', pos: 'adj.', definition: '待处理的，悬而未决的', example: 'La aprobación del presupuesto sigue pendiente.', example_translation: '预算批准仍悬而未决。' },
    ],
  },
  {
    date: '20.ene',
    sentence_original: 'El proyecto avanza de forma estable.',
    sentence_translation: '项目进展总体稳定。',
    analysis: [
      { word: 'avanzar', pos: 'intr.', definition: '推进，前进，取得进展', example: 'La obra avanza bien a pesar de las lluvias.', example_translation: '尽管下雨，工程仍进展顺利。' },
      { word: 'estable', pos: 'adj.', definition: '稳定的，平稳的', example: 'El sistema opera de forma estable tras el mantenimiento.', example_translation: '维护后系统运行稳定。' },
    ],
  },
  {
    date: '21.ene',
    sentence_original: 'Infórmanos si surge algún problema.',
    sentence_translation: '如有问题请及时告知我们。',
    analysis: [
      { word: 'informar', pos: 'tr.', definition: '通知，告知，汇报', example: 'Infórmame cuando lleguen los materiales.', example_translation: '材料到了请告知我。' },
      { word: 'surgir', pos: 'intr.', definition: '出现，产生，涌现', example: 'Surgieron varios problemas durante la instalación.', example_translation: '安装过程中出现了几个问题。' },
    ],
  },
  {
    date: '22.ene',
    sentence_original: 'Vamos a reorganizar el equipo.',
    sentence_translation: '我们将重新调整团队。',
    analysis: [
      { word: 'reorganizar', pos: 'tr.', definition: '重新组织，重新调整', example: 'Reorganizamos los turnos de trabajo para aumentar la eficiencia.', example_translation: '我们重新安排了班次以提高效率。' },
    ],
  },
  {
    date: '23.ene',
    sentence_original: 'El sistema ya está en funcionamiento.',
    sentence_translation: '系统已经开始运行。',
    analysis: [
      { word: 'funcionamiento', pos: 'm.', definition: '运行，运转，工作状态', example: 'La planta entró en funcionamiento después de las pruebas.', example_translation: '工厂在测试结束后投入运行。' },
    ],
  },
  {
    date: '24.ene',
    sentence_original: 'Hace falta mejorar la planificación.',
    sentence_translation: '需要加强规划。',
    analysis: [
      { word: 'mejorar', pos: 'tr.', definition: '改善，提升，优化', example: 'Hay que mejorar el proceso de control de calidad.', example_translation: '需要改善质量控制流程。' },
      { word: 'planificación', pos: 'f.', definition: '规划，计划，筹划', example: 'Una buena planificación reduce los riesgos del proyecto.', example_translation: '良好的规划可以降低项目风险。' },
    ],
  },
  {
    date: '25.ene',
    sentence_original: 'Esto puede generar riesgos adicionales.',
    sentence_translation: '这可能会带来额外风险。',
    analysis: [
      { word: 'generar', pos: 'tr.', definition: '产生，引发，生成', example: 'Los cambios frecuentes generan costos adicionales.', example_translation: '频繁的变更会产生额外成本。' },
      { word: 'riesgo', pos: 'm.', definition: '风险，危险', example: 'Identificamos los riesgos técnicos en la fase inicial.', example_translation: '我们在初期阶段识别了技术风险。' },
    ],
  },
  {
    date: '26.ene',
    sentence_original: 'Estamos analizando esta situación.',
    sentence_translation: '我们正在分析这一情况。',
    analysis: [
      { word: 'analizar', pos: 'tr.', definition: '分析，研究，检验', example: 'Analizamos las causas del fallo del sistema.', example_translation: '我们分析了系统故障的原因。' },
      { word: 'situación', pos: 'f.', definition: '情况，形势，处境', example: 'La situación en el sitio es más complicada de lo esperado.', example_translation: '现场情况比预期更复杂。' },
    ],
  },
  {
    date: '27.ene',
    sentence_original: 'El informe preliminar ya está listo.',
    sentence_translation: '初步报告已经完成。',
    analysis: [
      { word: 'informe', pos: 'm.', definition: '报告，汇报', example: 'Entregamos el informe técnico al cliente.', example_translation: '我们向客户提交了技术报告。' },
      { word: 'preliminar', pos: 'adj.', definition: '初步的，预备的', example: 'El estudio preliminar mostró resultados prometedores.', example_translation: '初步研究显示出令人期待的结果。' },
    ],
  },
  {
    date: '28.ene',
    sentence_original: 'Confirma si recibiste el archivo.',
    sentence_translation: '请确认你是否收到了文件。',
    analysis: [
      { word: 'recibir', pos: 'tr.', definition: '收到，接收', example: '¿Recibiste el plano actualizado que envié ayer?', example_translation: '你收到我昨天发的更新图纸了吗？' },
      { word: 'archivo', pos: 'm.', definition: '文件，档案，文档', example: 'Guarda el archivo en la carpeta compartida del equipo.', example_translation: '请把文件保存在团队共享文件夹中。' },
    ],
  },
  {
    date: '29.ene',
    sentence_original: 'Luego ajustamos los parámetros técnicos.',
    sentence_translation: '之后我们再调整技术参数。',
    analysis: [
      { word: 'ajustar', pos: 'tr.', definition: '调整，校准，修正', example: 'Ajusta la presión del sistema según las especificaciones.', example_translation: '请按规格要求调整系统压力。' },
      { word: 'parámetro', pos: 'm.', definition: '参数，指标', example: 'Los parámetros del equipo deben verificarse a diario.', example_translation: '设备参数需每日核查。' },
    ],
  },
  {
    date: '30.ene',
    sentence_original: 'Estamos entrando en la fase inicial.',
    sentence_translation: '我们正在进入初期阶段。',
    analysis: [
      { word: 'fase', pos: 'f.', definition: '阶段，期', example: 'Estamos en la fase de diseño del proyecto.', example_translation: '我们目前处于项目设计阶段。' },
      { word: 'inicial', pos: 'adj.', definition: '初始的，初期的', example: 'La inversión inicial fue mayor de lo previsto.', example_translation: '初期投入超出了预期。' },
    ],
  },
  {
    date: '31.ene',
    sentence_original: 'Gracias por tu apoyo en este proyecto.',
    sentence_translation: '感谢你在这个项目中的支持。',
    analysis: [
      { word: 'apoyo', pos: 'm.', definition: '支持，援助，配合', example: 'Contamos con el apoyo del equipo técnico local.', example_translation: '我们得到了当地技术团队的支持。' },
    ],
  },
  // ─── 2026年2月 ───
  {
    date: '01.feb',
    sentence_original: '¿Se ha completado la inspección del equipo?',
    sentence_translation: '设备检查完成了吗？',
    analysis: [
      { word: 'inspección', pos: 'f.', definition: '检查，检验，巡检', example: 'La inspección de seguridad se realiza cada mes.', example_translation: '安全检查每月进行一次。' },
      { word: 'completar', pos: 'tr.', definition: '完成，完毕', example: 'Completaron la revisión antes del plazo previsto.', example_translation: '他们在规定期限前完成了审核。' },
    ],
  },
  {
    date: '02.feb',
    sentence_original: 'Necesitamos aclarar este requisito técnico.',
    sentence_translation: '我们需要澄清这个技术要求。',
    analysis: [
      { word: 'aclarar', pos: 'tr.', definition: '澄清，说明，阐明', example: 'Hay que aclarar el alcance del proyecto cuanto antes.', example_translation: '需要尽快说明项目的范围。' },
      { word: 'requisito', pos: 'm.', definition: '要求，条件，规格', example: 'El requisito mínimo es tener dos años de experiencia.', example_translation: '最低要求是具备两年工作经验。' },
    ],
  },
  {
    date: '03.feb',
    sentence_original: 'El equipo de trabajo ya está en sitio.',
    sentence_translation: '施工团队已经在现场了。',
    analysis: [
      { word: 'sitio', pos: 'm.', definition: '现场，地点，场地', example: 'El ingeniero visitó el sitio de construcción por la mañana.', example_translation: '工程师早上参观了施工现场。' },
    ],
  },
  {
    date: '04.feb',
    sentence_original: 'Aún estamos recopilando la información necesaria.',
    sentence_translation: '我们还在收集必要信息。',
    analysis: [
      { word: 'recopilar', pos: 'tr.', definition: '收集，汇编，整理', example: 'Recopilamos todos los datos antes de redactar el informe.', example_translation: '我们在撰写报告前收集了所有数据。' },
    ],
  },
  {
    date: '05.feb',
    sentence_original: 'Revisemos este punto en la próxima reunión.',
    sentence_translation: '这个问题我们在下次会议再讨论。',
    analysis: [
      { word: 'revisar', pos: 'tr.', definition: '审查，检查，复核', example: 'Revisemos el presupuesto antes de aprobarlo.', example_translation: '批准之前我们先审查一下预算。' },
      { word: 'reunión', pos: 'f.', definition: '会议，会面', example: 'La reunión semanal se celebra los lunes por la mañana.', example_translation: '每周会议在周一早上召开。' },
    ],
  },
  {
    date: '06.feb',
    sentence_original: 'Este archivo contiene los datos más recientes.',
    sentence_translation: '这个文件包含最新数据。',
    analysis: [
      { word: 'archivo', pos: 'm.', definition: '文件，档案', example: 'Guarda el archivo en la carpeta compartida.', example_translation: '把文件保存到共享文件夹中。' },
      { word: 'reciente', pos: 'adj.', definition: '最新的，近期的', example: 'Adjunta la versión más reciente del plano.', example_translation: '请附上最新版本的图纸。' },
    ],
  },
  {
    date: '07.feb',
    sentence_original: 'El avance actual es más lento de lo esperado.',
    sentence_translation: '当前进度比预期慢。',
    analysis: [
      { word: 'avance', pos: 'm.', definition: '进展，推进，进度', example: 'El avance de las obras superó las expectativas.', example_translation: '工程进度超出了预期。' },
      { word: 'esperado', pos: 'adj.', definition: '预期的，预计的', example: 'Los resultados fueron mejores de lo esperado.', example_translation: '结果比预期的要好。' },
    ],
  },
  {
    date: '08.feb',
    sentence_original: 'Hay que contactar al proveedor hoy mismo.',
    sentence_translation: '今天必须联系供应商。',
    analysis: [
      { word: 'contactar', pos: 'tr.', definition: '联系，接触，沟通', example: 'Contacta al responsable de logística cuanto antes.', example_translation: '尽快联系物流负责人。' },
    ],
  },
  {
    date: '09.feb',
    sentence_original: 'Los materiales llegarán esta semana.',
    sentence_translation: '材料将在本周到达。',
    analysis: [
      { word: 'material', pos: 'm.', definition: '材料，物料', example: 'Verificamos la calidad de los materiales al recibirlos.', example_translation: '收货时我们核查了材料质量。' },
    ],
  },
  {
    date: '10.feb',
    sentence_original: 'Se presentó un fallo en el sistema.',
    sentence_translation: '系统出现了故障。',
    analysis: [
      { word: 'fallo', pos: 'm.', definition: '故障，失效，失误', example: 'El fallo eléctrico detuvo la producción por dos horas.', example_translation: '电气故障导致生产停止了两个小时。' },
      { word: 'presentarse', pos: 'prnl.', definition: '出现，发生（问题/情况）', example: 'Se presentó un problema inesperado durante la prueba.', example_translation: '测试过程中出现了一个意外问题。' },
    ],
  },
  {
    date: '11.feb',
    sentence_original: 'Por favor, verifica estos resultados.',
    sentence_translation: '请核对这些结果。',
    analysis: [
      { word: 'verificar', pos: 'tr.', definition: '核实，核对，验证', example: 'Verifica los cálculos antes de enviar el informe.', example_translation: '发送报告前请核实计算结果。' },
      { word: 'resultado', pos: 'm.', definition: '结果，成果', example: 'Los resultados de las pruebas fueron positivos.', example_translation: '测试结果是积极的。' },
    ],
  },
  {
    date: '12.feb',
    sentence_original: 'Este aspecto requiere más atención.',
    sentence_translation: '这一点需要更多关注。',
    analysis: [
      { word: 'aspecto', pos: 'm.', definition: '方面，环节，点', example: 'Hay varios aspectos técnicos que revisar.', example_translation: '有几个技术方面需要审查。' },
      { word: 'requerir', pos: 'tr.', definition: '需要，要求', example: 'Este proceso requiere la aprobación del cliente.', example_translation: '这个流程需要客户的批准。' },
    ],
  },
  {
    date: '13.feb',
    sentence_original: 'La construcción sigue en curso.',
    sentence_translation: '施工仍在进行中。',
    analysis: [
      { word: 'construcción', pos: 'f.', definition: '施工，建设，建筑', example: 'La construcción del puente tardará seis meses.', example_translation: '大桥施工需要六个月。' },
      { word: 'en curso', pos: 'adv.', definition: '进行中，当前', example: 'Las negociaciones están en curso.', example_translation: '谈判正在进行中。' },
    ],
  },
  {
    date: '14.feb',
    sentence_original: '¿Puedes enviar la versión final?',
    sentence_translation: '你可以发最终版本吗？',
    analysis: [
      { word: 'versión', pos: 'f.', definition: '版本，版次', example: 'Asegúrate de trabajar con la versión más reciente del plano.', example_translation: '请确保使用最新版本的图纸。' },
      { word: 'enviar', pos: 'tr.', definition: '发送，寄出', example: 'Envía el contrato firmado por correo electrónico.', example_translation: '请将签署好的合同通过电子邮件发送过来。' },
    ],
  },
  {
    date: '15.feb',
    sentence_original: 'El personal técnico ya fue asignado.',
    sentence_translation: '技术人员已经安排好了。',
    analysis: [
      { word: 'personal', pos: 'm.', definition: '人员，员工，职工', example: 'El personal de mantenimiento llegará mañana.', example_translation: '维修人员明天到达。' },
      { word: 'asignar', pos: 'tr.', definition: '分配，指派，安排', example: 'Se asignaron nuevas responsabilidades a cada área.', example_translation: '向各部门分配了新的职责。' },
    ],
  },
  {
    date: '16.feb',
    sentence_original: 'Tenemos que optimizar este proceso.',
    sentence_translation: '我们需要优化这个流程。',
    analysis: [
      { word: 'optimizar', pos: 'tr.', definition: '优化，改善效率', example: 'Optimizamos el flujo de trabajo para reducir tiempos.', example_translation: '我们优化了工作流程以缩短时间。' },
      { word: 'proceso', pos: 'm.', definition: '流程，过程，工艺', example: 'El proceso de fabricación cumple con las normas.', example_translation: '生产工艺符合相关规范。' },
    ],
  },
  {
    date: '17.feb',
    sentence_original: 'El cliente solicitó información adicional.',
    sentence_translation: '客户要求提供更多信息。',
    analysis: [
      { word: 'solicitar', pos: 'tr.', definition: '请求，申请，要求', example: 'El contratista solicitó una prórroga del plazo.', example_translation: '承包商申请延长工期。' },
      { word: 'adicional', pos: 'adj.', definition: '额外的，附加的', example: 'Se necesita un presupuesto adicional para este trabajo.', example_translation: '这项工作需要额外的预算。' },
    ],
  },
  {
    date: '18.feb',
    sentence_original: 'Nos queda poco tiempo para esta fase.',
    sentence_translation: '这一阶段时间不多了。',
    analysis: [
      { word: 'quedar', pos: 'intr.', definition: '剩余，还有（时间/数量）', example: 'Quedan tres días para cerrar esta etapa.', example_translation: '还有三天时间来完成这一阶段。' },
      { word: 'fase', pos: 'f.', definition: '阶段，阶段性，期', example: 'Entramos en la fase de pruebas del sistema.', example_translation: '我们进入了系统测试阶段。' },
    ],
  },
  {
    date: '19.feb',
    sentence_original: 'Este problema ya fue identificado.',
    sentence_translation: '这个问题已经被识别出来了。',
    analysis: [
      { word: 'identificar', pos: 'tr.', definition: '识别，确认，发现（问题）', example: 'Identificamos el origen del fallo en pocas horas.', example_translation: '我们在几个小时内确定了故障根源。' },
    ],
  },
  {
    date: '20.feb',
    sentence_original: 'El proyecto avanza sin inconvenientes.',
    sentence_translation: '项目进展顺利。',
    analysis: [
      { word: 'avanzar', pos: 'intr.', definition: '推进，进展，前进', example: 'Las obras avanzan a buen ritmo.', example_translation: '工程进展顺利，节奏良好。' },
      { word: 'inconveniente', pos: 'm.', definition: '麻烦，障碍，不便', example: 'Si surge algún inconveniente, avísame de inmediato.', example_translation: '如有任何麻烦，请立即告知我。' },
    ],
  },
  {
    date: '21.feb',
    sentence_original: 'Mantennos al tanto de cualquier novedad.',
    sentence_translation: '有新情况请及时告知。',
    analysis: [
      { word: 'mantener', pos: 'tr.', definition: '保持，维持', example: 'Mantenemos contacto diario con el equipo en campo.', example_translation: '我们与现场团队保持每日联系。' },
      { word: 'al tanto', pos: 'adv.', definition: '了解情况，知情', example: 'Te mantendremos al tanto de los avances.', example_translation: '我们会随时向你通报进展。' },
    ],
  },
  {
    date: '22.feb',
    sentence_original: 'Vamos a redistribuir los recursos.',
    sentence_translation: '我们要重新分配资源。',
    analysis: [
      { word: 'redistribuir', pos: 'tr.', definition: '重新分配，重新调配', example: 'Hay que redistribuir las tareas entre los turnos.', example_translation: '需要在各班次之间重新分配任务。' },
      { word: 'recurso', pos: 'm.', definition: '资源，资产，手段', example: 'Los recursos humanos son limitados en esta etapa.', example_translation: '这一阶段人力资源有限。' },
    ],
  },
  {
    date: '23.feb',
    sentence_original: 'El sistema necesita más pruebas.',
    sentence_translation: '系统需要更多测试。',
    analysis: [
      { word: 'prueba', pos: 'f.', definition: '测试，试验，检测', example: 'Realizamos pruebas de carga antes de la puesta en marcha.', example_translation: '正式投用前我们进行了负载测试。' },
    ],
  },
  {
    date: '24.feb',
    sentence_original: 'Hay falta de comunicación entre áreas.',
    sentence_translation: '部门之间沟通不足。',
    analysis: [
      { word: 'falta', pos: 'f.', definition: '缺乏，不足，欠缺', example: 'La falta de coordinación causó el retraso.', example_translation: '协调不足导致了延误。' },
      { word: 'área', pos: 'f.', definition: '部门，区域，领域', example: 'Cada área debe entregar su reporte el viernes.', example_translation: '各部门须于周五提交报告。' },
    ],
  },
  {
    date: '25.feb',
    sentence_original: 'Esto podría impactar el presupuesto.',
    sentence_translation: '这可能会影响预算。',
    analysis: [
      { word: 'impactar', pos: 'tr.', definition: '影响，冲击', example: 'El cambio de diseño impactó negativamente el presupuesto.', example_translation: '设计变更对预算产生了负面影响。' },
      { word: 'presupuesto', pos: 'm.', definition: '预算，报价', example: 'El presupuesto aprobado no puede ser superado.', example_translation: '批准的预算不能超支。' },
    ],
  },
  {
    date: '26.feb',
    sentence_original: 'Estamos buscando una solución viable.',
    sentence_translation: '我们正在寻找可行方案。',
    analysis: [
      { word: 'solución', pos: 'f.', definition: '解决方案，办法', example: 'Propusimos una solución técnica al cliente.', example_translation: '我们向客户提出了一个技术解决方案。' },
      { word: 'viable', pos: 'adj.', definition: '可行的，切实可行的', example: 'Necesitamos una alternativa viable dentro del plazo.', example_translation: '我们需要一个在期限内可行的替代方案。' },
    ],
  },
  {
    date: '27.feb',
    sentence_original: 'El documento será revisado hoy.',
    sentence_translation: '文件今天会被审核。',
    analysis: [
      { word: 'documento', pos: 'm.', definition: '文件，文档，证明', example: 'Adjunta todos los documentos requeridos al correo.', example_translation: '请将所有所需文件附在邮件中发送。' },
    ],
  },
  {
    date: '28.feb',
    sentence_original: 'Confirma si todo está en orden.',
    sentence_translation: '请确认一切是否正常。',
    analysis: [
      { word: 'confirmar', pos: 'tr.', definition: '确认，证实', example: 'Confirma la recepción del equipo antes del mediodía.', example_translation: '请在中午之前确认设备已收到。' },
      { word: 'en orden', pos: 'adv.', definition: '正常，有序，妥当', example: 'Verifica que los documentos estén en orden antes de firmar.', example_translation: '签字前请确认文件均已妥当。' },
    ],
  },
  // ─── 2026年3月 ───
  {
    date: '01.mar',
    sentence_original: '¿Ya se ha iniciado la instalación en el sitio?',
    sentence_translation: '现场安装已经开始了吗？',
    analysis: [
      { word: 'iniciar', pos: 'tr.', definition: '开始，启动，发起', example: 'Iniciamos la prueba del sistema a las ocho.', example_translation: '我们八点开始了系统测试。' },
      { word: 'sitio', pos: 'm.', definition: '现场，地点，场所', example: 'El inspector visitará el sitio mañana.', example_translation: '检查员明天将到现场视察。' },
    ],
  },
  {
    date: '02.mar',
    sentence_original: 'Necesitamos confirmar el alcance del trabajo.',
    sentence_translation: '我们需要确认工作范围。',
    analysis: [
      { word: 'alcance', pos: 'm.', definition: '范围，规模，覆盖面', example: 'El alcance del contrato incluye el mantenimiento.', example_translation: '合同范围包括维护工作。' },
    ],
  },
  {
    date: '03.mar',
    sentence_original: 'El equipo local ya está preparado.',
    sentence_translation: '当地团队已经准备好了。',
    analysis: [
      { word: 'preparado', pos: 'adj.', definition: '准备好的，就绪的', example: 'El equipo de emergencia siempre debe estar preparado.', example_translation: '应急团队必须随时处于待命状态。' },
      { word: 'local', pos: 'adj.', definition: '当地的，本地的', example: 'Contratamos personal local para la obra.', example_translation: '我们为工程雇用了当地人员。' },
    ],
  },
  {
    date: '04.mar',
    sentence_original: 'Todavía falta definir algunos detalles técnicos.',
    sentence_translation: '还有一些技术细节需要确定。',
    analysis: [
      { word: 'definir', pos: 'tr.', definition: '确定，定义，明确', example: 'Hay que definir los plazos antes de empezar.', example_translation: '开工前必须明确各项期限。' },
      { word: 'detalle', pos: 'm.', definition: '细节，详情', example: 'Los detalles del diseño serán revisados mañana.', example_translation: '设计细节将于明天审查。' },
    ],
  },
  {
    date: '05.mar',
    sentence_original: 'Vamos a revisar el plan de trabajo juntos.',
    sentence_translation: '我们一起审查一下工作计划。',
    analysis: [
      { word: 'revisar', pos: 'tr.', definition: '审查，复核，检查', example: 'Debemos revisar el plano antes de la ejecución.', example_translation: '施工前我们必须审查图纸。' },
      { word: 'plan', pos: 'm.', definition: '计划，方案，规划', example: 'El plan de contingencia fue aprobado ayer.', example_translation: '应急计划昨天获得批准。' },
    ],
  },
  {
    date: '06.mar',
    sentence_original: 'Este documento necesita ser actualizado.',
    sentence_translation: '这个文件需要更新。',
    analysis: [
      { word: 'documento', pos: 'm.', definition: '文件，文档', example: 'Por favor, firma el documento antes de enviarlo.', example_translation: '请在发送前签署文件。' },
      { word: 'actualizar', pos: 'tr.', definition: '更新，升级', example: 'Actualiza el registro con los datos más recientes.', example_translation: '请用最新数据更新记录。' },
    ],
  },
  {
    date: '07.mar',
    sentence_original: 'El avance no cumple con lo previsto.',
    sentence_translation: '进度没有达到预期。',
    analysis: [
      { word: 'avance', pos: 'm.', definition: '进展，进度，推进', example: 'El avance de la obra es satisfactorio esta semana.', example_translation: '本周工程进展令人满意。' },
      { word: 'cumplir', pos: 'tr.', definition: '达到，满足，履行', example: 'Hay que cumplir con los estándares de calidad.', example_translation: '必须达到质量标准。' },
    ],
  },
  {
    date: '08.mar',
    sentence_original: 'Hay que coordinar con el proveedor cuanto antes.',
    sentence_translation: '需要尽快与供应商协调。',
    analysis: [
      { word: 'coordinar', pos: 'tr.', definition: '协调，统筹安排', example: 'Coordinamos los turnos con el equipo de noche.', example_translation: '我们与夜班团队协调了班次安排。' },
      { word: 'proveedor', pos: 'm.', definition: '供应商，供货方', example: 'El proveedor entregó los materiales a tiempo.', example_translation: '供应商按时交付了材料。' },
    ],
  },
  {
    date: '09.mar',
    sentence_original: 'El material ya está en camino.',
    sentence_translation: '材料已经在运输途中。',
    analysis: [
      { word: 'material', pos: 'm.', definition: '材料，物料，原料', example: 'El material de construcción llegará esta tarde.', example_translation: '建筑材料今天下午将到达。' },
      { word: 'en camino', pos: 'adv.', definition: '在途中，途中，正在前来', example: 'Los técnicos ya están en camino al sitio.', example_translation: '技术人员已经在前往现场途中。' },
    ],
  },
  {
    date: '10.mar',
    sentence_original: 'Se detectó un error en el sistema.',
    sentence_translation: '系统中发现了一个错误。',
    analysis: [
      { word: 'detectar', pos: 'tr.', definition: '检测，发现，探测', example: 'Se detectaron fallos en la línea de producción.', example_translation: '生产线上发现了故障。' },
      { word: 'error', pos: 'm.', definition: '错误，故障，误差', example: 'El error fue corregido por el equipo técnico.', example_translation: '该错误已由技术团队修正。' },
    ],
  },
  {
    date: '11.mar',
    sentence_original: 'Por favor, revisa este archivo cuando tengas tiempo.',
    sentence_translation: '有空的时候请查看这个文件。',
    analysis: [
      { word: 'archivo', pos: 'm.', definition: '文件，档案，归档', example: 'Guarda el archivo en la carpeta compartida.', example_translation: '请将文件保存到共享文件夹。' },
    ],
  },
  {
    date: '12.mar',
    sentence_original: 'Este punto es clave para el proyecto.',
    sentence_translation: '这一点对项目至关重要。',
    analysis: [
      { word: 'clave', pos: 'adj.', definition: '关键的，核心的', example: 'La fecha de entrega es un factor clave.', example_translation: '交货日期是一个关键因素。' },
      { word: 'punto', pos: 'm.', definition: '点，事项，议题', example: 'Este punto fue discutido en la reunión anterior.', example_translation: '这一事项在上次会议中已讨论过。' },
    ],
  },
  {
    date: '13.mar',
    sentence_original: 'La obra avanza según lo planificado.',
    sentence_translation: '工程按计划推进。',
    analysis: [
      { word: 'obra', pos: 'f.', definition: '工程，工地，施工', example: 'La obra fue paralizada por las lluvias.', example_translation: '施工因降雨被迫停工。' },
      { word: 'planificado', pos: 'adj.', definition: '计划好的，规划中的', example: 'Todo se realizó según lo planificado.', example_translation: '一切按计划进行。' },
    ],
  },
  {
    date: '14.mar',
    sentence_original: '¿Puedes enviar los datos hoy mismo?',
    sentence_translation: '你今天可以把数据发过来吗？',
    analysis: [
      { word: 'enviar', pos: 'tr.', definition: '发送，寄送，派遣', example: 'Envía el presupuesto antes del mediodía.', example_translation: '请在中午前发送报价单。' },
      { word: 'dato', pos: 'm.', definition: '数据，资料，信息', example: 'Los datos del sensor deben ser verificados.', example_translation: '传感器数据需要进行核实。' },
    ],
  },
  {
    date: '15.mar',
    sentence_original: 'El personal llegará esta tarde.',
    sentence_translation: '人员今天下午到达。',
    analysis: [
      { word: 'personal', pos: 'm.', definition: '人员，员工，人手', example: 'El personal de mantenimiento revisó la maquinaria.', example_translation: '维修人员检查了机械设备。' },
    ],
  },
  {
    date: '16.mar',
    sentence_original: 'Tenemos que replantear esta parte.',
    sentence_translation: '这一部分需要重新调整。',
    analysis: [
      { word: 'replantear', pos: 'tr.', definition: '重新考虑，重新调整，重新规划', example: 'Hay que replantear la estrategia de ejecución.', example_translation: '需要重新规划执行策略。' },
    ],
  },
  {
    date: '17.mar',
    sentence_original: 'El cliente pidió una reunión urgente.',
    sentence_translation: '客户要求召开紧急会议。',
    analysis: [
      { word: 'reunión', pos: 'f.', definition: '会议，会面', example: 'La reunión de seguimiento es los martes.', example_translation: '跟进会议定在每周二。' },
      { word: 'urgente', pos: 'adj.', definition: '紧急的，迫切的', example: 'Hay una solicitud urgente del director.', example_translation: '主任有一项紧急请求。' },
    ],
  },
  {
    date: '18.mar',
    sentence_original: 'Nos falta información para continuar.',
    sentence_translation: '我们缺少继续推进所需的信息。',
    analysis: [
      { word: 'faltar', pos: 'intr.', definition: '缺少，不足，欠缺', example: 'Falta la firma del responsable en este formulario.', example_translation: '这份表格上缺少负责人的签名。' },
      { word: 'continuar', pos: 'intr.', definition: '继续，持续，推进', example: 'Continuamos con las pruebas al día siguiente.', example_translation: '第二天我们继续进行测试。' },
    ],
  },
  {
    date: '19.mar',
    sentence_original: 'Este tema ya fue resuelto.',
    sentence_translation: '这个问题已经解决了。',
    analysis: [
      { word: 'resolver', pos: 'tr.', definition: '解决，处理，解答', example: 'El ingeniero resolvió el problema en menos de una hora.', example_translation: '工程师不到一小时就解决了问题。' },
      { word: 'tema', pos: 'm.', definition: '问题，议题，主题', example: 'El tema del presupuesto será tratado mañana.', example_translation: '预算问题将于明天讨论。' },
    ],
  },
  {
    date: '20.mar',
    sentence_original: 'El proyecto sigue en buen estado.',
    sentence_translation: '项目目前进展良好。',
    analysis: [
      { word: 'seguir', pos: 'intr.', definition: '继续，保持，跟进', example: 'La obra sigue sin interrupciones.', example_translation: '工程持续进行，没有中断。' },
      { word: 'estado', pos: 'm.', definition: '状态，状况，情况', example: 'Infórmame sobre el estado del pedido.', example_translation: '请告知我订单的状态。' },
    ],
  },
  {
    date: '21.mar',
    sentence_original: 'Avísanos si hay algún cambio.',
    sentence_translation: '如果有任何变动请通知我们。',
    analysis: [
      { word: 'avisar', pos: 'tr.', definition: '通知，告知，提醒', example: 'Avisa al supervisor si hay una incidencia.', example_translation: '如有问题请通知主管。' },
      { word: 'cambio', pos: 'm.', definition: '变更，变动，改变', example: 'Los cambios al diseño deben ser aprobados.', example_translation: '设计变更必须获得批准。' },
    ],
  },
  {
    date: '22.mar',
    sentence_original: 'Vamos a reorganizar las tareas.',
    sentence_translation: '我们来重新安排任务。',
    analysis: [
      { word: 'reorganizar', pos: 'tr.', definition: '重新组织，重新安排', example: 'Reorganizamos el equipo tras la salida de dos miembros.', example_translation: '两名成员离职后，我们重新调整了团队。' },
      { word: 'tarea', pos: 'f.', definition: '任务，工作，作业', example: 'Cada miembro del equipo tiene una tarea asignada.', example_translation: '团队每位成员都有分配的任务。' },
    ],
  },
  {
    date: '23.mar',
    sentence_original: 'El sistema está en fase de prueba.',
    sentence_translation: '系统处于测试阶段。',
    analysis: [
      { word: 'fase', pos: 'f.', definition: '阶段，期，相位', example: 'Estamos en la fase de puesta en marcha.', example_translation: '我们处于启动阶段。' },
      { word: 'prueba', pos: 'f.', definition: '测试，检验，试验', example: 'La prueba de carga se realizará el jueves.', example_translation: '负载测试将于周四进行。' },
    ],
  },
  {
    date: '24.mar',
    sentence_original: 'Hace falta mejorar la coordinación.',
    sentence_translation: '需要提升协调效率。',
    analysis: [
      { word: 'mejorar', pos: 'tr.', definition: '改善，提升，优化', example: 'Mejoramos el proceso para reducir el tiempo de entrega.', example_translation: '我们优化了流程以缩短交货时间。' },
      { word: 'coordinación', pos: 'f.', definition: '协调，统筹，配合', example: 'La coordinación entre áreas es fundamental.', example_translation: '部门间的协调配合至关重要。' },
    ],
  },
  {
    date: '25.mar',
    sentence_original: 'Esto podría generar un retraso.',
    sentence_translation: '这可能会导致延误。',
    analysis: [
      { word: 'generar', pos: 'tr.', definition: '产生，引起，造成', example: 'El fallo técnico generó costos adicionales.', example_translation: '技术故障产生了额外费用。' },
      { word: 'retraso', pos: 'm.', definition: '延误，延迟，推迟', example: 'El retraso en la entrega afectó la obra.', example_translation: '交货延误影响了工程进度。' },
    ],
  },
  {
    date: '26.mar',
    sentence_original: 'Estamos evaluando distintas opciones.',
    sentence_translation: '我们正在评估不同方案。',
    analysis: [
      { word: 'evaluar', pos: 'tr.', definition: '评估，评价，衡量', example: 'Evaluamos el riesgo antes de tomar la decisión.', example_translation: '我们在做决定前评估了风险。' },
      { word: 'opción', pos: 'f.', definition: '方案，选项，选择', example: 'Tenemos tres opciones para resolver el problema.', example_translation: '我们有三个解决问题的方案。' },
    ],
  },
  {
    date: '27.mar',
    sentence_original: 'El reporte estará listo mañana.',
    sentence_translation: '报告明天可以完成。',
    analysis: [
      { word: 'reporte', pos: 'm.', definition: '报告，汇报，报表', example: 'El reporte semanal debe entregarse los viernes.', example_translation: '周报须在每周五提交。' },
      { word: 'listo', pos: 'adj.', definition: '准备好的，完成的，就绪的', example: 'El sistema estará listo para las pruebas el lunes.', example_translation: '系统将于周一准备好进行测试。' },
    ],
  },
  {
    date: '28.mar',
    sentence_original: 'Confirma cuando recibas los documentos.',
    sentence_translation: '收到文件后请确认。',
    analysis: [
      { word: 'confirmar', pos: 'tr.', definition: '确认，证实，核实', example: 'Confirma la hora de llegada con el transportista.', example_translation: '请向运输方确认到达时间。' },
      { word: 'documento', pos: 'm.', definition: '文件，文档，单据', example: 'Los documentos técnicos deben estar firmados.', example_translation: '技术文件必须签字确认。' },
    ],
  },
  {
    date: '29.mar',
    sentence_original: 'Luego revisamos los aspectos técnicos.',
    sentence_translation: '技术部分我们之后再看。',
    analysis: [
      { word: 'aspecto', pos: 'm.', definition: '方面，环节，角度', example: 'Hay que considerar todos los aspectos del diseño.', example_translation: '需要考虑设计的各个方面。' },
    ],
  },
  {
    date: '30.mar',
    sentence_original: 'Estamos entrando en una fase importante.',
    sentence_translation: '我们正在进入一个重要阶段。',
    analysis: [
      { word: 'entrar', pos: 'intr.', definition: '进入，开始，迈入', example: 'Entramos en la fase de comisionamiento.', example_translation: '我们进入了调试阶段。' },
      { word: 'importante', pos: 'adj.', definition: '重要的，关键的，重大的', example: 'Es importante cumplir con los plazos establecidos.', example_translation: '遵守规定的期限非常重要。' },
    ],
  },
  {
    date: '31.mar',
    sentence_original: 'Gracias por la colaboración de todos.',
    sentence_translation: '感谢大家的配合。',
    analysis: [
      { word: 'colaboración', pos: 'f.', definition: '合作，配合，协作', example: 'Gracias a la colaboración del equipo, terminamos a tiempo.', example_translation: '得益于团队的协作，我们按时完工。' },
    ],
  },
  // ─── 2026年4月 ───
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
