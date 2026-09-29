/**
 * Utility to generate and download a professional Employee Leave Handover Note template
 * in Word-compatible (.doc) format.
 */

export const generateHandoverTemplateHtml = () => {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Employee Leave Handover Note Template</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1e293b;
      margin: 24pt;
    }
    h1 {
      font-size: 20pt;
      color: #0f172a;
      border-bottom: 2pt solid #4f46e5;
      padding-bottom: 6pt;
      margin-bottom: 4pt;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    h2 {
      font-size: 13pt;
      color: #312e81;
      background-color: #f1f5f9;
      padding: 6pt 8pt;
      margin-top: 16pt;
      margin-bottom: 8pt;
      border-left: 4pt solid #4f46e5;
    }
    .subtitle {
      font-size: 11pt;
      color: #64748b;
      margin-bottom: 18pt;
    }
    .instructions {
      background-color: #f8fafc;
      border: 1pt solid #cbd5e1;
      padding: 8pt 12pt;
      font-size: 9.5pt;
      color: #475569;
      margin-bottom: 16pt;
      border-radius: 4pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12pt;
      font-size: 10pt;
    }
    th, td {
      border: 1pt solid #cbd5e1;
      padding: 6pt 8pt;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: bold;
    }
    .meta-table td:first-child {
      width: 25%;
      font-weight: bold;
      background-color: #f8fafc;
      color: #334155;
    }
    .meta-table td:nth-child(2) {
      width: 25%;
    }
    .meta-table td:nth-child(3) {
      width: 25%;
      font-weight: bold;
      background-color: #f8fafc;
      color: #334155;
    }
    .meta-table td:nth-child(4) {
      width: 25%;
    }
    .field-hint {
      color: #94a3b8;
      font-style: italic;
    }
    .footer {
      margin-top: 24pt;
      border-top: 1pt solid #e2e8f0;
      padding-top: 8pt;
      font-size: 8.5pt;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>

  <h1>Employee Leave Handover Note</h1>
  <div class="subtitle">Official handover documentation for tasks, responsibilities, and key contacts during planned leave.</div>

  <div class="instructions">
    <strong>Instructions for the Employee:</strong> Complete this handover form before commencing your leave. Share and review this document with your designated Relief Officer / Delegate and Line Manager. Upload the completed document or summarize key points in the Leave Request form.
  </div>

  <h2>1. General Information</h2>
  <table class="meta-table">
    <tr>
      <td>Employee Name:</td>
      <td><span class="field-hint">[Your Full Name]</span></td>
      <td>Job Title / Role:</td>
      <td><span class="field-hint">[Your Job Title]</span></td>
    </tr>
    <tr>
      <td>Department / Team:</td>
      <td><span class="field-hint">[Department Name]</span></td>
      <td>Line Manager / Supervisor:</td>
      <td><span class="field-hint">[Manager Name]</span></td>
    </tr>
    <tr>
      <td>Leave Start Date:</td>
      <td><span class="field-hint">[DD/MM/YYYY]</span></td>
      <td>Leave End Date:</td>
      <td><span class="field-hint">[DD/MM/YYYY]</span></td>
    </tr>
    <tr>
      <td>Total Working Days:</td>
      <td><span class="field-hint">[Number of Days]</span></td>
      <td>Date of Return to Work:</td>
      <td><span class="field-hint">[DD/MM/YYYY]</span></td>
    </tr>
    <tr>
      <td>Relief Officer / Delegate:</td>
      <td><span class="field-hint">[Colleague Name]</span></td>
      <td>Relief Officer Email & Phone:</td>
      <td><span class="field-hint">[Email / Phone]</span></td>
    </tr>
  </table>

  <h2>2. Routine & Recurring Responsibilities</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Task / Responsibility</th>
        <th style="width: 15%;">Frequency</th>
        <th style="width: 40%;">Instructions & Operating Notes</th>
        <th style="width: 20%;">Assigned Delegate</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Daily standup / operational check</td>
        <td>Daily</td>
        <td>Attend morning check-in and provide updates on ongoing items.</td>
        <td>[Relief Officer]</td>
      </tr>
      <tr>
        <td>Customer / ticket queue monitoring</td>
        <td>Daily / Continuous</td>
        <td>Check incoming ticket queue every morning and assign urgency tags.</td>
        <td>[Relief Officer]</td>
      </tr>
      <tr>
        <td>Weekly team reporting</td>
        <td>Weekly (Fridays)</td>
        <td>Compile status report using the standard template in shared drive.</td>
        <td>[Delegate Name]</td>
      </tr>
      <tr>
        <td><span class="field-hint">[Add other routine tasks...]</span></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <h2>3. Active Projects & Pending Deliverables</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Project / Deliverable</th>
        <th style="width: 20%;">Current Status</th>
        <th style="width: 35%;">Action Required During Leave Period</th>
        <th style="width: 20%;">Key Stakeholders</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Project Alpha</strong></td>
        <td>In Progress - 70% complete</td>
        <td>Follow up with QA on test results; unblock staging deployments.</td>
        <td>Sarah J., David K.</td>
      </tr>
      <tr>
        <td><strong>Client Proposal Beta</strong></td>
        <td>Under Review</td>
        <td>Receive final client feedback and acknowledge via email.</td>
        <td>Client Relations Team</td>
      </tr>
      <tr>
        <td><span class="field-hint">[Add active project...]</span></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <h2>4. Critical Deadlines & Milestone Dates</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Due Date</th>
        <th style="width: 30%;">Item / Milestone</th>
        <th style="width: 25%;">Responsible Person</th>
        <th style="width: 25%;">Contingency / Escalation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>[DD/MM/YYYY]</td>
        <td>Monthly compliance report submission</td>
        <td>[Relief Officer]</td>
        <td>Escalate to Line Manager if data is delayed</td>
      </tr>
      <tr>
        <td><span class="field-hint">[Date]</span></td>
        <td><span class="field-hint">[Milestone description]</span></td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <h2>5. Key External & Internal Contacts</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Stakeholder / Contact Name</th>
        <th style="width: 25%;">Organization / Role</th>
        <th style="width: 25%;">Email & Phone</th>
        <th style="width: 25%;">Subject / Reason to Contact</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Jane Doe</td>
        <td>Partner / Vendor X</td>
        <td>jane@vendor.com | +1 555-0123</td>
        <td>Cloud infrastructure support contracts</td>
      </tr>
      <tr>
        <td><span class="field-hint">[Contact Name]</span></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <h2>6. Systems, Shared Drives & Access Delegations</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 30%;">System / Document / Folder</th>
        <th style="width: 35%;">Location / Link / Path</th>
        <th style="width: 35%;">Delegation Status & Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Project Documentation Folder</td>
        <td>Google Drive / Sharepoint: /Teams/Engineering/Alpha</td>
        <td>Full edit permissions granted to Relief Officer.</td>
      </tr>
      <tr>
        <td>CRM / Ticketing System</td>
        <td>Dashboard / Queue: Internal Support</td>
        <td>Out-of-office autoreply configured; tickets routed to Relief Officer.</td>
      </tr>
    </tbody>
  </table>
  <p style="font-size: 9pt; color: #dc2626; margin-top: 4pt;">
    * Note: Never share personal login credentials or passwords. Ensure delegations are set up via official administrative roles and shared accounts.
  </p>

  <h2>7. Emergency Contact Protocol</h2>
  <table class="meta-table">
    <tr>
      <td>May employee be contacted during leave?</td>
      <td colspan="3">[ ] Only in critical emergencies &nbsp;&nbsp;&nbsp;&nbsp; [ ] Strictly unavailable</td>
    </tr>
    <tr>
      <td>Emergency Contact Channel:</td>
      <td colspan="3">[Phone Number / Secondary Email]</td>
    </tr>
    <tr>
      <td>Criteria for Contact:</td>
      <td colspan="3">Severity 1 production issues or unforeseen regulatory requirements where no delegate has authority.</td>
    </tr>
  </table>

  <h2>8. Handover Sign-off & Acknowledgement</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 33%;">Handover Prepared By (Employee)</th>
        <th style="width: 33%;">Handover Received By (Relief Officer)</th>
        <th style="width: 34%;">Acknowledged By (Line Manager)</th>
      </tr>
    </thead>
    <tbody>
      <tr style="height: 60pt;">
        <td>
          <br><br>
          Signature: ______________________<br>
          Name: __________________________<br>
          Date: __________________________
        </td>
        <td>
          <br><br>
          Signature: ______________________<br>
          Name: __________________________<br>
          Date: __________________________
        </td>
        <td>
          <br><br>
          Signature: ______________________<br>
          Name: __________________________<br>
          Date: __________________________
        </td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    TradeVu HR Management System &bull; Employee Leave Handover Form &bull; Confidential &copy; ${new Date().getFullYear()}
  </div>

</body>
</html>`;
};

/**
 * Triggers a browser download of the Word-compatible (.doc) Handover Note Template.
 */
export const downloadHandoverTemplate = () => {
  const content = generateHandoverTemplateHtml();
  const blob = new Blob(['\ufeff', content], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Leave_Handover_Note_Template.doc';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
