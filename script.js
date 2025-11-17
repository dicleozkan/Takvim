// Global değişkenler
let currentUser = null;
let currentDate = new Date();
let selectedDate = null;
let selectedEventId = null;
let events = [];

// 2026 Yılı Resmi Tatil Günleri
const holidays2026 = {
    '2026-01-01': 'Yılbaşı',
    '2026-03-19': 'Ramazan Bayramı Arifesi',
    '2026-03-20': 'Ramazan Bayramı 1.gün',
    '2026-03-21': 'Ramazan Bayramı 2.gün',
    '2026-03-22': 'Ramazan Bayramı 3.gün',
    '2026-04-23': 'Ulusal Egemenlik ve Çocuk Bayramı',
    '2026-05-01': 'Emek ve Dayanışma Günü',
    '2026-05-19': 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı',
    '2026-05-26': 'Kurban Bayramı Arifesi',
    '2026-05-27': 'Kurban Bayramı 1.gün',
    '2026-05-28': 'Kurban Bayramı 2.gün',
    '2026-05-29': 'Kurban Bayramı 3.gün',
    '2026-05-30': 'Kurban Bayramı 4.gün',
    '2026-07-15': 'Demokrasi ve Millî Birlik Günü',
    '2026-08-30': 'Zafer Bayramı',
    '2026-10-28': 'Cumhuriyet Bayramı Arifesi',
    '2026-10-29': 'Cumhuriyet Bayramı',
    '2026-12-31': 'Yılbaşı gecesi'
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    loadEvents();
    // Eğer localStorage'da kullanıcı varsa otomatik giriş yap
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        selectUser(savedUser);
    }
    
    // Modal dışına tıklanınca kapat
    const eventModal = document.getElementById('eventModal');
    if (eventModal) {
        eventModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
});

// Kullanıcı seçimi
function selectUser(userName) {
    currentUser = userName;
    localStorage.setItem('currentUser', userName);
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    document.getElementById('currentUserName').textContent = userName;
    renderCalendar();
}

// Çıkış
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
}

// Ay değiştirme
function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

// Takvimi render et
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Ay ve yıl başlığını güncelle
    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    document.getElementById('currentMonthYear').textContent = 
        `${monthNames[month]} ${year}`;
    
    // Ayın ilk günü ve son günü
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // İlk günün haftanın hangi günü olduğunu bul (Pazartesi = 0)
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Takvim grid'ini temizle
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Önceki ayın son günlerini ekle
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(year, month - 1, day);
        grid.appendChild(createDayElement(date, true));
    }
    
    // Bu ayın günlerini ekle
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        grid.appendChild(createDayElement(date, false));
    }
    
    // Sonraki ayın ilk günlerini ekle (42 hücre doldurmak için)
    const totalCells = grid.children.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        grid.appendChild(createDayElement(date, true));
    }
    
    // Ay sonu toplamını hesapla ve göster
    calculateMonthTotal();
}

// Ay sonu toplam ödenen tutarı hesapla
function calculateMonthTotal() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Bu ayın tüm organizasyonlarını filtrele
    const monthEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && 
               eventDate.getMonth() === month &&
               event.paymentDone === true;
    });
    
    // Toplam ödenen tutarı hesapla (deposit değil, totalPrice)
    const totalAmount = monthEvents.reduce((sum, event) => {
        return sum + (parseFloat(event.totalPrice) || 0);
    }, 0);
    
    // Toplamı göster
    document.getElementById('monthTotalAmount').textContent = 
        totalAmount.toFixed(2) + ' ₺';
}

// Rezervasyon tarihi düzenleme modunu aç/kapat
function toggleReservationDateEdit() {
    const editCheckbox = document.getElementById('editReservationDate');
    const dateInput = document.getElementById('reservationDate');
    
    if (editCheckbox.checked) {
        dateInput.removeAttribute('readonly');
        dateInput.classList.remove('readonly-input');
    } else {
        dateInput.setAttribute('readonly', 'readonly');
        dateInput.classList.add('readonly-input');
    }
}

// Gün elementi oluştur
function createDayElement(date, isOtherMonth) {
    const dayDiv = document.createElement('div');
    const dateStr = formatDate(date);
    let dayClass = 'calendar-day';
    
    if (isOtherMonth) {
        dayClass += ' other-month';
    }
    
    // Tatil günü kontrolü
    if (holidays2026[dateStr]) {
        dayClass += ' holiday';
    }
    
    dayDiv.className = dayClass;
    dayDiv.onclick = () => openModal(date);
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    
    // Tatil günü ise tatil etiketi ekle
    if (holidays2026[dateStr]) {
        const holidayLabel = document.createElement('div');
        holidayLabel.className = 'holiday-label';
        holidayLabel.textContent = holidays2026[dateStr];
        dayNumber.appendChild(holidayLabel);
    }
    
    dayDiv.appendChild(dayNumber);
    
    const dayEvents = document.createElement('div');
    dayEvents.className = 'day-events';
    
    // Bu tarihe ait organizasyonları getir
    const dayEventsList = events.filter(e => e.date === dateStr);
    
    dayEventsList.forEach(event => {
        const eventItem = document.createElement('div');
        
        // Organizasyon kategorisine göre class ekle (öncelik kategori)
        let categoryClass = '';
        if (event.category) {
            categoryClass = `category-${event.category}`;
        } else if (event.type) {
            // Geriye dönük uyumluluk için eski sistem
            categoryClass = `type-${event.type}`;
        } else {
            // Geriye dönük uyumluluk için yönetici renkleri
            categoryClass = event.user ? event.user.toLowerCase() : '';
        }
        
        // Ödeme yapıldı durumunu kontrol et
        if (event.paymentDone) {
            categoryClass += ' payment-done';
        }
        
        eventItem.className = `event-item ${categoryClass}`;
        eventItem.onclick = (e) => {
            e.stopPropagation();
            editEvent(event);
        };
        
        const timeSpan = document.createElement('div');
        timeSpan.className = 'event-time';
        
        // Saat bilgisini göster
        if (event.startTime && event.endTime) {
            timeSpan.textContent = `${event.startTime} - ${event.endTime}`;
        } else if (event.time) {
            // Geriye dönük uyumluluk
            timeSpan.textContent = event.time;
        } else if (event.startTime) {
            timeSpan.textContent = event.startTime;
        }
        
        const nameSpan = document.createElement('div');
        nameSpan.className = 'event-name';
        
        // Organizasyon adını göster
        let displayName = '';
        
        // Kategori adını göster
        if (event.category) {
            const categoryNames = {
                'kina': 'Kına',
                'nisan': 'Nişan',
                'dogum-gunu': 'Doğum Günü',
                'babyshower': 'Babyshower',
                'diger': event.otherCategory || 'Diğer'
            };
            displayName = categoryNames[event.category] || event.category;
            
            // Eğer çift isimleri varsa ekle
            if (event.couple) {
                displayName += ` - ${event.couple}`;
            }
        } else if (event.name) {
            // Geriye dönük uyumluluk
            displayName = event.name;
            if (event.type) {
                const typeNames = {
                    'gold': 'Gold Paket',
                    'silver': 'Silver Paket',
                    'standart': 'Standart Paket'
                };
                if (typeNames[event.type]) {
                    displayName = `${typeNames[event.type]} - ${displayName}`;
                }
            }
        }
        
        nameSpan.textContent = displayName || 'Organizasyon';
        
        eventItem.appendChild(timeSpan);
        eventItem.appendChild(nameSpan);
        dayEvents.appendChild(eventItem);
    });
    
    dayDiv.appendChild(dayEvents);
    return dayDiv;
}

// Modal aç
function openModal(date) {
    selectedDate = date;
    selectedEventId = null;
    document.getElementById('modalTitle').textContent = 'REZERVASYON BİLGİLERİ';
    document.getElementById('eventForm').reset();
    document.getElementById('deleteBtn').style.display = 'none';
    document.getElementById('paymentDone').checked = false;
    document.getElementById('remainingPrice').value = '';
    document.getElementById('otherCategoryGroup').style.display = 'none';
    document.getElementById('otherCategory').required = false;
    document.getElementById('editReservationDate').checked = false;
    document.getElementById('photoPermission').value = '';
    
    // Yeni rezervasyon için son güncelleyen bilgisini göster
    document.getElementById('lastUpdateText').textContent = 
        `En son güncelleyen: ${currentUser}`;
    
    // Rezervasyon tarihini bugünün tarihi ile doldur (reset'ten sonra)
    setTimeout(() => {
        const today = new Date();
        document.getElementById('reservationDate').value = formatDate(today);
        toggleReservationDateEdit();
    }, 0);
    
    togglePaymentStatus();
    document.getElementById('eventModal').classList.remove('hidden');
    // Body scroll'u engelle
    document.body.style.overflow = 'hidden';
}

// Organizasyon kategorisi değiştiğinde
function handleEventCategoryChange() {
    const eventCategory = document.getElementById('eventCategory').value;
    const otherCategoryGroup = document.getElementById('otherCategoryGroup');
    const otherCategoryInput = document.getElementById('otherCategory');
    
    if (eventCategory === 'diger') {
        otherCategoryGroup.style.display = 'block';
        otherCategoryInput.required = true;
    } else {
        otherCategoryGroup.style.display = 'none';
        otherCategoryInput.required = false;
        otherCategoryInput.value = '';
    }
}

// Kalan ücreti hesapla
function calculateRemaining() {
    const totalPrice = parseFloat(document.getElementById('totalPrice').value) || 0;
    const deposit = parseFloat(document.getElementById('deposit').value) || 0;
    const remaining = totalPrice - deposit;
    document.getElementById('remainingPrice').value = remaining >= 0 ? remaining.toFixed(2) : '0.00';
}

// Ödeme durumunu değiştir
function togglePaymentStatus() {
    const paymentDone = document.getElementById('paymentDone').checked;
    const modalContent = document.getElementById('eventModal').querySelector('.modal-content');
    const formGroups = document.querySelectorAll('.form-group');
    
    if (paymentDone) {
        modalContent.classList.add('payment-done');
        formGroups.forEach(group => {
            group.classList.add('payment-done');
        });
    } else {
        modalContent.classList.remove('payment-done');
        formGroups.forEach(group => {
            group.classList.remove('payment-done');
        });
    }
}

// Organizasyon düzenle
function editEvent(event) {
    selectedDate = new Date(event.date);
    selectedEventId = event.id;
    document.getElementById('modalTitle').textContent = 'REZERVASYON BİLGİLERİ';
    document.getElementById('reservationDate').value = event.reservationDate || formatDate(new Date());
    document.getElementById('eventCategory').value = event.category || '';
    document.getElementById('eventType').value = event.type || '';
    document.getElementById('startTime').value = event.startTime || '';
    document.getElementById('endTime').value = event.endTime || '';
    document.getElementById('eventCouple').value = event.couple || '';
    document.getElementById('phone1').value = event.phone1 || '';
    document.getElementById('phone2').value = event.phone2 || '';
    document.getElementById('photoPermission').value = event.photoPermission || '';
    document.getElementById('guestCount').value = event.guestCount || '';
    document.getElementById('totalPrice').value = event.totalPrice || '';
    document.getElementById('deposit').value = event.deposit || '';
    document.getElementById('eventNotes').value = event.notes || '';
    document.getElementById('paymentDone').checked = event.paymentDone || false;
    document.getElementById('editReservationDate').checked = false;
    
    // Fotoğraf seçimi checkbox'larını yükle
    document.querySelectorAll('input[name="photoSelection"]').forEach(checkbox => {
        checkbox.checked = event.photoSelection && event.photoSelection.includes(checkbox.value);
    });
    
    // Menü seçimi checkbox'larını yükle
    document.querySelectorAll('input[name="menuSelection"]').forEach(checkbox => {
        checkbox.checked = event.menuSelection && event.menuSelection.includes(checkbox.value);
    });
    
    // Son güncelleme bilgisini göster
    if (event.lastUpdatedBy) {
        document.getElementById('lastUpdateText').textContent = 
            `En son güncelleyen: ${event.lastUpdatedBy}`;
    } else if (event.user) {
        document.getElementById('lastUpdateText').textContent = 
            `En son güncelleyen: ${event.user}`;
    } else {
        document.getElementById('lastUpdateText').textContent = '';
    }
    
    // Kategoriye göre "Diğer" alanını göster/gizle
    handleEventCategoryChange();
    if (event.category === 'diger' && event.otherCategory) {
        document.getElementById('otherCategory').value = event.otherCategory;
    }
    
    toggleReservationDateEdit();
    calculateRemaining();
    togglePaymentStatus();
    
    document.getElementById('deleteBtn').style.display = 'inline-block';
    document.getElementById('eventModal').classList.remove('hidden');
    // Body scroll'u engelle
    document.body.style.overflow = 'hidden';
}

// Modal kapat
function closeModal() {
    document.getElementById('eventModal').classList.add('hidden');
    selectedDate = null;
    selectedEventId = null;
    // Body scroll'u geri aç
    document.body.style.overflow = '';
}

// Organizasyon kaydet
function saveEvent(e) {
    e.preventDefault();
    
    const eventCategory = document.getElementById('eventCategory').value;
    const otherCategory = eventCategory === 'diger' ? document.getElementById('otherCategory').value : '';
    const totalPrice = parseFloat(document.getElementById('totalPrice').value) || 0;
    const deposit = parseFloat(document.getElementById('deposit').value) || 0;
    const remaining = totalPrice - deposit;
    
    // Fotoğraf seçimi checkbox'larını topla
    const photoSelections = [];
    document.querySelectorAll('input[name="photoSelection"]:checked').forEach(checkbox => {
        photoSelections.push(checkbox.value);
    });
    
    // Menü seçimi checkbox'larını topla
    const menuSelections = [];
    document.querySelectorAll('input[name="menuSelection"]:checked').forEach(checkbox => {
        menuSelections.push(checkbox.value);
    });
    
    const eventData = {
        id: selectedEventId || Date.now().toString(),
        date: formatDate(selectedDate),
        reservationDate: document.getElementById('reservationDate').value || formatDate(new Date()),
        category: eventCategory,
        otherCategory: otherCategory,
        type: document.getElementById('eventType').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        couple: document.getElementById('eventCouple').value,
        phone1: document.getElementById('phone1').value,
        phone2: document.getElementById('phone2').value,
        photoPermission: document.getElementById('photoPermission').value,
        guestCount: document.getElementById('guestCount').value,
        photoSelection: photoSelections,
        menuSelection: menuSelections,
        totalPrice: totalPrice,
        deposit: deposit,
        remainingPrice: remaining >= 0 ? remaining : 0,
        notes: document.getElementById('eventNotes').value,
        paymentDone: document.getElementById('paymentDone').checked,
        user: currentUser,
        lastUpdatedBy: currentUser
    };
    
    if (selectedEventId) {
        // Düzenleme - mevcut user bilgisini koru, lastUpdatedBy'ı güncelle
        const index = events.findIndex(e => e.id === selectedEventId);
        if (index !== -1) {
            eventData.user = events[index].user || currentUser; // İlk oluşturanı koru
            events[index] = eventData;
        }
    } else {
        // Yeni ekleme
        events.push(eventData);
    }
    
    saveEvents();
    renderCalendar();
    closeModal();
}

// Organizasyon sil
function deleteEvent() {
    if (selectedEventId && confirm('Bu organizasyonu silmek istediğinize emin misiniz?')) {
        events = events.filter(e => e.id !== selectedEventId);
        saveEvents();
        renderCalendar();
        closeModal();
    }
}

// Tarih formatla (YYYY-MM-DD)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Organizasyonları localStorage'a kaydet
function saveEvents() {
    localStorage.setItem('organizasyonTakvimi', JSON.stringify(events));
}

// Organizasyonları localStorage'dan yükle
function loadEvents() {
    const saved = localStorage.getItem('organizasyonTakvimi');
    if (saved) {
        events = JSON.parse(saved);
    }
}


