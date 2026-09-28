#!/usr/bin/env node
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import * as path from 'node:path';

import { app } from './app';
import { Logger } from './modules/logging';

const logger = Logger.getLogger('server');

const CONNECTION_DRAIN_DELAY_MS = 4000;
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 5000;

let server: http.Server | https.Server | null = null;
let shutdownStarted = false;

// used by shutdownCheck in readinessChecks
app.locals.shutdown = false;

const port: number = Number.parseInt(process.env.PORT || '3344', 10);

if (app.locals.ENV === 'development') {
  const sslDirectory = path.join(__dirname, 'resources', 'localhost-ssl');
  const sslOptions = {
    cert: fs.readFileSync(path.join(sslDirectory, 'localhost.crt')),
    key: fs.readFileSync(path.join(sslDirectory, 'localhost.key')),
  };
  server = https.createServer(sslOptions, app);
  server.listen(port, () => {
    logger.info(`Application started: https://localhost:${port}`);
  });
} else {
  server = app.listen(port, () => {
    logger.info(`Application started: http://localhost:${port}`);
  });
}

function gracefulShutdownHandler(signal: string) {
  if (shutdownStarted) {
    return;
  }

  shutdownStarted = true;
  logger.info(`⚠️ Caught ${signal}, gracefully shutting down. Setting readiness to DOWN`);
  app.locals.shutdown = true;

  const forceExitTimer = setTimeout(() => {
    logger.info('Forcing application shutdown after timeout');
    server?.closeAllConnections();
    process.exit(1);
  }, CONNECTION_DRAIN_DELAY_MS + GRACEFUL_SHUTDOWN_TIMEOUT_MS);

  setTimeout(() => {
    logger.info('Shutting down application');
    if (!server) {
      clearTimeout(forceExitTimer);
      process.exit(0);
      return;
    }

    server.close(error => {
      clearTimeout(forceExitTimer);

      if (error) {
        logger.error(`Failed to close server: ${error.message}`);
        server?.closeAllConnections();
        process.exit(1);
        return;
      }

      logger.info('Server closed');
      process.exit(0);
    });
  }, CONNECTION_DRAIN_DELAY_MS);
}

process.on('SIGINT', gracefulShutdownHandler);
process.on('SIGTERM', gracefulShutdownHandler);
