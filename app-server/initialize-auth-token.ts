import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';
import { join } from 'path';

const CONFIG_DIR = 'config';
const ENV_FILE = join(CONFIG_DIR, '.env.local');

// make sure the config directory exists
if (!existsSync(CONFIG_DIR)) {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

// read contents of ENV_FILE and parse into an object, if it exists otherwise create a new empty object
console.log(`Trying to reading environment variables from '${ENV_FILE}'...`);
const envVars = existsSync(ENV_FILE)
  ? Object.fromEntries(
      readFileSync(ENV_FILE, 'utf8')
        .split('\n')
        .map((line) => line.split('='))
        .filter(([key, value]) => key && value !== undefined)
        .map(([key, value]) => [key.trim(), value.trim()]),
    )
  : {};

if (!envVars['AUTH_SECRET']) {
  console.log(`'AUTH_SECRET' is not set. Generating a new secret...`);
  envVars['AUTH_SECRET'] = randomBytes(32).toString('hex');

  // write envVars to ENV_File file
  writeFileSync(
    ENV_FILE,
    Object.entries(envVars)
      .map(([k, v]) => `${k}="${v}"`)
      .join('\n') + '\n',
    'utf8',
  );
  console.log(`'AUTH_SECRET' has been written to ${ENV_FILE} file.`);
} else {
  console.log(`'AUTH_SECRET' is already set in ${ENV_FILE} file.`);
}
