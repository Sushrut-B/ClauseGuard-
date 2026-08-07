type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class Logger {
  constructor(private serviceName: string) {}

  private format(level: LogLevel, message: string, meta?: Record<string, any>) {
    return {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      level,
      message,
      ...meta,
    };
  }

  info(message: string, meta?: Record<string, any>) {
    console.log(JSON.stringify(this.format('info', message, meta)));
  }

  warn(message: string, meta?: Record<string, any>) {
    console.warn(JSON.stringify(this.format('warn', message, meta)));
  }

  error(message: string, meta?: Record<string, any>) {
    console.error(JSON.stringify(this.format('error', message, meta)));
  }

  debug(message: string, meta?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify(this.format('debug', message, meta)));
    }
  }
}

export const logger = new Logger('contract-service');
