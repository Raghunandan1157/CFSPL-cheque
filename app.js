/**
 * CFSPL Cheque Tracker — app.js
 * Handles login, dashboard logic, localStorage, and UI interactions.
 */

/* ═══════════════════════════════════════════
   THEME — runs immediately to prevent flash
═══════════════════════════════════════════ */

(function initTheme() {
  var saved = localStorage.getItem('cfspl_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();

function setupThemeToggle() {
  var currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateToggleIcons(currentTheme);

  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var html = document.documentElement;
      html.classList.add('theme-transitioning');
      var current = html.getAttribute('data-theme') || 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('cfspl_theme', next);
      updateToggleIcons(next);
      setTimeout(function () { html.classList.remove('theme-transitioning'); }, 350);
    });
  });
}

function updateToggleIcons(theme) {
  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    var moonIcon = btn.querySelector('.icon-moon');
    var sunIcon = btn.querySelector('.icon-sun');
    if (moonIcon) moonIcon.style.display = theme === 'dark' ? 'block' : 'none';
    if (sunIcon) sunIcon.style.display = theme === 'light' ? 'block' : 'none';
  });
}

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

  // Admin button
  const adminBtn = document.getElementById('adminLoginBtn');
  if (adminBtn) {
    adminBtn.addEventListener('click', function () {
      window.location.href = 'admin.html';
    });
  }
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

  // Photo upload elements
  const fieldPhoto      = document.getElementById('fieldPhoto');
  const photoDropZone   = document.getElementById('photoDropZone');
  const photoInput      = document.getElementById('chequePhoto');
  const photoPlaceholder= document.getElementById('photoPlaceholder');
  const photoPreview    = document.getElementById('photoPreview');
  const photoPreviewImg = document.getElementById('photoPreviewImg');
  const photoRemoveBtn  = document.getElementById('photoRemoveBtn');
  let currentPhotoData  = null;

  function handlePhotoFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showAlert(formAlert, formAlertT, 'Please select a valid image file.', 'error');
      formAlert.className = 'alert alert-error show';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert(formAlert, formAlertT, 'Image must be under 5 MB.', 'error');
      formAlert.className = 'alert alert-error show';
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      currentPhotoData = e.target.result;
      photoPreviewImg.src = currentPhotoData;
      photoPlaceholder.style.display = 'none';
      photoPreview.classList.add('active');
      photoInput.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    currentPhotoData = null;
    photoPreviewImg.src = '';
    photoPreview.classList.remove('active');
    photoPlaceholder.style.display = '';
    photoInput.style.display = '';
    photoInput.value = '';
  }

  if (photoInput) {
    photoInput.addEventListener('change', function () {
      if (this.files && this.files[0]) handlePhotoFile(this.files[0]);
    });
  }

  if (photoRemoveBtn) {
    photoRemoveBtn.addEventListener('click', clearPhoto);
  }

  if (photoDropZone) {
    photoDropZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      photoDropZone.classList.add('dragover');
    });
    photoDropZone.addEventListener('dragleave', function () {
      photoDropZone.classList.remove('dragover');
    });
    photoDropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      photoDropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handlePhotoFile(e.dataTransfer.files[0]);
      }
    });
  }

  function updateRadioUI(value) {
    if (value === 'Yes') {
      fieldLocation.classList.add('visible');
      fieldPhoto.classList.add('visible');
      fieldReason.classList.remove('visible');
      labelYes.classList.add('selected');
      labelNo.classList.remove('selected');
      document.getElementById('chequeReason').value = '';
    } else if (value === 'No') {
      fieldReason.classList.add('visible');
      fieldLocation.classList.remove('visible');
      fieldPhoto.classList.remove('visible');
      labelNo.classList.add('selected');
      labelYes.classList.remove('selected');
      document.getElementById('chequeLocation').value = '';
      clearPhoto();
    } else {
      fieldReason.classList.remove('visible');
      fieldLocation.classList.remove('visible');
      fieldPhoto.classList.remove('visible');
      labelYes.classList.remove('selected');
      labelNo.classList.remove('selected');
      clearPhoto();
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

      if (chequeReceived.value === 'Yes' && !currentPhotoData) {
        formAlert.className = 'alert alert-error show';
        showAlert(formAlert, formAlertT, 'Please attach a photo of the cheque.', 'error');
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
        photo:          chequeReceived.value === 'Yes' ? currentPhotoData : null,
        timestamp:      new Date().toISOString(),
      };

      const records = getRecords();
      records.push(record);
      saveRecords(records);

      // Reset form
      form.reset();
      clearPhoto();
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

    const photoCell = r.photo
      ? `<a href="${r.photo}" target="_blank"><img src="${r.photo}" alt="Cheque" style="width:40px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--border);cursor:pointer;" /></a>`
      : '<span style="color:var(--text-muted);font-size:0.75rem;">—</span>';

    return `
      <tr>
        <td>${sorted.length - idx}</td>
        <td>${escapeHTML(r.branch)}</td>
        <td>${escapedName}</td>
        <td>${escapedLoanId}</td>
        <td><span class="badge ${badgeClass}">${r.chequeReceived}</span></td>
        <td><strong style="color:var(--text-muted);font-size:0.75rem;">${detailLabel}:</strong> ${escapedDetail}</td>
        <td>${photoCell}</td>
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
          <th>Photo</th>
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
   ADMIN PAGE
═══════════════════════════════════════════ */

function initAdminPage() {
  const navOverview = document.getElementById('navOverview');
  const navReport   = document.getElementById('navReport');
  const pageOverview = document.getElementById('pageOverview');
  const pageReport   = document.getElementById('pageReport');
  const logoutBtn    = document.getElementById('adminLogoutBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar      = document.getElementById('adminSidebar');

  // Sidebar navigation
  function switchPage(page) {
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));

    if (page === 'overview') {
      navOverview.classList.add('active');
      pageOverview.classList.add('active');
      renderOverview();
    } else {
      navReport.classList.add('active');
      pageReport.classList.add('active');
      renderAdminReport();
    }

    // Close mobile sidebar
    if (sidebar) sidebar.classList.remove('open');
  }

  if (navOverview) navOverview.addEventListener('click', () => switchPage('overview'));
  if (navReport)   navReport.addEventListener('click',   () => switchPage('report'));

  // Mobile menu toggle
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      window.location.replace('index.html');
    });
  }

  // Initial render
  renderOverview();

  // ─── OVERVIEW ───
  function renderOverview() {
    const records = getRecords();
    const total = records.length;
    const received = records.filter(r => r.chequeReceived === 'Yes').length;
    const notReceived = records.filter(r => r.chequeReceived === 'No').length;
    const branches = [...new Set(records.map(r => r.branch))];

    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          </div>
          <div class="stat-value">${total}</div>
          <div class="stat-label">Total Records</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg>
          </div>
          <div class="stat-value">${received}</div>
          <div class="stat-label">Cheques Received</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          </div>
          <div class="stat-value">${notReceived}</div>
          <div class="stat-label">Not Received</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon gold">
            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <div class="stat-value">${branches.length}</div>
          <div class="stat-label">Active Branches</div>
        </div>
      `;
    }

    // Branch breakdown table
    const breakdownContainer = document.getElementById('branchBreakdownContainer');
    if (breakdownContainer) {
      if (total === 0) {
        breakdownContainer.innerHTML = '<div class="empty-state"><p>No records yet.</p></div>';
        return;
      }

      const branchData = {};
      records.forEach(r => {
        if (!branchData[r.branch]) branchData[r.branch] = { total: 0, yes: 0, no: 0 };
        branchData[r.branch].total++;
        if (r.chequeReceived === 'Yes') branchData[r.branch].yes++;
        else branchData[r.branch].no++;
      });

      const branchRows = Object.keys(branchData).sort().map(b => {
        const d = branchData[b];
        const pct = d.total > 0 ? Math.round((d.yes / d.total) * 100) : 0;
        return `<tr>
          <td style="font-weight:500;color:var(--white);">${escapeHTML(b)}</td>
          <td>${d.total}</td>
          <td><span class="badge badge-yes">${d.yes}</span></td>
          <td><span class="badge badge-no">${d.no}</span></td>
          <td>
            <div class="progress-bar-wrapper">
              <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width:${pct}%;"></div>
              </div>
              <span class="progress-bar-label">${pct}%</span>
            </div>
          </td>
        </tr>`;
      }).join('');

      breakdownContainer.innerHTML = `
        <table>
          <thead><tr>
            <th>Branch</th>
            <th>Total</th>
            <th>Received</th>
            <th>Not Received</th>
            <th>Collection Rate</th>
          </tr></thead>
          <tbody>${branchRows}</tbody>
        </table>`;
    }
  }

  // ─── REPORT WITH COLUMN FILTERING ───

  let activeFilters = {};

  const filterableColumns = [
    { key: 'branch', label: 'Branch' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'customerLoanId', label: 'Loan ID' },
    { key: 'chequeReceived', label: 'Cheque' },
  ];

  function getFilteredRecords() {
    let records = getRecords();
    Object.keys(activeFilters).forEach(key => {
      const values = activeFilters[key];
      if (values && values.length > 0) {
        records = records.filter(r => values.includes(r[key]));
      }
    });
    return records;
  }

  function getUniqueValues(key) {
    const records = getRecords();
    return [...new Set(records.map(r => r[key]))].sort();
  }

  function renderActiveFilters() {
    const container = document.getElementById('activeFilters');
    const tagsEl = document.getElementById('filterTags');
    if (!container || !tagsEl) return;

    const hasFilters = Object.values(activeFilters).some(v => v && v.length > 0);

    if (!hasFilters) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';

    let tagsHTML = '';
    Object.keys(activeFilters).forEach(key => {
      const col = filterableColumns.find(c => c.key === key);
      if (!col) return;
      activeFilters[key].forEach(val => {
        tagsHTML += `<span class="filter-tag">
          ${escapeHTML(col.label)}: ${escapeHTML(val)}
          <button class="filter-tag-remove" data-key="${key}" data-value="${escapeHTML(val)}">&times;</button>
        </span>`;
      });
    });

    tagsEl.innerHTML = tagsHTML;

    // Attach remove handlers
    tagsEl.querySelectorAll('.filter-tag-remove').forEach(btn => {
      btn.addEventListener('click', function () {
        const k = this.dataset.key;
        const v = this.dataset.value;
        activeFilters[k] = activeFilters[k].filter(x => x !== v);
        if (activeFilters[k].length === 0) delete activeFilters[k];
        renderAdminReport();
      });
    });
  }

  // Clear all filters
  const clearAllBtn = document.getElementById('clearAllFilters');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', function () {
      activeFilters = {};
      renderAdminReport();
    });
  }

  // Filter dropdown logic
  let currentFilterKey = null;
  let selectedFilterValues = [];

  function openFilterDropdown(key, thElement) {
    const dropdown = document.getElementById('filterDropdown');
    const overlay  = document.getElementById('filterOverlay');
    const title    = document.getElementById('filterDropdownTitle');
    const search   = document.getElementById('filterSearch');
    const options  = document.getElementById('filterOptions');

    if (!dropdown || !overlay) return;

    currentFilterKey = key;
    const col = filterableColumns.find(c => c.key === key);
    title.textContent = 'Filter: ' + (col ? col.label : key);

    const uniqueVals = getUniqueValues(key);
    selectedFilterValues = activeFilters[key] ? [...activeFilters[key]] : [];

    function renderOptions(filterText) {
      const filtered = filterText
        ? uniqueVals.filter(v => v.toLowerCase().includes(filterText.toLowerCase()))
        : uniqueVals;

      options.innerHTML = filtered.map(v => {
        const checked = selectedFilterValues.includes(v) ? 'checked' : '';
        const checkedClass = checked ? ' checked' : '';
        return `<label class="filter-option${checkedClass}">
          <input type="checkbox" value="${escapeHTML(v)}" ${checked} />
          ${escapeHTML(v)}
        </label>`;
      }).join('');

      options.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function () {
          if (this.checked) {
            if (!selectedFilterValues.includes(this.value)) selectedFilterValues.push(this.value);
          } else {
            selectedFilterValues = selectedFilterValues.filter(x => x !== this.value);
          }
          this.closest('.filter-option').classList.toggle('checked', this.checked);
        });
      });
    }

    search.value = '';
    renderOptions('');

    search.oninput = function () {
      renderOptions(this.value);
    };

    // Position dropdown near the header
    const rect = thElement.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 8) + 'px';
    dropdown.style.left = Math.min(rect.left, window.innerWidth - 296) + 'px';

    dropdown.style.display = 'block';
    overlay.style.display = 'block';
  }

  function closeFilterDropdown() {
    const dropdown = document.getElementById('filterDropdown');
    const overlay  = document.getElementById('filterOverlay');
    if (dropdown) dropdown.style.display = 'none';
    if (overlay)  overlay.style.display = 'none';
    currentFilterKey = null;
  }

  // Apply filter
  const applyBtn = document.getElementById('filterApplyBtn');
  if (applyBtn) {
    applyBtn.addEventListener('click', function () {
      if (currentFilterKey) {
        if (selectedFilterValues.length > 0) {
          activeFilters[currentFilterKey] = [...selectedFilterValues];
        } else {
          delete activeFilters[currentFilterKey];
        }
        renderAdminReport();
      }
      closeFilterDropdown();
    });
  }

  // Reset filter for current column
  const resetBtn = document.getElementById('filterResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (currentFilterKey) {
        delete activeFilters[currentFilterKey];
        renderAdminReport();
      }
      closeFilterDropdown();
    });
  }

  // Close button and overlay
  const closeBtn = document.getElementById('filterCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeFilterDropdown);
  const overlayEl = document.getElementById('filterOverlay');
  if (overlayEl) overlayEl.addEventListener('click', closeFilterDropdown);

  function renderAdminReport() {
    const container = document.getElementById('adminReportContainer');
    const countEl   = document.getElementById('adminRecordCount');
    if (!container) return;

    const records = getFilteredRecords();
    const allRecords = getRecords();

    if (countEl) {
      const showing = records.length;
      const total   = allRecords.length;
      countEl.textContent = showing === total
        ? (total === 1 ? '1 record' : total + ' records')
        : showing + ' of ' + total + ' records';
    }

    renderActiveFilters();

    if (allRecords.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No records yet.</p></div>';
      return;
    }

    if (records.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No records match the current filters.</p></div>';
      return;
    }

    const sorted = [...records].reverse();

    const rows = sorted.map((r, idx) => {
      const badgeClass = r.chequeReceived === 'Yes' ? 'badge-yes' : 'badge-no';
      const detailLabel = r.chequeReceived === 'Yes' ? 'Location' : 'Reason';
      const photoCell = r.photo
        ? '<a href="' + r.photo + '" target="_blank"><img src="' + r.photo + '" alt="Cheque" style="width:40px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--border);" /></a>'
        : '<span style="color:var(--text-muted);font-size:0.75rem;">—</span>';

      return '<tr>' +
        '<td>' + (sorted.length - idx) + '</td>' +
        '<td>' + escapeHTML(r.branch) + '</td>' +
        '<td>' + escapeHTML(r.customerName) + '</td>' +
        '<td>' + escapeHTML(r.customerLoanId) + '</td>' +
        '<td><span class="badge ' + badgeClass + '">' + r.chequeReceived + '</span></td>' +
        '<td><strong style="color:var(--text-muted);font-size:0.75rem;">' + detailLabel + ':</strong> ' + escapeHTML(r.detail || '—') + '</td>' +
        '<td>' + photoCell + '</td>' +
        '<td style="white-space:nowrap;">' + formatDate(r.timestamp) + '</td>' +
        '</tr>';
    }).join('');

    // Build header with filterable columns
    const headers = [
      { label: '#', key: null },
      { label: 'Branch', key: 'branch' },
      { label: 'Customer Name', key: 'customerName' },
      { label: 'Loan ID', key: 'customerLoanId' },
      { label: 'Cheque', key: 'chequeReceived' },
      { label: 'Details', key: null },
      { label: 'Photo', key: null },
      { label: 'Date & Time', key: null },
    ];

    const headerHTML = headers.map(h => {
      if (h.key) {
        const isFiltered = activeFilters[h.key] && activeFilters[h.key].length > 0;
        return '<th class="filterable' + (isFiltered ? ' filtered' : '') + '" data-filter-key="' + h.key + '">' + h.label + '</th>';
      }
      return '<th>' + h.label + '</th>';
    }).join('');

    container.innerHTML = '<table><thead><tr>' + headerHTML + '</tr></thead><tbody>' + rows + '</tbody></table>';

    // Attach click handlers for filterable headers
    container.querySelectorAll('th.filterable').forEach(th => {
      th.addEventListener('click', function () {
        openFilterDropdown(this.dataset.filterKey, this);
      });
    });
  }
}

/* ═══════════════════════════════════════════
   INIT — detect which page we're on
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {
  setupThemeToggle();

  const path = window.location.pathname;

  if (path.endsWith('dashboard.html')) {
    initDashboardPage();
  } else if (path.endsWith('admin.html')) {
    initAdminPage();
  } else {
    initLoginPage();
  }
});
