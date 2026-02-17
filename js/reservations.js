const ReservationService = {
    create: function(data) {
        if (!validateFutureDate(data.date)) {
            return { success: false, message: 'La fecha debe ser hoy o futura' };
        }
        
        if (!isTimeSlotAvailable(data.date, data.time)) {
            return { success: false, message: 'Horario no disponible' };
        }
        
        const reservation = {
            id: Date.now().toString(),
            ...data,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        const reservations = StorageService.getReservations();
        reservations.push(reservation);
        StorageService.saveReservations(reservations);
        
        return { success: true, message: 'Reserva creada', reservation };
    },
    
    update: function(id, data) {
        if (data.date && data.time) {
            if (!isTimeSlotAvailable(data.date, data.time, id)) {
                return { success: false, message: 'Horario no disponible' };
            }
        }
        
        const updated = StorageService.updateReservation(id, data);
        return updated ? 
            { success: true, message: 'Reserva actualizada' } : 
            { success: false, message: 'Error al actualizar' };
    },
    
    changeStatus: function(id, status) {
        return this.update(id, { status });
    },
    
    delete: function(id) {
        StorageService.deleteReservation(id);
        return { success: true, message: 'Reserva eliminada' };
    },
    
    getByDate: function(date) {
        return StorageService.getReservations()
            .filter(r => r.date === date)
            .sort((a, b) => a.time.localeCompare(b.time));
    },
    
    getByClient: function(clientId) {
        return StorageService.getReservations()
            .filter(r => r.clientId === clientId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    
    getStats: function() {
        const r = StorageService.getReservations();
        return {
            total: r.length,
            pending: r.filter(x => x.status === 'pending').length,
            confirmed: r.filter(x => x.status === 'confirmed').length,
            cancelled: r.filter(x => x.status === 'cancelled').length,
            today: r.filter(x => x.date === new Date().toISOString().split('T')[0]).length
        };
    }
};