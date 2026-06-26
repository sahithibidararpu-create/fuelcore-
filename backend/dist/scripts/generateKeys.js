"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const keysDir = path_1.default.resolve('./keys');
if (!fs_1.default.existsSync(keysDir)) {
    fs_1.default.mkdirSync(keysDir, { recursive: true });
}
const { privateKey, publicKey } = (0, crypto_1.generateKeyPairSync)('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
fs_1.default.writeFileSync(path_1.default.join(keysDir, 'private.pem'), privateKey, { mode: 0o600 });
fs_1.default.writeFileSync(path_1.default.join(keysDir, 'public.pem'), publicKey, { mode: 0o644 });
console.log('✅ RS256 key pair generated:');
console.log('  - keys/private.pem (keep secret, do NOT commit)');
console.log('  - keys/public.pem');
//# sourceMappingURL=generateKeys.js.map