// Déclaration du global injecté à l'exécution par la plateforme.
// La forme réelle est validée côté plateforme ; ici on garde `any` pour ne pas
// dupliquer DEFAULT_CONTENT (content.ts caste vers `typeof DEFAULT_CONTENT`).
export {}

declare global {
  interface Window {
    __SITE_CONTENT__?: any
  }
}
