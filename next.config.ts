import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le repo parent (site-factory) a aussi un package-lock.json ; on fixe la racine
  // du workspace sur ce dossier pour que Turbopack ne remonte pas au parent.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
