// mammoth n'embarque pas ses types — déclaration minimale pour l'extraction de
// texte brut (.docx) utilisée par /api/foundry/reviews/extract.
declare module "mammoth" {
  interface ExtractResult {
    value: string;
    messages: unknown[];
  }
  export function extractRawText(input: { buffer: Buffer } | { path: string }): Promise<ExtractResult>;
  const _default: { extractRawText: typeof extractRawText };
  export default _default;
}
