/**
 * ========================================
 * PANEL DE CLIENTE - VERSIÓN CORREGIDA
 * ========================================
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Panel cliente cargado - Iniciando...');
    
    // Mostrar nombre del usuario
    const user = StorageService.getCurrentUser();
    if (user) {
        document.getElementById('userNameDisplay').innerHTML = 
            `<i class="fas fa-user me-1"></i>${user.name}`;
        document.getElementById('clientName').textContent = user.name;
    }
    
    // Cargar reservas del cliente
    loadClientReservations();
    
    // Configurar eventos
    setupClientEvents();
});

/**
 * Carga las reservas del cliente
 */
function loadClientReservations() {
    const user = StorageService.getCurrentUser();
    if (!user) return;
    
    const allReservations = StorageService.getReservations();
    const clientReservations = allReservations.filter(r => r.clientId === user.id);
    
    console.log('Reservas del cliente:', clientReservations);
    
    // Actualizar estadísticas
    updateClientStats(clientReservations);
    
    // Separar activas y pasadas
    const today = new Date().toISOString().split('T')[0];
    const active = clientReservations.filter(r => r.date >= today && r.status !== 'cancelled');
    const history = clientReservations.filter(r => r.date < today || r.status === 'cancelled');
    
    displayActiveReservations(active);
    displayHistoryReservations(history);
}

/**
 * Actualiza las estadísticas del cliente
 */
function updateClientStats(reservations) {
    const today = new Date().toISOString().split('T')[0];
    
    document.getElementById('totalReservations').textContent = reservations.length;
    document.getElementById('activeReservations').textContent = 
        reservations.filter(r => r.date >= today && r.status !== 'cancelled').length;
    document.getElementById('pastReservations').textContent = 
        reservations.filter(r => r.date < today || r.status === 'cancelled').length;
}

/**
 * Muestra las reservas activas
 */
function displayActiveReservations(reservations) {
    const container = document.getElementById('activeReservationsList');
    if (!container) return;
    
    if (reservations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-calendar-check fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No tienes reservas activas</h5>
                <p class="text-muted">¡Crea una nueva reserva para comenzar!</p>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#newReservationModal">
                    <i class="fas fa-plus me-2"></i>Crear Reserva
                </button>
            </div>
        `;
        return;
    }
    
    // Ordenar por fecha (más próxima primero)
    reservations.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    container.innerHTML = reservations.map(r => {
        const statusClass = r.status === 'pending' ? 'badge-pending' : 'badge-confirmed';
        const statusText = r.status === 'pending' ? 'Pendiente' : 'Confirmada';
        
        return `
            <div class="card reservation-card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="d-flex align-items-center mb-2">
                                <h5 class="card-title mb-0 me-3">${r.service}</h5>
                                <span class="badge ${statusClass}">${statusText}</span>
                            </div>
                            <p class="mb-2">
                                <i class="fas fa-calendar me-2 text-primary"></i>${formatDate(r.date)}
                                <i class="fas fa-clock ms-3 me-2 text-primary"></i>${r.time}
                            </p>
                            ${r.notes ? `<p class="text-muted mb-2"><i class="fas fa-comment me-2"></i>${r.notes}</p>` : ''}
                        </div>
                        <div>
                            <button class="btn btn-outline-danger btn-sm" onclick="cancelClientReservation('${r.id}')">
                                <i class="fas fa-times me-1"></i>Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Muestra el historial de reservas
 */
function displayHistoryReservations(reservations) {
    const container = document.getElementById('historyReservationsList');
    if (!container) return;
    
    if (reservations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-history fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay reservas en tu historial</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por fecha (más reciente primero)
    reservations.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = reservations.map(r => {
        const statusClass = r.status === 'pending' ? 'badge-pending' : 
                           r.status === 'confirmed' ? 'badge-confirmed' : 'badge-cancelled';
        const statusText = r.status === 'pending' ? 'Pendiente' : 
                          r.status === 'confirmed' ? 'Completada' : 'Cancelada';
        
        return `
            <div class="card reservation-card mb-3 bg-light">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            <h5 class="card-title mb-2">${r.service}</h5>
                            <p class="mb-1">
                                <i class="fas fa-calendar me-2 text-muted"></i>${formatDate(r.date)}
                                <i class="fas fa-clock ms-3 me-2 text-muted"></i>${r.time}
                            </p>
                            <span class="badge ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Configura los eventos del cliente
 */
function setupClientEvents() {
    // Modal de nueva reserva
    const modal = document.getElementById('newReservationModal');
    if (modal) {
        modal.addEventListener('show.bs.modal', function() {
            console.log('Abriendo modal de nueva reserva');
            
            const dateInput = document.getElementById('reservationDate');
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.min = today;
                dateInput.value = today;
                console.log('Fecha establecida:', today);
            }
            
            // Llenar horarios disponibles
            updateAvailableTimes();
        });
    }
    
    // Cambio de fecha - actualizar horarios disponibles
    const dateInput = document.getElementById('reservationDate');
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            console.log('Fecha cambiada a:', this.value);
            updateAvailableTimes();
        });
    }
    
    // Formulario de nueva reserva
    const form = document.getElementById('newReservationForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const user = StorageService.getCurrentUser();
            if (!user) return;
            
            const service = document.getElementById('service').value;
            const date = document.getElementById('reservationDate').value;
            const time = document.getElementById('reservationTime').value;
            const notes = document.getElementById('notes').value;
            
            // Validaciones
            if (!service || !date || !time) {
                showAlert('Por favor complete todos los campos', 'danger');
                return;
            }
            
            const reservationData = {
                clientId: user.id,
                clientName: user.name,
                clientEmail: user.email,
                service: service,
                date: date,
                time: time,
                notes: notes
            };
            
            console.log('Creando reserva:', reservationData);
            
            const result = ReservationService.create(reservationData);
            
            if (result.success) {
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('newReservationModal'));
                modal.hide();
                
                // Limpiar formulario
                form.reset();
                
                // Recargar datos
                loadClientReservations();
                
                showAlert(result.message, 'success');
            } else {
                showAlert(result.message, 'danger');
            }
        });
    }
}

/**
 * Actualiza los horarios disponibles
 */
function updateAvailableTimes() {
    const dateInput = document.getElementById('reservationDate');
    const timeSelect = document.getElementById('reservationTime');
    
    if (!dateInput || !timeSelect) {
        console.error('No se encontraron los elementos de fecha/hora');
        return;
    }
    
    const selectedDate = dateInput.value;
    if (!selectedDate) {
        console.log('No hay fecha seleccionada');
        return;
    }
    
    console.log('Actualizando horarios para:', selectedDate);
    
    // Todos los horarios disponibles
    const allTimes = [
        '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00'
    ];
    
    // Obtener reservas existentes
    const reservations = StorageService.getReservations();
    console.log('Reservas existentes:', reservations);
    
    // Filtrar horarios ocupados
    const availableTimes = allTimes.filter(time => {
        const isOccupied = reservations.some(r => 
            r.date === selectedDate && 
            r.time === time && 
            r.status !== 'cancelled'
        );
        return !isOccupied;
    });
    
    console.log('Horarios disponibles:', availableTimes);
    
    // Limpiar y llenar el select
    timeSelect.innerHTML = '<option value="">Seleccione un horario</option>';
    
    if (availableTimes.length === 0) {
        timeSelect.innerHTML += '<option value="" disabled>No hay horarios disponibles</option>';
    } else {
        availableTimes.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        });
    }
}

/**
 * Cancela una reserva desde el panel del cliente
 */
function cancelClientReservation(id) {
    if (confirm('¿Está seguro de cancelar esta reserva?')) {
        const result = ReservationService.changeStatus(id, 'cancelled');
        if (result.success) {
            showAlert('Reserva cancelada', 'success');
            loadClientReservations();
        }
    }
}

// Hacer funciones globales
window.cancelClientReservation = cancelClientReservation;