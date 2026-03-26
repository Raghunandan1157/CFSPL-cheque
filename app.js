/**
 * CFSPL Cheque Tracker — app.js
 * Handles login, dashboard logic, localStorage, and UI interactions.
 */

const CORRECT_PASSWORD = 'Nava@123';
const STORAGE_BRANCH   = 'cfspl_branch';
const STORAGE_RECORDS  = 'cfspl_records';

/* ═══════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════ */

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_RECORDS)) || [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_RECORDS, JSON.stringify(records));
}

function showAlert(alertEl, textEl, message, type) {
  alertEl.className = `alert alert-${type} show`;
  textEl.textContent = message;
}

function hideAlert(alertEl) {
  alertEl.classList.remove('show');
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  }) + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* ═══════════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════════ */

function initLoginPage() {
  // If already logged in, skip to dashboard
  if (localStorage.getItem(STORAGE_BRANCH)) {
    window.location.replace('dashboard.html');
    return;
  }

  const form        = document.getElementById('loginForm');
  const branchSel   = document.getElementById('branchSelect');
  const passwordInp = document.getElementById('passwordInput');
  const alertEl     = document.getElementById('loginAlert');
  const alertText   = document.getElementById('loginAlertText');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideAlert(alertEl);

    const branch   = branchSel.value.trim();
    const password = passwordInp.value;

    if (!branch) {
      showAlert(alertEl, alertText, 'Please select a branch to continue.', 'error');
      branchSel.focus();
      return;
    }

    if (!password) {
      showAlert(alertEl, alertText, 'Please enter your password.', 'error');
      passwordInp.focus();
      return;
    }

    if (password !== CORRECT_PASSWORD) {
      showAlert(alertEl, alertText, 'Incorrect password. Please try again.', 'error');
      passwordInp.value = '';
      passwordInp.focus();
      return;
    }

    // Success
    localStorage.setItem(STORAGE_BRANCH, branch);
    window.location.replace('dashboard.html');
  });
}

/* ═══════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════ */

function initDashboardPage() {
  const branch = localStorage.getItem(STORAGE_BRANCH);

  // Guard: not logged in
  if (!branch) {
    window.location.replace('index.html');
    return;
  }

  // Populate branch display
  const headerBranch  = document.getElementById('headerBranch');
  const branchSubtitle = document.getElementById('branchSubtitle');
  if (headerBranch)   headerBranch.textContent  = branch;
  if (branchSubtitle) branchSubtitle.textContent = `Managing cheque records for ${branch}`;

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      localStorage.removeItem(STORAGE_BRANCH);
      localStorage.removeItem(STORAGE_RECORDS);
      window.location.replace('index.html');
    });
  }

  // Radio buttons – show/hide conditional fields
  const radioYes     = document.getElementById('radioYes');
  const radioNo      = document.getElementById('radioNo');
  const labelYes     = document.getElementById('radioLabelYes');
  const labelNo      = document.getElementById('radioLabelNo');
  const fieldReason  = document.getElementById('fieldReason');
  const fieldLocation= document.getElementById('fieldLocation');

  function updateRadioUI(value) {
    if (value === 'Yes') {
      fieldLocation.classList.add('visible');
      fieldReason.classList.remove('visible');
      labelYes.classList.add('selected');
      labelNo.classList.remove('selected');
      document.getElementById('chequeReason').value = '';
    } else if (value === 'No') {
      fieldReason.classList.add('visible');
      fieldLocation.classList.remove('visible');
      labelNo.classList.add('selected');
      labelYes.classList.remove('selected');
      document.getElementById('chequeLocation').value = '';
    } else {
      fieldReason.classList.remove('visible');
      fieldLocation.classList.remove('visible');
      labelYes.classList.remove('selected');
      labelNo.classList.remove('selected');
    }
  }

  if (radioYes) radioYes.addEventListener('change', () => updateRadioUI('Yes'));
  if (radioNo)  radioNo.addEventListener('change',  () => updateRadioUI('No'));

  // Form submission
  const form       = document.getElementById('entryForm');
  const formAlert  = document.getElementById('formAlert');
  const formAlertT = document.getElementById('formAlertText');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert(formAlert);

      const customerName   = document.getElementById('customerName').value.trim();
      const customerLoanId = document.getElementById('customerLoanId').value.trim();
      const chequeReceived = document.querySelector('input[name="chequeReceived"]:checked');
      const chequeReason   = document.getElementById('chequeReason').value.trim();
      const chequeLocation = document.getElementById('chequeLocation').value.trim();

      // Validation
      if (!customerName) {
        showAlert(formAlert, formAlertT, 'Please enter the customer name.', 'error');
        formAlert.className = 'alert alert-error show';
        document.getElementById('customerName').focus();
        return;
      }

      if (!customerLoanId) {
        formAlert.className = 'alert alert-error show';
        showAlert(formAlert, formAlertT, 'Please enter the customer Loan ID.', 'error');
        document.getElementById('customerLoanId').focus();
        return;
      }

      if (!chequeReceived) {
        formAlert.className = 'alert alert-error show';
        showAlert(formAlert, formAlertT, 'Please select whether the cheque was received or not.', 'error');
        return;
      }

      if (chequeReceived.value === 'No' && !chequeReason) {
        formAlert.className = 'alert alert-error show';
        showAlert(formAlert, formAlertT, 'Please provide a reason for the cheque not being received.', 'error');
        document.getElementById('chequeReason').focus();
        return;
      }

      if (chequeReceived.value === 'Yes' && !chequeLocation) {
        formAlert.className = 'alert alert-error show';
        showAlert(formAlert, formAlertT, 'Please specify where the cheque is kept.', 'error');
        document.getElementById('chequeLocation').focus();
        return;
      }

      // Build record
      const record = {
        id:             Date.now(),
        branch:         branch,
        customerName:   customerName,
        customerLoanId: customerLoanId,
        chequeReceived: chequeReceived.value,
        detail:         chequeReceived.value === 'Yes' ? chequeLocation : chequeReason,
        timestamp:      new Date().toISOString(),
      };

      const records = getRecords();
      records.push(record);
      saveRecords(records);

      // Reset form
      form.reset();
      updateRadioUI(null);

      // Show success
      formAlert.className = 'alert alert-success show';
      showAlert(formAlert, formAlertT, `Record for "${customerName}" saved successfully!`, 'success');

      setTimeout(() => hideAlert(formAlert), 4000);

      // Re-render table
      renderTable();
    });
  }

  // Initial table render
  renderTable();
}

/* ═══════════════════════════════════════════
   RECORDS TABLE
═══════════════════════════════════════════ */

function renderTable() {
  const container   = document.getElementById('recordsContainer');
  const countEl     = document.getElementById('recordCount');
  if (!container) return;

  const records = getRecords();

  if (countEl) {
    countEl.textContent = records.length === 1 ? '1 record' : `${records.length} records`;
  }

  if (records.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm4-4h8v2h-8z"/></svg>
        <p>No records yet. Use the form above to add a cheque entry.</p>
      </div>`;
    return;
  }

  // Newest first
  const sorted = [...records].reverse();

  const rows = sorted.map((r, idx) => {
    const badgeClass = r.chequeReceived === 'Yes' ? 'badge-yes' : 'badge-no';
    const detailLabel = r.chequeReceived === 'Yes' ? 'Location' : 'Reason';
    const escapedDetail = escapeHTML(r.detail || '—');
    const escapedName   = escapeHTML(r.customerName);
    const escapedLoanId = escapeHTML(r.customerLoanId);

    return `
      <tr>
        <td>${sorted.length - idx}</td>
        <td>${escapeHTML(r.branch)}</td>
        <td>${escapedName}</td>
        <td>${escapedLoanId}</td>
        <td><span class="badge ${badgeClass}">${r.chequeReceived}</span></td>
        <td><strong style="color:var(--text-muted);font-size:0.75rem;">${detailLabel}:</strong> ${escapedDetail}</td>
        <td style="white-space:nowrap;">${formatDate(r.timestamp)}</td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Branch</th>
          <th>Customer Name</th>
          <th>Loan ID</th>
          <th>Cheque</th>
          <th>Details</th>
          <th>Date &amp; Time</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ═══════════════════════════════════════════
   INIT — detect which page we're on
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {
  const path = window.location.pathname;

  if (path.endsWith('dashboard.html')) {
    initDashboardPage();
  } else {
    // index.html or root
    initLoginPage();
  }
});
