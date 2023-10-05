// @ts-check
import {join} from "path";
import {readFileSync} from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import addFile from "./add-file.js";
import GDPRWebhookHandlers from "./gdpr.js";
import sqlite3 from "sqlite3";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({webhookHandlers: GDPRWebhookHandlers})
);

app.use("/api/*", shopify.validateAuthenticatedSession());

const db = new sqlite3.Database("database.sqlite");

app.use(express.json());

const getShopifySessions = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM shopify_sessions`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const addFileToStore = async () => {
  const rows = await getShopifySessions();
  await addFile(rows[0]);
};

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, {index: false}));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  addFileToStore();
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
