/**
 * Datos de contacto y perfil — edita solo este archivo.
 * En frontend no hay .env para datos públicos: van en el bundle.
 * Centralizarlos aquí evita buscarlos por toda la web.
 */
export const site = {
  name: 'Francisco Javier Ruiz García',
  title: 'Arquitecto de sistemas de Inteligencia Artificial',
  email: 'fjavierRG26@outlook.com',
  phone: '+34 633 397 564',
  linkedin: 'https://www.linkedin.com/in/francisco-javier-ruiz-garcía-49950a182/',
  /** Texto corto para meta description y SEO */
  description:
    'Automatización de procesos e IA a medida. Agentes robustos, RAG, MCP y APIs — sin depender de plataformas de terceros.',
} as const;

export type SiteConfig = typeof site;
