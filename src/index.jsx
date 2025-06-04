import React from "react";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";

Sentry.init({
  dsn: "https://6918530215805069ba44c8943e777796@o4509435684126720.ingest.de.sentry.io/4509441568079952",
  sendDefaultPii: true,
});

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
