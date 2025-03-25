let apiKey = '';
let currentData = [];

// Loading overlay functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Modal handling functions
function showModal(modalId, backdropId) {
    document.getElementById(modalId).style.display = 'block';
    document.getElementById(backdropId).style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling of background
}

function hideModal(modalId, backdropId) {
    document.getElementById(modalId).style.display = 'none';
    document.getElementById(backdropId).style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
}

function showLoginModal() {
    showModal('loginModal', 'loginModalBackdrop');
}

function closeLoginModal() {
    hideModal('loginModal', 'loginModalBackdrop');
}

function submitApiKey() {
    apiKey = document.getElementById('apiKeyInput').value;
    closeLoginModal();
    fetchData();
}

// API handling
async function getConfig() {
    try {
        const response = await fetch('config.json');
        const configjson = await response.json();
        const groupBy = document.getElementById('groupBy').value;
        return configjson[groupBy];
    } catch (error) {
        console.error('Error loading config:', error);
        throw error;
    }
}

async function fetchData() {
    if (!apiKey) {
        showLoginModal();
        return;
    }

    showLoading();
    try {
        const config = await getConfig();
        const response = await fetch(
            `${config}?key=${apiKey}&action=read`
        );
        const result = await response.json();

        if (result.error) {
            if (result.error.includes('Unauthorized')) {
                showLoginModal();
            }
            throw new Error(result.error);
        }

        currentData = result.data.slice(1); // Skip header row
        displayData();
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading data');
    } finally {
        hideLoading();
    }
}

// Helper function to calculate age
function calculateAge(birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// Display functions
function getPriorityColor(priority) {
    const value = parseInt(priority);
    const hue = ((10 - value) * 12); // 120 (green) to 0 (red)
    return `hsl(${hue}, 70%, 50%)`;
}

function formatPendientes(pendientesStr) {
    try {
        const pendientes = JSON.parse(pendientesStr);
        return pendientes.map(p => `
            <div class="pendiente-item" style="background-color: ${getPriorityColor(p.priority)}">
                ${p.name} - ${new Date(p.date).toLocaleDateString()} 
                (Prioridad: ${p.priority})
            </div>
        `).join('');
    } catch (e) {
        return '';
    }
}

// function displayData() {
//     let displayData = [...currentData];

//     // Apply search filter
//     const searchTerm = document.getElementById('searchInput').value.toLowerCase();
//     if (searchTerm) {
//         displayData = displayData.filter(row =>
//             row[1].toLowerCase().includes(searchTerm) || // Filter by patologia
//             row[2].toLowerCase().includes(searchTerm)    // Filter by medicamentos
//         );
//     }

//     const tbody = document.getElementById('tableBody');
//     tbody.innerHTML = displayData.map(row => `
//         <tr>
//             <td class="patologia-cell">${row[1]}</td>
//             <td class="medicamentos-cell">${row[2]}</td>
//             <td class="observaciones-cell">${row[3]}</td>
//             <td class="enlaces-cell">${formatEnlaces(row[4])}</td>
//             <td class="actions-cell">
//                 <button onclick="editPerson('${row[0]}')" class="btn">Editar</button>
//                 <button onclick="deletePerson('${row[0]}')" class="btn btn-danger">Eliminar</button>
//             </td>
//         </tr>
//     `).join('');
// }


function displayData() {
    let displayData = [...currentData];

    // Apply search filter
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        displayData = displayData.filter(row =>
            row[1].toLowerCase().includes(searchTerm) || // Patologia
            row[2].toLowerCase().includes(searchTerm) || // Medicamentos
            row[3].toLowerCase().includes(searchTerm)    // Observaciones
        );
    }

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = displayData.map(row => `
        <tr>
            <td class="patologia-cell">
                <div class="patologia-content">
                    <div class="patologia-text">${row[1]}</div>
                    <div class="patologia-actions">
                        <button onclick="editPerson('${row[0]}')" class="btn btn-sm">Editar</button>
                        <button onclick="deletePerson('${row[0]}')" class="btn btn-sm btn-danger">Eliminar</button>
                    </div>
                </div>
            </td>
            <td class="medicamentos-cell">${row[2]}</td>
            <td class="observaciones-cell">${row[3]}</td>
            <td class="enlaces-cell">${formatEnlaces(row[4])}</td>
        </tr>
    `).join('');
}

// function formatEnlaces(enlacesStr) {
//     try {
//         const enlaces = JSON.parse(enlacesStr);
//         return enlaces.map(e => `
//             <div class="enlace-item">
//                 <a href="${e.link}" target="_blank" rel="noopener noreferrer">${e.name}</a>
//             </div>
//         `).join('');
//     } catch (e) {
//         return '';
//     }
// }

function formatEnlaces(enlacesStr) {
    try {
        const enlaces = JSON.parse(enlacesStr);
        return enlaces.map(e => {
            // Ensure the link has a protocol
            const url = e.link.startsWith('http://') || e.link.startsWith('https://') 
                ? e.link 
                : `https://${e.link}`;
            return `
            <div class="enlace-item">
                <a href="${url}" target="_blank" rel="noopener noreferrer">${e.name}</a>
            </div>
        `}).join('');
    } catch (e) {
        return '';
    }
}


// CRUD Operations
function getPersonFormContent(person = null) {
    return `
        <div class="modal-form-group">
            <label>Patologia:</label>
            <input type="text" id="personPatologia" value="${person?.patologia || ''}">
        </div>
        <div class="modal-form-group">
            <label>Medicamentos:</label>
            <textarea id="personMedicamentos" rows="4">${person?.medicamentos || ''}</textarea>
        </div>
        <div class="modal-form-group">
            <label>Observaciones:</label>
            <textarea id="personObservaciones" rows="4">${person?.observaciones || ''}</textarea>
        </div>
        <div class="modal-form-group">
            <label>Enlaces:</label>
            <div id="enlacesList"></div>
        </div>
    `;
}

function addEnlaceField(existingData = null) {
    const enlaceDiv = document.createElement('div');
    enlaceDiv.className = 'enlace-field';
    enlaceDiv.innerHTML = `
        <input type="text" placeholder="Nombre del Enlace" value="${existingData?.name || ''}">
        <input type="url" placeholder="URL" value="${existingData?.link || ''}">
        <button onclick="this.parentElement.remove()" class="btn btn-danger">×</button>
    `;
    document.getElementById('enlacesList').appendChild(enlaceDiv);
}

function addNewPerson() {
    const modalContent = `
        <h2>Agregar Nueva Patología</h2>
        ${getPersonFormContent()}
        <div class="modal-buttons">
            <button onclick="addEnlaceField()" class="btn">Agregar Enlace</button>
            <button onclick="saveNewPerson()" class="btn btn-primary">Guardar</button>
            <button onclick="closeModal()" class="btn">Cancelar</button>
        </div>
    `;

    document.getElementById('editModal').innerHTML = modalContent;
    showModal('editModal', 'editModalBackdrop');
    addEnlaceField();
}
function addPendienteField(existingData = null) {
    const pendienteDiv = document.createElement('div');
    pendienteDiv.className = 'pendiente-field';
    pendienteDiv.innerHTML = `
        <input type="text" placeholder="Nombre" value="${existingData?.name || ''}">
        <input type="date" value="${existingData?.date || ''}">
        <input type="number" min="1" max="10" placeholder="Prioridad" 
               value="${existingData?.priority || ''}">
        <button onclick="this.parentElement.remove()" class="btn btn-danger">×</button>
    `;
    document.getElementById('pendientesList').appendChild(pendienteDiv);
}

async function saveNewPerson() {
    const data = {
        patologia: document.getElementById('personPatologia').value,
        medicamentos: document.getElementById('personMedicamentos').value,
        observaciones: document.getElementById('personObservaciones').value,
        enlaces: Array.from(document.getElementsByClassName('enlace-field')).map(div => ({
            name: div.children[0].value,
            link: div.children[1].value
        })).filter(e => e.name && e.link)
    };

    showLoading();
    try {
        const config = await getConfig();
        const response = await fetch(`${config}?key=${apiKey}`, {
            method: 'POST',
            body: JSON.stringify({
                action: 'create',
                ...data
            })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error);

        closeModal();
        fetchData();
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        alert('Error al guardar');
    }
}



function editPerson(id) {
    const person = currentData.find(row => row[0] === id);
    if (!person) return;

    const personData = {
        patologia: person[1],
        medicamentos: person[2],
        observaciones: person[3],
        enlaces: JSON.parse(person[4] || '[]')
    };

    const modalContent = `
        <h2>Editar Patología</h2>
        ${getPersonFormContent(personData)}
        <div class="modal-buttons">
            <button onclick="addEnlaceField()" class="btn">Agregar Enlace</button>
            <button onclick="saveEdit('${id}')" class="btn btn-primary">Guardar</button>
            <button onclick="closeModal()" class="btn">Cancelar</button>
        </div>
    `;

    document.getElementById('editModal').innerHTML = modalContent;
    showModal('editModal', 'editModalBackdrop');

    personData.enlaces.forEach(e => addEnlaceField(e));
}

async function saveEdit(id) {
    const data = {
        patologia: document.getElementById('personPatologia').value,
        medicamentos: document.getElementById('personMedicamentos').value,
        observaciones: document.getElementById('personObservaciones').value,
        enlaces: Array.from(document.getElementsByClassName('enlace-field')).map(div => ({
            name: div.children[0].value,
            link: div.children[1].value
        })).filter(e => e.name && e.link)
    };

    showLoading();
    try {
        const config = await getConfig();
        const response = await fetch(`${config}?key=${apiKey}`, {
            method: 'POST',
            body: JSON.stringify({
                action: 'update',
                id: id,
                ...data
            })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error);

        closeModal();
        fetchData();
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        alert('Error al actualizar');
    }
}

async function deletePerson(id) {
    if (!confirm('¿Está seguro de que desea eliminar esta patología?')) return;

    showLoading();
    try {
        const config = await getConfig();
        const response = await fetch(`${config}?key=${apiKey}`, {
            method: 'POST',
            body: JSON.stringify({
                action: 'delete',
                id: id
            })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error);

        fetchData();
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        alert('Error al eliminar');
    } finally {
        // hideLoading();
    }
}

function closeModal() {
    hideModal('editModal', 'editModalBackdrop');
}

// document.getElementById('searchInput').addEventListener('input', displayData);
// document.getElementById('sortBy').addEventListener('change', displayData);
document.getElementById('groupBy').addEventListener('change', fetchData);

document.addEventListener('DOMContentLoaded', () => {
    if (!apiKey) {
        showLoginModal();
    } else {
        fetchData();
    }
});