import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { setApiUrl } from "./old-app/utils/api";

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
      <RemixBrowser />
    </StrictMode>
  );
});
