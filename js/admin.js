/**
 * ========================================
 * PANEL DE ADMINISTRADOR - VERSIÓN FUNCIONAL
 * ========================================
 */

let currentFilter = 'all';
let statusChart = null;

// Cargar datos cuando la página esté lista
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel cargado');
    loadAdminData();
    setupModalEvents();
});

/**
 * Carga todos los datos del admin
 */
function loadAdminData() {
    const user = StorageService.getCurrentUser();
    if (user) {
        document.getElementById('userNameDisplay').innerHTML = 
            `<i class="fas fa-user me-1"></i>${user.name} (Admin)`;
    }
    
    loadStatistics();
    loadReservationsTable();
    loadUsersList();
    updateChart();
}

/**
 * Carga las estadísticas
 */
function loadStatistics() {
    const reservations = StorageService.getReservations();
    console.log('Cargando estadísticas:', reservations);
    
    const stats = {
        total: reservations.length,
        pending: reservations.filter(r => r.status === 'pending').length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length
    };
    
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statPending').textContent = stats.pending;
    document.getElementById('statConfirmed').textContent = stats.confirmed;
    document.getElementById('statCancelled').textContent = stats.cancelled;
}

/**
 * Carga la tabla de reservas
 */
function loadReservationsTable() {
    const tbody = document.getElementById('reservationsTableBody');
    if (!tbody) return;
    
    let reservations = StorageService.getReservations();
    console.log('Cargando reservas:', reservations);
    
    // Aplicar filtro
    if (currentFilter !== 'all') {
        reservations = reservations.filter(r => r.status === currentFilter);
    }
    
    // Ordenar por fecha (más reciente primero)
    reservations.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (reservations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-calendar-times fa-3x text-muted mb-2"></i>
                    <p class="text-muted">No hay reservas para mostrar</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = reservations.map(r => {
        const statusClass = {
            'pending': 'badge-pending',
            'confirmed': 'badge-confirmed',
            'cancelled': 'badge-cancelled'
        }[r.status];
        
        const statusText = {
            'pending': 'Pendiente',
            'confirmed': 'Confirmada',
            'cancelled': 'Cancelada'
        }[r.status];
        
        return `
            <tr>
                <td data-label="Cliente">
                    <strong>${r.clientName}</strong><br>
                    <small>${r.clientEmail}</small>
                </td>
                <td data-label="Servicio">${r.service}</td>
                <td data-label="Fecha">${formatDate(r.date)}</td>
                <td data-label="Hora">${r.time}</td>
                <td data-label="Estado">
                    <span class="${statusClass}">${statusText}</span>
                </td>
                <td data-label="Notas">${r.notes || '-'}</td>
                <td data-label="Acciones">
                    <select class="form-select form-select-sm d-inline-block w-auto" 
                            onchange="changeReservationStatus('${r.id}', this.value)">
                        <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                        <option value="confirmed" ${r.status === 'confirmed' ? 'selected' : ''}>Confirmada</option>
                        <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>Cancelada</option>
                    </select>
                    <button class="btn btn-sm btn-danger btn-action" onclick="deleteReservation('${r.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Carga la lista de usuarios
 */
function loadUsersList() {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    const users = StorageService.getUsers();
    const currentUser = StorageService.getCurrentUser();
    
    // Filtrar usuario actual
    const otherUsers = users.filter(u => u.id !== currentUser?.id);
    
    if (otherUsers.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-4">
                <i class="fas fa-users fa-3x text-muted mb-2"></i>
                <p class="text-muted">No hay otros usuarios registrados</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = otherUsers.map(user => `
        <div class="col-md-6 mb-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${user.name}</h6>
                            <p class="mb-1 small text-muted">
                                <i class="fas fa-envelope me-1"></i>${user.email}
                            </p>
                            <span class="badge bg-${user.role === 'admin' ? 'danger' : user.role === 'operator' ? 'warning' : 'info'}">
                                ${user.role === 'admin' ? 'Administrador' : user.role === 'operator' ? 'Operador' : 'Cliente'}
                            </span>
                        </div>
                        <div>
                            <select class="form-select form-select-sm" onchange="changeUserRole('${user.id}', this.value)">
                                <option value="client" ${user.role === 'client' ? 'selected' : ''}>Cliente</option>
                                <option value="operator" ${user.role === 'operator' ? 'selected' : ''}>Operador</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Actualiza el gráfico de estadísticas
 */
function updateChart() {
    const ctx = document.getElementById('statusChart')?.getContext('2d');
    if (!ctx) return;
    
    const reservations = StorageService.getReservations();
    const stats = {
        pending: reservations.filter(r => r.status === 'pending').length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length
    };
    
    if (statusChart) {
        statusChart.destroy();
    }
    
    statusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pendientes', 'Confirmadas', 'Canceladas'],
            datasets: [{
                data: [stats.pending, stats.confirmed, stats.cancelled],
                backgroundColor: ['#ffc107', '#28a745', '#dc3545']
            }]
        }
    });
    
    // Estadísticas recientes
    const recentDiv = document.getElementById('recentStats');
    if (recentDiv) {
        const today = new Date().toISOString().split('T')[0];
        const todayReservations = reservations.filter(r => r.date === today).length;
        
        recentDiv.innerHTML = `
            <div class="list-group">
                <div class="list-group-item d-flex justify-content-between">
                    <span>Reservas hoy:</span>
                    <strong>${todayReservations}</strong>
                </div>
                <div class="list-group-item d-flex justify-content-between">
                    <span>Total reservas:</span>
                    <strong>${reservations.length}</strong>
                </div>
                <div class="list-group-item d-flex justify-content-between">
                    <span>Tasa de confirmación:</span>
                    <strong>${reservations.length ? Math.round((stats.confirmed / reservations.length) * 100) : 0}%</strong>
                </div>
            </div>
        `;
    }
}

/**
 * Filtra las reservas por estado
 */
function filterReservations(filter) {
    currentFilter = filter;
    
    // Actualizar botones
    document.querySelectorAll('[onclick^="filterReservations"]').forEach(btn => {
        btn.className = 'btn btn-outline-' + 
            (btn.textContent.includes('Todas') ? 'primary' : 
             btn.textContent.includes('Pendientes') ? 'warning' :
             btn.textContent.includes('Confirmadas') ? 'success' : 'danger');
    });
    
    event.target.className = 'btn btn-' + 
        (event.target.textContent.includes('Todas') ? 'primary' : 
         event.target.textContent.includes('Pendientes') ? 'warning' :
         event.target.textContent.includes('Confirmadas') ? 'success' : 'danger');
    
    loadReservationsTable();
}

/**
 * Cambia el estado de una reserva
 */
function changeReservationStatus(id, status) {
    const result = ReservationService.changeStatus(id, status);
    if (result.success) {
        showAlert(result.message, 'success');
        loadAdminData();
    } else {
        showAlert(result.message, 'danger');
    }
}

/**
 * Elimina una reserva
 */
function deleteReservation(id) {
    if (confirm('¿Está seguro de eliminar esta reserva?')) {
        const result = ReservationService.delete(id);
        if (result.success) {
            showAlert(result.message, 'success');
            loadAdminData();
        }
    }
}

/**
 * Cambia el rol de un usuario
 */
function changeUserRole(userId, newRole) {
    const users = StorageService.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
        user.role = newRole;
        StorageService.saveUser(user);
        showAlert(`Rol de ${user.name} actualizado`, 'success');
        loadUsersList();
    }
}

/**
 * Configura los eventos del modal
 */
function setupModalEvents() {
    const modal = document.getElementById('newReservationModal');
    if (!modal) return;
    
    // Establecer fecha mínima
    const dateInput = document.getElementById('reservationDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }
    
    // Manejar envío del formulario
    const form = document.getElementById('newReservationForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const reservationData = {
                clientId: 'admin_' + Date.now(),
                clientName: document.getElementById('clientName').value,
                clientEmail: document.getElementById('clientEmail').value,
                service: document.getElementById('service').value,
                date: document.getElementById('reservationDate').value,
                time: document.getElementById('reservationTime').value,
                notes: document.getElementById('notes').value
            };
            
            const result = ReservationService.create(reservationData);
            
            if (result.success) {
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('newReservationModal'));
                modal.hide();
                
                // Limpiar formulario
                form.reset();
                
                // Recargar datos
                loadAdminData();
                
                showAlert(result.message, 'success');
            } else {
                showAlert(result.message, 'danger');
            }
        });
    }
}

// Hacer funciones globales
window.filterReservations = filterReservations;
window.changeReservationStatus = changeReservationStatus;
window.deleteReservation = deleteReservation;
window.changeUserRole = changeUserRole;
window.loadAdminData = loadAdminData;