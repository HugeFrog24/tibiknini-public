import * as React from "react";
import { HydratedRouter } from "react-router/dom";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { setApiUrl } from "./utils/api";

// For client-side, we can use the current domain
const protocol = window.location.protocol;
const host = window.location.host;
// If we're running on dev server port (3000), use port 80 for API calls
const apiHost = host.includes(':3000') ? host.replace(':3000', '') : host;
setApiUrl(`${protocol}//${apiHost}`);

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
