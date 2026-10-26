const { generateKeyPairSync } = require('node:crypto');
const fs = require('fs');

const { publicKey, privateKey } = generateKeyPairSync('ed25519');

const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const publicPem = publicKey.export({ type: 'spki', format: 'pem' });

fs.writeFileSync('private.pem', privatePem);
fs.writeFileSync('public.pem', publicPem);

console.log('✅ Ed25519 Private and Public keys generated!');