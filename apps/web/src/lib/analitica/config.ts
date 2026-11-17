// Configuración de PostHog por variables de entorno (ADR 040). Sin NEXT_PUBLIC_POSTHOG_KEY la
// analítica queda apagada: ni el cliente ni el servidor envían nada.
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
export const POSTHOG_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, "");

export const analiticaActiva = (): boolean => POSTHOG_KEY.length > 0;
