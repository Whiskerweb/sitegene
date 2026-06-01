import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // App entièrement en français : les apostrophes/guillemets dans le JSX sont
  // légitimes (React les rend correctement). On coupe ce bruit stylistique.
  {
    rules: {
      "react/no-unescaped-entities": "off",
      // Lecture ponctuelle des query params au montage (SSR-safe) = pattern légitime ;
      // on informe sans casser le lint.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Bundles buildés + apps Vite autonomes des templates (toolchain/lint séparés ;
    // validées par leur propre `tsc --noEmit && vite build`). Jamais lintées ici.
    "public/_templates/**",
    "templates/**",
    ".intake-tmp/**",
  ]),
]);

export default eslintConfig;
