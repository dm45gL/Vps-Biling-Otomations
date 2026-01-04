import { createLogger, format, transports } from 'winston';
import path from 'path';

const logDir = path.join(__dirname, '../../logs'); // folder logs di root project

const logger = createLogger({
  level: 'info', // default level
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'admin-auth-service' },
  transports: [
    // Log untuk error
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    // Log untuk info
    new transports.File({ filename: path.join(logDir, 'combined.log') }),
  ],
});

// Jika sedang development, tampilkan juga di console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

export default logger;
