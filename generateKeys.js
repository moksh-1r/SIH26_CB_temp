// Step 1: Import Node's built-in crypto and file-system modules (no npm install needed!)
const { generateKeyPairSync } = require('node:crypto');
const fs = require('fs');

console.log("Generating Ed25519 Cryptographic Keys...");

// Step 2: Generate an Ed25519 public and private key pair
const { publicKey, privateKey } = generateKeyPairSync('ed25519');

// Step 3: Convert the keys into standard text format (PEM)
const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const publicPem = publicKey.export({ type: 'spki', format: 'pem' });

// Step 4: Write the keys to physical text files in your project directory
fs.writeFileSync('private.pem', privatePem);
fs.writeFileSync('public.pem', publicPem);

console.log("Success! Created 'private.pem' and 'public.pem' in your folder.");