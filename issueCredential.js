const { sign, createPrivateKey } = require('node:crypto');
const fs = require('fs');

console.log("Creating Cryptographically Signed Student Credential...\n");

// 1. Load your Private Key
const privateKeyPem = fs.readFileSync('private.pem', 'utf8');
const privateKey = createPrivateKey(privateKeyPem);

// 2. Define the Student Data (This represents data synced from the College ERP)
const studentData = {
  apaar_id: "APAAR-9988-1111",
  student_name: "Rahul Sharma",
  degree: "B.Tech Computer Engineering",
  aishe_code: "C-12345",
  year_of_passing: 2026,
  verification_status: "VERIFIED_AICTE"
};

// 3. Convert JSON data into a binary Buffer for signing
const dataBuffer = Buffer.from(JSON.stringify(studentData));

// 4. Generate the Digital Signature using Ed25519
// (In Node.js, Ed25519 takes null as the algorithm parameter)
const signatureBuffer = sign(null, dataBuffer, privateKey);
const signatureHex = signatureBuffer.toString('hex');

// 5. Package both the payload and signature together
const qrPackage = {
  payload: studentData,
  signature: signatureHex
};

// Convert to string format suitable for embedding into a QR Code
const qrPayloadString = JSON.stringify(qrPackage);

// Save the QR payload to a text file so you can inspect/test it
fs.writeFileSync('qrPayload.json', qrPayloadString);

console.log("✅ SUCCESS! Credential Signed Successfully.");
console.log("\n--- Generated Digital Signature (Hex) ---");
console.log(signatureHex);
console.log("\n--- Complete QR Payload JSON Saved to 'qrPayload.json' ---");