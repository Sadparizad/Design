// The global sheets are imported before App so they are injected before the component CSS
// modules. The other way round, a global text class would override a module rule that sets
// the same property at the same specificity.
import "./styles/tokens.css";
import "./styles/fonts.css";
import "./styles/text-styles.css";
import "./styles/base.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
