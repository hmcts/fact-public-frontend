import { Server } from 'http';
import { AddressInfo } from 'net';

import { app } from '../../../main/app';

let server: Server;
let port: number;

export function startTestServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address !== 'string') {
          port = (address as AddressInfo).port;
          const baseUrl = `http://localhost:${port}`;
          resolve(baseUrl);
        } else {
          reject(new Error('Server address is not available'));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function stopTestServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

export function getTestServerPort(): number {
  return port;
}
