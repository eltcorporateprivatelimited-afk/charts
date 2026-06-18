/**
 * Delhi Bus E-Ticket Booking Portal - app.js
 * Logic for responsive e-ticket generation, dynamic calculations,
 * status clock, autocomplete, pseudo-QR drawing, and UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Input Form
    const routeInput = document.getElementById('route-input');
    const ticketsSelect = document.getElementById('tickets-input');
    const startStopInput = document.getElementById('start-stop');
    const endStopInput = document.getElementById('end-stop');
    const fareSelect = document.getElementById('fare-select');
    const bookingTimeInput = document.getElementById('booking-time-input');
    
    const baseTotalVal = document.getElementById('base-total-val');
    const discountVal = document.getElementById('discount-val');
    const paidTotalVal = document.getElementById('paid-total-val');
    
    const btnCurrentTime = document.getElementById('btn-current-time');
    const btnRandomTicket = document.getElementById('btn-random-ticket');
    const btnPrint = document.getElementById('btn-print');
    
    // DOM Elements - Ticket Preview (Phone Screen)
    const ticketCardEl = document.getElementById('ticket-card-el');
    const ticketTopFare = document.getElementById('ticket-top-fare');
    const ticketRoute = document.getElementById('ticket-route');
    const ticketBaseFare = document.getElementById('ticket-base-fare');
    const ticketBookingTime = document.getElementById('ticket-booking-time');
    const ticketCount = document.getElementById('ticket-count');
    const ticketStartStop = document.getElementById('ticket-start-stop');
    const ticketEndStop = document.getElementById('ticket-end-stop');
    const ticketHashCode = document.getElementById('ticket-hash-code');
    const ticketValidatedPill = document.getElementById('ticket-validated-pill');
    const ticketEmptyEl = document.getElementById('ticket-empty-el');
    
    // DOM Elements - View Swapping
    const bookingView = document.getElementById('booking-view');
    const ticketView = document.getElementById('ticket-view');
    const btnCloseApp = document.getElementById('btn-close-app');
    
    // DOM Elements - Status Bar & Presets
    const statusClock = document.getElementById('status-clock');
    const presetTags = document.querySelectorAll('.preset-tag');
    const routeSuggestions = document.getElementById('route-suggestions');
    const startSuggestions = document.getElementById('start-suggestions');
    const endSuggestions = document.getElementById('end-suggestions');

    // DOM Elements - Modal QR
    const btnShowQr = document.getElementById('btn-show-qr');
    const qrModal = document.getElementById('qr-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCloseModalOk = document.getElementById('btn-close-modal-ok');
    const qrCanvas = document.getElementById('qr-canvas');
    const modalRoute = document.getElementById('modal-route');
    const modalTickets = document.getElementById('modal-tickets');
    const modalFare = document.getElementById('modal-fare');
    const modalHash = document.getElementById('modal-hash');

    // Predefined suggestions lists for Delhi Buses
    const delhiRoutes = ["OMS", "OMS+", "OMS+UNSK", "502", "727", "419", "205", "522", "926", "Airport Express", "GL-23", "429", "85", "390", "73", "261"];
    const delhiStops = [
        "Shaheed Captain Vikram Batra Flyover",
        "Burari Crossing",
        "ISBT Kashmere Gate",
        "Rajiv Chowk (Connaught Place)",
        "Nehru Place",
        "Dhaula Kuan",
        "Azadpur Bypass",
        "GTB Nagar Metro Station",
        "Anand Vihar ISBT",
        "Uttam Nagar Terminal",
        "Dwarka Sector 21 Metro Station",
        "Mehrauli Terminal",
        "Jawaharlal Nehru Stadium",
        "Ambedkar Nagar Terminal",
        "Old Delhi Railway Station",
        "Noida Sector 37",
        "Badarpur Border",
        "Janakpuri District Centre",
        "Punjabi Bagh Chowk",
        "Sarai Kale Khan ISBT"
    ];

    // Initialize Page
    init();

    function init() {
        // Set Default Date and Time
        setBookingTimeToNow();
        // Update all ticket calculations
        updateCalculationsAndPreview();
        // Start live clock for phone status bar
        startPhoneClock();
        // Generate initial ticket hash code
        regenerateTicketHash();
        // Set up autocomplete events
        setupAutocomplete(routeInput, routeSuggestions, delhiRoutes);
        setupAutocomplete(startStopInput, startSuggestions, delhiStops);
        setupAutocomplete(endStopInput, endSuggestions, delhiStops);
    }

    // 1. Calculations & Live Preview Updates
    function updateCalculationsAndPreview() {
        const baseFarePerTicket = parseFloat(fareSelect.value);
        const count = parseInt(ticketsSelect.value);
        const route = routeInput.value.trim() || "OMS+UNSK";
        const start = startStopInput.value.trim() || "Shaheed Captain Vikram Batra Flyover";
        const end = endStopInput.value.trim() || "Burari Crossing";
        
        // Date formatting
        const bookingDateVal = new Date(bookingTimeInput.value);
        const formattedDate = formatTicketDate(bookingDateVal);

        // Compute pricing
        const totalBase = baseFarePerTicket * count;
        // ONDC network ticket gets 7.5% discount
        const rawDiscount = totalBase * 0.075;
        // Rounded discount to nearest 0.25 (to keep it look like real fares)
        const discount = Math.round(rawDiscount * 4) / 4;
        const paidTotal = totalBase - discount;

        // Update booking panel breakdown
        baseTotalVal.textContent = `₹${totalBase.toFixed(2)}`;
        discountVal.textContent = `-₹${discount.toFixed(2)}`;
        paidTotalVal.textContent = `₹${paidTotal.toFixed(2)}`;

        // Update live phone mockup screen details
        ticketTopFare.textContent = `₹${paidTotal.toFixed(2)}`;
        ticketRoute.textContent = route;
        ticketBaseFare.textContent = `₹${baseFarePerTicket.toFixed(1)}`;
        ticketCount.textContent = count;
        ticketStartStop.textContent = start;
        ticketEndStop.textContent = end;
        ticketBookingTime.textContent = formattedDate;
        ticketValidatedPill.textContent = `Validated At: ${formattedDate}`;
    }

    // Bind inputs to dynamic updater
    [routeInput, ticketsSelect, startStopInput, endStopInput, fareSelect, bookingTimeInput].forEach(elem => {
        elem.addEventListener('input', updateCalculationsAndPreview);
    });

    // 2. Clock & Date Management
    function setBookingTimeToNow() {
        const now = new Date();
        // Format to YYYY-MM-DDTHH:MM for datetime-local input
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        bookingTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        updateCalculationsAndPreview();
    }

    btnCurrentTime.addEventListener('click', () => {
        setBookingTimeToNow();
        regenerateTicketHash();
        playBeep(800, 100);
    });

    function startPhoneClock() {
        function updateClock() {
            const now = new Date();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 should be 12
            statusClock.textContent = `${hours}:${minutes} ${ampm}`;
        }
        updateClock();
        setInterval(updateClock, 60000); // Update every minute
    }

    // Format: "13 Jun, 26 | 07:06 PM"
    function formatTicketDate(date) {
        if (isNaN(date.getTime())) return "Invalid Date";
        const months = ["Jun", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; // Quick array, but let's map index
        // To handle correct naming
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = String(date.getDate()).padStart(2, '0');
        const month = monthNames[date.getMonth()];
        // Delhi Govt app format usually uses 2-digit year (e.g. "26") or 4-digit. Let's use 2-digit to match screenshot ("13 Jun, 26")
        const year = String(date.getFullYear()).substring(2); 
        
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedHours = String(hours).padStart(2, '0');
        
        return `${day} ${month}, ${year} | ${formattedHours}:${minutes} ${ampm}`;
    }

    // Generate ticket hash: "T" + DDMMYYYY + 10 random hex digits
    function regenerateTicketHash() {
        const dateVal = new Date(bookingTimeInput.value);
        if (isNaN(dateVal.getTime())) return;
        
        const day = String(dateVal.getDate()).padStart(2, '0');
        const month = String(dateVal.getMonth() + 1).padStart(2, '0');
        const year = dateVal.getFullYear();
        
        const dateString = `${day}${month}${year}`;
        
        const chars = '0123456789abcdef';
        let randomPart = '';
        for (let i = 0; i < 10; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        const hashCode = `T${dateString}${randomPart}`;
        ticketHashCode.textContent = hashCode;
    }

    // 3. Autocomplete suggestion logic
    function setupAutocomplete(inputEl, suggestionEl, list) {
        inputEl.addEventListener('input', () => {
            const val = inputEl.value.toLowerCase().trim();
            suggestionEl.innerHTML = '';
            if (!val) {
                suggestionEl.style.display = 'none';
                return;
            }

            const matches = list.filter(item => item.toLowerCase().includes(val)).slice(0, 5);
            if (matches.length === 0) {
                suggestionEl.style.display = 'none';
                return;
            }

            matches.forEach(match => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = match;
                div.addEventListener('click', () => {
                    inputEl.value = match;
                    suggestionEl.style.display = 'none';
                    updateCalculationsAndPreview();
                });
                suggestionEl.appendChild(div);
            });
            suggestionEl.style.display = 'block';
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== inputEl && e.target !== suggestionEl) {
                suggestionEl.style.display = 'none';
            }
        });
    }

    // Helper to reveal ticket view and hide booking form
    function showTicket() {
        if (bookingView) bookingView.classList.add('hidden');
        if (ticketView) ticketView.classList.remove('hidden');
    }

    // Go back to booking form
    if (btnCloseApp) {
        btnCloseApp.addEventListener('click', () => {
            if (ticketView) ticketView.classList.add('hidden');
            if (bookingView) bookingView.classList.remove('hidden');
            playBeep(440, 120);
        });
    }

    // Preset tag badge clicks
    presetTags.forEach(tag => {
        tag.addEventListener('click', () => {
            routeInput.value = tag.getAttribute('data-route');
            startStopInput.value = tag.getAttribute('data-start');
            endStopInput.value = tag.getAttribute('data-end');
            fareSelect.value = tag.getAttribute('data-fare');
            
            setBookingTimeToNow();
            regenerateTicketHash();
            updateCalculationsAndPreview();
            
            // Show ticket view
            showTicket();
            // Highlight preview
            triggerPrintAnimation();
            playBeep(600, 150);
        });
    });

    // 4. Random Ticket Generator
    btnRandomTicket.addEventListener('click', () => {
        // Random Route
        routeInput.value = delhiRoutes[Math.floor(Math.random() * delhiRoutes.length)];
        
        // Random stops (must be different)
        let startIndex = Math.floor(Math.random() * delhiStops.length);
        let endIndex = Math.floor(Math.random() * delhiStops.length);
        while (startIndex === endIndex) {
            endIndex = Math.floor(Math.random() * delhiStops.length);
        }
        startStopInput.value = delhiStops[startIndex];
        endStopInput.value = delhiStops[endIndex];
        
        // Random fare
        const fares = ["5", "10", "15", "20", "25"];
        fareSelect.value = fares[Math.floor(Math.random() * fares.length)];
        
        // Random ticket count
        ticketsSelect.value = Math.floor(Math.random() * 3) + 1; // 1 to 3 tickets

        setBookingTimeToNow();
        regenerateTicketHash();
        updateCalculationsAndPreview();
        
        // Show ticket view
        showTicket();
        triggerPrintAnimation();
        playBeep(523.25, 200); // Do-note
    });

    // Book Ticket Action
    btnPrint.addEventListener('click', () => {
        if (!routeInput.value || !startStopInput.value || !endStopInput.value) {
            alert("Please fill in all ticket details first.");
            return;
        }

        regenerateTicketHash();
        updateCalculationsAndPreview();
        
        // Show ticket view
        showTicket();
        triggerPrintAnimation();
        
        // Play premium electronic validation chime
        playValidateChime();
    });

    function triggerPrintAnimation() {
        ticketCardEl.classList.remove('printing-effect');
        // Trigger reflow
        void ticketCardEl.offsetWidth;
        ticketCardEl.classList.add('printing-effect');
    }

    // 5. Synthesized Web Audio API Chimes (Premium WOW factor)
    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function playBeep(frequency, duration) {
        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.value = frequency;
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
            
            osc.start();
            osc.stop(ctx.currentTime + duration / 1000);
        } catch (e) {
            // Browser policy block fallback
        }
    }

    function playValidateChime() {
        try {
            const ctx = getAudioContext();
            const time = ctx.currentTime;
            
            // Tone 1
            let osc1 = ctx.createOscillator();
            let gain1 = ctx.createGain();
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.frequency.setValueAtTime(587.33, time); // D5
            gain1.gain.setValueAtTime(0.06, time);
            gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            osc1.start(time);
            osc1.stop(time + 0.15);

            // Tone 2
            let osc2 = ctx.createOscillator();
            let gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.frequency.setValueAtTime(880.00, time + 0.08); // A5
            gain2.gain.setValueAtTime(0.06, time + 0.08);
            gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
            osc2.start(time + 0.08);
            osc2.stop(time + 0.3);
        } catch (e) {
            // Audio context failed
        }
    }

    // 6. QR Code Drawer & Modal
    btnShowQr.addEventListener('click', () => {
        // Populate modal data
        modalRoute.textContent = ticketRoute.textContent;
        modalTickets.textContent = `${ticketCount.textContent} Ticket${ticketCount.textContent > 1 ? 's' : ''}`;
        modalFare.textContent = ticketTopFare.textContent;
        modalHash.textContent = ticketHashCode.textContent;

        // Draw the pseudorandom QR Code on Canvas
        drawQR(ticketHashCode.textContent);

        // Open Modal
        qrModal.classList.add('active');
        playBeep(987.77, 80); // Quick B5 beep
    });

    function closeModal() {
        qrModal.classList.remove('active');
        playBeep(440, 100); // Low close beep
    }

    btnCloseModal.addEventListener('click', closeModal);
    btnCloseModalOk.addEventListener('click', closeModal);
    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) {
            closeModal();
        }
    });

    // Custom Pseudo-QR Generator for offline high-fidelity render
    function drawQR(text) {
        const ctx = qrCanvas.getContext('2d');
        const width = qrCanvas.width;
        const height = qrCanvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // QR Grid size (e.g. 29x29 blocks)
        const gridSize = 29;
        const cellSize = width / gridSize;

        ctx.fillStyle = '#000000';

        // Helper to draw QR corner eye finder pattern
        function drawFinderPattern(x, y) {
            // 7x7 outer square
            ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
            // 5x5 inner white square
            ctx.fillStyle = '#ffffff';
            ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
            // 3x3 center black solid
            ctx.fillStyle = '#000000';
            ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
        }

        // Draw top-left, top-right, bottom-left finders
        drawFinderPattern(0, 0);
        drawFinderPattern(gridSize - 7, 0);
        drawFinderPattern(0, gridSize - 7);

        // Draw small alignment pattern near bottom-right
        ctx.fillStyle = '#000000';
        const ax = gridSize - 9;
        const ay = gridSize - 9;
        ctx.fillRect(ax * cellSize, ay * cellSize, 5 * cellSize, 5 * cellSize);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect((ax + 1) * cellSize, (ay + 1) * cellSize, 3 * cellSize, 3 * cellSize);
        ctx.fillStyle = '#000000';
        ctx.fillRect((ax + 2) * cellSize, (ay + 2) * cellSize, 1 * cellSize, 1 * cellSize);

        // Fill the rest with hash-based pseudo random bits
        // Simple hash function to generate consistent bits for a given ticket ID
        function hashCode(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        }

        let seed = hashCode(text);
        
        function pseudoRandom() {
            let x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        }

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                // Skip areas occupied by the finder eyes
                const inTopLeft = r < 9 && c < 9;
                const inTopRight = r < 9 && c >= gridSize - 9;
                const inBottomLeft = r >= gridSize - 9 && c < 9;
                const inAlignment = r >= gridSize - 10 && r < gridSize - 4 && c >= gridSize - 10 && c < gridSize - 4;

                if (inTopLeft || inTopRight || inBottomLeft || inAlignment) {
                    continue;
                }

                // Extra QR structures: timing patterns (dotted lines between finders)
                if (r === 6 || c === 6) {
                    if ((r === 6 && c % 2 === 0) || (c === 6 && r % 2 === 0)) {
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    }
                    continue;
                }

                // Random block
                if (pseudoRandom() > 0.45) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                }
            }
        }
    }
});
