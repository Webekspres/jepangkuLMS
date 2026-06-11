import path from 'node:path';
import pino, { type Logger, type TransportTargetOptions } from 'pino';

export type { Logger };

const isDev = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info');

/** Folder output log di root repo — isi file di-gitignore, `.gitkeep` tetap di-track. */
export const LOG_DIR = path.join(process.cwd(), 'logs');
export const DEFAULT_LOG_FILE = path.join(LOG_DIR, 'jepangku-lms.log');

/** Path file log aktif; `null` jika `LOG_TO_FILE=false`. */
export function resolveLogFilePath(): string | null {
  if (process.env.LOG_TO_FILE === 'false') return null;
  const configured = process.env.LOG_FILE?.trim();
  if (!configured) return DEFAULT_LOG_FILE;
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

/**
 * Root logger JepangKu LMS — server-side only.
 *
 * Env:
 * - LOG_LEVEL — trace | debug | info | warn | error (default: debug dev, info prod)
 * - LOG_FILE — path file log (default: logs/jepangku-lms.log)
 * - LOG_TO_FILE — set `false` untuk nonaktifkan tulis ke file (hanya stdout)
 *
 * Dev: terminal (pino-pretty) + file JSON di `logs/`.
 * Prod: stdout JSON + file JSON (sama isi, beda tujuan).
 */
function createRootLogger(logFile: string | null): Logger {
  const base = {
    service: 'jepangku-lms',
    env: process.env.NODE_ENV ?? 'development',
  };

  const targets: TransportTargetOptions[] = [];

  if (isDev) {
    targets.push({
      target: 'pino-pretty',
      level: logLevel,
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname,service,env',
        messageFormat: '{module} | {msg}',
        destination: 1,
      },
    });
  } else {
    targets.push({
      target: 'pino/file',
      level: logLevel,
      options: { destination: 1 },
    });
  }

  if (logFile) {
    targets.push({
      target: 'pino/file',
      level: logLevel,
      options: { destination: logFile, mkdir: true },
    });
  }

  return pino({
    level: logLevel,
    base,
    transport: { targets },
  });
}

const globalForLogger = globalThis as unknown as {
  __jepangkuLogger?: Logger;
  __jepangkuLogFile?: string | null;
};

const activeLogFile =
  globalForLogger.__jepangkuLogFile ?? resolveLogFilePath();

const isNewLogger = !globalForLogger.__jepangkuLogger;

export const rootLogger =
  globalForLogger.__jepangkuLogger ?? createRootLogger(activeLogFile);

if (process.env.NODE_ENV !== 'production') {
  globalForLogger.__jepangkuLogger = rootLogger;
  globalForLogger.__jepangkuLogFile = activeLogFile;
}

if (activeLogFile && isNewLogger) {
  rootLogger.info({ logFile: activeLogFile }, 'File logging enabled');
}

/** Child logger per domain — selalu sertakan field `module` untuk filter di Core/partner. */
export function createLogger(module: string): Logger {
  return rootLogger.child({ module });
}

/** Logger siap pakai per area aplikasi */
export const loggers = {
  auth: createLogger('auth'),
  core: createLogger('core'),
  db: createLogger('db'),
  learning: createLogger('learning'),
  api: createLogger('api'),
  seed: createLogger('seed'),
  webhook: createLogger('webhook'),
} as const;

export { serializeError } from './serialize-error';
