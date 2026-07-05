// Registra los matchers de jest-dom (toBeInTheDocument, etc.).
// Seguro en entorno node (solo extiende expect; el cleanup del DOM lo hace
// automáticamente Testing Library con globals: true).
import "@testing-library/jest-dom/vitest";
