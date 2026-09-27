/**
 * ==============================================================================
 * SMART LOST AND FOUND — JAVASCRIPT FRONTEND LOGIC (script.js)
 * Designed for 1st-Year Engineering Hackathon Prototype
 * 
 * Key Concepts Demonstrated for Judges:
 * 1. DOM Element Selection (`document.getElementById`, `document.querySelectorAll`)
 * 2. Event Listeners (`change`, `submit`, `click`, `input`)
 * 3. Dynamic DOM Manipulation (creating HTML elements, real-time search & filter)
 * 4. State Management (tracking metric counters & feed items in memory)
 * 5. Client-Side Form Validation & UX Feedback (shake animations, glow states)
 * ==============================================================================
 */

// ==============================================================================
// 1. DATA STORES & STATE VARIABLES
// ==============================================================================

// Campus locations list used for populating dropdown options dynamically
// Deployed backend URL
const API_BASE_URL = 'https://smart-lost-and-found-aurafind-yd7o.onrender.com';
const CAMPUS_LOCATIONS = [
  "Central Library - 1st Floor",
  "Central Library - 2nd Floor Reading Room",
  "RK Hall - Cafeteria",
  "RK Hall - Main Lobby & Security",
  "Sports Complex - Indoor Gymnasium",
  "Computer Science Lab 304",
  "Student Union Building - Food Court",
  "Main Auditorium & Amphitheatre",
  "Mechanical Engineering Workshop",
  "Campus Bus Stop / Transport Bay",
  "Hostel Block 3 Quadrangle"
];

// Live metrics state counters
let metricsState = {
  totalLost: 2,
  totalFound: 1,
  pendingClaims: 2,
  successfulReturns: 14
};

// Counter to generate unique mock incident tracking IDs (e.g., #ITM-9043)
let nextIncidentId = 9043;


// ==============================================================================
// 2. TAB SWITCHING LOGIC
// ==============================================================================
/**
 * Switch between "Report Item", "Live Match Feed", and "Admin Dashboard"
 * @param {string} targetTabId - The HTML id of the section to show ('reportTab', 'feedTab', 'adminTab')
 * @param {HTMLElement} clickedButton - The navigation tab button clicked by the user
 */
function switchTab(targetTabId, clickedButton) {
  // Step A: Find all tab content sections and hide them
  const allTabs = document.querySelectorAll('.tab-content');
  allTabs.forEach(tab => {
    tab.classList.remove('active');
  });

  // Step B: Show only the targeted tab section
  const targetTab = document.getElementById(targetTabId);
  if (targetTab) {
    targetTab.classList.add('active');
  }

  // Step C: Update active class on navbar buttons for CSS highlighting
  const allTabButtons = document.querySelectorAll('.tab-btn');
  allTabButtons.forEach(btn => {
    btn.classList.remove('active');
  });

  // If a button was passed, activate it; otherwise find the button by ID
  if (clickedButton) {
    clickedButton.classList.add('active');
  } else {
    if (targetTabId === 'reportTab') document.getElementById('tabBtnReport').classList.add('active');
    if (targetTabId === 'feedTab') document.getElementById('tabBtnFeed').classList.add('active');
    if (targetTabId === 'adminTab') document.getElementById('tabBtnAdmin').classList.add('active');
  }
}


// ==============================================================================
// 3. DYNAMIC FORM LOGIC (Lost vs. Found Conditional Behavior)
// ==============================================================================
/**
 * Populates the Location dropdown dynamically based on whether "Lost" or "Found" is selected.
 * - For LOST: Includes "Unknown / Misplaced" as an option.
 * - For FOUND: Removes "Unknown" because found items must specify an exact discovery spot.
 * 
 * Also conditionally toggles:
 * - Drop-off Status field (visible only if Found)
 * - Secret Verification Question field (mandatory only if Found)
 */
function updateDynamicFormFields() {
  // Check which radio option is currently checked
  const isFound = document.getElementById('typeFound').checked;

  const locationSelect = document.getElementById('itemLocation');
  const dropOffContainer = document.getElementById('dropOffContainer');
  const secretQuestionContainer = document.getElementById('secretQuestionContainer');
  const secretQuestionInput = document.getElementById('secretQuestion');
  const locationHint = document.getElementById('locationHint');

  // Clear existing options in location dropdown
  locationSelect.innerHTML = '';

  // Default placeholder option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = isFound 
    ? 'Select exact location found (Required)...' 
    : 'Select where it was lost or last seen...';
  locationSelect.appendChild(defaultOption);

  // If "LOST" is selected: Include an "Unknown" option
  if (!isFound) {
    const unknownOption = document.createElement('option');
    unknownOption.value = 'Unknown / Misplaced';
    unknownOption.textContent = '❓ Unknown (I am not sure where it was misplaced)';
    locationSelect.appendChild(unknownOption);
  }

  // Append standard campus locations
  CAMPUS_LOCATIONS.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = `📍 ${loc}`;
    locationSelect.appendChild(opt);
  });

  // Update UI conditional visibility and validation rules
  if (isFound) {
    // 1. Show Drop-off Status dropdown
    dropOffContainer.style.display = 'block';

    // 2. Show Secret Verification Question and make it mandatory
    secretQuestionContainer.style.display = 'block';
    secretQuestionInput.setAttribute('required', 'required');

    // 3. Update location hint
    locationHint.textContent = '(Found items require an exact discovery location)';
  } else {
    // 1. Hide Drop-off Status (not applicable when you lost something)
    dropOffContainer.style.display = 'none';

    // 2. Hide Secret Question and remove mandatory validation
    secretQuestionContainer.style.display = 'none';
    secretQuestionInput.removeAttribute('required');
    secretQuestionInput.value = ''; // Reset value
    clearInputError(secretQuestionInput, 'errorSecretQuestion');
    clearInputError(document.getElementById('dropOffStatus'), 'errorDropOffStatus');

    // 3. Update location hint
    locationHint.textContent = '(Select where you last saw it, or choose Unknown)';
  }
}

/**
 * Resets the form inputs and re-syncs dynamic field visibility and clears errors
 */
function resetFormState() {
  // Clear all visual error states
  document.querySelectorAll('.form-input').forEach(input => {
    input.classList.remove('is-invalid');
  });
  document.querySelectorAll('.field-error').forEach(err => {
    err.classList.remove('show-error');
  });

  setTimeout(() => {
    setDefaultDate();
    updateDynamicFormFields();
  }, 50);
}

/**
 * Clears visual error feedback on an input when the user interacts with it
 * @param {HTMLElement} inputElement - The input or select element
 * @param {string} errorElementId - The ID of the associated .field-error element
 */
function clearInputError(inputElement, errorElementId) {
  if (inputElement) {
    inputElement.classList.remove('is-invalid');
  }
  const errorElem = document.getElementById(errorElementId);
  if (errorElem) {
    errorElem.classList.remove('show-error');
  }
}

/**
 * Validates report form fields and displays visual error feedback.
 * Explanatory notes for judges:
 * - Checks mandatory fields based on active incident type (Lost vs. Found)
 * - Toggles .is-invalid class to trigger red glowing border & shake animation
 * - Reveals targeted .field-error helper messages
 * - Automatically focuses the first invalid element for seamless accessibility
 * @returns {boolean} true if all required fields are valid, false otherwise.
 */
function validateReportForm() {
  let isValid = true;
  let firstInvalidInput = null;

  // Helper function to mark/unmark input state and error message
  function setFieldError(inputId, errorId, isError, customMessage) {
    const input = document.getElementById(inputId);
    const errorElem = document.getElementById(errorId);
    if (!input || !errorElem) return;

    if (isError) {
      isValid = false;
      input.classList.add('is-invalid');
      if (customMessage) {
        errorElem.textContent = customMessage;
      }
      errorElem.classList.add('show-error');

      // Keep track of the first invalid field to focus it
      if (!firstInvalidInput) {
        firstInvalidInput = input;
      }
    } else {
      input.classList.remove('is-invalid');
      errorElem.classList.remove('show-error');
    }
  }

  const isFound = document.getElementById('typeFound').checked;
  const category = document.getElementById('itemCategory').value;
  const date = document.getElementById('itemDate').value;
  const itemName = document.getElementById('itemName').value.trim();
  const location = document.getElementById('itemLocation').value;
  const dropOffStatus = document.getElementById('dropOffStatus') ? document.getElementById('dropOffStatus').value : '';
  const secretQuestion = document.getElementById('secretQuestion') ? document.getElementById('secretQuestion').value.trim() : '';

  // 1. Category validation
  setFieldError('itemCategory', 'errorItemCategory', !category);

  // 2. Incident Date validation
  setFieldError('itemDate', 'errorItemDate', !date);

  // 3. Item Name validation (must be at least 3 characters)
  if (!itemName) {
    setFieldError('itemName', 'errorItemName', true, 'Item name and primary description are required.');
  } else if (itemName.length < 3) {
    setFieldError('itemName', 'errorItemName', true, 'Item name must be at least 3 characters long for matching.');
  } else {
    setFieldError('itemName', 'errorItemName', false);
  }

  // 4. Location validation
  setFieldError('itemLocation', 'errorItemLocation', !location);

  // 5. Found-specific validations
  if (isFound) {
    // Drop-off Status must be selected
    setFieldError('dropOffStatus', 'errorDropOffStatus', !dropOffStatus);

    // Secret Verification Question is mandatory for Found items
    if (!secretQuestion) {
      setFieldError('secretQuestion', 'errorSecretQuestion', true, 'Secret verification question is required for found items.');
    } else if (secretQuestion.length < 5) {
      setFieldError('secretQuestion', 'errorSecretQuestion', true, 'Please provide a more descriptive challenge question (min 5 characters).');
    } else {
      setFieldError('secretQuestion', 'errorSecretQuestion', false);
    }
  } else {
    // If Lost, clear any found-only errors
    setFieldError('dropOffStatus', 'errorDropOffStatus', false);
    setFieldError('secretQuestion', 'errorSecretQuestion', false);
  }

  // Focus the first erroneous input to assist the user
  if (!isValid && firstInvalidInput) {
    firstInvalidInput.focus();
    firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return isValid;
}


// ==============================================================================
// 4. FORM SUBMISSION SIMULATION & CARD CREATION
// ==============================================================================
/**
 * Handles form submit event:
 * - Prevents default browser reload
 * - Executes client-side validation with visual feedback
 * - Collects and validates inputs
 * - Generates new card and adds to Live Match Feed
 * - Updates Admin Dashboard telemetry
 * - Shows interactive toast notification
 * - Switches tab to Live Match Feed
 */
async function handleFormSubmit(event) {
  // Prevent page reload on submit
  event.preventDefault();

  // Run comprehensive client-side validation
  const isFormValid = validateReportForm();
  if (!isFormValid) {
    showToast('⚠️ Transmission Incomplete: Please check highlighted fields.', 'warning');
    return;
  }

  // Read input values from DOM
  const isFound = document.getElementById('typeFound').checked;
  const itemType = isFound ? 'Found' : 'Lost';
  const category = document.getElementById('itemCategory').value;
  const date = document.getElementById('itemDate').value;
  const itemName = document.getElementById('itemName').value.trim();
  const location = document.getElementById('itemLocation').value;
  const brand = document.getElementById('itemBrand').value.trim() || 'Unspecified';
  const size = document.getElementById('itemSize').value.trim() || 'Standard';
  const marks = document.getElementById('identifyingMarks').value.trim() || 'No specific marks listed.';
  const isHighPriority = document.getElementById('isHighPriority').checked;
  const dropOffStatus = isFound ? document.getElementById('dropOffStatus').value : 'N/A';
  const secretQuestion = isFound ? document.getElementById('secretQuestion').value.trim() : '';
  console.log('🚀 Starting backend request...');

const response = await fetch(`${API_BASE_URL}/api/reports`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: itemType.toLowerCase(),
    category: category,
    item: itemName,
    brand: brand,
    size: size,
    marks: marks,
    location: location,
    date: date,
    high_priority: isHighPriority ? 1 : 0,
    drop_off_status: dropOffStatus,
    secret_question: secretQuestion
  })
});

const result = await response.json();
console.log('Backend response:', result);

  // Use the real database ID and extract the match score
const incidentCode = `#ITM-${result.report_id || nextIncidentId++}`;
const dynamicMatchScore = result.match_score || 0;

  // Build the new HTML Card element
  const cardElement = createFeedCardElement({
    id: incidentCode,
    type: itemType,
    category: category,
    name: itemName,
    date: date,
    location: location,
    brand: brand,
    size: size,
    marks: marks,
    isHighPriority: isHighPriority,
    dropOffStatus: dropOffStatus,
    secretQuestion: secretQuestion,
    matchScore: dynamicMatchScore
  });

  // Prepend new card to the top of Live Match Feed
  const feedContainer = document.getElementById('matchFeedContainer');
  feedContainer.insertBefore(cardElement, feedContainer.firstChild);

  // Re-run filter logic to ensure proper visibility state
  filterFeedItems();

  // Update badge count in navbar
  updateFeedCountBadge();

  // Update Admin Dashboard Counters
  if (itemType === 'Lost') {
    metricsState.totalLost++;
  } else {
    metricsState.totalFound++;
    metricsState.pendingClaims++;
  }
  updateAdminMetricsDisplay();

  // Add entry to the Admin Table
  addAdminTableRow(incidentCode, itemName, itemType, location);

  // Show success alert toast
  showToast(`🚀 ${itemType} report for "${itemName}" registered successfully! Telemetry broadcasted.`, 'success');

  // Reset form inputs to default clean state
  document.getElementById('reportForm').reset();
  resetFormState();

  // Automatically switch tab to Live Match Feed so the user sees their new item!
  setTimeout(() => {
    switchTab('feedTab', document.getElementById('tabBtnFeed'));
  }, 450);
}

/**
 * Builds a DOM `<article>` card representing a reported item
 * @param {Object} data - Form report data
 * @returns {HTMLElement} article card element
 */
function createFeedCardElement(data) {
  const card = document.createElement('article');
  card.className = 'card feed-card';
  card.setAttribute('data-type', data.type);

  // Dynamic match check (triggers alert if score is 50% or higher)
  const matchScore = data.matchScore || 0;
  const isMatch = matchScore >= 50;

  if (isMatch) {
    card.classList.add('match-card');
  }

  // Header Pill
  const pillClass = data.type === 'Lost' ? 'pill-lost' : 'pill-found';
  
  // Custom right header badge
  let headerRightBadge = '';
  if (isMatch) {
    headerRightBadge = `
      <div class="match-alert-badge" title="Dynamic match based on Category, Brand & Location">
        <span class="glow-dot"></span>
        <span class="match-text">Match Alert! ${matchScore}% Match</span>
      </div>
    `;
  } else if (data.type === 'Found') {
    headerRightBadge = `<span class="custody-badge">🏢 Custody: ${escapeHtml(data.dropOffStatus)}</span>`;
  } else if (data.location && data.location.includes('Unknown')) {
    headerRightBadge = `<span class="unknown-pill">❓ Location Unknown</span>`;
  }

  // Secret Challenge Box HTML (for Found items)
  const secretHtml = data.secretQuestion ? `
    <div class="secret-challenge-preview">
      <span class="secret-icon">🔒</span>
      <span><strong>Verification Challenge:</strong> "${escapeHtml(data.secretQuestion)}"</span>
    </div>
  ` : '';

  // Priority Tag HTML
  const priorityHtml = data.isHighPriority ? `
    <div class="priority-tag high-priority">🔥 High Priority Incident</div>
  ` : '';

  // Simulated match notice
  const matchNoticeHtml = isMatch ? `
    <div class="sim-notice">⚡ Real-time Match Score: ${matchScore}% algorithmic confidence</div>
  ` : '';

  // Fill card content
  card.innerHTML = `
    <div class="card-header">
      <div class="type-pill ${pillClass}">${data.type.toUpperCase()}</div>
      ${headerRightBadge}
    </div>

    <div class="card-body">
      <div class="card-category">📁 ${escapeHtml(data.category)}</div>
      <h2 class="card-title">${escapeHtml(data.name)}</h2>
      ${matchNoticeHtml}

      <div class="card-meta">
        <div class="meta-item">
          <span class="meta-icon">📍</span>
          <span class="meta-label">Location:</span>
          <span class="meta-val">${escapeHtml(data.location)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-icon">📅</span>
          <span class="meta-label">Date:</span>
          <span class="meta-val">${escapeHtml(data.date)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-icon">🏷️</span>
          <span class="meta-label">Brand:</span>
          <span class="meta-val">${escapeHtml(data.brand)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-icon">📏</span>
          <span class="meta-label">Size:</span>
          <span class="meta-val">${escapeHtml(data.size)}</span>
        </div>
      </div>

      <p class="card-description">
        <strong>Identifying Marks:</strong> ${escapeHtml(data.marks)}
      </p>

      ${secretHtml}
      ${priorityHtml}
    </div>

    <div class="card-actions">
      <button class="btn btn-action" onclick="generateQrCode('${escapeAttr(data.name)}', '${data.id}')">
        <span class="btn-icon">📱</span>
        <span>Generate QR Code</span>
      </button>
      <button class="btn btn-action btn-outline" onclick="messageFinderAnonymously('${data.id}', '${escapeAttr(data.name)}')">
        <span class="btn-icon">💬</span>
        <span>Message Finder Anonymously</span>
      </button>
    </div>
  `;

  return card;
}


// ==============================================================================
// 5. SIMULATED INTERACTIVE FEATURES (QR Code & Anonymous Messaging)
// ==============================================================================
/**
 * Simulates dynamic QR code generation for campus security handover
 */
function generateQrCode(itemName, itemId) {
  // Simulated frontend notification
  showToast(`📱 Generating instant QR Code token for "${itemName}" [${itemId}]... Scanning authorized for Security Kiosks.`, 'info');
  
  // Standard browser alert for demo presentation
  setTimeout(() => {
    alert(
      `========================================\n` +
      `🛸 AURA-FIND DIGITAL RECOVERY PASS\n` +
      `========================================\n` +
      `Item: ${itemName}\n` +
      `ID: ${itemId}\n` +
      `Digital Token: AURAFIND-QR-SEC-${Math.floor(100000 + Math.random() * 900000)}\n\n` +
      `[SIMULATED FEATURE]: Present this dynamic QR Code at RK Hall Security or Central Library front desk to authenticate physical handover.`
    );
  }, 100);
}

/**
 * Simulates anonymous encrypted messaging relay between owner and finder
 */
function messageFinderAnonymously(itemId, itemName) {
  const userMessage = prompt(
    `🔒 Encrypted Anonymous Relay for Incident [${itemId}]\n` +
    `Item: "${itemName}"\n\n` +
    `Enter a secure message for the finder (your identity will remain completely anonymous):`,
    "Hello! I believe this belongs to me. Can we coordinate verification at RK Hall?"
  );

  if (userMessage !== null && userMessage.trim() !== '') {
    showToast(`📨 Anonymous message securely relayed for ${itemId}! The custodian has been notified.`, 'success');
  }
}

/**
 * Simulates administrative claim resolution
 */
function simulateClaimResolution(itemName, buttonElement) {
  metricsState.pendingClaims = Math.max(0, metricsState.pendingClaims - 1);
  metricsState.successfulReturns++;
  updateAdminMetricsDisplay();

  buttonElement.disabled = true;
  buttonElement.textContent = 'Resolved ✓';
  buttonElement.style.borderColor = '#00ff88';
  buttonElement.style.color = '#00ff88';
  buttonElement.style.cursor = 'default';

  showToast(`🏆 Claim resolved! "${itemName}" verified and returned to owner. Metrics updated.`, 'success');
}

/**
 * Simulates general administrative actions
 */
function simulateAdminAction(actionTitle) {
  showToast(`⚡ Executing: ${actionTitle}... Status: Complete 200 OK`, 'info');
}


// ==============================================================================
// 6. FILTERING & SEARCH IN MATCH FEED
// ==============================================================================
/**
 * Filters the displayed cards in Live Match Feed by:
 * 1. Search Query: Matches item name OR location text (real-time as user types)
 * 2. Type Filter: "All", "Lost", or "Found"
 */
function filterFeedItems() {
  // Read current search input and convert to lowercase for case-insensitive matching
  const searchInput = document.getElementById('feedSearchInput');
  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

  // Read current selected dropdown filter (All, Lost, Found)
  const filterSelect = document.getElementById('filterType');
  const filterVal = filterSelect ? filterSelect.value : 'All';

  // Toggle clear button visibility based on whether search input has text
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) {
    clearBtn.style.display = searchVal.length > 0 ? 'block' : 'none';
  }

  // Get all feed cards in the container
  const cards = document.querySelectorAll('#matchFeedContainer .feed-card');
  let visibleCount = 0;

  cards.forEach(card => {
    // 1. Check Type match (All / Lost / Found)
    const cardType = card.getAttribute('data-type') || '';
    const matchesType = (filterVal === 'All' || cardType === filterVal);

    // 2. Extract title, location, and category text from the card DOM
    const titleElement = card.querySelector('.card-title');
    const titleText = titleElement ? titleElement.textContent.toLowerCase() : '';

    // Location is in the first meta item with class .meta-val
    const locationElement = card.querySelector('.card-meta .meta-item .meta-val');
    const locationText = locationElement ? locationElement.textContent.toLowerCase() : '';

    // Category badge text
    const categoryElement = card.querySelector('.card-category');
    const categoryText = categoryElement ? categoryElement.textContent.toLowerCase() : '';

    // 3. Check Search Query match against Name or Location (or Category)
    const matchesSearch = (searchVal === '') || 
                          titleText.includes(searchVal) || 
                          locationText.includes(searchVal) ||
                          categoryText.includes(searchVal);

    // Card is displayed only if BOTH conditions are satisfied
    if (matchesType && matchesSearch) {
      card.style.display = 'block';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  // Toggle "No Matching Items" banner if all cards are filtered out
  const noMatchAlert = document.getElementById('noMatchAlert');
  if (noMatchAlert) {
    noMatchAlert.style.display = (visibleCount === 0) ? 'flex' : 'none';
  }

  // Update showing count display
  const countDisplay = document.getElementById('filterCountDisplay');
  if (countDisplay) {
    countDisplay.textContent = `${visibleCount} Item${visibleCount === 1 ? '' : 's'}`;
  }
}

/**
 * Clears the search input and restores full feed list
 */
function clearSearchInput() {
  const searchInput = document.getElementById('feedSearchInput');
  if (searchInput) {
    searchInput.value = '';
    filterFeedItems();
    searchInput.focus();
  }
}

/**
 * Updates the numerical badge showing total active feed cards
 */
function updateFeedCountBadge() {
  const cards = document.querySelectorAll('#matchFeedContainer .feed-card');
  const count = cards.length;
  const badge = document.getElementById('feedCountBadge');
  if (badge) {
    badge.textContent = count;
  }
  const filterCount = document.getElementById('filterCountDisplay');
  if (filterCount && (!document.getElementById('feedSearchInput') || !document.getElementById('feedSearchInput').value)) {
    filterCount.textContent = `${count} Items`;
  }
}


// ==============================================================================
// 7. ADMIN DASHBOARD METRICS UPDATE LOGIC
// ==============================================================================
/**
 * Renders state counter numbers into Admin Dashboard DOM elements
 */
function updateAdminMetricsDisplay() {
  const lostElem = document.getElementById('metricTotalLost');
  const foundElem = document.getElementById('metricTotalFound');
  const pendingElem = document.getElementById('metricPendingClaims');
  const returnedElem = document.getElementById('metricSuccessfulReturns');

  if (lostElem) lostElem.textContent = metricsState.totalLost;
  if (foundElem) foundElem.textContent = metricsState.totalFound;
  if (pendingElem) pendingElem.textContent = metricsState.pendingClaims;
  if (returnedElem) returnedElem.textContent = metricsState.successfulReturns;
}

/**
 * Appends a new row to the Admin Dashboard audit table
 */
function addAdminTableRow(id, name, type, location) {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  const tr = document.createElement('tr');
  const badgeClass = type === 'Lost' ? 'badge-lost' : 'badge-found';
  
  tr.innerHTML = `
    <td><code>${escapeHtml(id)}</code></td>
    <td>${escapeHtml(name)}</td>
    <td><span class="badge ${badgeClass}">${type.toUpperCase()}</span></td>
    <td>${escapeHtml(location)}</td>
    <td><span class="badge badge-pending">PENDING</span></td>
    <td>
      <button class="btn-table-action" onclick="simulateClaimResolution('${escapeAttr(name)}', this)">
        Verify Return
      </button>
    </td>
  `;

  tbody.insertBefore(tr, tbody.firstChild);
}


// ==============================================================================
// 8. TOAST NOTIFICATION HELPER
// ==============================================================================
/**
 * Creates and displays a sleek non-intrusive toast notification in the UI
 * @param {string} message - Text to display
 * @param {string} type - 'success' | 'info' | 'warning'
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '⚡';
  if (type === 'success') icon = '✅';
  if (type === 'info') icon = 'ℹ️';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeToastOut 0.35s ease forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 350);
  }, 4000);
}


// ==============================================================================
// 9. UTILITY SANITIZATION FUNCTIONS (Security & Robustness)
// ==============================================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function setDefaultDate() {
  const dateInput = document.getElementById('itemDate');
  if (dateInput && !dateInput.value) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
}


// ==============================================================================
// 10. INITIALIZATION ON PAGE LOAD
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Set today's date as default
  setDefaultDate();

  // 2. Attach change event listeners to Lost / Found radio buttons
  const lostRadio = document.getElementById('typeLost');
  const foundRadio = document.getElementById('typeFound');

  if (lostRadio && foundRadio) {
    lostRadio.addEventListener('change', updateDynamicFormFields);
    foundRadio.addEventListener('change', updateDynamicFormFields);
  }

  // 3. Initialize dynamic form dropdowns & fields
  updateDynamicFormFields();

  // 4. Update initial metric counters and counts
  updateAdminMetricsDisplay();
  updateFeedCountBadge();
});
// 5. Fetch real data from Backend and clear dummy HTML cards
  fetch(`${API_BASE_URL}/api/reports`)
    .then(res => res.json())
    .then(data => {
      const feedContainer = document.getElementById('matchFeedContainer');
      feedContainer.innerHTML = ''; // Clears dummy cards
      
      data.reports.forEach(report => {
        const card = createFeedCardElement({
          id: `#ITM-${report.id}`,
          type: report.status === 'lost' ? 'Lost' : 'Found',
          category: report.category,
          name: report.item,
          date: report.date,
          location: report.location,
          brand: report.brand,
          size: report.size,
          marks: report.marks,
          isHighPriority: report.high_priority,
          dropOffStatus: report.drop_off_status,
          secretQuestion: report.secret_question,
          matchScore: 0 // Historic items don't trigger flashing alerts
        });
        feedContainer.appendChild(card);
      });
      updateFeedCountBadge();
    })
    .catch(err => console.error("Database connection failed:", err));
