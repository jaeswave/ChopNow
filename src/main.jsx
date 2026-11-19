import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth";
import { ToastProvider } from "./ui";
import "./styles.css";
import { MetaProvider } from "./hooks/useMeta";
import { setupPwa } from "./pwa";
import { capturePreview } from "./config/launch";

setupPwa(); // app tags, install prompt and (in production) the service worker
capturePreview(window.location.search); // ?preview=<word>: unlocked before the first screen, so nothing flickers

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <MetaProvider>
          <App />
        </MetaProvider>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>,
);
