import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export async function getOrCreateDeviceId({
  env = process.env,
  homeDir = env.ZLBX_HOME || join(homedir(), '.zlbx_pay'),
  randomId = () => randomBytes(16).toString('hex'),
  now = () => new Date().toISOString(),
} = {}) {
  if (env.ZLBX_DEVICE_ID) return env.ZLBX_DEVICE_ID;
  const path = join(homeDir, 'device.json');
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8'));
    if (typeof parsed.device_id === 'string' && parsed.device_id.length > 0) return parsed.device_id;
  } catch (error) {
    if (error?.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
  }
  const deviceId = randomId();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify({ device_id: deviceId, created_at: now() }, null, 2), 'utf8');
  return deviceId;
}
