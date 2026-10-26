import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentDataForm() {
  // Portal View Switcher: 'COLLEGE' or 'AICTE'
  const [activePortal, setActivePortal] = useState('COLLEGE');

  // Form input state for College Portal
  const [formData, setFormData] = useState({
    apaar_id: "APAAR-9988-1111",
    student_name: "Rahul Sharma",
    dob: "2005-08-15",
    aishe_code: "C-12345",
    course: "B.Tech Computer Engineering",
    academic_year: "2026-2027",
    admission_category: "Approved Intake",
    roll_number: "CSE2026045",
    institution_name: "D.J. Sanghvi College of Engineering"
  });

  const [qrPayload, setQrPayload] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  // Centralized Audit Log & Issued Credentials Database (Shared between portals)
  const [auditLogs, setAuditLogs] = useState([]);
  const [issuedCredentials, setIssuedCredentials] = useState([]);

  // Automated Logger with precise timestamps
  const addAuditLog = (actionType, description) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newLog = {
      id: Date.now(),
      action: actionType,
      college: formData.institution_name,
      aishe: formData.aishe_code,
      message: `${description} at ${formattedTime} on ${formattedDate}`,
      timestamp: `${formattedDate} ${formattedTime}`
    };

    setAuditLogs((prevLogs) => [newLog, ...prevLogs]);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

// 1. Issue Credential Handler (Connected to Express Backend & MongoDB Atlas)
 // 1. Issue Credential Handler (Local Generation without Backend)
  const handleGenerateQR = async (e) => {
    e.preventDefault();
    setVerificationResult(null);

    try {
      // Create local payload directly in the browser
      const payload = {
        apaar_id: formData.apaar_id,
        student_name: formData.student_name,
        dob: formData.dob,
        aishe_code: formData.aishe_code,
        course: formData.course,
        academic_year: formData.academic_year,
        admission_category: formData.admission_category,
        roll_number: formData.roll_number,
        institution_name: formData.institution_name
      };

      // Mock signature for local UI testing
      const mockSignature = "local_sig_" + Date.now();
      const issuedAt = new Date().toISOString();

      const payloadPackage = {
        payload: payload,
        signature: mockSignature,
        issued_at: issuedAt
      };

      setQrPayload(payloadPackage);

      // Save to global list for AICTE view
      setIssuedCredentials((prev) => [payloadPackage, ...prev.filter(item => item.payload.apaar_id !== formData.apaar_id)]);

      // Record Audit Trail
      addAuditLog("CREATE", `[${formData.institution_name}] Issued cryptographic badge for ${formData.student_name} (${formData.apaar_id})`);
    } catch (err) {
      console.error('Error generating local credential:', err);
      alert('Error generating credential badge.');
    }
  };

  // 2. Verify Credential Handler (Verifies via Backend API)
  const handleVerifyQR = async () => {
    if (!qrPayload) return;

    try {
      const response = await fetch('http://localhost:5000/api/verify-credential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qrPayload),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResult({
          success: true,
          status: "VERIFIED",
          message: data.message
        });
        addAuditLog("VERIFY", `[${formData.institution_name}] Signature verified for ${qrPayload.payload.student_name}`);
      } else {
        setVerificationResult({
          success: false,
          status: "TAMPERED",
          message: data.message
        });
        addAuditLog("SECURITY_ALERT", `[${formData.institution_name}] Signature verification failed for ${qrPayload.payload.student_name}`);
      }
    } catch (err) {
      setVerificationResult({
        success: false,
        status: "INVALID",
        message: "Failed to connect to verification server."
      });
    }
  };

  // 3. Modify Record Handler (Simulate Tampering)
  const handleSimulateTamper = () => {
    if (!qrPayload) return;

    const oldName = qrPayload.payload.student_name;
    const tamperedPackage = {
      ...qrPayload,
      payload: {
        ...qrPayload.payload,
        student_name: `${oldName} (TAMPERED - FAKE GRADE)`
      }
    };

    setQrPayload(tamperedPackage);
    setVerificationResult(null);

    addAuditLog("MODIFY", `[${formData.institution_name}] Modified student record details for ${oldName}`);
  };

  // 4. Delete Record Handler (Deletes from DB via API)
  const handleDeleteRecord = async () => {
    if (!qrPayload) return;

    const studentName = qrPayload.payload.student_name;
    const apaarId = qrPayload.payload.apaar_id;

    try {
      await fetch(`http://localhost:5000/api/students/${apaarId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Delete request failed:', err);
    }

    setQrPayload(null);
    setVerificationResult(null);

    // Remove from issued credentials registry
    setIssuedCredentials((prev) => prev.filter(item => item.payload.apaar_id !== apaarId));

    addAuditLog("DELETE", `[${formData.institution_name}] Deleted record for ${studentName} (${apaarId})`);
  };

  return (
    <div style={styles.pageBackground}>
      {/* Top Navbar with Live View Switcher */}
      <nav style={styles.navbar}>
        <div style={styles.navContainer}>
          <div style={styles.brandTitle}>
            <span style={styles.badgeGov}>AICTE ECOSYSTEM</span>
            <span style={styles.brandText}>National Student Academic Credentials Framework</span>
          </div>

          {/* Role Switcher Controls */}
          <div style={styles.portalSwitcher}>
            <button
              onClick={() => setActivePortal('COLLEGE')}
              style={{
                ...styles.switchBtn,
                backgroundColor: activePortal === 'COLLEGE' ? '#0284c7' : 'transparent',
                color: activePortal === 'COLLEGE' ? '#ffffff' : '#94a3b8'
              }}
            >
              🏫 College Portal (Ingestion)
            </button>
            <button
              onClick={() => setActivePortal('AICTE')}
              style={{
                ...styles.switchBtn,
                backgroundColor: activePortal === 'AICTE' ? '#0284c7' : 'transparent',
                color: activePortal === 'AICTE' ? '#ffffff' : '#94a3b8'
              }}
            >
              🏛️ AICTE Monitoring Portal
            </button>
          </div>
        </div>
      </nav>

      <main style={styles.mainContainer}>
        {/* ========================================================= */}
        {/* VIEW 1: COLLEGE PORTAL (Data Ingestion & Local Management) */}
        {/* ========================================================= */}
        {activePortal === 'COLLEGE' ? (
          <div style={styles.gridWrapper}>
            
            {/* Left Box: Student Registration Form */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>College Data Entry & Signing Node</h3>
                <p style={styles.cardSubtitle}>Connected Node: {formData.institution_name} ({formData.aishe_code})</p>
              </div>

              <form onSubmit={handleGenerateQR} style={styles.formContent}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>APAAR ID (National Identifier)</label>
                  <input type="text" name="apaar_id" value={formData.apaar_id} onChange={handleChange} required style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Student Legal Name</label>
                  <input type="text" name="student_name" value={formData.student_name} onChange={handleChange} required style={styles.input} />
                </div>

                <div style={styles.rowTwoCols}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} required style={styles.input} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>AISHE Code</label>
                    <input type="text" name="aishe_code" value={formData.aishe_code} onChange={handleChange} required style={styles.input} />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Course / Specialization</label>
                  <input type="text" name="course" value={formData.course} onChange={handleChange} required style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Admission Category (Seat Quota)</label>
                  <select name="admission_category" value={formData.admission_category} onChange={handleChange} style={styles.select}>
                    <option value="Approved Intake">Approved Intake (Regular)</option>
                    <option value="Supernumerary - NRI">Supernumerary - NRI Quota</option>
                    <option value="Supernumerary - OCI">Supernumerary - OCI Quota</option>
                    <option value="Supernumerary - Foreign National (FN)">Supernumerary - FN Quota</option>
                    <option value="Supernumerary - TFW">Tuition Fee Waiver (TFW)</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>College Roll Number</label>
                  <input type="text" name="roll_number" value={formData.roll_number} onChange={handleChange} required style={styles.input} />
                </div>

                <button type="submit" style={styles.btnPrimary}>
                  Sign & Issue Credential Badge
                </button>
              </form>
            </div>

            {/* Right Box: Live Signed Credential Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Verifiable Badge & Actions</h3>
                <p style={styles.cardSubtitle}>Cryptographically signed payload ready for verification</p>
              </div>

              {qrPayload ? (
                <div style={styles.badgeWrapper}>
                  <div style={styles.credentialCard}>
                    <div style={styles.certHeader}>
                      <span style={styles.certSeal}>🛡️ INSTITUTIONAL PRIVATE KEY SIGNED</span>
                      <h4 style={styles.certTitle}>{qrPayload.payload.institution_name}</h4>
                    </div>

                    <div style={styles.certGrid}>
                      <div><span style={styles.certLabel}>Student:</span> <strong>{qrPayload.payload.student_name}</strong></div>
                      <div><span style={styles.certLabel}>APAAR ID:</span> <code>{qrPayload.payload.apaar_id}</code></div>
                      <div><span style={styles.certLabel}>Course:</span> {qrPayload.payload.course}</div>
                      <div><span style={styles.certLabel}>Category:</span> {qrPayload.payload.admission_category}</div>
                    </div>

                    <div style={styles.qrContainer}>
                      <div style={styles.qrBox}>
                        <QRCodeSVG value={JSON.stringify(qrPayload)} size={140} level={"H"} includeMargin={true} />
                      </div>
                      <span style={styles.qrCaption}>Ed25519 Encoded Digital Seal</span>
                    </div>
                  </div>

                  <div style={styles.actionButtonGroup}>
                    <button type="button" onClick={handleVerifyQR} style={styles.btnSuccess}>Verify Signature</button>
                    <button type="button" onClick={handleSimulateTamper} style={styles.btnWarning}>Modify Record</button>
                    <button type="button" onClick={handleDeleteRecord} style={styles.btnDanger}>Delete Record</button>
                  </div>

                  {verificationResult && (
                    <div style={{
                      ...styles.alertBanner,
                      backgroundColor: verificationResult.success ? '#ecfdf5' : '#fef2f2',
                      borderColor: verificationResult.success ? '#10b981' : '#ef4444',
                      color: verificationResult.success ? '#065f46' : '#991b1b'
                    }}>
                      <div style={styles.alertTitle}>
                        {verificationResult.status === "VERIFIED" ? "🟢 AUTHENTIC RECORD" : "🔴 TAMPER ALERT"}
                      </div>
                      <div style={styles.alertMessage}>{verificationResult.message}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📜</div>
                  <h4>No Credential Active</h4>
                  <p>Issue a credential to inspect signed outputs and execute record modifications.</p>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 2: AICTE CENTRAL MONITORING PORTAL (Audit & Sync)    */
          /* ========================================================= */
          <div style={styles.aicteContainer}>
            
            {/* Top Metrics Row */}
            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Total Connected Institutions</span>
                <span style={styles.metricValue}>1,248</span>
              </div>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Verified APAAR Credentials</span>
                <span style={styles.metricValue}>{issuedCredentials.length}</span>
              </div>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Audit Logs Intercepted</span>
                <span style={styles.metricValue}>{auditLogs.length}</span>
              </div>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>System Integrity Status</span>
                <span style={{ ...styles.metricValue, color: '#10b981' }}>100% SECURE</span>
              </div>
            </div>

            <div style={styles.gridWrapper}>
              {/* Left Box: Central Audit Stream */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>📡 National Real-Time Audit Log Stream</h3>
                  <p style={styles.cardSubtitle}>Live broadcast of creation, modification, and deletion events across all colleges</p>
                </div>

                <div style={styles.auditList}>
                  {auditLogs.length === 0 ? (
                    <p style={styles.emptyAudit}>No incoming events from college nodes yet.</p>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} style={styles.auditItem}>
                        <span style={{
                          ...styles.logTag,
                          backgroundColor: log.action === 'DELETE' ? '#fef2f2' : log.action === 'MODIFY' ? '#fffbebfb' : '#f0fdf4',
                          color: log.action === 'DELETE' ? '#dc2626' : log.action === 'MODIFY' ? '#d97706' : '#16a34a',
                          borderColor: log.action === 'DELETE' ? '#fca5a5' : log.action === 'MODIFY' ? '#fcd34d' : '#86efac'
                        }}>
                          {log.action}
                        </span>
                        <span style={styles.logText}>{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Box: National Issued Registry */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>📚 AICTE Central Registry Snapshot</h3>
                  <p style={styles.cardSubtitle}>Registered student records verified by public keys</p>
                </div>

                <div style={styles.registryList}>
                  {issuedCredentials.length === 0 ? (
                    <p style={styles.emptyAudit}>No active credentials stored in registry snapshot.</p>
                  ) : (
                    issuedCredentials.map((item, index) => (
                      <div key={index} style={styles.registryCard}>
                        <div><strong>{item.payload.student_name}</strong> ({item.payload.apaar_id})</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Course: {item.payload.course} | Category: {item.payload.admission_category}
                        </div>
                        <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px' }}>
                          Verified via AISHE: {item.payload.aishe_code}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  pageBackground: { minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  navbar: { backgroundColor: '#0f172a', color: '#ffffff', padding: '16px 32px', borderBottom: '3px solid #0284c7' },
  navContainer: { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brandTitle: { display: 'flex', alignItems: 'center', gap: '12px' },
  badgeGov: { backgroundColor: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.5px' },
  brandText: { fontSize: '18px', fontWeight: '600' },
  portalSwitcher: { display: 'flex', gap: '8px', backgroundColor: '#1e293b', padding: '4px', borderRadius: '8px' },
  switchBtn: { border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  mainContainer: { maxWidth: '1200px', margin: '32px auto', padding: '0 16px' },
  gridWrapper: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' },
  card: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '28px', display: 'flex', flexDirection: 'column' },
  cardHeader: { marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' },
  cardTitle: { margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '600' },
  cardSubtitle: { margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' },
  formContent: { display: 'flex', flexDirection: 'column', gap: '14px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  rowTwoCols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#f8fafc', color: '#0f172a', outline: 'none' },
  select: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#f8fafc', color: '#0f172a', outline: 'none' },
  btnPrimary: { marginTop: '8px', padding: '12px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  badgeWrapper: { display: 'flex', flexDirection: 'column', gap: '16px' },
  credentialCard: { backgroundColor: '#f8fafc', border: '2px solid #0284c7', borderRadius: '10px', padding: '16px' },
  certHeader: { borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '12px', textAlign: 'center' },
  certSeal: { fontSize: '11px', color: '#0284c7', fontWeight: 'bold', letterSpacing: '0.5px' },
  certTitle: { margin: '4px 0 0 0', fontSize: '14px', color: '#0f172a' },
  certGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#334155' },
  certLabel: { color: '#64748b' },
  qrContainer: { marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  qrBox: { padding: '10px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' },
  qrCaption: { fontSize: '11px', color: '#166534', fontWeight: '600', marginTop: '6px' },
  actionButtonGroup: { display: 'flex', gap: '8px' },
  btnSuccess: { flex: 1, padding: '10px 6px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' },
  btnWarning: { flex: 1, padding: '10px 6px', backgroundColor: '#f59e0b', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' },
  btnDanger: { flex: 1, padding: '10px 6px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' },
  alertBanner: { padding: '12px', borderRadius: '8px', border: '1px solid', textAlign: 'center' },
  alertTitle: { fontWeight: '700', fontSize: '13px', marginBottom: '2px' },
  alertMessage: { fontSize: '12px' },
  emptyState: { margin: 'auto 0', padding: '40px 20px', textAlign: 'center', color: '#64748b' },
  emptyIcon: { fontSize: '48px', marginBottom: '12px' },
  aicteContainer: { display: 'flex', flexDirection: 'column', gap: '24px' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  metricCard: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' },
  metricLabel: { fontSize: '12px', color: '#64748b', fontWeight: '600' },
  metricValue: { fontSize: '22px', fontWeight: '700', color: '#0f172a' },
  auditList: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' },
  emptyAudit: { fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0 },
  auditItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9' },
  logTag: { fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', border: '1px solid' },
  logText: { fontSize: '12px', color: '#334155' },
  registryList: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' },
  registryCard: { padding: '12px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }
};