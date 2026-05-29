// Déclaration du global injecté à l'exécution par la plateforme.
export {}

declare global {
  interface Window {
    __SITE_CONTENT__?: any
  }
}
