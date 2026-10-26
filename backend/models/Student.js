const mongoose = require('mongoose');

// Blueprint for student credentials in MongoDB Atlas
const StudentSchema = new mongoose.Schema({
  apaar_id: { type: String, required: true, unique: true },
  student_name: { type: String, required: true },
  dob: { type: String, required: true },
  aishe_code: { type: String, required: true },
  course: { type: String, required: true },
  academic_year: { type: String, required: true },
  admission_category: { type: String, required: true },
  roll_number: { type: String, required: true },
  institution_name: { type: String, required: true },
  signature: { type: String, required: true },
  issued_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', StudentSchema);