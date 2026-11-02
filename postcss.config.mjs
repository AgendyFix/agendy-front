import { fileURLToPath } from "node:url";

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Turbopack resuelve los plugins como módulos: un plugin local necesita ruta absoluta.
    [fileURLToPath(new URL("./postcss-color-mix-fallback.cjs", import.meta.url))]: {},
  },
};

export default config;
