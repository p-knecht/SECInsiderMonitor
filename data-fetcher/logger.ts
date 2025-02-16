import log4js from 'log4js';

// create a logger which logs to console and file
log4js.configure({
  appenders: {
    console: {
      // create configuration for console logging based on defined pattern
      type: 'console',
      layout: {
        type: 'pattern',
        pattern: '%[%d %z [%p]%] %m', // date, process id, log level, message; first three are colored based on log level
      },
    },
    file: {
      // create configuration for file logging with daily rotation, 30 days retention and custom pattern
      type: 'dateFile',
      filename: 'logs/datafetcher.log',
      pattern: 'yyyy-MM-dd',
      alwaysIncludePattern: true, // make sure the pattern is always included in the log file name, even on the first day
      keepFileExt: true, // make sure the log file extension is kept
      fileNameSep: '-',
      numBackups: 30, // keep 30 days of logs
      layout: {
        type: 'pattern',
        pattern: '%d %z [%p] %m', // date, process id, log level, message
      },
    },
  },
  categories: {
    default: { appenders: ['console', 'file'], level: process.env.LOG_LEVEL || 'info' },
  },
});

// create logger based on the configuration
const logger = log4js.getLogger();

export default logger;
