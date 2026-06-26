import { generateKeyPairSync } from 'crypto';
import fs from 'fs';
import path from 'path';

const keysDir = path.resolve('./keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey, { mode: 0o600 });
fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey, { mode: 0o644 });

console.log('✅ RS256 key pair generated:');
console.log('  - keys/private.pem (keep secret, do NOT commit)');
console.log('  - keys/public.pem');
