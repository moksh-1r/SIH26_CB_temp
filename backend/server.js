const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { sign, verify, createPrivateKey, createPublicKey } = require('node:crypto');
const fs = require('fs');

// Import the Student Model
const Student = require('./models/Student');

const app = express();

// ==========================================
// ENHANCED CORS & PREFLIGHT CONFIGURATION
// ==========================================
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Explicitly handle preflight requests for all routes
// app.options('*', cors());

app.use(bodyParser.json());

// ==========================================
// 1. CONNECT TO LOCAL MONGODB DATABASE
// ==========================================
mongoose.connect('mongodb://127.0.0.1:27017/aicte_db')
  .then(() => console.log('🍃 Connected to Local MongoDB Database Successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Load Cryptographic Keys
let privateKey, publicKey;
try {
  const privateKeyPem = fs.readFileSync('private.pem', 'utf8');
  const publicKeyPem = fs.readFileSync('public.pem', 'utf8');
  privateKey = createPrivateKey(privateKeyPem);
  publicKey = createPublicKey(publicKeyPem);
  console.log('🔑 Ed25519 Cryptographic Keys Loaded Successfully!');
} catch (err) {
  console.error('❌ Failed to load cryptographic keys from private.pem / public.pem:', err.message);
}

// Helper: Consistently stringify JSON to preserve key ordering for verification
function serializePayload(payload) {
  const orderedObj = {
    apaar_id: payload.apaar_id,
    student_name: payload.student_name,
    dob: payload.dob,
    aishe_code: payload.aishe_code,
    course: payload.course,
    academic_year: payload.academic_year,
    admission_category: payload.admission_category,
    roll_number: payload.roll_number,
    institution_name: payload.institution_name
  };
  return JSON.stringify(orderedObj);
}

// ==========================================
// API ENDPOINT 1: SIGN & SAVE CREDENTIAL TO MONGO
// ==========================================
app.post('/api/issue-credential', async (req, res) => {
  // Debug log to confirm if the request reached the backend
  console.log('📥 RECEIVED REQUEST AT /api/issue-credential:', req.body);

  try {
    const studentData = req.body;

    if (!studentData || !studentData.apaar_id) {
      return res.status(400).json({ success: false, message: "Invalid payload: apaar_id is required." });
    }

    // 1. Convert deterministic payload to Buffer
    const canonicalString = serializePayload(studentData);
    const dataBuffer = Buffer.from(canonicalString);

    // 2. Sign with Ed25519 Private Key
    const signatureBuffer = sign(null, dataBuffer, privateKey);
    const signatureHex = signatureBuffer.toString('hex');

    // 3. Upsert into MongoDB (Update if APAAR ID exists, Insert if new)
    const filter = { apaar_id: studentData.apaar_id };
    const update = {
      ...studentData,
      signature: signatureHex,
      issued_at: new Date()
    };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    const savedStudent = await Student.findOneAndUpdate(filter, update, options);
    console.log(`💾 Saved record to MongoDB for ${studentData.student_name} (${studentData.apaar_id})`);

    // 4. Return signed payload + signature to React
    res.json({
      success: true,
      payload: studentData,
      signature: signatureHex,
      issued_at: savedStudent.issued_at
    });
  } catch (err) {
    console.error("Save Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// API ENDPOINT 2: VERIFY CREDENTIAL SIGNATURE
// ==========================================
app.post('/api/verify-credential', (req, res) => {
  try {
    const { payload, signature } = req.body;

    if (!payload || !signature) {
      return res.status(400).json({
        success: false,
        status: "INVALID",
        message: "Missing payload or signature in request body."
      });
    }

    const canonicalString = serializePayload(payload);
    const dataBuffer = Buffer.from(canonicalString);
    const signatureBuffer = Buffer.from(signature, 'hex');

    // Perform Cryptographic Signature Check
    const isValid = verify(null, dataBuffer, publicKey, signatureBuffer);

    if (isValid) {
      res.json({
        success: true,
        status: "VERIFIED",
        message: "AUTHENTIC RECORD: Digital Signature Verified Successfully."
      });
    } else {
      res.json({
        success: false,
        status: "TAMPERED",
        message: "ALERT: Signature verification failed. Record altered or forged!"
      });
    }
  } catch (err) {
    res.status(400).json({ success: false, status: "INVALID", message: "Malformed Data Payload" });
  }
});

// ==========================================
// API ENDPOINT 3: FETCH ALL RECORDS FROM MONGO
// ==========================================
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ issued_at: -1 });
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// API ENDPOINT 4: DELETE STUDENT FROM MONGO
// ==========================================
app.delete('/api/students/:apaar_id', async (req, res) => {
  try {
    const { apaar_id } = req.params;
    await Student.findOneAndDelete({ apaar_id });
    console.log(`🗑️ Deleted record from MongoDB for APAAR ID: ${apaar_id}`);
    res.json({ success: true, message: `Record ${apaar_id} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 AICTE Cryptographic Server running at http://127.0.0.1:${PORT}`);
});