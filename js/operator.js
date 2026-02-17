/**
 * ========================================
 * PANEL DE OPERADOR - VERSIÓN CORREGIDA
 * ========================================
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Panel operador cargado - Iniciando...');
    
    // Mostrar nombre del usuario
    const user = StorageService.getCurrentUser();
    if (user) {
        document.getElementById('userNameDisplay').innerHTML = 
            `<i class="fas fa-user me-1"></i>${user.name} (Operador)`;
    }
    
    // Configurar fecha actual en el picker
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        const today = new Date().toISOString().split('T')[0];
        datePicker.value = today;
        console.log('Fecha actual establecida:', today);
    }
    
    // Cargar la agenda
    loadDailyAgenda();
    
    // Configurar eventos
    setupOperatorEvents();
});

/**
 * Carga la agenda del día seleccionado
 */
function loadDailyAgenda() {
    console.log('Cargando agenda diaria...');
    
    const datePicker = document.getElementById('datePicker');
    if (!datePicker) {
        console.error('No se encontró el datePicker');
        return;
    }
    
    const selectedDate = datePicker.value;
    if (!selectedDate) {
        console.error('No hay fecha seleccionada');
        return;
    }
    
    console.log('Fecha seleccionada:', selectedDate);
    
    // Actualizar título de la agenda
    const agendaDateEl = document.getElementById('agendaDate');
    if (agendaDateEl) {
        agendaDateEl.textContent = formatDate(selectedDate);
    }
    
    // Obtener todas las reservas
    const allReservations = StorageService.getReservations();
    console.log('Total reservas:', allReservations.length);
    
    // Filtrar reservas del día
    const dailyReservations = allReservations.filter(r => r.date === selectedDate);
    console.log('Reservas del día:', dailyReservations.length);
    
    // Actualizar contadores
    updateCounters(dailyReservations);
    
    // Mostrar la agenda
    displayAgenda(dailyReservations);
}

/**
 * Actualiza los contadores del resumen
 */
function updateCounters(reservations) {
    const totalEl = document.getElementById('totalCount');
    const pendingEl = document.getElementById('pendingCount');
    const confirmedEl = document.getElementById('confirmedCount');
    
    if (totalEl) totalEl.textContent = reservations.length;
    if (pendingEl) pendingEl.textContent = reservations.filter(r => r.status === 'pending').length;
    if (confirmedEl) confirmedEl.textContent = reservations.filter(r => r.status === 'confirmed').length;
}

/**
 * Muestra la agenda en el DOM
 */
function displayAgenda(reservations) {
    const container = document.getElementById('dailyAgenda');
    if (!container) {
        console.error('No se encontró el contenedor dailyAgenda');
        return;
    }
    
    // Ordenar por hora
    reservations.sort((a, b) => a.time.localeCompare(b.time));
    
    if (reservations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-calendar-day fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No hay reservas para este día</h5>
                <p class="text-muted">Las reservas aparecerán aquí cuando los clientes las creen</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="list-group">';
    
    reservations.forEach(r => {
        const statusClass = r.status === 'pending' ? 'badge-pending' : 
                           r.status === 'confirmed' ? 'badge-confirmed' : 'badge-cancelled';
        
        const statusText = r.status === 'pending' ? 'Pendiente' :
                          r.status === 'confirmed' ? 'Confirmada' : 'Cancelada';
        
        const canConfirm = r.status === 'pending';
        const canCancel = r.status !== 'cancelled';
        
        html += `
            <div class="list-group-item agenda-card mb-2 p-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div style="flex: 1;">
                        <div class="d-flex align-items-center mb-2">
                            <span class="time-slot me-3" style="font-weight: bold; color: #667eea;">${r.time}</span>
                            <span class="badge ${statusClass}" style="padding: 5px 10px; border-radius: 20px;">${statusText}</span>
                        </div>
                        <h6 class="mb-1">${r.clientName}</h6>
                        <p class="mb-1 text-muted">
                            <i class="fas fa-tag me-1"></i>${r.service}
                        </p>
                        ${r.notes ? `<small class="text-muted"><i class="fas fa-comment me-1"></i>${r.notes}</small>` : ''}
                    </div>
                    <div class="btn-group btn-group-sm">
                        ${canConfirm ? `
                            <button class="btn btn-success" onclick="confirmReservation('${r.id}')" title="Confirmar">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-warning" onclick="openRescheduleModal('${r.id}')" title="Reprogramar">
                            <i class="fas fa-calendar-alt"></i>
                        </button>
                        ${canCancel ? `
                            <button class="btn btn-danger" onclick="cancelReservation('${r.id}')" title="Cancelar">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Configura los eventos del panel
 */
function setupOperatorEvents() {
    // Evento de cambio de fecha
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.addEventListener('change', function() {
            console.log('Fecha cambiada a:', this.value);
            loadDailyAgenda();
        });
    }
    
    // Botón "Ver Agenda"
    const viewBtn = document.querySelector('button[onclick="loadDailyAgenda()"]');
    if (viewBtn) {
        // Ya está manejado por el onclick en HTML
    }
    
    // Evento de reprogramación
    const rescheduleForm = document.getElementById('rescheduleForm');
    if (rescheduleForm) {
        rescheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const id = document.getElementById('rescheduleReservationId').value;
            const newDate = document.getElementById('newDate').value;
            const newTime = document.getElementById('newTime').value;
            
            // Validar fecha futura
            if (!validateFutureDate(newDate)) {
                showAlert('La fecha debe ser hoy o futura', 'danger');
                return;
            }
            
            const result = ReservationService.update(id, {
                date: newDate,
                time: newTime
            });
            
            if (result.success) {
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('rescheduleModal'));
                modal.hide();
                
                // Recargar agenda
                loadDailyAgenda();
                
                showAlert('Reserva reprogramada exitosamente', 'success');
            } else {
                showAlert(result.message, 'danger');
            }
        });
    }
    
    // Configurar modal para fecha mínima
    const rescheduleModal = document.getElementById('rescheduleModal');
    if (rescheduleModal) {
        rescheduleModal.addEventListener('show.bs.modal', function() {
            const newDate = document.getElementById('newDate');
            if (newDate) {
                const today = new Date().toISOString().split('T')[0];
                newDate.min = today;
            }
        });
    }
}

/**
 * Confirma una reserva
 */
function confirmReservation(id) {
    if (confirm('¿Confirmar esta reserva?')) {
        const result = ReservationService.changeStatus(id, 'confirmed');
        if (result.success) {
            showAlert('Reserva confirmada', 'success');
            loadDailyAgenda();
        }
    }
}

/**
 * Cancela una reserva
 */
function cancelReservation(id) {
    if (confirm('¿Cancelar esta reserva?')) {
        const result = ReservationService.changeStatus(id, 'cancelled');
        if (result.success) {
            showAlert('Reserva cancelada', 'success');
            loadDailyAgenda();
        }
    }
}

/**
 * Abre el modal para reprogramar
 */
function openRescheduleModal(id) {
    const reservations = StorageService.getReservations();
    const reservation = reservations.find(r => r.id === id);
    
    if (!reservation) {
        showAlert('Reserva no encontrada', 'danger');
        return;
    }
    
    document.getElementById('rescheduleReservationId').value = id;
    document.getElementById('currentDateTime').textContent = 
        `${formatDate(reservation.date)} - ${reservation.time}`;
    document.getElementById('newDate').value = reservation.date;
    document.getElementById('newTime').value = reservation.time;
    
    const modal = new bootstrap.Modal(document.getElementById('rescheduleModal'));
    modal.show();
}

// Hacer funciones globales
window.loadDailyAgenda = loadDailyAgenda;
window.confirmReservation = confirmReservation;
window.cancelReservation = cancelReservation;
window.openRescheduleModal = openRescheduleModal;