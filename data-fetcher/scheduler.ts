import cron from 'node-cron';
import logger from './logger.js';
import fetcher from './fetcher.js';

// basic configuration
const CRON_SCHEDULE: string = '0 0 6 * * *'; // Run every day at 6 AM
const CRON_TIMEZONE: string = 'Europe/Zurich'; // Timezone for cron schedule
const RETRIES: number = 3; // number of retries if fetching script fails
const RETRY_INTERVAL: number = 60; // retry interval in minutes after failed attempts

// flag to prevent multiple executions of the fetcher script at the same time
let isRunning: boolean = false;

/**
 * Run the fetcher script asynchronously and retry if it fails
 *
 * @param {number} [currentAttempt=0] - defines the current attempt number. Default is 0.
 * @returns {Promise<void>} promise that resolves when the fetcher script is done
 */
async function runFetcherScript(currentAttempt: number = 0): Promise<void> {
  // stop if maximum number of retries is reached
  if (currentAttempt >= RETRIES) {
    logger.error(
      `Fetching SEC forms with fetcher.js finally failed after ${RETRIES} retries. Waiting for next cronjob execution...`,
    );
    isRunning = false;
    return;
  }

  // try to fetch SEC forms and retry if it fails
  try {
    await fetcher();
    isRunning = false;
  } catch (error) {
    logger.error(`Error fetching SEC forms with fetcher.js: ${error}`);
    logger.info(`Retrying in ${RETRY_INTERVAL} minutes...`);
    setTimeout(() => {
      // retry fetching after a defined interval asynchronously
      logger.info('Starting retry attempt...');
      runFetcherScript(currentAttempt + 1);
    }, RETRY_INTERVAL);
  }
}

// schedule the execution of fetcher cronjob
cron.schedule(
  CRON_SCHEDULE,
  () => {
    if (isRunning) {
      logger.info('A cronjob execution is already execution. Skipping this new cronjob execution.');
      return;
    }
    isRunning = true;
    runFetcherScript();
  },
  { scheduled: true, timezone: CRON_TIMEZONE },
);

logger.info('Fetcher cronjob scheduled successfully.');
logger.debug(`Used scheduling configuration:
    Schedule: ${CRON_SCHEDULE}
    Timezone: ${CRON_TIMEZONE}
    Retries: ${RETRIES}
    Retry Interval: ${RETRY_INTERVAL} minutes
`);
