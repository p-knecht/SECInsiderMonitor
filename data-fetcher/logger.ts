import * as winston from 'winston';

// create a logger to console with a timestamp and log level in uppercase next to the message
const logger: winston.Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // use LOG_LEVEL environment variable if set, otherwise default to 'info'
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}] ${message}`, // show timestamp and log level in uppercase next to the message
    ),
  ),
  transports: [
    new winston.transports.Console(), // print logs to console to allow log collection by docker
  ],
});

export default logger;
