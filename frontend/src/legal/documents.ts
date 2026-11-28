/**
 * Única fuente de los textos legales. Cada afirmación describe lo que la app hace: si cambia qué datos se guardan,
 * dónde o para qué, actualiza el texto y sube `LEGAL_VERSION`.
 */
export const LEGAL_VERSION = "1.0";
export const LEGAL_DATE = "27 de noviembre de 2026";
const CONTACT = "contacto@domasystems.example";

export type LegalDocumentId = "terms" | "privacy";

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  id: LegalDocumentId;
  title: string;
  /** Nombre corto para enlaces y filas. */
  shortTitle: string;
  intro: string;
  sections: LegalSection[];
}

const terms: LegalDocument = {
  id: "terms",
  title: "Términos y condiciones",
  shortTitle: "Términos y condiciones",
  intro: "Estas son las reglas para usar MyOrbit. Al crear tu cuenta o seguir usándola después de aceptarlas, te comprometes a cumplirlas.",
  sections: [
    {
      heading: "1. Quién ofrece MyOrbit",
      paragraphs: [
        "MyOrbit es ofrecido por Doma Systems, un nombre ficticio creado para un proyecto académico universitario en Colombia. No es una empresa registrada.",
        `Contacto: ${CONTACT} (dirección de ejemplo del proyecto).`,
      ],
    },
    {
      heading: "2. Qué es el servicio",
      paragraphs: [
        "Una app web y para Android que ayuda a estudiantes universitarios a organizar tareas, agenda, materias y notas, hábitos y recordatorios. El uso es gratuito y no incluye publicidad.",
        "MyOrbit no está afiliada a ninguna universidad ni reemplaza sus sistemas oficiales.",
      ],
    },
    {
      heading: "3. Tu cuenta",
      bullets: [
        "Da un nombre y un correo reales y tuyos.",
        "Elige una contraseña segura y no la compartas. Lo que se haga con tu sesión se considera hecho por ti.",
        "Si eres menor de edad, necesitas la autorización de tu representante legal (madre, padre o acudiente).",
        "Puedes eliminar tu cuenta cuando quieras desde Perfil.",
      ],
    },
    {
      heading: "4. Uso permitido",
      paragraphs: ["Usa MyOrbit para tu organización personal y académica. No está permitido:"],
      bullets: [
        "Acceder o intentar acceder a cuentas o datos de otras personas.",
        "Interferir con el servicio, sobrecargarlo o buscar vulnerabilidades sin autorización.",
        "Guardar contenido ilegal, ofensivo o que vulnere derechos de terceros.",
        "Usar el servicio para suplantar a alguien o para fines comerciales.",
      ],
    },
    {
      heading: "5. Desactivación y eliminación de cuentas",
      paragraphs: [
        `Un administrador puede desactivar o eliminar una cuenta que incumpla estos términos o que ponga en riesgo el servicio. Si crees que fue un error, escribe a ${CONTACT}.`,
      ],
    },
    {
      heading: "6. Notas y cálculos académicos",
      paragraphs: [
        "Los promedios, las metas y la nota que necesitas se calculan con lo que tú registras y son orientativos. La única nota oficial es la de tu universidad. Verifica en sus canales antes de tomar decisiones.",
      ],
    },
    {
      heading: "7. Recordatorios y notificaciones",
      paragraphs: [
        "Los avisos son una ayuda y pueden llegar tarde o no llegar: dependen de la conexión, de los permisos, del ahorro de batería del teléfono y de que el servidor esté activo. No dependas solo de ellos para entregas o evaluaciones.",
      ],
    },
    {
      heading: "8. Disponibilidad y responsabilidad",
      paragraphs: [
        "Al ser un proyecto académico, el servicio se ofrece «como está», sin garantía de disponibilidad continua ni de que no tenga errores. Puede haber interrupciones, demoras o pérdida de información; conserva por tu cuenta lo que sea importante.",
        "En la medida que la ley lo permita, Doma Systems no responde por consecuencias académicas o de otro tipo derivadas de esas fallas. Nada de lo anterior limita los derechos que la ley colombiana te reconoce.",
      ],
    },
    {
      heading: "9. Tu contenido y la propiedad intelectual",
      paragraphs: [
        "Lo que escribes en MyOrbit es tuyo. Solo lo usamos para prestarte el servicio.",
        "El nombre, el logo, el diseño y el código de MyOrbit pertenecen a sus autores. No puedes presentarlos como propios.",
      ],
    },
    {
      heading: "10. Cambios y cierre del servicio",
      paragraphs: [
        "Si estos términos cambian, se publica una versión nueva y la app te pedirá aceptarla para continuar.",
        "El servicio puede suspenderse o cerrarse, por ejemplo al terminar el proyecto académico. En ese caso los datos se eliminarán.",
      ],
    },
    {
      heading: "11. Ley aplicable",
      paragraphs: ["Estos términos se rigen por las leyes de la República de Colombia."],
    },
  ],
};

const privacy: LegalDocument = {
  id: "privacy",
  title: "Política de tratamiento de datos personales",
  shortTitle: "Política de datos",
  intro: "Qué información guarda MyOrbit, para qué la usa y cómo puedes controlarla. Se rige por la Ley 1581 de 2012 y sus normas reglamentarias (Decreto 1074 de 2015).",
  sections: [
    {
      heading: "1. Responsable del tratamiento",
      paragraphs: [
        "Doma Systems, nombre ficticio de un proyecto académico universitario, con operación en Colombia.",
        `Canal para consultas y reclamos: ${CONTACT} (dirección de ejemplo del proyecto).`,
      ],
    },
    {
      heading: "2. Qué datos guardamos",
      bullets: [
        "Cuenta: nombre, correo, contraseña cifrada con un resumen irreversible (nunca en texto legible), rol, estado, fecha de creación y zona horaria.",
        "Perfil académico, si lo completas: programa, semestre y meta de promedio.",
        "Lo que registras: tareas y subtareas, categorías, semestres, materias y su horario, evaluaciones y notas, hábitos y sus días cumplidos, eventos y recordatorios.",
        "Notificaciones: los avisos generados, tus preferencias y los datos técnicos de tu navegador necesarios para enviarte avisos push, si los activas.",
        "Sesiones: un identificador de sesión con su fecha de vencimiento.",
      ],
    },
    {
      heading: "3. Para qué los usamos",
      bullets: [
        "Crear tu cuenta y reconocerte al entrar.",
        "Mostrarte y calcular tu información académica y de hábitos.",
        "Enviarte los recordatorios que tengas activos.",
        "Administrar las cuentas y mantener el servicio seguro y en funcionamiento.",
      ],
      paragraphs: ["No vendemos tus datos, no mostramos publicidad y no usamos herramientas de analítica ni de seguimiento."],
    },
    {
      heading: "4. Datos que no pedimos",
      paragraphs: [
        "MyOrbit no pide datos sensibles (salud, religión, orientación sexual, opiniones políticas, biometría, entre otros) ni documento de identidad. No los escribas en tareas, notas o eventos. Responder sobre datos sensibles nunca es obligatorio.",
      ],
    },
    {
      heading: "5. Menores de edad",
      paragraphs: [
        "Si tienes menos de 18 años puedes usar MyOrbit solo con la autorización de tu representante legal, que se otorga después de escuchar tu opinión. El tratamiento respeta tu interés superior y tus derechos fundamentales.",
        `Tu representante puede pedir en cualquier momento consultar, corregir o eliminar tus datos escribiendo a ${CONTACT}.`,
      ],
    },
    {
      heading: "6. Quién puede ver tus datos",
      bullets: [
        "Tú, desde tu cuenta.",
        "Los administradores de la app ven de cada cuenta el nombre, el correo, el rol, el estado y la fecha de creación.",
        "El equipo que mantiene el proyecto puede acceder a la base de datos cuando sea necesario para operarla o corregir fallas.",
        "Una autoridad, cuando la ley lo ordene.",
      ],
    },
    {
      heading: "7. Proveedores y tratamiento fuera de Colombia",
      paragraphs: [
        "Para funcionar, MyOrbit usa proveedores cuyos servidores pueden estar fuera de Colombia. Al autorizar el tratamiento aceptas esa transmisión.",
      ],
      bullets: [
        "MongoDB Atlas: base de datos.",
        "Render: servidor de la aplicación.",
        "Cloudflare: publicación de la app web.",
        "El servicio de notificaciones de tu navegador (por ejemplo Google, Mozilla o Apple), si activas los avisos push.",
      ],
    },
    {
      heading: "8. Datos en tu dispositivo",
      bullets: [
        "La app guarda en tu navegador o teléfono tu sesión, tus preferencias, una copia de tu información para usarla sin conexión y los cambios pendientes de enviar.",
        "En Android también programa avisos en el teléfono y, si agregas el widget, muestra tu agenda del día en la pantalla de inicio.",
        "Si tu teléfono hace copias de seguridad automáticas, Android puede incluir datos de la app en la copia de tu cuenta de Google.",
        "Al cerrar sesión se borra la copia de tu información. Los cambios que no alcanzaron a enviarse se conservan hasta que vuelvas a entrar.",
      ],
    },
    {
      heading: "9. Cuánto tiempo se conservan",
      paragraphs: [
        "Mientras tu cuenta exista y el servicio esté en funcionamiento. Las sesiones vencen solas.",
        "Al eliminar tu cuenta se borran de la base de datos tu cuenta y toda la información asociada. Los proveedores pueden conservar registros técnicos, como la dirección IP, o copias de respaldo durante un tiempo limitado según sus propias políticas.",
      ],
    },
    {
      heading: "10. Seguridad",
      paragraphs: [
        "Las contraseñas se guardan cifradas, cada cuenta solo accede a su información y el servicio publicado cifra la comunicación (HTTPS). Ningún sistema es infalible: si detectas un problema, avísanos.",
      ],
    },
    {
      heading: "11. Tus derechos",
      bullets: [
        "Conocer, actualizar y rectificar tus datos.",
        "Pedir prueba de la autorización que diste.",
        "Saber cómo se han usado tus datos.",
        "Revocar la autorización o pedir que se eliminen, cuando no haya un deber legal de conservarlos.",
        "Acceder gratis a tus datos.",
        "Presentar quejas ante la Superintendencia de Industria y Comercio, después de haber hecho tu consulta o reclamo ante el responsable.",
      ],
    },
    {
      heading: "12. Cómo ejercerlos",
      paragraphs: [
        "En la app puedes cambiar tu nombre y tu perfil académico, editar o borrar lo que registraste y eliminar tu cuenta (Perfil, «Eliminar mi cuenta»). Eliminar la cuenta revoca la autorización.",
        `Para lo demás, escribe a ${CONTACT} con tu nombre, el correo de tu cuenta y lo que pides.`,
        "Las consultas se responden en máximo 10 días hábiles, prorrogables 5 más. Los reclamos (corrección, eliminación o incumplimiento) en máximo 15 días hábiles, prorrogables 8 más. Si se necesita la prórroga, te informaremos el motivo.",
      ],
    },
    {
      heading: "13. Vigencia y cambios",
      paragraphs: [
        `Rige desde el ${LEGAL_DATE}. Las bases de datos se mantienen mientras el servicio esté activo.`,
        "Si esta política cambia de forma importante, se publica una versión nueva y la app te pedirá autorizarla para continuar.",
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = { terms, privacy };
