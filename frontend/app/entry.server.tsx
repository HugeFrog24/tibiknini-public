import { PassThrough } from "stream";
import { type EntryContext, createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToPipeableStream } from "react-dom/server";
import { isbot } from "isbot";
import * as React from "react";
import { setApiUrl } from "./old-app/utils/api";
import { getApiUrl } from "./env.server";

const ABORT_DELAY = 5000;

// Set API URL once at server startup
setApiUrl(getApiUrl());

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const callbackName = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  return new Promise((resolve, reject) => {
    let didError = false;

    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        [callbackName]() {
          const body = new PassThrough();
          
          responseHeaders.set("Content-Type", "text/html");
          
          resolve(
            new Response(createReadableStreamFromReadable(body), {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            })
          );
          
          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          didError = true;
          console.error(error);
        },
      }
    );
    
    setTimeout(abort, ABORT_DELAY);
  });
}
