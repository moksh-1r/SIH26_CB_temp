const { verify, createPublicKey } = require('node:crypto');
const fs = require('fs');

console.log("Verifying QR Payload Authenticity...\n");

function verifyCredential(qrPayloadJsonString) {
  try {
    // 1. Parse the scanned QR Data
    const { payload, signature } = JSON.parse(qrPayloadJsonString);

    // 2. Load the Public Key (This would be fetched from your public AICTE database)
    const publicKeyPem = fs.readFileSync('public.pem', 'utf8');
    const publicKey = createPublicKey(publicKeyPem);

    // 3. Reconstruct Buffers
    const dataBuffer = Buffer.from(JSON.stringify(payload));
    const signatureBuffer = Buffer.from(signature, 'hex');

    // 4. Perform Mathematical Signature Check
    const isValid = verify(null, dataBuffer, publicKey, signatureBuffer);

    if (isValid) {
      console.log("--------------------------------------------------");
      console.log("🟢 VERIFICATION STATUS: [ AUTHENTIC RECORD ]");
      console.log("--------------------------------------------------");
      console.log(`Student Name : ${payload.student_name}`);
      console.log(`APAAR ID     : ${payload.apaar_id}`);
      console.log(`Degree       : ${payload.degree}`);
      console.log(`AISHE Code   : ${payload.aishe_code}`);
      console.log("--------------------------------------------------");
    } else {
      console.log("--------------------------------------------------");
      console.log("🔴 VERIFICATION STATUS: [ INVALID / TAMPERED RECORD ]");
      console.log("--------------------------------------------------");
    }
  } catch (err) {
    console.log("❌ Error reading QR payload format:", err.message);
  }
}

// Read the generated payload file and test it
const sampleQrData = fs.readFileSync('qrPayload.json', 'utf8');
verifyCredential(sampleQrData);