import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/space-grotesk";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "./index.css";
import App from "./App.jsx";
import { AtmosphereProvider } from "./lib/atmosphere.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AtmosphereProvider>
        <App />
      </AtmosphereProvider>
    </BrowserRouter>
  </StrictMode>
);
