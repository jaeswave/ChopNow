import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth";
import { ToastProvider } from "./ui";
import "./styles.css";
import { MetaProvider } from "./hooks/useMeta";

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
