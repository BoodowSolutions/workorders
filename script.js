// Work Order Management Script

// Data arrays (loaded from localStorage if available)
let workers = JSON.parse(localStorage.getItem('workers') || '[]');
let clients = JSON.parse(localStorage.getItem('clients') || '[]');
let workOrders = JSON.parse(localStorage.getItem('workOrders') || '[]');

// Initialize EmailJS if available. Replace 'YOUR_PUBLIC_KEY' with your actual public key from EmailJS.
if (typeof emailjs !== 'undefined') {
    try {
        emailjs.init('YOUR_PUBLIC_KEY');
    } catch (e) {
        console.warn('EmailJS failed to initialize. Please provide a valid public key.');
    }
}

/**
 * Send an email notification to the assigned worker when a new work order is created.
 * This function uses EmailJS to send an email. You must configure a service and template
 * on emailjs.com and replace the placeholders below with your own IDs. If EmailJS
 * is not configured, this function will simply log a message to the console.
 *
 * @param {Object} order The newly created work order object
 */
function sendNewWorkOrderEmail(order) {
    const worker = workers.find(w => w.id === order.workerId);
    if (!worker || !worker.email) {
        console.warn('Worker email not found; cannot send notification');
        return;
    }
    const client = clients.find(c => c.id === order.clientId) || {};
    const params = {
        worker_name: worker.name,
        worker_email: worker.email,
        order_number: order.number,
        order_title: order.title,
        order_description: order.description,
        due_date: order.dueDate,
        service_location: order.serviceLocation,
        client_name: client.name || ''
    };
    if (typeof emailjs !== 'undefined' && emailjs.send) {
        emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', params)
            .then(function(response) {
                console.log('Email successfully sent:', response.status, response.text);
            }, function(error) {
                console.error('Failed to send email:', error);
            });
    } else {
        // Fallback: log to console. You can replace this with a mailto: link or other implementation.
        console.log('EmailJS not configured. Notification would be sent to:', worker.email, params);
    }
}

// Reference to forms and sections
const tabs = document.querySelectorAll('.tabs button');
const sections = document.querySelectorAll('.tab-content');

// Work order form and elements
const woForm = document.getElementById('workorder-form');
const woClientSelect = document.getElementById('wo-client');
const woWorkerSelect = document.getElementById('wo-worker');
const woStatusSelect = document.getElementById('wo-status');
const woNumberInput = document.getElementById('wo-number');
const woCreatedInput = document.getElementById('wo-created');
const woDueInput = document.getElementById('wo-due');
const woLocationInput = document.getElementById('wo-location');
const woContactNameInput = document.getElementById('wo-contact-name');
const woContactPhoneInput = document.getElementById('wo-contact-phone');
const woServiceDescInput = document.getElementById('wo-service-description');
const woPhotosBeforeInput = document.getElementById('wo-photos');
const woPhotosAfterInput = document.getElementById('wo-photos-after');

// Worker and client forms
const workerForm = document.getElementById('worker-form');
const workerSpecialtyInput = document.getElementById('worker-specialty');
const clientForm = document.getElementById('client-form');

// List containers
const workordersList = document.getElementById('workorders-list');
const completedWorkordersList = document.getElementById('completed-workorders-list');

// Sub-tab buttons for switching between active and completed work orders
const subTabActiveBtn = document.getElementById('sub-tab-active');
const subTabCompletedBtn = document.getElementById('sub-tab-completed');

if (subTabActiveBtn && subTabCompletedBtn) {
    subTabActiveBtn.addEventListener('click', () => {
        subTabActiveBtn.classList.add('active');
        subTabCompletedBtn.classList.remove('active');
        workordersList.classList.remove('hidden');
        completedWorkordersList.classList.add('hidden');
    });
    subTabCompletedBtn.addEventListener('click', () => {
        subTabCompletedBtn.classList.add('active');
        subTabActiveBtn.classList.remove('active');
        workordersList.classList.add('hidden');
        completedWorkordersList.classList.remove('hidden');
    });
}
const workersList = document.getElementById('workers-list');
const clientsList = document.getElementById('clients-list');

// Modal elements
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');
const closeModalBtn = document.getElementById('close-modal');
const cancelWoBtn = document.getElementById('cancel-wo');

// Floating action button and menu elements
const fabButton = document.getElementById('fab-button');
const fabMenu = document.getElementById('fab-menu');
const fabCreateWorkOrderBtn = document.getElementById('fab-create-workorder');
const fabCreateWorkerBtn = document.getElementById('fab-create-worker');
const fabCreateClientBtn = document.getElementById('fab-create-client');

// Quick add buttons inside selects
const addClientBtn = document.getElementById('add-client-btn');
const addWorkerBtn = document.getElementById('add-worker-btn');

// Sections for conditional display
const workordersSection = document.getElementById('workorders-section');
const workersSection = document.getElementById('workers-section');
const clientsSection = document.getElementById('clients-section');
const workorderListTabs = document.getElementById('workorder-list-tabs');

// Helper functions to toggle sections/forms
function showWorkOrderForm() {
    // show work order form
    woForm.classList.remove('hidden');
    // show cancel button
    cancelWoBtn.classList.remove('hidden');
    // hide work order lists and tabs
    if (workorderListTabs) workorderListTabs.classList.add('hidden');
    workordersList.classList.add('hidden');
    completedWorkordersList.classList.add('hidden');
    // hide other sections
    workersSection.classList.add('hidden');
    clientsSection.classList.add('hidden');
    // ensure workorders section is visible and active
    workordersSection.classList.remove('hidden');
    workordersSection.classList.add('active');
    workersSection.classList.remove('active');
    clientsSection.classList.remove('active');
    // reset editing id
    editingWorkOrderId = null;
}

function hideWorkOrderForm() {
    // hide form
    woForm.classList.add('hidden');
    // hide cancel button
    cancelWoBtn.classList.add('hidden');
    // show work order lists and tabs
    if (workorderListTabs) workorderListTabs.classList.remove('hidden');
    workordersList.classList.remove('hidden');
    // Show/hide completed list depending on active sub-tab
    if (subTabActiveBtn && subTabActiveBtn.classList.contains('active')) {
        completedWorkordersList.classList.add('hidden');
    } else {
        completedWorkordersList.classList.remove('hidden');
    }
    // ensure workorders section is visible and active
    workordersSection.classList.remove('hidden');
    workordersSection.classList.add('active');
    workersSection.classList.remove('active');
    workersSection.classList.add('hidden');
    clientsSection.classList.remove('active');
    clientsSection.classList.add('hidden');
    // reset form
    woForm.reset();
    // reset created date
    const today = new Date().toISOString().split('T')[0];
    woCreatedInput.value = today;
}

function showWorkersSection() {
    // Activate workers section and deactivate others
    workersSection.classList.remove('hidden');
    workersSection.classList.add('active');
    clientsSection.classList.remove('active');
    clientsSection.classList.add('hidden');
    workordersSection.classList.remove('active');
    workordersSection.classList.add('hidden');
    // hide fab menu
    fabMenu.classList.add('hidden');
}

function showClientsSection() {
    // Activate clients section and deactivate others
    clientsSection.classList.remove('hidden');
    clientsSection.classList.add('active');
    workersSection.classList.remove('active');
    workersSection.classList.add('hidden');
    workordersSection.classList.remove('active');
    workordersSection.classList.add('hidden');
    // hide fab menu
    fabMenu.classList.add('hidden');
}

// Current editing Work Order id (null if creating new)
let editingWorkOrderId = null;

// Utility functions to save to localStorage
function saveWorkers() {
    localStorage.setItem('workers', JSON.stringify(workers));
}

function saveClients() {
    localStorage.setItem('clients', JSON.stringify(clients));
}

function saveWorkOrders() {
    localStorage.setItem('workOrders', JSON.stringify(workOrders));
}

// Populate dropdowns for clients and workers
function populateDropdowns() {
    // Clients
    woClientSelect.innerHTML = '<option value="">Select client</option>';
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        woClientSelect.appendChild(option);
    });
    // Workers
    woWorkerSelect.innerHTML = '<option value="">Select worker</option>';
    workers.forEach(worker => {
        const option = document.createElement('option');
        option.value = worker.id;
        option.textContent = worker.name;
        woWorkerSelect.appendChild(option);
    });
}

// Render lists
function renderWorkers() {
    workersList.innerHTML = '';
    if (workers.length === 0) {
        workersList.innerHTML = '<p>No workers registered.</p>';
        return;
    }
    workers.forEach(worker => {
        const card = document.createElement('div');
        card.className = 'card';
        let html = `<h4>${worker.name}</h4>`;
        html += `<p>Email: ${worker.email}</p>`;
        if (worker.phone) html += `<p>Phone: ${worker.phone}</p>`;
        if (worker.specialty) html += `<p>Specialty: ${worker.specialty}</p>`;
        card.innerHTML = html;
        workersList.appendChild(card);
    });
}

function renderClients() {
    clientsList.innerHTML = '';
    if (clients.length === 0) {
        clientsList.innerHTML = '<p>No clients registered.</p>';
        return;
    }
    clients.forEach(client => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>${client.name}</h4>
            <p>Email: ${client.email}</p>
            ${client.phone ? `<p>Phone: ${client.phone}</p>` : ''}
        `;
        clientsList.appendChild(card);
    });
}

function renderWorkOrders() {
    // Clear both lists
    workordersList.innerHTML = '';
    completedWorkordersList.innerHTML = '';
    // Separate active and completed work orders
    const activeOrders = workOrders.filter(wo => wo.status !== 'Done');
    const completedOrders = workOrders.filter(wo => wo.status === 'Done');
    // Render active list
    if (activeOrders.length === 0) {
        workordersList.innerHTML = '<p>No active work orders.</p>';
    } else {
        // Sort by creation date descending
        const sortedActive = [...activeOrders].sort((a, b) => b.createdAt - a.createdAt);
        sortedActive.forEach(wo => {
            const card = document.createElement('div');
            card.className = 'card';
            const client = clients.find(c => c.id === wo.clientId);
            const worker = workers.find(w => w.id === wo.workerId);
            const statusSpan = document.createElement('span');
            statusSpan.className = 'status';
            statusSpan.textContent = wo.status;
            statusSpan.setAttribute('data-status', wo.status);
            card.appendChild(statusSpan);
            const titleEl = document.createElement('h4');
            titleEl.textContent = `${wo.number} - ${wo.title}`;
            card.appendChild(titleEl);
            const meta = document.createElement('p');
            meta.textContent = `Client: ${client ? client.name : 'N/A'} | Worker: ${worker ? worker.name : 'N/A'}`;
            card.appendChild(meta);
            const due = document.createElement('p');
            due.textContent = `Due: ${wo.dueDate || ''}`;
            card.appendChild(due);
            if (typeof wo.accepted === 'boolean') {
                const acc = document.createElement('p');
                acc.textContent = wo.accepted ? 'Accepted' : 'Declined';
                acc.style.fontWeight = 'bold';
                acc.style.color = wo.accepted ? '#2e7d32' : '#e53935';
                card.appendChild(acc);
            }
            const actions = document.createElement('div');
            actions.className = 'card-actions';
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => editWorkOrder(wo.id));
            actions.appendChild(editBtn);
            const viewBtn = document.createElement('button');
            viewBtn.className = 'view-btn';
            viewBtn.textContent = 'View';
            viewBtn.addEventListener('click', () => viewWorkOrder(wo.id));
            actions.appendChild(viewBtn);
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteWorkOrder(wo.id));
            actions.appendChild(deleteBtn);
            // Only show Send button if order is not completed (status not Done)
            const sendBtn = document.createElement('button');
            sendBtn.className = 'send-btn';
            sendBtn.textContent = 'Send';
            sendBtn.addEventListener('click', () => sendWorkOrder(wo.id));
            actions.appendChild(sendBtn);
            card.appendChild(actions);
            workordersList.appendChild(card);
        });
    }
    // Render completed list
    if (completedOrders.length === 0) {
        completedWorkordersList.innerHTML = '<p>No completed work orders.</p>';
    } else {
        const sortedCompleted = [...completedOrders].sort((a, b) => b.createdAt - a.createdAt);
        sortedCompleted.forEach(wo => {
            const card = document.createElement('div');
            card.className = 'card';
            const client = clients.find(c => c.id === wo.clientId);
            const worker = workers.find(w => w.id === wo.workerId);
            const statusSpan = document.createElement('span');
            statusSpan.className = 'status';
            statusSpan.textContent = wo.status;
            statusSpan.setAttribute('data-status', wo.status);
            card.appendChild(statusSpan);
            const titleEl = document.createElement('h4');
            titleEl.textContent = `${wo.number} - ${wo.title}`;
            card.appendChild(titleEl);
            const meta = document.createElement('p');
            meta.textContent = `Client: ${client ? client.name : 'N/A'} | Worker: ${worker ? worker.name : 'N/A'}`;
            card.appendChild(meta);
            const due = document.createElement('p');
            due.textContent = `Due: ${wo.dueDate || ''}`;
            card.appendChild(due);
            if (typeof wo.accepted === 'boolean') {
                const acc = document.createElement('p');
                acc.textContent = wo.accepted ? 'Accepted' : 'Declined';
                acc.style.fontWeight = 'bold';
                acc.style.color = wo.accepted ? '#2e7d32' : '#e53935';
                card.appendChild(acc);
            }
            const actions = document.createElement('div');
            actions.className = 'card-actions';
            // For completed orders, allow view/edit/delete
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => editWorkOrder(wo.id));
            actions.appendChild(editBtn);
            const viewBtn = document.createElement('button');
            viewBtn.className = 'view-btn';
            viewBtn.textContent = 'View';
            viewBtn.addEventListener('click', () => viewWorkOrder(wo.id));
            actions.appendChild(viewBtn);
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteWorkOrder(wo.id));
            actions.appendChild(deleteBtn);
            card.appendChild(actions);
            completedWorkordersList.appendChild(card);
        });
    }
}

// Tab switching
tabs.forEach(btn => {
    btn.addEventListener('click', () => {
        tabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const id = btn.id.replace('tab-', '') + '-section';
        sections.forEach(sec => sec.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    });
});

// Floating action button toggling and menu actions
if (fabButton && fabMenu) {
    fabButton.addEventListener('click', () => {
        fabMenu.classList.toggle('hidden');
    });
}
if (fabCreateWorkOrderBtn) {
    fabCreateWorkOrderBtn.addEventListener('click', () => {
        // hide menu and show work order form
        fabMenu.classList.add('hidden');
        showWorkOrderForm();
    });
}
if (fabCreateWorkerBtn) {
    fabCreateWorkerBtn.addEventListener('click', () => {
        showWorkersSection();
    });
}
if (fabCreateClientBtn) {
    fabCreateClientBtn.addEventListener('click', () => {
        showClientsSection();
    });
}
if (addClientBtn) {
    addClientBtn.addEventListener('click', () => {
        showClientsSection();
    });
}
if (addWorkerBtn) {
    addWorkerBtn.addEventListener('click', () => {
        showWorkersSection();
    });
}

// Worker form submission
workerForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('worker-name').value.trim();
    const email = document.getElementById('worker-email').value.trim();
    const phone = document.getElementById('worker-phone').value.trim();
    const specialty = workerSpecialtyInput.value.trim();
    if (!name || !email) return;
    const id = Date.now().toString();
    workers.push({ id, name, email, phone, specialty });
    saveWorkers();
    populateDropdowns();
    renderWorkers();
    workerForm.reset();
    alert('Worker saved');
});

// Client form submission
clientForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('client-name').value.trim();
    const email = document.getElementById('client-email').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    if (!name || !email) return;
    const id = Date.now().toString();
    clients.push({ id, name, email, phone });
    saveClients();
    populateDropdowns();
    renderClients();
    clientForm.reset();
    alert('Client saved');
});

// Work order form submission
woForm.addEventListener('submit', async e => {
    e.preventDefault();
    const number = woNumberInput.value.trim();
    const title = document.getElementById('wo-title').value.trim();
    const description = document.getElementById('wo-description').value.trim();
    const clientId = woClientSelect.value;
    const workerId = woWorkerSelect.value;
    const status = woStatusSelect.value;
    const dueDate = woDueInput.value;
    const location = woLocationInput.value.trim();
    const contactName = woContactNameInput.value.trim();
    const contactPhone = woContactPhoneInput.value.trim();
    if (!number || !title || !description || !clientId || !workerId || !dueDate || !location || !contactName || !contactPhone) {
        alert('Please complete all required fields');
        return;
    }
    // Convert before photos to Base64 strings
    const photoFilesBefore = woPhotosBeforeInput.files;
    const photosBefore = [];
    for (const file of photoFilesBefore) {
        const dataUrl = await fileToDataURL(file);
        photosBefore.push(dataUrl);
    }
    if (editingWorkOrderId) {
        // Editing existing
        const wo = workOrders.find(w => w.id === editingWorkOrderId);
        if (wo) {
            wo.number = number;
            wo.title = title;
            wo.description = description;
            wo.clientId = clientId;
            wo.workerId = workerId;
            wo.status = status;
            wo.dueDate = dueDate;
            wo.serviceLocation = location;
            wo.contactName = contactName;
            wo.contactPhone = contactPhone;
            // Append new photos before
            if (photosBefore.length > 0) wo.photosBefore = wo.photosBefore.concat(photosBefore);
            // Service executed details
            const serviceDesc = woServiceDescInput.value.trim();
            if (serviceDesc) wo.serviceDescription = serviceDesc;
            // After photos
            const photoFilesAfter = woPhotosAfterInput.files;
            const afterList = [];
            for (const file of photoFilesAfter) {
                const dataUrl = await fileToDataURL(file);
                afterList.push(dataUrl);
            }
            if (afterList.length > 0) {
                if (!wo.photosAfter) wo.photosAfter = [];
                wo.photosAfter = wo.photosAfter.concat(afterList);
            }
        saveWorkOrders();
        renderWorkOrders();
        alert('Work order updated');
        hideWorkOrderForm();
        }
        editingWorkOrderId = null;
        cancelWoBtn.classList.add('hidden');
        // Hide service executed section after editing
        toggleServiceExecutedFields(false);
    } else {
        // Create new
        const id = Date.now().toString();
        const createdAt = Date.now();
        const createdDateStr = new Date(createdAt).toISOString().split('T')[0];
        const newWO = {
            id,
            number,
            title,
            description,
            clientId,
            workerId,
            status,
            photosBefore,
            createdAt,
            createdDate: createdDateStr,
            dueDate,
            serviceLocation: location,
            contactName,
            contactPhone,
            accepted: null, // will be set after worker accepts/declines
            serviceDescription: '',
            photosAfter: []
        };
        workOrders.push(newWO);
        saveWorkOrders();
        renderWorkOrders();
        alert('Work order created');
        // Send email notification to worker for the new work order
        sendNewWorkOrderEmail(newWO);
        // Return to list view after creation
        hideWorkOrderForm();
    }
    woForm.reset();
    // Reset created date field to today's date for new entry
    const today = new Date().toISOString().split('T')[0];
    woCreatedInput.value = today;
});

// Cancel editing
cancelWoBtn.addEventListener('click', () => {
    editingWorkOrderId = null;
    // Hide service executed fields
    toggleServiceExecutedFields(false);
    // Hide form and show lists
    hideWorkOrderForm();
});

// Helper: file to data URL
function fileToDataURL(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

// Toggle service executed fields visibility
function toggleServiceExecutedFields(show) {
    const sections = document.querySelectorAll('.service-executed-section');
    sections.forEach(sec => {
        if (show) {
            sec.classList.remove('hidden');
        } else {
            sec.classList.add('hidden');
        }
    });
}

// Edit work order
function editWorkOrder(id) {
    const wo = workOrders.find(w => w.id === id);
    if (!wo) return;
    // Show form and hide lists before populating
    showWorkOrderForm();
    editingWorkOrderId = id;
    woNumberInput.value = wo.number;
    document.getElementById('wo-title').value = wo.title;
    document.getElementById('wo-description').value = wo.description;
    woClientSelect.value = wo.clientId;
    woWorkerSelect.value = wo.workerId;
    woStatusSelect.value = wo.status;
    woCreatedInput.value = wo.createdDate;
    woDueInput.value = wo.dueDate;
    woLocationInput.value = wo.serviceLocation;
    woContactNameInput.value = wo.contactName;
    woContactPhoneInput.value = wo.contactPhone;
    woServiceDescInput.value = wo.serviceDescription || '';
    // When editing, show service executed section so user can add executed details
    toggleServiceExecutedFields(true);
    cancelWoBtn.classList.remove('hidden');
    // Scroll to form
    document.getElementById('workorders-section').scrollIntoView({ behavior: 'smooth' });
}

// Delete work order
function deleteWorkOrder(id) {
    if (!confirm('Are you sure you want to delete this work order?')) return;
    workOrders = workOrders.filter(w => w.id !== id);
    saveWorkOrders();
    renderWorkOrders();
}

// View work order
function viewWorkOrder(id) {
    const wo = workOrders.find(w => w.id === id);
    if (!wo) return;
    const client = clients.find(c => c.id === wo.clientId);
    const worker = workers.find(w => w.id === wo.workerId);
    let html = '';
    // Title
    html += `<h2>${wo.number} - ${wo.title}</h2>`;
    // Interactive status selector
    const statuses = ['Open','On Hold','In Progress','Done'];
    html += '<div class="status-selector">';
    statuses.forEach(st => {
        const activeClass = st === wo.status ? 'active' : '';
        html += `<button class="status-option ${activeClass}" data-status="${st}">${st}</button>`;
    });
    html += '</div>';
    // Accepted/Declined info
    if (typeof wo.accepted === 'boolean') {
        html += `<p><strong>Response:</strong> ${wo.accepted ? 'Accepted' : 'Declined'}</p>`;
    }
    html += `<p><strong>Description:</strong> ${wo.description}</p>`;
    html += `<p><strong>Client:</strong> ${client ? `${client.name} (${client.email})` : 'N/A'}</p>`;
    html += `<p><strong>Worker:</strong> ${worker ? `${worker.name} (${worker.email})` : 'N/A'}</p>`;
    html += `<p><strong>Created:</strong> ${wo.createdDate}</p>`;
    html += `<p><strong>Due Date:</strong> ${wo.dueDate}</p>`;
    html += `<p><strong>Location:</strong> ${wo.serviceLocation}</p>`;
    html += `<p><strong>Contact:</strong> ${wo.contactName} (${wo.contactPhone})</p>`;
    if (wo.photosBefore && wo.photosBefore.length > 0) {
        html += '<h3>Problem Photos</h3><div class="photo-gallery">';
        wo.photosBefore.forEach(src => {
            html += `<img src="${src}" alt="Photo" style="max-width:100%;margin-bottom:0.5rem;">`;
        });
        html += '</div>';
    }
    // Service executed details
    if (wo.serviceDescription) {
        html += `<p><strong>Service Executed Description:</strong> ${wo.serviceDescription}</p>`;
    }
    if (wo.photosAfter && wo.photosAfter.length > 0) {
        html += '<h3>Executed Service Photos</h3><div class="photo-gallery">';
        wo.photosAfter.forEach(src => {
            html += `<img src="${src}" alt="Photo" style="max-width:100%;margin-bottom:0.5rem;">`;
        });
        html += '</div>';
    }
    modalContent.innerHTML = html;
    // Attach event listeners for status buttons once content is set
    const statusButtons = modalContent.querySelectorAll('.status-option');
    statusButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const newStatus = btn.getAttribute('data-status');
            if (wo.status !== newStatus) {
                wo.status = newStatus;
                saveWorkOrders();
                renderWorkOrders();
            }
            // Update active classes
            statusButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    modalOverlay.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
});

// Send work order (notification simulation with accept/decline)
function sendWorkOrder(id) {
    const wo = workOrders.find(w => w.id === id);
    if (!wo) return;
    const worker = workers.find(w => w.id === wo.workerId);
    if (!worker) return;
    // Send email notification when the work order is explicitly sent. This notifies the worker that a work order awaits their response.
    sendNewWorkOrderEmail(wo);
    // Show modal with accept/decline options
    let html = '';
    html += `<h2>Send Work Order</h2>`;
    html += `<p>This will send the work order "${wo.number} - ${wo.title}" to ${worker.name} at ${worker.email}.</p>`;
    html += `<button id="accept-btn" style="margin-right:0.5rem;background-color:#2e7d32;color:white;padding:0.5rem;border:none;border-radius:4px;cursor:pointer;">Accept</button>`;
    html += `<button id="decline-btn" style="background-color:#e53935;color:white;padding:0.5rem;border:none;border-radius:4px;cursor:pointer;">Decline</button>`;
    modalContent.innerHTML = html;
    modalOverlay.classList.remove('hidden');
    document.getElementById('accept-btn').addEventListener('click', () => {
        wo.accepted = true;
        wo.status = 'In Progress';
        saveWorkOrders();
        renderWorkOrders();
        modalOverlay.classList.add('hidden');
        alert(`Work order accepted by ${worker.name}`);
    });
    document.getElementById('decline-btn').addEventListener('click', () => {
        wo.accepted = false;
        wo.status = 'On Hold';
        saveWorkOrders();
        renderWorkOrders();
        modalOverlay.classList.add('hidden');
        alert(`Work order declined by ${worker.name}`);
    });
}

// Load initial lists
function init() {
    populateDropdowns();
    renderWorkers();
    renderClients();
    renderWorkOrders();
    // For new entries, set created date field to today (this field is disabled and used for display)
    const today = new Date().toISOString().split('T')[0];
    woCreatedInput.value = today;
}

init();