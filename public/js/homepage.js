document.addEventListener('DOMContentLoaded', function() {
    // Step 1: Select Professor
    const professorCards = document.querySelectorAll('.professor-card');
    const step1NextBtn = document.getElementById('step1-next');
    let selectedProfessorId = null;
    
    professorCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            professorCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            this.classList.add('selected');
            selectedProfessorId = this.getAttribute('data-professor-id');
            
            // Enable next button
            step1NextBtn.disabled = false;
            
            // Store professor name for later steps
            const professorName = this.querySelector('.professor-name').textContent;
            document.getElementById('selected-professor-name').textContent = professorName;
            document.getElementById('confirm-professor').textContent = professorName;
        });
    });
    
    // Step navigation
    const step1Content = document.getElementById('step1-content');
    const step2Content = document.getElementById('step2-content');
    const step3Content = document.getElementById('step3-content');
    const confirmationContent = document.getElementById('confirmation-content');
    
    const step1Indicator = document.getElementById('step1-indicator');
    const step2Indicator = document.getElementById('step2-indicator');
    const step3Indicator = document.getElementById('step3-indicator');
    
    // Initialize calendar
    initializeCalendar();
    
    // Step 1 to Step 2
    step1NextBtn.addEventListener('click', function() {
        step1Content.classList.remove('active');
        step2Content.classList.add('active');
        
        step1Indicator.classList.remove('active');
        step1Indicator.classList.add('completed');
        step2Indicator.classList.add('active');
    });
    
    // Step 2 to Step 1
    document.getElementById('step2-back').addEventListener('click', function() {
        step2Content.classList.remove('active');
        step1Content.classList.add('active');
        
        step2Indicator.classList.remove('active');
        step1Indicator.classList.add('active');
        step1Indicator.classList.remove('completed');
    });
    
    // Step 2 to Step 3
    document.getElementById('step2-next').addEventListener('click', function() {
        step2Content.classList.remove('active');
        step3Content.classList.add('active');
        
        step2Indicator.classList.remove('active');
        step2Indicator.classList.add('completed');
        step3Indicator.classList.add('active');
    });
    
    // Step 3 to Step 2
    document.getElementById('step3-back').addEventListener('click', function() {
        step3Content.classList.remove('active');
        step2Content.classList.add('active');
        
        step3Indicator.classList.remove('active');
        step2Indicator.classList.add('active');
        step2Indicator.classList.remove('completed');
    });
    
    // Confirm booking
    document.getElementById('confirm-booking').addEventListener('click', function() {
        step3Content.classList.remove('active');
        confirmationContent.classList.add('active');
        
        // Simulate processing
        setTimeout(function() {
            document.querySelector('.loading').classList.add('hidden');
            document.querySelector('.confirmation-success').classList.remove('hidden');
        }, 2000);
    });
    
    // New booking
    document.getElementById('new-booking').addEventListener('click', function() {
        // Reset the form
        professorCards.forEach(c => c.classList.remove('selected'));
        step1NextBtn.disabled = true;
        document.getElementById('step2-next').disabled = true;
        
        // Reset indicators
        step1Indicator.classList.remove('completed');
        step2Indicator.classList.remove('completed', 'active');
        step3Indicator.classList.remove('active');
        step1Indicator.classList.add('active');
        
        // Show step 1
        confirmationContent.classList.remove('active');
        step1Content.classList.add('active');
        
        // Reset confirmation
        document.querySelector('.loading').classList.remove('hidden');
        document.querySelector('.confirmation-success').classList.add('hidden');
    });
    
    // Calendar functionality
    function initializeCalendar() {
        const currentDate = new Date();
        renderCalendar(currentDate);
        
        // Previous month button
        document.getElementById('prev-month').addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
        });
        
        // Next month button
        document.getElementById('next-month').addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
        });
    }
    
    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // Set month title
        const monthNames = ["January", "February", "March", "April", "May", "June",
                           "July", "August", "September", "October", "November", "December"];
        document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
        
        // Get first day of month and total days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Get days from previous month
        const prevMonthDays = new Date(year, month, 0).getDate();
        
        // Clear calendar
        const calendarDays = document.getElementById('calendar-days');
        calendarDays.innerHTML = '';
        
        // Add days from previous month
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day disabled';
            dayElement.textContent = prevMonthDays - i;
            calendarDays.appendChild(dayElement);
        }
        
        // Add days from current month
        const today = new Date();
        const currentDate = new Date();
        
        // For demo purposes, mark some days as having availability
        const daysWithAvailability = [5, 8, 12, 15, 19, 22, 26];
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = i;
            
            // Mark today
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('selected');
                updateSelectedDate(i, month, year);
            }
            
            // Mark days with availability (for demo)
            if (daysWithAvailability.includes(i)) {
                dayElement.classList.add('has-availability');
            }
            
            // Add click event
            dayElement.addEventListener('click', function() {
                if (!this.classList.contains('disabled')) {
                    // Remove selected from all days
                    document.querySelectorAll('.calendar-day').forEach(day => {
                        day.classList.remove('selected');
                    });
                    
                    // Add selected to clicked day
                    this.classList.add('selected');
                    
                    // Update selected date display
                    updateSelectedDate(i, month, year);
                    
                    // Enable next button if time slot is selected
                    const timeSlotSelected = document.querySelector('.time-slot.selected');
                    document.getElementById('step2-next').disabled = !timeSlotSelected;
                }
            });
            
            calendarDays.appendChild(dayElement);
        }
        
        // Calculate total cells added so far
        const totalCells = firstDay + daysInMonth;
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        
        // Add days from next month
        for (let i = 1; i <= remainingCells; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day disabled';
            dayElement.textContent = i;
            calendarDays.appendChild(dayElement);
        }
    }
    
    function updateSelectedDate(day, month, year) {
        const date = new Date(year, month, day);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', options);
        document.getElementById('selected-date').textContent = formattedDate;
        document.getElementById('confirm-date').textContent = formattedDate;
    }
    
    // Time slot selection
    const timeSlotsGrid = document.getElementById('time-slots-grid');
    const step2NextBtn = document.getElementById('step2-next');
    
    timeSlotsGrid.addEventListener('click', function(e) {
        if (e.target.classList.contains('time-slot') && !e.target.classList.contains('booked')) {
            // Remove selected from all time slots
            document.querySelectorAll('.time-slot').forEach(slot => {
                slot.classList.remove('selected');
            });
            
            // Add selected to clicked time slot
            e.target.classList.add('selected');
            
            // Update confirmation time
            document.getElementById('confirm-time').textContent = e.target.textContent;
            
            // Enable next button
            step2NextBtn.disabled = false;
        }
    });
});