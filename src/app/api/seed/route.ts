import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST /api/seed - Seed the database with example data (includes admin user)
export async function POST() {
  try {
    // Clean existing data (order matters due to foreign keys)
    await db.interaction.deleteMany();
    await db.task.deleteMany();
    await db.lead.deleteMany();
    await db.pipelineStage.deleteMany();
    await db.whatsAppTemplate.deleteMany();
    await db.aIPrompt.deleteMany();
    await db.dailyMetric.deleteMany();
    await db.session.deleteMany();
    await db.account.deleteMany();
    await db.user.deleteMany();

    // ========================================
    // 1. ADMIN USER
    // ========================================
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await db.user.create({
      data: {
        name: 'Admin VidaCRM',
        email: 'admin@vidacrm.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    });

    const userId = adminUser.id;

    // ========================================
    // 2. PIPELINE STAGES (for admin user)
    // ========================================
    const stages = await db.$transaction([
      db.pipelineStage.create({
        data: {
          userId,
          name: 'Nuevo Lead',
          order: 1,
          color: '#3b82f6',
          objective: 'Primer contacto con el lead',
          entryCriteria: 'Lead ingresa al sistema',
          exitCriteria: 'Se realiza primer contacto',
          suggestedTask: 'Enviar mensaje de bienvenida por WhatsApp',
          whatsappTemplateKey: 'primer_contacto',
        },
      }),
      db.pipelineStage.create({
        data: {
          userId,
          name: 'Contactado',
          order: 2,
          color: '#8b5cf6',
          objective: 'Se estableció contacto con el lead',
          entryCriteria: 'Se envió o recibió primer mensaje',
          exitCriteria: 'El lead responde e inicia conversación',
          suggestedTask: 'Hacer seguimiento si no responde en 24hs',
          whatsappTemplateKey: 'seguimiento_sin_respuesta',
        },
      }),
      db.pipelineStage.create({
        data: {
          userId,
          name: 'Conversación Iniciada',
          order: 3,
          color: '#f59e0b',
          objective: 'Intercambio activo de mensajes con el lead',
          entryCriteria: 'El lead responde al contacto',
          exitCriteria: 'Se solicitan datos para cotización',
          suggestedTask: 'Identificar necesidades y explicar opciones',
          whatsappTemplateKey: 'retomar_conversacion',
        },
      }),
      db.pipelineStage.create({
        data: {
          userId,
          name: 'Datos Solicitados',
          order: 4,
          color: '#06b6d4',
          objective: 'Recopilar datos del lead para cotización',
          entryCriteria: 'Se solicitan datos para cotizar',
          exitCriteria: 'Se cuentan con todos los datos necesarios',
          suggestedTask: 'Solicitar datos faltantes para la cotización',
          whatsappTemplateKey: 'pedido_de_datos',
        },
      }),
      db.pipelineStage.create({
        data: {
          userId,
          name: 'Propuesta Enviada',
          order: 5,
          color: '#f97316',
          objective: 'Se envió propuesta de plan de salud',
          entryCriteria: 'Se envía cotización al lead',
          exitCriteria: 'El lead acepta, rechaza o negocia',
          suggestedTask: 'Seguimiento post-propuesta a las 48hs',
          whatsappTemplateKey: 'seguimiento_post_propuesta',
        },
      }),
      db.pipelineStage.create({
        data: {
          userId,
          name: 'Negociación',
          order: 6,
          color: '#ec4899',
          objective: 'Negociar condiciones del plan',
          entryCriteria: 'El lead quiere negociar o tiene objeciones',
          exitCriteria: 'El lead acepta o se pierde',
          suggestedTask: 'Agendar llamada para resolver dudas',
          whatsappTemplateKey: 'agendar_llamada',
        },
      }),
      db.pipelineStage.create({
        data: {
          userId,
          name: 'Cerrado Ganado',
          order: 7,
          color: '#22c55e',
          objective: 'Venta concretada',
          entryCriteria: 'El lead acepta la propuesta',
          exitCriteria: 'Se completa la afiliación',
          suggestedTask: 'Enviar confirmación y bienvenida al plan',
          whatsappTemplateKey: 'cierre',
        },
      }),
      db.pipelineStage.create({
        data: {
          userId,
          name: 'Cerrado Perdido',
          order: 8,
          color: '#ef4444',
          objective: 'Lead que no concretó la venta',
          entryCriteria: 'El lead rechaza o deja de responder',
          exitCriteria: 'Se descarta o se reactiva',
          suggestedTask: 'Marcar motivo de pérdida y evaluar reactivación en 30 días',
          whatsappTemplateKey: 'reactivacion_lead_frio',
        },
      }),
    ]);

    const [
      nuevoLead,
      contactado,
      conversacionIniciada,
      datosSolicitados,
      propuestaEnviada,
      negociacion,
      cerradoGanado,
      cerradoPerdido,
    ] = stages;

    // ========================================
    // 3. EXAMPLE LEADS (for admin user)
    // ========================================
    const now = new Date();
    const daysAgo = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d;
    };
    const hoursAgo = (hours: number) => {
      const d = new Date(now);
      d.setHours(d.getHours() - hours);
      return d;
    };
    const daysFromNow = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d;
    };

    const leads = await db.$transaction([
      // Lead 1: María en Nuevo Lead
      db.lead.create({
        data: {
          userId,
          firstName: 'María',
          lastName: 'González',
          phone: '+5491112345678',
          email: 'maria.gonzalez@email.com',
          channel: 'whatsapp',
          source: 'Facebook Ads - Planes de Salud',
          pipelineStageId: nuevoLead.id,
          planInterest: 'Plan 3100',
          currentCoverage: 'Ninguna',
          familyGroup: 'Individual',
          status: 'active',
          priority: 'high',
          responseStatus: 'pending',
          lastContact: hoursAgo(2),
          nextFollowUp: daysFromNow(1),
          followUpCount: 0,
          notes: 'Consultó por plan individual. Viene de publicidad en Facebook.',
        },
      }),
      // Lead 2: Juan en Contactado
      db.lead.create({
        data: {
          userId,
          firstName: 'Juan',
          lastName: 'Pérez',
          phone: '+5491198765432',
          email: 'juan.perez@gmail.com',
          channel: 'whatsapp',
          source: 'Google Ads',
          pipelineStageId: contactado.id,
          planInterest: 'Plan 2100',
          currentCoverage: 'OSDE 210',
          familyGroup: 'Pareja',
          status: 'active',
          priority: 'high',
          responseStatus: 'responded',
          lastContact: daysAgo(1),
          nextFollowUp: daysFromNow(0),
          followUpCount: 1,
          notes: 'Quiere cambiar de OSDE a algo más económico. Es para él y su esposa.',
        },
      }),
      // Lead 3: Valentina en Conversación Iniciada
      db.lead.create({
        data: {
          userId,
          firstName: 'Valentina',
          lastName: 'Rodríguez',
          phone: '+5491155667788',
          email: 'vale.rod@outlook.com',
          channel: 'instagram',
          source: 'Instagram DM',
          pipelineStageId: conversacionIniciada.id,
          planInterest: 'Plan 4100',
          currentCoverage: 'Swiss Medical',
          familyGroup: 'Familia (3 personas)',
          status: 'active',
          priority: 'medium',
          responseStatus: 'conversation_started',
          lastContact: daysAgo(2),
          nextFollowUp: daysFromNow(1),
          followUpCount: 2,
          notes: 'Interesada en el plan más completo para su familia. Tiene dudas sobre la red de clinics.',
        },
      }),
      // Lead 4: Carlos en Datos Solicitados
      db.lead.create({
        data: {
          userId,
          firstName: 'Carlos',
          lastName: 'Martínez',
          phone: '+5491144332211',
          email: 'carlos.martinez@empresa.com',
          channel: 'whatsapp',
          source: 'Referido - Juan Pérez',
          pipelineStageId: datosSolicitados.id,
          planInterest: 'Plan 3100',
          currentCoverage: 'Galeno',
          familyGroup: 'Pareja + 1 hijo',
          status: 'active',
          priority: 'high',
          responseStatus: 'responded',
          lastContact: daysAgo(1),
          nextFollowUp: daysFromNow(0),
          followUpCount: 3,
          notes: 'Faltan datos de su esposa para completar la cotización. Lo refirió Juan Pérez.',
        },
      }),
      // Lead 5: Lucía en Propuesta Enviada
      db.lead.create({
        data: {
          userId,
          firstName: 'Lucía',
          lastName: 'Fernández',
          phone: '+5491177889900',
          email: 'lucia.f@hotmail.com',
          channel: 'whatsapp',
          source: 'Landing Page',
          pipelineStageId: propuestaEnviada.id,
          planInterest: 'Plan 2100',
          currentCoverage: 'Ninguna',
          familyGroup: 'Individual',
          status: 'active',
          priority: 'medium',
          responseStatus: 'responded',
          lastContact: daysAgo(3),
          nextFollowUp: daysAgo(1),
          followUpCount: 4,
          notes: 'Se le envió propuesta hace 3 días. No ha respondido aún. Cotización: $85.000/mes.',
        },
      }),
      // Lead 6: Roberto en Negociación
      db.lead.create({
        data: {
          userId,
          firstName: 'Roberto',
          lastName: 'López',
          phone: '+5491166554433',
          email: 'roberto.lopez@yahoo.com.ar',
          channel: 'whatsapp',
          source: 'Google Ads',
          pipelineStageId: negociacion.id,
          planInterest: 'Plan 4100',
          currentCoverage: 'Medifé',
          familyGroup: 'Familia (4 personas)',
          status: 'active',
          priority: 'high',
          responseStatus: 'conversation_started',
          lastContact: daysAgo(1),
          nextFollowUp: daysFromNow(1),
          followUpCount: 5,
          notes: 'Está negociando el precio. Pide descuento por grupo familiar grande. Cotización original: $180.000/mes.',
        },
      }),
      // Lead 7: Ana en Cerrado Ganado
      db.lead.create({
        data: {
          userId,
          firstName: 'Ana',
          lastName: 'Sánchez',
          phone: '+5491133221100',
          email: 'ana.sanchez@gmail.com',
          channel: 'whatsapp',
          source: 'Referido - María González',
          pipelineStageId: cerradoGanado.id,
          planInterest: 'Plan 3100',
          currentCoverage: 'Ninguna',
          familyGroup: 'Pareja',
          status: 'won',
          priority: 'medium',
          responseStatus: 'responded',
          lastContact: daysAgo(5),
          followUpCount: 6,
          finalResult: 'won',
          notes: 'Aceptó Plan 3100 para ella y su esposo. Afiliación en proceso.',
        },
      }),
      // Lead 8: Diego en Cerrado Perdido
      db.lead.create({
        data: {
          userId,
          firstName: 'Diego',
          lastName: 'Torres',
          phone: '+5491199887766',
          channel: 'facebook',
          source: 'Facebook Messenger',
          pipelineStageId: cerradoPerdido.id,
          planInterest: 'Plan 2100',
          currentCoverage: 'OSDE 210',
          familyGroup: 'Individual',
          status: 'lost',
          priority: 'low',
          responseStatus: 'not_responding',
          lastContact: daysAgo(15),
          followUpCount: 3,
          finalResult: 'lost_price',
          notes: 'Dijo que era muy caro. Ya tiene OSDE 210 y no quiere cambiar. Posible reactivación en 2 meses.',
        },
      }),
    ]);

    const [maria, juan, valentina, carlos, lucia, roberto, ana, diego] = leads;

    // ========================================
    // 4. TASKS (for admin user)
    // ========================================
    await db.$transaction([
      db.task.create({
        data: {
          userId,
          leadId: maria.id,
          title: 'Enviar mensaje de bienvenida',
          description: 'Usar template de primer contacto para María González',
          type: 'follow_up',
          dueDate: daysFromNow(0),
          completed: false,
        },
      }),
      db.task.create({
        data: {
          userId,
          leadId: juan.id,
          title: 'Llamar a Juan para entender necesidades',
          description: 'Preguntar por qué quiere dejar OSDE y qué busca en el nuevo plan',
          type: 'call',
          dueDate: daysFromNow(0),
          completed: false,
        },
      }),
      db.task.create({
        data: {
          userId,
          leadId: juan.id,
          title: 'Enviar info Plan 2100',
          description: 'Enviar PDF con beneficios del Plan 2100',
          type: 'send_info',
          dueDate: daysAgo(1),
          completed: true,
          completedAt: daysAgo(1),
        },
      }),
      db.task.create({
        data: {
          userId,
          leadId: carlos.id,
          title: 'Solicitar datos de la esposa',
          description: 'Necesitamos edad y DNI de la esposa para completar la cotización',
          type: 'follow_up',
          dueDate: daysFromNow(0),
          completed: false,
        },
      }),
      db.task.create({
        data: {
          userId,
          leadId: lucia.id,
          title: 'Seguimiento post-propuesta',
          description: 'Llamar a Lucía para ver si revisó la propuesta',
          type: 'follow_up',
          dueDate: daysAgo(1),
          completed: false,
        },
      }),
      db.task.create({
        data: {
          userId,
          leadId: roberto.id,
          title: 'Agendar reunión para negociar',
          description: 'Coordinar videollamada para discutir opciones de descuento grupal',
          type: 'meeting',
          dueDate: daysFromNow(1),
          completed: false,
        },
      }),
      db.task.create({
        data: {
          userId,
          leadId: ana.id,
          title: 'Enviar confirmación de afiliación',
          description: 'Enviar email con confirmación y datos de bienvenida al Plan 3100',
          type: 'send_info',
          dueDate: daysAgo(5),
          completed: true,
          completedAt: daysAgo(4),
        },
      }),
    ]);

    // ========================================
    // 5. INTERACTIONS (for admin user)
    // ========================================
    await db.$transaction([
      db.interaction.create({
        data: {
          userId,
          leadId: maria.id,
          type: 'note',
          content: 'Lead creado: María González',
          metadata: JSON.stringify({ action: 'lead_created' }),
          createdAt: hoursAgo(2),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: juan.id,
          type: 'note',
          content: 'Lead creado: Juan Pérez',
          metadata: JSON.stringify({ action: 'lead_created' }),
          createdAt: daysAgo(2),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: juan.id,
          type: 'whatsapp_sent',
          content: 'Mensaje de primer contacto enviado',
          metadata: JSON.stringify({ template: 'primer_contacto', tone: 'friendly' }),
          createdAt: daysAgo(2),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: juan.id,
          type: 'whatsapp_received',
          content: 'Juan responde: "Hola, sí, quiero info sobre los planes"',
          metadata: null,
          createdAt: daysAgo(1),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: juan.id,
          type: 'stage_change',
          content: 'Etapa cambiada: Nuevo Lead → Contactado',
          metadata: JSON.stringify({ from: 'Nuevo Lead', to: 'Contactado' }),
          createdAt: daysAgo(1),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: valentina.id,
          type: 'note',
          content: 'Lead creado: Valentina Rodríguez',
          metadata: JSON.stringify({ action: 'lead_created' }),
          createdAt: daysAgo(5),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: valentina.id,
          type: 'whatsapp_sent',
          content: 'Mensaje de primer contacto enviado por Instagram',
          metadata: JSON.stringify({ template: 'primer_contacto', channel: 'instagram' }),
          createdAt: daysAgo(5),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: valentina.id,
          type: 'whatsapp_received',
          content: 'Valentina: "Hola! Quería info sobre planes familiares"',
          metadata: null,
          createdAt: daysAgo(4),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: valentina.id,
          type: 'stage_change',
          content: 'Etapa cambiada: Contactado → Conversación Iniciada',
          metadata: JSON.stringify({ from: 'Contactado', to: 'Conversación Iniciada' }),
          createdAt: daysAgo(4),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: valentina.id,
          type: 'whatsapp_sent',
          content: 'Se enviaron detalles del Plan 4100 con cobertura familiar',
          metadata: null,
          createdAt: daysAgo(3),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: valentina.id,
          type: 'whatsapp_received',
          content: 'Valentina: "Me interesa, pero quiero saber si incluyen las clinics de Belgrano"',
          metadata: null,
          createdAt: daysAgo(2),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: carlos.id,
          type: 'note',
          content: 'Lead creado: Carlos Martínez (referido por Juan Pérez)',
          metadata: JSON.stringify({ action: 'lead_created', referredBy: 'Juan Pérez' }),
          createdAt: daysAgo(4),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: carlos.id,
          type: 'stage_change',
          content: 'Etapa cambiada: Nuevo Lead → Datos Solicitados',
          metadata: JSON.stringify({ from: 'Nuevo Lead', to: 'Datos Solicitados' }),
          createdAt: daysAgo(3),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: carlos.id,
          type: 'whatsapp_sent',
          content: 'Se solicitaron datos de grupo familiar para cotización',
          metadata: JSON.stringify({ template: 'pedido_de_datos', tone: 'friendly' }),
          createdAt: daysAgo(1),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: lucia.id,
          type: 'note',
          content: 'Lead creado: Lucía Fernández',
          metadata: JSON.stringify({ action: 'lead_created' }),
          createdAt: daysAgo(10),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: lucia.id,
          type: 'stage_change',
          content: 'Etapa cambiada: Datos Solicitados → Propuesta Enviada',
          metadata: JSON.stringify({ from: 'Datos Solicitados', to: 'Propuesta Enviada' }),
          createdAt: daysAgo(3),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: lucia.id,
          type: 'email',
          content: 'Propuesta enviada: Plan 2100 individual - $85.000/mes',
          metadata: JSON.stringify({ plan: 'Plan 2100', price: 85000 }),
          createdAt: daysAgo(3),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: roberto.id,
          type: 'note',
          content: 'Lead creado: Roberto López',
          metadata: JSON.stringify({ action: 'lead_created' }),
          createdAt: daysAgo(12),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: roberto.id,
          type: 'stage_change',
          content: 'Etapa cambiada: Propuesta Enviada → Negociación',
          metadata: JSON.stringify({ from: 'Propuesta Enviada', to: 'Negociación' }),
          createdAt: daysAgo(2),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: roberto.id,
          type: 'whatsapp_received',
          content: 'Roberto: "El precio está alto para 4 personas. ¿No hay descuento grupal?"',
          metadata: null,
          createdAt: daysAgo(2),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: roberto.id,
          type: 'call',
          content: 'Llamada con Roberto - discutió opciones de descuento por grupo familiar',
          metadata: JSON.stringify({ duration: '15min', outcome: 'Negociación en curso' }),
          createdAt: daysAgo(1),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: ana.id,
          type: 'note',
          content: 'Lead creado: Ana Sánchez',
          metadata: JSON.stringify({ action: 'lead_created' }),
          createdAt: daysAgo(15),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: ana.id,
          type: 'stage_change',
          content: 'Etapa cambiada: Negociación → Cerrado Ganado',
          metadata: JSON.stringify({ from: 'Negociación', to: 'Cerrado Ganado' }),
          createdAt: daysAgo(5),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: ana.id,
          type: 'task_completed',
          content: 'Tarea completada: Enviar confirmación de afiliación',
          metadata: JSON.stringify({ taskType: 'send_info' }),
          createdAt: daysAgo(4),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: diego.id,
          type: 'note',
          content: 'Lead creado: Diego Torres',
          metadata: JSON.stringify({ action: 'lead_created' }),
          createdAt: daysAgo(30),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: diego.id,
          type: 'stage_change',
          content: 'Etapa cambiada: Propuesta Enviada → Cerrado Perdido',
          metadata: JSON.stringify({ from: 'Propuesta Enviada', to: 'Cerrado Perdido' }),
          createdAt: daysAgo(15),
        },
      }),
      db.interaction.create({
        data: {
          userId,
          leadId: diego.id,
          type: 'whatsapp_received',
          content: 'Diego: "Gracias, pero es muy caro. Me quedo con OSDE"',
          metadata: null,
          createdAt: daysAgo(15),
        },
      }),
    ]);

    // ========================================
    // 6. WHATSAPP TEMPLATES (global, no userId)
    // ========================================
    await db.$transaction([
      db.whatsAppTemplate.create({
        data: {
          name: 'Primer Contacto',
          category: 'first_contact',
          formalText: 'Buenos días {nombre}, le contactamos de PlanVida Argentina en relación a su consulta sobre planes de salud. Nos gustaría brindarle información personalizada. ¿Podría indicarnos un horario conveniente para contactarle?',
          friendlyText: '¡Hola {nombre}! 👋 Soy de PlanVida Argentina. Vi que te interesaban nuestros planes de salud. ¿Cuándo te viene bien que te llame para contarte las opciones?',
          briefText: 'Hola {nombre}, soy de PlanVida. ¿Cuándo podemos charlar sobre planes de salud?',
          isActive: true,
        },
      }),
      db.whatsAppTemplate.create({
        data: {
          name: 'Respuesta a Consulta',
          category: 'first_contact',
          formalText: 'Estimado/a {nombre}, gracias por su consulta. Le enviamos información detallada sobre nuestros planes de salud disponibles. Quedamos a su disposición para cualquier duda.',
          friendlyText: '¡Gracias por escribirnos, {nombre}! 😊 Te paso toda la info de nuestros planes de salud. Cualquier duda me decís.',
          briefText: 'Gracias por tu consulta, {nombre}. Te envío info de los planes.',
          isActive: true,
        },
      }),
      db.whatsAppTemplate.create({
        data: {
          name: 'Pedido de Datos',
          category: 'follow_up',
          formalText: 'Estimado/a {nombre}, para poder brindarle una cotización personalizada necesitamos algunos datos: edad, grupo familiar y cobertura actual. ¿Podría proporcionárnoslos?',
          friendlyText: '{nombre}, para armar una cotización que se ajuste a lo que necesitás, me vendría bien saber: tu edad, si es para vos solo o grupo familiar, y si tenés alguna cobertura ahora. 😊',
          briefText: '{nombre}, necesito tu edad, grupo familiar y cobertura actual para cotizar.',
          isActive: true,
        },
      }),
      db.whatsAppTemplate.create({
        data: {
          name: 'Seguimiento Sin Respuesta',
          category: 'follow_up',
          formalText: 'Estimado/a {nombre}, le escribimos nuevamente ya que no hemos recibido respuesta a nuestro mensaje anterior. Seguimos a su disposición para informarle sobre nuestros planes de salud.',
          friendlyText: '¡Hola {nombre}! 👋 No tuve noticias tuyas y no quería que te quedes sin info. ¿Todavía estás interesado/a en los planes de salud?',
          briefText: '{nombre}, ¿seguís interesado/a en los planes de salud?',
          isActive: true,
        },
      }),
      db.whatsAppTemplate.create({
        data: {
          name: 'Seguimiento Post Propuesta',
          category: 'proposal',
          formalText: 'Estimado/a {nombre}, nos comunicamos para saber si ha podido revisar la propuesta que le enviamos. Estamos disponibles para aclarar cualquier consulta o ajustar la cobertura según sus necesidades.',
          friendlyText: '¡Hola {nombre}! ¿Pudiste ver la propuesta que te mandé? Si tenés dudas o querés cambiar algo, decime y lo ajustamos. 😊',
          briefText: '{nombre}, ¿viste la propuesta? ¿Tenés dudas?',
          isActive: true,
        },
      }),
      db.whatsAppTemplate.create({
        data: {
          name: 'Cierre',
          category: 'closing',
          formalText: 'Estimado/a {nombre}, le confirmamos que la propuesta presentada se encuentra vigente hasta el final del mes. Para proceder con la afiliación necesitamos su confirmación. Quedamos a la espera.',
          friendlyText: '{nombre}, la propuesta que te mandé tiene vigencia hasta fin de mes. Si te cierra, confirmame y arrancamos con la afiliación. 🎉',
          briefText: '{nombre}, la propuesta vence fin de mes. ¿Confirmamos?',
          isActive: true,
        },
      }),
      db.whatsAppTemplate.create({
        data: {
          name: 'Reactivación Lead Frío',
          category: 'reactivation',
          formalText: 'Estimado/a {nombre}, notamos que no hemos podido avanzar con su consulta sobre planes de salud. Queremos informarle que tenemos nuevas opciones y promociones disponibles. ¿Le interesaría revisarlas?',
          friendlyText: '¡Hola {nombre}! 👋 Hace un tiempo charlamos sobre planes de salud. Tuvimos algunas novedades y promos nuevas. ¿Te interesa que te cuente?',
          briefText: '{nombre}, tenemos promos nuevas en planes de salud. ¿Te interesa?',
          isActive: true,
        },
      }),
      db.whatsAppTemplate.create({
        data: {
          name: 'Agendar Llamada',
          category: 'scheduling',
          formalText: 'Estimado/a {nombre}, nos gustaría agendar una llamada para explicar en detalle las opciones de planes de salud. ¿Qué día y horario le resulta conveniente?',
          friendlyText: '¡Hola {nombre}! ¿Te parece si agendamos una llamadita para contarte todo bien? ¿Qué día y horario te viene mejor? 📞',
          briefText: '{nombre}, ¿cuándo podés para una llamada sobre los planes?',
          isActive: true,
        },
      }),
      db.whatsAppTemplate.create({
        data: {
          name: 'Retomar Conversación',
          category: 'follow_up',
          formalText: 'Estimado/a {nombre}, retomamos contacto ya que quedó pendiente nuestra conversación sobre planes de salud. Estamos disponibles cuando lo desee.',
          friendlyText: '¡Hola {nombre}! Quedamos en seguir hablando sobre los planes y se me pasó. ¿Todo bien? ¿Seguimos? 😊',
          briefText: '{nombre}, ¿seguimos con lo de los planes de salud?',
          isActive: true,
        },
      }),
    ]);

    // ========================================
    // 7. AI PROMPTS (global, no userId)
    // ========================================
    await db.$transaction([
      db.aIPrompt.create({
        data: {
          name: 'Resumir Conversación',
          category: 'analysis',
          promptText: 'Actuá como asistente de ventas de planes de salud en Argentina. Te paso una conversación de WhatsApp con un lead. Devolveme: 1) Resumen en 2 líneas. 2) Nivel de interés (Alto/Medio/Bajo). 3) Objeciones detectadas. 4) Etapa sugerida del pipeline (Nuevo Lead / Contactado / Conversación Iniciada / Datos Solicitados / Propuesta Enviada / Negociación / Cerrado). 5) Próximo paso sugerido. 6) Mensaje de WhatsApp sugerido para el próximo contacto (cercano, no formal). CONVERSACIÓN: {conversacion}',
          description: 'Analiza una conversación de WhatsApp y devuelve resumen, nivel de interés, objeciones y próximos pasos',
          isActive: true,
        },
      }),
      db.aIPrompt.create({
        data: {
          name: 'Follow Up por Etapa',
          category: 'follow_up',
          promptText: "Actuá como vendedor de planes de salud en Argentina. El lead {nombre} está en la etapa '{etapa}' del pipeline. Su último contacto fue {ultimo_contacto}. Escribí un mensaje de follow up por WhatsApp que sea cercano pero profesional, no más de 3 líneas, que invite a avanzar en el proceso de venta.",
          description: 'Genera un mensaje de follow up personalizado según la etapa del pipeline',
          isActive: true,
        },
      }),
      db.aIPrompt.create({
        data: {
          name: 'Clasificar Leads por Prioridad',
          category: 'classification',
          promptText: 'Actuá como asistente CRM. Te paso una lista de leads con su etapa, último contacto y respuestas. Clasificá cada uno como Prioridad ALTA, MEDIA o BAJA basándote en: cercanía de cierre, nivel de interacción, tiempo sin respuesta. Formato: NOMBRE - PRIORIDAD - MOTIVO. LEADS: {leads}',
          description: 'Clasifica una lista de leads en prioridades Alta, Media y Baja',
          isActive: true,
        },
      }),
      db.aIPrompt.create({
        data: {
          name: 'Reactivar Lead Frío',
          category: 'reactivation',
          promptText: "Actuá como vendedor de planes de salud en Argentina. El lead {nombre} lleva {dias_sin_respuesta} días sin responder. Estaba en etapa '{etapa}'. Escribí un mensaje de WhatsApp para reactivar el contacto que sea casual, no insistente, y que ofrezca valor (novedad, promo, info nueva). No más de 3 líneas.",
          description: 'Genera un mensaje para reactivar leads que no responden hace tiempo',
          isActive: true,
        },
      }),
      db.aIPrompt.create({
        data: {
          name: 'Leads a Contactar Hoy',
          category: 'daily_priority',
          promptText: 'Actuá como asistente de ventas. Te paso mi lista de leads activos con su etapa, próximo seguimiento y prioridad. Decime: 1) Quiénes debo contactar HOY sí o sí. 2) Quiénes puedo contactar si tengo tiempo. 3) Quiénes pueden esperar. Ordená por urgencia. LEADS: {leads}',
          description: 'Prioriza leads para contacto diario basándose en urgencia y oportunidad',
          isActive: true,
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Database seeded successfully',
      data: {
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        },
        pipelineStages: stages.length,
        leads: leads.length,
        tasks: 7,
        interactions: 25,
        whatsAppTemplates: 9,
        aiPrompts: 5,
      },
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}
