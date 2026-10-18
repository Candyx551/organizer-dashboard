document.addEventListener('DOMContentLoaded', () => {

    // --- BROWSER SHORTCUTS ---
    const defaultShortcuts = [
        { name: "TUWEL", url: "https://tuwel.tuwien.ac.at", icon: "fa-solid fa-graduation-cap" },
        { name: "TISS", url: "https://tiss.tuwien.ac.at", icon: "fa-solid fa-building-columns" },
        { name: "Gmail", url: "https://mail.google.com", icon: "fa-solid fa-envelope" },
        { name: "GitHub", url: "https://github.com", icon: "fa-brands fa-github" },
        { name: "ChatGPT", url: "https://chatgpt.com", icon: "fa-solid fa-brain" }
    ];

    let shortcuts = JSON.parse(localStorage.getItem('dashboard_shortcuts')) || defaultShortcuts;
    let deleteMode = false;
    let selectedIndicesToDelete = new Set();

    const shortcutsGrid = document.getElementById('shortcutsGrid');
    const shortcutsWidgetCard = document.getElementById('shortcutsWidgetCard');
    const toggleDeleteModeBtn = document.getElementById('toggleDeleteModeBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const shortcutModal = document.getElementById('shortcutModal');
    const closeModalBtn = document.getElementById('closeModal');
    const shortcutForm = document.getElementById('shortcutForm');

    function renderShortcuts() {
        if (!shortcutsGrid) return;
        shortcutsGrid.innerHTML = '';

        shortcuts.forEach((shortcut, index) => {
            const card = document.createElement('a');
            card.href = deleteMode ? '#' : shortcut.url;
            if (!deleteMode) card.target = '_blank';
            card.className = 'shortcut-card';
            
            // Falls der Shortcut bereits zum Löschen markiert ist (z.B. nach einem Re-Render)
            if (selectedIndicesToDelete.has(index)) {
                card.classList.add('selected-for-deletion');
                card.style.borderColor = '#ef4444';
                card.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                card.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.4)';
            }

            card.innerHTML = `
                <div class="shortcut-content">
                    <i class="${shortcut.icon || 'fa-solid fa-globe'}"></i>
                    <span>${shortcut.name}</span>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (deleteMode) {
                    e.preventDefault();
                    if (selectedIndicesToDelete.has(index)) {
                        // Abwählen: Visuelle Effekte entfernen
                        selectedIndicesToDelete.delete(index);
                        card.classList.remove('selected-for-deletion');
                        card.style.borderColor = '';
                        card.style.backgroundColor = '';
                        card.style.boxShadow = '';
                    } else {
                        // Auswählen: Rot aufleuchten lassen
                        selectedIndicesToDelete.add(index);
                        card.classList.add('selected-for-deletion');
                        card.style.borderColor = '#ef4444';
                        card.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                        card.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.4)';
                        card.style.transition = 'all 0.2s ease-in-out';
                    }
                }
            });

            shortcutsGrid.appendChild(card);
        });

        if (!deleteMode) {
            const addCard = document.createElement('div');
            addCard.className = 'shortcut-card add-shortcut';
            addCard.innerHTML = `
                <div class="shortcut-content">
                    <i class="fa-solid fa-plus"></i>
                    <span>Hinzufügen</span>
                </div>
            `;
            addCard.addEventListener('click', () => {
                if (shortcutModal) shortcutModal.classList.add('active');
            });
            shortcutsGrid.appendChild(addCard);
        }
    }

    if (toggleDeleteModeBtn) {
        toggleDeleteModeBtn.addEventListener('click', () => {
            deleteMode = !deleteMode;
            selectedIndicesToDelete.clear();
            if (deleteMode) {
                shortcutsWidgetCard.classList.add('delete-mode');
                confirmDeleteBtn.classList.remove('hidden');
            } else {
                shortcutsWidgetCard.classList.remove('delete-mode');
                confirmDeleteBtn.classList.add('hidden');
            }
            renderShortcuts();
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (selectedIndicesToDelete.size > 0) {
                shortcuts = shortcuts.filter((_, index) => !selectedIndicesToDelete.has(index));
                localStorage.setItem('dashboard_shortcuts', JSON.stringify(shortcuts));
            }
            deleteMode = false;
            selectedIndicesToDelete.clear();
            shortcutsWidgetCard.classList.remove('delete-mode');
            confirmDeleteBtn.classList.add('hidden');
            renderShortcuts();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (shortcutModal) shortcutModal.classList.remove('active');
            if (shortcutForm) shortcutForm.reset();
        });
    }

    if (shortcutForm) {
        shortcutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('shortcutName').value;
            const url = document.getElementById('shortcutUrl').value;
            shortcuts.push({ name, url, icon: "fa-solid fa-globe" });
            localStorage.setItem('dashboard_shortcuts', JSON.stringify(shortcuts));
            if (shortcutModal) shortcutModal.classList.remove('active');
            shortcutForm.reset();
            renderShortcuts();
        });
    }


    // --- KALENDER LOGIK ---
    const defaultEvents = [
        { id: "1", title: "Mathe 1 Vorlesung", date: "2026-10-14", startHour: "10:00", endHour: "12:00", type: "uni", allDay: false, color: "#06b6d4", repeat: "none", exceptions: [] }
    ];

    let events = JSON.parse(localStorage.getItem('dashboard_events')) || defaultEvents;
    let currentView = 'week';
    let currentWeekDate = new Date();

    const periodDisplay = document.getElementById('periodDisplay');
    const prevPeriodBtn = document.getElementById('prevPeriod');
    const nextPeriodBtn = document.getElementById('nextPeriod');
    const weekHeader = document.getElementById('weekHeader');
    const weekHoursGrid = document.getElementById('weekHoursGrid');
    const monthDaysGrid = document.getElementById('monthDaysGrid');
    const yearMonthsGrid = document.getElementById('yearMonthsGrid');
    const todayEventsList = document.getElementById('todayEventsList');

    const viewButtons = document.querySelectorAll('.view-btn[data-view]');
    const eventModal = document.getElementById('eventModal');
    const openEventModalBtn = document.getElementById('openEventModalBtn');
    const closeEventModalBtn = document.getElementById('closeEventModalBtn');
    const deleteEventBtn = document.getElementById('deleteEventBtn');
    const eventForm = document.getElementById('eventForm');
    const eventTypeTimeMode = document.getElementById('eventTypeTimeMode');
    const timeSlotGroup = document.getElementById('timeSlotGroup');
    const eventRepeat = document.getElementById('eventRepeat');
    const repeatUntilGroup = document.getElementById('repeatUntilGroup');
    const eventModalTitle = document.getElementById('eventModalTitle');
    const eventEditId = document.getElementById('eventEditId');

    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.getAttribute('data-view');
            
            document.querySelectorAll('.cal-view').forEach(v => v.classList.remove('active'));
            const targetView = document.getElementById(currentView + 'View');
            if (targetView) targetView.classList.add('active');
            renderCalendar();
        });
    });

    function renderCalendar() {
        renderTodayEvents();
        if (currentView === 'week') renderWeekView();
        else if (currentView === 'month') renderMonthView();
        else if (currentView === 'year') renderYearView();
    }

    function getExpandedEventsForDate(dateStr) {
        let expanded = [];
        events.forEach((ev, evIndex) => {
            if (ev.exceptions && ev.exceptions.includes(dateStr)) return;

            if (ev.repeat === 'weekly' && ev.repeatUntil) {
                let curr = new Date(ev.date);
                let end = new Date(ev.repeatUntil);

                while (curr <= end) {
                    let currStr = curr.toISOString().split('T')[0];
                    if (currStr === dateStr) {
                        expanded.push({ ...ev, instanceDate: dateStr, originalIndex: evIndex });
                        break;
                    }
                    curr.setDate(curr.getDate() + 7);
                }
            } else {
                if (ev.date === dateStr) {
                    expanded.push({ ...ev, instanceDate: dateStr, originalIndex: evIndex });
                }
            }
        });
        return expanded;
    }

    function renderWeekView() {
        if (!weekHeader || !weekHoursGrid) return;
        weekHeader.innerHTML = `<span>Zeit</span>`;
        weekHoursGrid.innerHTML = '';

        let startOfWeek = new Date(currentWeekDate);
        let day = startOfWeek.getDay();
        let diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        let weekDates = [];
        for (let i = 0; i < 7; i++) {
            let d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            weekDates.push(d);

            const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
            const headerSpan = document.createElement('span');
            headerSpan.innerHTML = `${dayNames[i]}<br>${d.getDate()}.${d.getMonth() + 1}.`;
            weekHeader.appendChild(headerSpan);
        }

        if (periodDisplay) {
            periodDisplay.textContent = `Woche: ${weekDates[0].getDate()}.${weekDates[0].getMonth()+1}. - ${weekDates[6].getDate()}.${weekDates[6].getMonth()+1}.${weekDates[6].getFullYear()}`;
        }

        const hours = [
            "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
            "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", 
            "22:00", "23:00"
        ];

        hours.forEach(hour => {
            const row = document.createElement('div');
            row.className = 'hour-row';

            const label = document.createElement('span');
            label.className = 'hour-label';
            label.textContent = hour;
            row.appendChild(label);

            weekDates.forEach(dateObj => {
                const cell = document.createElement('div');
                cell.className = 'hour-cell';
                const formattedMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
                const formattedDay = String(dateObj.getDate()).padStart(2, '0');
                const dateStr = `${dateObj.getFullYear()}-${formattedMonth}-${formattedDay}`;

                const dayEvents = getExpandedEventsForDate(dateStr);
                const matchingEvent = dayEvents.find(ev => {
                    if (ev.allDay) return hour === "08:00";
                    return ev.startHour <= hour && hour < ev.endHour;
                });

                if (matchingEvent) {
                    cell.classList.add('has-event');
                    cell.textContent = matchingEvent.title;
                    if (matchingEvent.color) {
                        cell.style.backgroundColor = matchingEvent.color + '40';
                        cell.style.borderColor = matchingEvent.color;
                    }

                    cell.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openEditModal(matchingEvent.originalIndex, dateStr);
                    });
                } else {
                    cell.addEventListener('click', () => {
                        openCreateModal(dateStr, hour);
                    });
                }

                row.appendChild(cell);
            });

            weekHoursGrid.appendChild(row);
        });
    }

    function renderMonthView() {
        if (!monthDaysGrid) return;
        monthDaysGrid.innerHTML = '';
        const year = currentWeekDate.getFullYear();
        const month = currentWeekDate.getMonth();
        const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
        if (periodDisplay) periodDisplay.textContent = `${monthNames[month]} ${year}`;

        const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
        const totalDays = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            monthDaysGrid.appendChild(emptyDiv);
        }

        for (let day = 1; day <= totalDays; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            const formattedMonth = String(month + 1).padStart(2, '0');
            const formattedDay = String(day).padStart(2, '0');
            const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

            dayDiv.innerHTML = `<span>${day}</span>`;
            dayDiv.addEventListener('click', () => {
                openCreateModal(dateStr, "08:00");
            });

            monthDaysGrid.appendChild(dayDiv);
        }
    }

    function renderYearView() {
        if (!yearMonthsGrid) return;
        yearMonthsGrid.innerHTML = '';
        const year = currentWeekDate.getFullYear();
        const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
        if (periodDisplay) periodDisplay.textContent = `Jahr ${year}`;

        monthNames.forEach((mName, index) => {
            const mCard = document.createElement('div');
            mCard.className = 'year-month-card';
            mCard.textContent = mName;
            mCard.addEventListener('click', () => {
                currentWeekDate.setMonth(index);
                currentView = 'month';
                
                document.querySelectorAll('.view-btn[data-view]').forEach(b => b.classList.remove('active'));
                const monthBtn = document.querySelector('[data-view="month"]');
                if (monthBtn) monthBtn.classList.add('active');
                
                document.querySelectorAll('.cal-view').forEach(v => v.classList.remove('active'));
                const monthView = document.getElementById('monthView');
                if (monthView) monthView.classList.add('active');
                renderCalendar();
            });
            yearMonthsGrid.appendChild(mCard);
        });
    }

    function renderTodayEvents() {
        if (!todayEventsList) return;
        todayEventsList.innerHTML = '';

        const todayStr = new Date().toISOString().split('T')[0];
        let todayEvents = getExpandedEventsForDate(todayStr);

        if (todayEvents.length === 0) {
            todayEventsList.innerHTML = `<p class="placeholder-text" style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">Keine Termine für heute.</p>`;
            return;
        }

        todayEvents.forEach(ev => {
            const item = document.createElement('div');
            item.className = 'event-item';
            item.style.cursor = 'pointer';
            let typeLabel = ev.type === 'exam' ? 'Prüfung' : (ev.type === 'private' ? 'Privat' : 'Uni');
            let timeStr = ev.allDay ? '(Ganztägig)' : `${ev.startHour} - ${ev.endHour}`;
            
            item.innerHTML = `
                <div class="event-info">
                    <span class="event-title" style="color: ${ev.color || 'var(--text-primary)'}">${ev.title}</span>
                    <span class="event-date">${timeStr}</span>
                </div>
                <span class="event-tag ${ev.type}">${typeLabel}</span>
            `;

            item.addEventListener('click', () => {
                openEditModal(ev.originalIndex, todayStr);
            });

            todayEventsList.appendChild(item);
        });
    }

    function openCreateModal(dateStr, hour) {
        if (eventModalTitle) eventModalTitle.textContent = "Termin / Vorlesung hinzufügen";
        if (eventEditId) eventEditId.value = "";
        if (deleteEventBtn) deleteEventBtn.classList.add('hidden');
        document.getElementById('eventTitle').value = "";
        document.getElementById('eventDate').value = dateStr;
        document.getElementById('eventRepeat').value = "none";
        if (repeatUntilGroup) repeatUntilGroup.style.display = 'none';
        document.getElementById('eventStartHour').value = hour;
        if (eventModal) eventModal.classList.add('active');
    }

    function openEditModal(index, instanceDate = null) {
        const ev = events[index];
        if (!ev) return;
        if (eventModalTitle) eventModalTitle.textContent = "Termin bearbeiten / löschen";
        if (eventEditId) eventEditId.value = `${index}:${instanceDate || ev.date}`;
        if (deleteEventBtn) deleteEventBtn.classList.remove('hidden');

        document.getElementById('eventTitle').value = ev.title;
        document.getElementById('eventDate').value = ev.date;
        document.getElementById('eventRepeat').value = ev.repeat || 'none';
        if (ev.repeat === 'weekly') {
            if (repeatUntilGroup) repeatUntilGroup.style.display = 'block';
            document.getElementById('eventRepeatUntil').value = ev.repeatUntil || '';
        } else {
            if (repeatUntilGroup) repeatUntilGroup.style.display = 'none';
        }

        document.getElementById('eventTypeTimeMode').value = ev.allDay ? 'allDay' : 'slot';
        if (ev.allDay) {
            if (timeSlotGroup) timeSlotGroup.style.display = 'none';
        } else {
            if (timeSlotGroup) timeSlotGroup.style.display = 'block';
            document.getElementById('eventStartHour').value = ev.startHour || '08:00';
            document.getElementById('eventEndHour').value = ev.endHour || '10:00';
        }
        document.getElementById('eventColor').value = ev.color || '#06b6d4';
        document.getElementById('eventType').value = ev.type || 'uni';

        if (eventModal) eventModal.classList.add('active');
    }

    if (prevPeriodBtn) {
        prevPeriodBtn.addEventListener('click', () => {
            if (currentView === 'week') currentWeekDate.setDate(currentWeekDate.getDate() - 7);
            else if (currentView === 'month') currentWeekDate.setMonth(currentWeekDate.getMonth() - 1);
            else if (currentView === 'year') currentWeekDate.setFullYear(currentWeekDate.getFullYear() - 1);
            renderCalendar();
        });
    }

    if (nextPeriodBtn) {
        nextPeriodBtn.addEventListener('click', () => {
            if (currentView === 'week') currentWeekDate.setDate(currentWeekDate.getDate() + 7);
            else if (currentView === 'month') currentWeekDate.setMonth(currentWeekDate.getMonth() + 1);
            else if (currentView === 'year') currentWeekDate.setFullYear(currentWeekDate.getFullYear() + 1);
            renderCalendar();
        });
    }

    if (openEventModalBtn) {
        openEventModalBtn.addEventListener('click', () => {
            const todayStr = new Date().toISOString().split('T')[0];
            openCreateModal(todayStr, "08:00");
        });
    }

    if (closeEventModalBtn) {
        closeEventModalBtn.addEventListener('click', () => {
            if (eventModal) eventModal.classList.remove('active');
            if (eventForm) eventForm.reset();
        });
    }

    if (eventModal) {
        eventModal.addEventListener('click', (e) => {
            if (e.target === eventModal) {
                eventModal.classList.remove('active');
                if (eventForm) eventForm.reset();
            }
        });
    }

    if (deleteEventBtn) {
        deleteEventBtn.addEventListener('click', () => {
            const [indexStr, instanceDate] = eventEditId.value.split(':');
            const index = parseInt(indexStr);

            if (!isNaN(index) && index >= 0) {
                const ev = events[index];
                if (ev.repeat === 'weekly' && instanceDate && instanceDate !== ev.date) {
                    if (!ev.exceptions) ev.exceptions = [];
                    ev.exceptions.push(instanceDate);
                } else {
                    events.splice(index, 1);
                }
                localStorage.setItem('dashboard_events', JSON.stringify(events));
            }
            if (eventModal) eventModal.classList.remove('active');
            eventForm.reset();
            renderCalendar();
        });
    }

    if (eventRepeat) {
        eventRepeat.addEventListener('change', (e) => {
            if (e.target.value === 'weekly') {
                if (repeatUntilGroup) repeatUntilGroup.style.display = 'block';
            } else {
                if (repeatUntilGroup) repeatUntilGroup.style.display = 'none';
            }
        });
    }

    if (eventTypeTimeMode) {
        eventTypeTimeMode.addEventListener('change', (e) => {
            if (e.target.value === 'allDay') {
                if (timeSlotGroup) timeSlotGroup.style.display = 'none';
            } else {
                if (timeSlotGroup) timeSlotGroup.style.display = 'block';
            }
        });
    }

    if (eventForm) {
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('eventTitle').value;
            const date = document.getElementById('eventDate').value;
            const repeat = document.getElementById('eventRepeat').value;
            const repeatUntil = repeat === 'weekly' ? document.getElementById('eventRepeatUntil').value : null;
            const timeMode = document.getElementById('eventTypeTimeMode').value;
            const startHour = timeMode === 'slot' ? document.getElementById('eventStartHour').value : null;
            const endHour = timeMode === 'slot' ? document.getElementById('eventEndHour').value : null;
            const allDay = timeMode === 'allDay';
            const color = document.getElementById('eventColor').value;
            const type = document.getElementById('eventType').value;

            const editVal = eventEditId.value;
            const eventData = { title, date, repeat, repeatUntil, startHour, endHour, allDay, color, type, exceptions: [] };

            if (editVal !== "") {
                const [indexStr] = editVal.split(':');
                const index = parseInt(indexStr);
                eventData.exceptions = events[index].exceptions || [];
                events[index] = eventData;
            } else {
                events.push(eventData);
            }

            localStorage.setItem('dashboard_events', JSON.stringify(events));

            if (eventModal) eventModal.classList.remove('active');
            eventForm.reset();
            renderCalendar();
        });
    }

    renderShortcuts();
    renderCalendar();

    // --- SPOTIFY LIVE API ÜBER PYTHON BRIDGE ---
    const spotifyLoginBtn = document.getElementById('spotifyLoginBtn');
    const spotifyPlayerContainer = document.getElementById('spotifyPlayerContainer');
    const spotifyLoggedOutMsg = document.getElementById('spotifyLoggedOutMsg');
    
    const spotifyTitle = document.getElementById('spotifyTitle');
    const spotifyArtist = document.getElementById('spotifyArtist');
    const spotifyCoverImg = document.getElementById('spotifyCoverImg');
    const spotifyCoverIcon = document.getElementById('spotifyCoverIcon');
    const spotifyPlayPauseIcon = document.getElementById('spotifyPlayPauseIcon');
    const spotifyPlayPause = document.getElementById('spotifyPlayPause');
    const spotifyPrev = document.getElementById('spotifyPrev');
    const spotifyNext = document.getElementById('spotifyNext');

    let isPlaying = false;

    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');

    if (authCode) {
        fetch(`http://127.0.0.1:5000/exchange-code?code=${authCode}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                    location.reload();
                }
            })
            .catch(err => console.error("Code-Austausch fehlgeschlagen:", err));
    }

    if (spotifyLoginBtn) {
        spotifyLoginBtn.addEventListener('click', async () => {
            try {
                const res = await fetch('http://127.0.0.1:5000/login');
                const data = await res.json();
                if (data.auth_url) {
                    window.location.href = data.auth_url;
                }
            } catch (err) {
                console.error("Python Bridge nicht erreichbar:", err);
                alert("Bitte starte zuerst das Python-Skript (spotify_bridge.py)!");
            }
        });
    }

    setInterval(async () => {
        try {
            const res = await fetch('http://127.0.0.1:5000/currently-playing');
            if (res.status === 401) {
                if (spotifyLoginBtn) spotifyLoginBtn.style.display = 'block';
                if (spotifyPlayerContainer) spotifyPlayerContainer.style.display = 'none';
                return;
            }

            const data = await res.json();
            if (data && data.name) {
                if (spotifyLoginBtn) spotifyLoginBtn.style.display = 'none';
                if (spotifyLoggedOutMsg) spotifyLoggedOutMsg.style.display = 'none';
                if (spotifyPlayerContainer) spotifyPlayerContainer.style.display = 'flex';

                spotifyTitle.textContent = data.name;
                spotifyArtist.textContent = data.artists.join(', ');
                isPlaying = data.is_playing;

                spotifyPlayPauseIcon.className = isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";

                if (data.album_image) {
                    spotifyCoverImg.src = data.album_image;
                    spotifyCoverImg.style.display = 'block';
                    spotifyCoverIcon.style.display = 'none';
                }
            }
        } catch (err) {
            // Python Server läuft eventuell noch nicht
        }
    }, 3000);

    async function sendPythonCommand(action) {
        try {
            await fetch(`http://127.0.0.1:5000/control/${action}`, { method: 'POST' });
        } catch (err) {
            console.error("Control Error:", err);
        }
    }

    if (spotifyPlayPause) {
        spotifyPlayPause.addEventListener('click', () => {
            if (isPlaying) {
                sendPythonCommand('pause');
                isPlaying = false;
                spotifyPlayPauseIcon.className = "fa-solid fa-play";
            } else {
                sendPythonCommand('play');
                isPlaying = true;
                spotifyPlayPauseIcon.className = "fa-solid fa-pause";
            }
        });
    }

    if (spotifyNext) {
        spotifyNext.addEventListener('click', () => sendPythonCommand('next'));
    }

    if (spotifyPrev) {
        spotifyPrev.addEventListener('click', () => sendPythonCommand('previous'));
    }

    // --- AKTIEN & MÄRKTE MIT FAVORITEN & EURO-UMSTELLUNG ---
    let stockFavorites = JSON.parse(localStorage.getItem('stock_favorites')) || [
        { symbol: "INDEX:DEU40", name: "DAX" },
        { symbol: "NASDAQ:AAPL", name: "Apple" },
        { symbol: "BITSTAMP:BTCEUR", name: "Bitcoin (EUR)" }
    ];

    function loadTradingViewWidget(symbol = "INDEX:DEU40") {
        const container = document.getElementById('tradingview_widget_wrapper');
        if (!container) return;
        
        container.innerHTML = '';

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": symbol,
            "interval": "D",
            "timezone": "Europe/Vienna",
            "theme": "dark",
            "style": "1",
            "locale": "de",
            "currency": "EUR",
            "allow_symbol_change": true,
            "calendar": false,
            "support_host": "https://www.tradingview.com"
        });
        
        container.appendChild(script);
        updateFavoritesUI();
    }

    function updateFavoritesUI() {
        const favBar = document.getElementById('stockFavoritesBar');
        if (!favBar) return;

        favBar.innerHTML = '';
        if (stockFavorites.length === 0) {
            favBar.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted); padding: 4px;">Keine Favoriten gespeichert. Suche ein Symbol und klicke auf den Stern!</span>`;
            return;
        }

        stockFavorites.forEach(fav => {
            const tag = document.createElement('div');
            tag.style.cssText = "display: flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s;";
            
            tag.innerHTML = `<span style="color: #fff; font-weight: 500;">${fav.name}</span> <i class="fa-solid fa-xmark remove-fav" data-symbol="${fav.symbol}" style="color: var(--text-muted); padding: 2px;" title="Favorit löschen"></i>`;
            
            tag.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-fav')) {
                    e.stopPropagation();
                    removeFavorite(fav.symbol);
                } else {
                    loadTradingViewWidget(fav.symbol);
                }
            });

            favBar.appendChild(tag);
        });
    }

    function addFavorite(symbol, name) {
        if (!stockFavorites.some(fav => fav.symbol === symbol)) {
            stockFavorites.push({ symbol, name });
            localStorage.setItem('stock_favorites', JSON.stringify(stockFavorites));
            updateFavoritesUI();
        }
    }

    function removeFavorite(symbol) {
        stockFavorites = stockFavorites.filter(fav => fav.symbol !== symbol);
        localStorage.setItem('stock_favorites', JSON.stringify(stockFavorites));
        updateFavoritesUI();
    }

    const initialSymbol = stockFavorites.length > 0 ? stockFavorites[0].symbol : "INDEX:DEU40";
    loadTradingViewWidget(initialSymbol);

    const stockSearchBtn = document.getElementById('stockSearchBtn');
    const stockSearchInput = document.getElementById('stockSearchInput');
    const stockAddFavBtn = document.getElementById('stockAddFavBtn');

    if (stockSearchBtn && stockSearchInput) {
        stockSearchBtn.addEventListener('click', () => {
            let query = stockSearchInput.value.trim().toUpperCase();
            if (query) {
                let symbolToLoad = query.includes(":") ? query : `NASDAQ:${query}`;
                loadTradingViewWidget(symbolToLoad);
            }
        });

        stockSearchInput.value = "";

        stockSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                stockSearchBtn.click();
            }
        });
    }

    if (stockAddFavBtn && stockSearchInput) {
        stockAddFavBtn.addEventListener('click', () => {
            let query = stockSearchInput.value.trim().toUpperCase();
            if (query) {
                let symbolToLoad = query.includes(":") ? query : `NASDAQ:${query}`;
                addFavorite(symbolToLoad, query);
                loadTradingViewWidget(symbolToLoad);
            } else {
                alert("Bitte gib oben ein Symbol ein (z.B. AAPL), das du als Favorit speichern möchtest.");
            }
        });
    }

    // --- WETTER FUNKTION ---
    const weatherTemp = document.getElementById('weatherTemp');
    const weatherCondition = document.getElementById('weatherCondition');
    const weatherCity = document.getElementById('weatherCity');
    const weatherDetails = document.getElementById('weatherDetails');
    const weatherIcon = document.getElementById('weatherIcon');
    const weatherSearchInput = document.getElementById('weatherSearchInput');
    const weatherSearchBtn = document.getElementById('weatherSearchBtn');
    const weatherLocateBtn = document.getElementById('weatherLocateBtn');

    function getWeatherDescription(code) {
        const weatherMap = {
            0: { text: "Klarer Himmel", icon: "fa-sun" },
            1: { text: "Überwiegend klar", icon: "fa-cloud-sun" },
            2: { text: "Teilweise bewölkt", icon: "fa-cloud-sun" },
            3: { text: "Bewölkt", icon: "fa-cloud" },
            45: { text: "Nebelig", icon: "fa-smog" },
            48: { text: "Reifnebel", icon: "fa-smog" },
            51: { text: "Leichter Nieselregen", icon: "fa-cloud-rain" },
            61: { text: "Leichter Regen", icon: "fa-cloud-rain" },
            63: { text: "Mäßiger Regen", icon: "fa-cloud-showers-heavy" },
            71: { text: "Leichter Schnee", icon: "fa-snowflake" },
            95: { text: "Gewitter", icon: "fa-bolt" }
        };
        return weatherMap[code] || { text: "Wechselhaft", icon: "fa-cloud-sun" };
    }

    async function fetchWeather(lat, lon, cityName) {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`);
            const data = await res.json();
            
            if (data && data.current) {
                const temp = Math.round(data.current.temperature_2m);
                const wind = data.current.wind_speed_10m;
                const weatherInfo = getWeatherDescription(data.current.weather_code);

                weatherTemp.textContent = `${temp}°C`;
                weatherCondition.textContent = weatherInfo.text;
                weatherCity.textContent = cityName;
                weatherDetails.textContent = `Wind: ${wind} km/h`;
                weatherIcon.className = `fa-solid ${weatherInfo.icon}`;
            }
        } catch (err) {
            console.error("Fehler beim Abrufen der Wetterdaten:", err);
            weatherCondition.textContent = "Fehler beim Laden";
        }
    }

    async function searchCity(cityName) {
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=de&format=json`);
            const data = await res.json();
            
            if (data && data.results && data.results.length > 0) {
                const location = data.results[0];
                fetchWeather(location.latitude, location.longitude, location.name);
            } else {
                alert("Stadt nicht gefunden!");
            }
        } catch (err) {
            console.error("Geocoding Fehler:", err);
        }
    }

    function initWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude, "Dein Standort");
                },
                () => {
                    fetchWeather(48.2082, 16.3738, "Wien");
                }
            );
        } else {
            fetchWeather(48.2082, 16.3738, "Wien");
        }
    }

    if (weatherSearchBtn && weatherSearchInput) {
        weatherSearchBtn.addEventListener('click', () => {
            const city = weatherSearchInput.value.trim();
            if (city) searchCity(city);
        });
        weatherSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') weatherSearchBtn.click();
        });
    }

    if (weatherLocateBtn) {
        weatherLocateBtn.addEventListener('click', initWeather);
    }

    initWeather();

    // --- FINANZEN MANAGER LOGIK ---
    let financeData = JSON.parse(localStorage.getItem('dashboard_finances')) || {
        monthlyGoal: 800,
        transactions: []
    };

    let financePrivacyHidden = true;
    let financeCurrentView = 'month';

    const finIncomeVal = document.getElementById('finIncomeVal');
    const finExpenseVal = document.getElementById('finExpenseVal');
    const finGoalVal = document.getElementById('finGoalVal');
    const finBalanceVal = document.getElementById('finBalanceVal');
    const finRatioPercent = document.getElementById('finRatioPercent');
    const finRingProgress = document.getElementById('finRingProgress');
    const finPeriodLabel = document.getElementById('finPeriodLabel');
    const finPeriodLabel2 = document.getElementById('finPeriodLabel2');
    const toggleFinancePrivacyBtn = document.getElementById('toggleFinancePrivacyBtn');
    const financeModal = document.getElementById('financeModal');
    const openFinanceModalBtn = document.getElementById('openFinanceModalBtn');
    const closeFinanceModalBtn = document.getElementById('closeFinanceModalBtn');
    const financeForm = document.getElementById('financeForm');

    const transactionListModal = document.getElementById('transactionListModal');
    const closeTxListModalBtn = document.getElementById('closeTxListModalBtn');
    const txModalTitle = document.getElementById('txModalTitle');
    const txListContainer = document.getElementById('txListContainer');
    const openIncomeList = document.getElementById('openIncomeList');
    const openExpenseList = document.getElementById('openExpenseList');

    function showTransactionList(type) {
        if (!txListContainer || !transactionListModal) return;
        txListContainer.innerHTML = '';

        const isIncome = type === 'income';
        txModalTitle.textContent = isIncome ? "Alle Einnahmen" : "Alle Ausgaben";

        const filtered = financeData.transactions.filter(tx => tx.type === type);

        if (filtered.length === 0) {
            txListContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 20px;">Keine Einträge vorhanden.</p>`;
        } else {
            filtered.forEach(tx => {
                const item = document.createElement('div');
                item.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.04); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); font-size: 0.85rem;";
                
                item.innerHTML = `
                    <div>
                        <strong style="color: var(--text-primary); display: block;">${tx.title}</strong>
                        <span style="font-size: 0.7rem; color: var(--text-muted);">${tx.date}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-weight: 600; color: ${isIncome ? '#22c55e' : '#ef4444'};">${tx.amount.toFixed(2)} €</span>
                        <i class="fa-solid fa-trash delete-tx" data-id="${tx.id}" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Löschen"></i>
                    </div>
                `;

                item.querySelector('.delete-tx').addEventListener('click', () => {
                    financeData.transactions = financeData.transactions.filter(t => t.id !== tx.id);
                    localStorage.setItem('dashboard_finances', JSON.stringify(financeData));
                    updateFinanceUI();
                    showTransactionList(type);
                });

                txListContainer.appendChild(item);
            });
        }

        transactionListModal.classList.add('active');
    }

    if (openIncomeList) {
        openIncomeList.addEventListener('click', () => showTransactionList('income'));
    }

    if (openExpenseList) {
        openExpenseList.addEventListener('click', () => showTransactionList('expense'));
    }

    if (closeTxListModalBtn) {
        closeTxListModalBtn.addEventListener('click', () => {
            if (transactionListModal) transactionListModal.classList.remove('active');
        });
    }

    function formatMoney(amount) {
        return `${amount.toFixed(2)} €`;
    }

    function updateFinanceUI() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let filteredTransactions = financeData.transactions.filter(tx => {
            const txDate = new Date(tx.date);
            if (financeCurrentView === 'month') {
                return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
            } else if (financeCurrentView === 'week') {
                const diffTime = Math.abs(now - txDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            } else if (financeCurrentView === 'year') {
                return txDate.getFullYear() === currentYear;
            }
            return true;
        });

        let totalIncome = 0;
        let totalExpense = 0;

        filteredTransactions.forEach(tx => {
            if (tx.type === 'income') totalIncome += tx.amount;
            else if (tx.type === 'expense') totalExpense += tx.amount;
        });

        const balance = totalIncome - totalExpense;

        finIncomeVal.setAttribute('data-raw', formatMoney(totalIncome));
        finExpenseVal.setAttribute('data-raw', formatMoney(totalExpense));
        finGoalVal.setAttribute('data-raw', formatMoney(financeData.monthlyGoal));
        finBalanceVal.setAttribute('data-raw', formatMoney(balance));

        applyPrivacyMode();

        let percent = financeData.monthlyGoal > 0 ? Math.min(Math.round((totalExpense / financeData.monthlyGoal) * 100), 100) : 0;
        finRatioPercent.textContent = financePrivacyHidden ? '••••%' : `${percent}%`;
        if (finRingProgress) {
            finRingProgress.style.strokeDasharray = `${percent}, 100`;
        }

        let labelText = 'Monat';
        if (financeCurrentView === 'week') labelText = 'Woche';
        if (financeCurrentView === 'year') labelText = 'Jahr';

        if (finPeriodLabel) finPeriodLabel.textContent = labelText;
        if (finPeriodLabel2) finPeriodLabel2.textContent = labelText;
    }

    function applyPrivacyMode() {
        const elements = document.querySelectorAll('.fin-amount');
        elements.forEach(el => {
            const rawVal = el.getAttribute('data-raw') || "0.00 €";
            if (financePrivacyHidden) {
                el.textContent = "•••• €";
            } else {
                el.textContent = rawVal;
            }
        });
        if (toggleFinancePrivacyBtn) {
            toggleFinancePrivacyBtn.innerHTML = financePrivacyHidden ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
        }
    }

    if (toggleFinancePrivacyBtn) {
        toggleFinancePrivacyBtn.addEventListener('click', () => {
            financePrivacyHidden = !financePrivacyHidden;
            applyPrivacyMode();
            updateFinanceUI();
        });
    }

    const financeViewSwitcher = document.getElementById('financeViewSwitcher');
    if (financeViewSwitcher) {
        financeViewSwitcher.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                financeViewSwitcher.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                financeCurrentView = btn.getAttribute('data-fview');
                updateFinanceUI();
            });
        });
    }

    if (openFinanceModalBtn) {
        openFinanceModalBtn.addEventListener('click', () => {
            document.getElementById('finMonthlyGoalInput').value = financeData.monthlyGoal;
            if (financeModal) financeModal.classList.add('active');
        });
    }

    if (closeFinanceModalBtn) {
        closeFinanceModalBtn.addEventListener('click', () => {
            if (financeModal) financeModal.classList.remove('active');
        });
    }

    if (financeForm) {
        financeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('finTitle').value;
            const amount = parseFloat(document.getElementById('finAmount').value);
            const type = document.getElementById('finType').value;
            const goalInput = parseFloat(document.getElementById('finMonthlyGoalInput').value);

            if (!isNaN(goalInput)) {
                financeData.monthlyGoal = goalInput;
            }

            if (title && !isNaN(amount)) {
                financeData.transactions.push({
                    id: Date.now(),
                    title,
                    amount,
                    type,
                    date: new Date().toISOString().split('T')[0]
                });
            }

            localStorage.setItem('dashboard_finances', JSON.stringify(financeData));
            if (financeModal) financeModal.classList.remove('active');
            financeForm.reset();
            updateFinanceUI();
        });
    }

    updateFinanceUI();

    // --- NOTIZBLOCK LOGIK ---
    const dashboardNotes = document.getElementById('dashboardNotes');
    const notesSaveStatus = document.getElementById('notesSaveStatus');

    if (dashboardNotes) {
        const savedNotes = localStorage.getItem('dashboard_notes');
        if (savedNotes !== null) {
            dashboardNotes.value = savedNotes;
        }

        let saveTimeout;
        dashboardNotes.addEventListener('input', () => {
            if (notesSaveStatus) notesSaveStatus.textContent = "Speichere...";
            
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                localStorage.setItem('dashboard_notes', dashboardNotes.value);
                if (notesSaveStatus) notesSaveStatus.textContent = "Gespeichert";
            }, 500);
        });
    }

    // --- SIDEBAR EIN- UND AUSKLAPPEN ---
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebarToggleIcon = document.getElementById('sidebarToggleIcon');

    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            
            if (sidebar.classList.contains('collapsed')) {
                sidebarToggleIcon.className = "fa-solid fa-chevron-right";
            } else {
                sidebarToggleIcon.className = "fa-solid fa-chevron-left";
            }
        });
    }

    // --- HALBSTÜNDIGE UHRZEITEN FÜR KALENDER GENERIEREN ---
    function populateTimeDropdowns() {
        const startSelect = document.getElementById('eventStartHour');
        const endSelect = document.getElementById('eventEndHour');
        if (!startSelect || !endSelect) return;

        startSelect.innerHTML = '';
        endSelect.innerHTML = '';

        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                const hourStr = String(h).padStart(2, '0');
                const minStr = String(m).padStart(2, '0');
                const timeValue = `${hourStr}:${minStr}`;

                startSelect.add(new Option(timeValue, timeValue));
                endSelect.add(new Option(timeValue, timeValue));
            }
        }
        startSelect.value = "08:00";
        endSelect.value = "09:30";
    }
    populateTimeDropdowns();

    // --- MODERNE FARB-PALETTE AUSWAHL LOGIK ---
    const colorDots = document.querySelectorAll('.color-dot');
    const eventColorInput = document.getElementById('eventColor');

    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            if (eventColorInput) {
                eventColorInput.value = dot.getAttribute('data-color');
            }
        });
    });

    // --- GLOBALE MODAL-STEUERUNG (ESC-TASTE) ---
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Einstellungs-Modal schließen
            if (settingsModal && settingsModal.classList.contains('active')) {
                settingsModal.classList.remove('active');
            }
            // Termin-Modal
            if (eventModal && eventModal.classList.contains('active')) {
                eventModal.classList.remove('active');
                if (eventForm) eventForm.reset();
            }
            // Shortcut-Modal
            if (shortcutModal && shortcutModal.classList.contains('active')) {
                shortcutModal.classList.remove('active');
                if (shortcutForm) shortcutForm.reset();
            }
            // Finanz-Modal
            if (financeModal && financeModal.classList.contains('active')) {
                financeModal.classList.remove('active');
                if (financeForm) financeForm.reset();
            }
            // Transaktions-Liste
            if (transactionListModal && transactionListModal.classList.contains('active')) {
                transactionListModal.classList.remove('active');
            }
        }
    });

    // --- SIDEBAR NAVIGATION & WIDGET FOKUS ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    // Optional: Gib allen Haupt-Containern deiner Widgets die Klasse "widget-container", 
    // damit wir den Effekt global steuern können.
    const allWidgetContainers = document.querySelectorAll('.widget-container');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 1. Sidebar-UI aktualisieren (aktiven Button markieren)
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // 2. Ziel-Widget finden
            const targetId = link.getAttribute('data-target');
            
            if (targetId === 'dashboard-top') {
                // Zurück nach ganz oben scrollen
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Alle Fokus-Effekte entfernen
                allWidgetContainers.forEach(w => w.classList.remove('widget-focus'));
            } else {
                const targetWidget = document.getElementById(targetId);
                
                if (targetWidget) {
                    // 3. Weich zum Widget scrollen (mittig im Bildschirm platzieren)
                    targetWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // 4. Fokus-Effekt anwenden (Vordergrund)
                    allWidgetContainers.forEach(w => w.classList.remove('widget-focus'));
                    targetWidget.classList.add('widget-focus');
                    
                    // 5. Fokus-Effekt nach 2 Sekunden langsam wieder ausblenden
                    setTimeout(() => {
                        targetWidget.classList.remove('widget-focus');
                    }, 2000);
                }
            }
        });
    });

    // --- EINSTELLUNGEN, NAME & HINTERGRÜNDE ---
    const savedAccent = localStorage.getItem('dashboard_accent') || '#06b6d4';
    const savedBgStyle = localStorage.getItem('dashboard_bg') || 'dark';
    const savedName = localStorage.getItem('dashboard_username') || 'Tobias';

    // Name im Header initialisieren
    const welcomeTitle = document.getElementById('welcomeTitle');
    if (welcomeTitle) welcomeTitle.textContent = `Hallo, ${savedName}!`;

    const userNameInput = document.getElementById('userNameInput');
    if (userNameInput) {
        userNameInput.value = savedName;
        userNameInput.addEventListener('input', (e) => {
            const name = e.target.value.trim() || 'Tobias';
            localStorage.setItem('dashboard_username', name);
            if (welcomeTitle) welcomeTitle.textContent = `Hallo, ${name}!`;
        });
    }

    function applyAccentColor(color) {
        document.documentElement.style.setProperty('--accent-color', color);
    }
    applyAccentColor(savedAccent);

    // Hintergrund anwenden (integriert Presets und eigene URLs)
    function applyBgStyle(styleOrUrl) {
        const body = document.body;
        body.style.backgroundImage = 'none';
        
        if (styleOrUrl === 'midnight') {
            body.style.backgroundColor = '#0f172a';
        } else if (styleOrUrl === 'space') {
            body.style.backgroundImage = 'linear-gradient(rgba(5, 11, 20, 0.85), rgba(5, 11, 20, 0.85)), url("https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1920&auto=format&fit=crop")';
            body.style.backgroundSize = 'cover';
            body.style.backgroundAttachment = 'fixed';
        } else if (styleOrUrl === 'cyber') {
            body.style.backgroundImage = 'linear-gradient(rgba(5, 11, 20, 0.9), rgba(5, 11, 20, 0.9)), url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1920&auto=format&fit=crop")';
            body.style.backgroundSize = 'cover';
            body.style.backgroundAttachment = 'fixed';
        } else if (styleOrUrl.startsWith('http')) {
            // Eigene Bild-URL vom Nutzer
            body.style.backgroundImage = `linear-gradient(rgba(5, 11, 20, 0.8), rgba(5, 11, 20, 0.8)), url("${styleOrUrl}")`;
            body.style.backgroundSize = 'cover';
            body.style.backgroundAttachment = 'fixed';
        } else {
            body.style.backgroundColor = '#050b14'; // Standard Tiefschwarz
        }
    }
    applyBgStyle(savedBgStyle);

    // Modal Steuerung
    const settingsModal = document.getElementById('settingsModal');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');

    if (openSettingsBtn && settingsModal) {
        openSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            settingsModal.classList.add('active');
        });
    }

    if (closeSettingsModalBtn && settingsModal) {
        closeSettingsModalBtn.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });
    }

    // Kachel-Auswahl für Hintergründe
    const bgCards = document.querySelectorAll('.bg-card');
    bgCards.forEach(card => {
        const bgVal = card.getAttribute('data-bg');
        if (bgVal === savedBgStyle) card.classList.add('active-bg');

        card.addEventListener('click', () => {
            bgCards.forEach(c => c.classList.remove('active-bg'));
            card.classList.add('active-bg');
            
            localStorage.setItem('dashboard_bg', bgVal);
            applyBgStyle(bgVal);
        });
    });

    // Eigene Bild-URL setzen
    const customBgInput = document.getElementById('customBgInput');
    const applyCustomBgBtn = document.getElementById('applyCustomBgBtn');
    if (applyCustomBgBtn && customBgInput) {
        applyCustomBgBtn.addEventListener('click', () => {
            const url = customBgInput.value.trim();
            if (url) {
                bgCards.forEach(c => c.classList.remove('active-bg'));
                localStorage.setItem('dashboard_bg', url);
                applyBgStyle(url);
                customBgInput.value = '';
            }
        });
    }

    // Akzentfarben-Punkte
    const accentDots = document.querySelectorAll('#themeAccentPalette .color-dot');
    accentDots.forEach(dot => {
        const col = dot.getAttribute('data-accent');
        if (col === savedAccent) dot.classList.add('active-dot');

        dot.addEventListener('click', () => {
            accentDots.forEach(d => d.classList.remove('active-dot'));
            dot.classList.add('active-dot');
            
            applyAccentColor(col);
            localStorage.setItem('dashboard_accent', col);
        });
    });

    // Daten zurücksetzen
    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', () => {
            if (confirm("Möchtest du wirklich alle lokalen Daten zurücksetzen?")) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    // --- VOLLSTÄNDIGE SPRACH-UMSCHALTUNG (DE / EN) ---
    const translations = {
        de: {
            welcome: "Hallo, ",
            subtitle: "Hier ist dein heutiger Überblick.",
            langBtn: "🌐 EN",
            navDashboard: "Dashboard",
            navShortcuts: "Shortcuts",
            navUni: "Uni & Termine",
            navToday: "Heutige Termine",
            navSpotify: "Spotify Live",
            navWeather: "Wetter",
            navFinance: "Finanzen",
            navNotes: "Notizen",
            navStocks: "Aktien",
            navSettings: "Einstellungen",
            shortcutsTitle: "Browser Shortcuts",
            addShortcut: "+ Hinzufügen",
            uniTitle: "Uni & Termine",
            viewWeek: "Woche",
            viewMonth: "Monat",
            viewYear: "Jahr",
            todayTitle: "Heutige Termine",
            addEventBtn: "+ Termin",
            spotifyTitle: "Spotify Live",
            weatherTitle: "Wetter",
            financeTitle: "Finanzen",
            notesTitle: "Notizen",
            notesPlaceholder: "Schreibe eine Notiz...",
            stocksTitle: "Aktien",
            settingsTitle: "Einstellungen & Design",
            settingsNameLabel: "Dein Name (Begrüßung)",
            settingsAccentLabel: "Akzentfarbe (Buttons & Highlights)",
            settingsBgLabel: "Hintergrund-Design",
            bgDark: "Tiefschwarz",
            bgMidnight: "Mitternacht",
            bgSpace: "Cosmic Space",
            bgCyber: "Cyberpunk",
            settingsCustomBgLabel: "Oder eigenes Hintergrundbild (Bild-URL)",
            settingsCustomBgBtn: "Setzen",
            settingsResetLabel: "Lokale Daten zurücksetzen:",
            settingsResetBtn: "Reset",
            settingsCloseBtn: "Schließen"
        },
        en: {
            welcome: "Hello, ",
            subtitle: "Here is your overview for today.",
            langBtn: "🌐 DE",
            navDashboard: "Dashboard",
            navShortcuts: "Shortcuts",
            navUni: "University & Schedule",
            navToday: "Today's Events",
            navSpotify: "Spotify Live",
            navWeather: "Weather",
            navFinance: "Finances",
            navNotes: "Notes",
            navStocks: "Stocks",
            navSettings: "Settings",
            shortcutsTitle: "Browser Shortcuts",
            addShortcut: "+ Add",
            uniTitle: "University & Schedule",
            viewWeek: "Week",
            viewMonth: "Month",
            viewYear: "Year",
            todayTitle: "Today's Events",
            addEventBtn: "+ Event",
            spotifyTitle: "Spotify Live",
            weatherTitle: "Weather",
            financeTitle: "Finances",
            notesTitle: "Notes",
            notesPlaceholder: "Write a note...",
            stocksTitle: "Stocks",
            settingsTitle: "Settings & Design",
            settingsNameLabel: "Your Name (Greeting)",
            settingsAccentLabel: "Accent Color (Buttons & Highlights)",
            settingsBgLabel: "Background Design",
            bgDark: "Pitch Black",
            bgMidnight: "Midnight",
            bgSpace: "Cosmic Space",
            bgCyber: "Cyberpunk",
            settingsCustomBgLabel: "Or custom background image (Image URL)",
            settingsCustomBgBtn: "Apply",
            settingsResetLabel: "Reset local data:",
            settingsResetBtn: "Reset",
            settingsCloseBtn: "Close"
        }
    };

    let currentLang = localStorage.getItem('dashboard_lang') || 'de';

    function updateTexts() {
        const t = translations[currentLang];
        const savedName = localStorage.getItem('dashboard_username') || 'Tobias';

        // Header Begrüßung
        const welcomeTitle = document.getElementById('welcomeTitle');
        const welcomeSub = document.getElementById('welcomeSub');
        if (welcomeTitle) welcomeTitle.textContent = `${t.welcome}${savedName}!`;
        if (welcomeSub) welcomeSub.textContent = t.subtitle;

        // Sprach-Button Text aktualisieren
        const langBtn = document.getElementById('langToggleBtn');
        if (langBtn) langBtn.textContent = t.langBtn;

        // Spezielle Elemente direkt übersetzen (Buttons, Input-Placeholder etc.)
        const spotifyLoginBtn = document.getElementById('spotifyLoginBtn');
        if (spotifyLoginBtn) spotifyLoginBtn.textContent = currentLang === 'en' ? 'Connect' : 'Verbinden';

        const weatherSearchInput = document.getElementById('weatherSearchInput');
        if (weatherSearchInput) {
            weatherSearchInput.placeholder = currentLang === 'en' ? 'Search city (e.g. Vienna)...' : 'Stadt suchen (z.B. Wien)...';
        }

        const notesTextarea = document.getElementById('dashboardNotes');
        if (notesTextarea) {
            notesTextarea.placeholder = t.notesPlaceholder;
        }

        // Alle Elemente mit data-i18n Attribut automatisch übersetzen
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                    el.placeholder = t[key];
                } else {
                    el.textContent = t[key];
                }
            }
        });
    }

    // Sprach-Button Klick-Event (HIER HATTE ES GEFEHLT!)
    const langToggleBtn = document.getElementById('langToggleBtn');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            currentLang = currentLang === 'de' ? 'en' : 'de';
            localStorage.setItem('dashboard_lang', currentLang);
            updateTexts();
        });
    }

    // Beim Start einmal ausführen
    updateTexts();
    

    // --- INITIALISIERUNG BEIM LADEN DER SEITE ---
    renderShortcuts();
    renderCalendar();
    updateFinanceUI();

});