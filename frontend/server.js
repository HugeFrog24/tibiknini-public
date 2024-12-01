import { createRequestHandler } from "@remix-run/express";
import express from "express";
import * as build from "./build/index.js";

const app = express();
const mode = process.env.NODE_ENV || "development";
const port = process.env.PORT || 3000;

// Handle CORS preflight requests
app.options("*", (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

// Handle all other requests with Remix
app.all(
  "*",
  createRequestHandler({
    build,
    mode,
    getLoadContext(req, res) {
      return {};
    },
  })
);

app.listen(port, () => {
  console.log(`Remix server started on port ${port} in ${mode} mode`);
});
