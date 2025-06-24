// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBRIyuxDhndABeMJng-fJRZJPaX_R7g7O8",
    authDomain: "appointment-system-6d7a5.firebaseapp.com",
    projectId: "appointment-system-6d7a5",
    storageBucket: "appointment-system-6d7a5.appspot.com",
    messagingSenderId: "764916211566",
    appId: "1:764916211566:web:551c88b55cba38ba446b7f",
    measurementId: "G-PF964W9HCQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let selectedProfessorId = null;
let selectedProfessorName = "";
let selectedDate = "";
let selectedTime = "";

// On DOM Load
document.addEventListener("DOMContentLoaded", () => {
    loadProfessors();
    generateCalendar(new Date());
    enableTimeSlotSelection();

    // Step 1: Next
    document.getElementById("step1-next").addEventListener("click", () => {
        if (selectedProfessorId) {
            document.getElementById("step1-content").classList.remove("active");
            document.getElementById("step2-content").classList.add("active");
            document.getElementById("selected-professor-name").textContent = selectedProfessorName;
        }
    });

    // Step 2: Next
    document.getElementById("step2-next").addEventListener("click", () => {
        if (selectedDate && selectedTime) {
            document.getElementById("step2-content").classList.remove("active");
            document.getElementById("step3-content").classList.add("active");
            document.getElementById("confirm-professor").textContent = selectedProfessorName;
            document.getElementById("confirm-date").textContent = selectedDate;
            document.getElementById("confirm-time").textContent = selectedTime;
        } else {
            alert("Please select a date and time.");
        }
    });

    // Step 3: Complete Booking
    document.getElementById("step3-next").addEventListener("click", () => {
        const studentName = document.getElementById("student-name").value;
        const studentID = document.getElementById("student-id").value;
        const studentEmail = document.getElementById("student-email").value;
        const appointmentPurpose = document.getElementById("appointment-purpose").value;

        if (!studentName || !studentID || !selectedDate || !selectedTime) {
            alert("Please complete all required fields.");
            return;
        }

        const appointmentData = {
            studentName,
            studentID,
            email: studentEmail,
            purpose: appointmentPurpose,
            date: selectedDate,
            time: selectedTime,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        saveAppointment(selectedProfessorId, appointmentData);
    });

    // Step 2: Back
    document.getElementById("step2-back").addEventListener("click", () => {
        document.getElementById("step2-content").classList.remove("active");
        document.getElementById("step1-content").classList.add("active");
    });

    // Step 3: Back
    document.getElementById("step3-back").addEventListener("click", () => {
        document.getElementById("step3-content").classList.remove("active");
        document.getElementById("step2-content").classList.add("active");
    });

    // New Booking
    document.getElementById("new-booking").addEventListener("click", () => {
        location.reload();
    });
});

// Load All Users from Firestore (Even if not professors)
function loadProfessors() {
    const professorGrid = document.getElementById('professor-grid');
    professorGrid.innerHTML = '<p>Loading users...</p>';

    db.collection("users").get()
        .then((snapshot) => {
            professorGrid.innerHTML = '';
            if (snapshot.empty) {
                professorGrid.innerHTML = '<p>No professors found.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const card = createProfessorCard(doc.id, data);
                professorGrid.appendChild(card);
            });
        })
        .catch((error) => {
            console.error("Error loading users:", error);
            professorGrid.innerHTML = '<p>Error loading users.</p>';
        });
}

function createProfessorCard(id, data) {
    const card = document.createElement('div');
    card.classList.add('professor-card');
    card.setAttribute('data-professor-id', id);

    const imageBase64 = data.profilePicBase64 || 'default-profile.png';
    const imageUrl = imageBase64.startsWith('data:image') ? imageBase64 : 'default-profile.png';

    const name = `${data.firstName || 'No'} ${data.lastName || 'Name'}`;
    const department = data.department || 'Unknown Department';
    const status = data.status || 'Unavailable';

    let statusClass = 'status-unavailable';
    let statusText = '● Unavailable';
    let isAvailable = false;

    if (status.toLowerCase() === 'available') {
        statusClass = 'status-available';
        statusText = '● Available Now';
        isAvailable = true;
    } else if (status.toLowerCase() === 'busy' || status.toLowerCase() === 'in meeting') {
        statusClass = 'status-busy';
        statusText = '● Busy';
    }

    card.innerHTML = `
        <div class="professor-image" style="background-image: url('${imageUrl}');"></div>
        <div class="professor-info">
            <div class="professor-name">${name}</div>
            <div class="professor-department">${department}</div>
            <div class="professor-status ${statusClass}">${statusText}</div>
        </div>
    `;

    // Only add click listener if professor is available
    if (isAvailable) {
        card.addEventListener('click', () => {
            document.querySelectorAll('.professor-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedProfessorId = id;
            selectedProfessorName = name;
            document.getElementById("step1-next").disabled = false;
        });
    } else {
        // Visually disable card to indicate unclickable
        card.style.opacity = '0.6';
        card.style.cursor = 'not-allowed';
    }

    return card;
}

// Calendar Generation
function generateCalendar(date) {
    const calendarDays = document.getElementById('calendar-days');
    const currentMonth = document.getElementById('current-month');
    const prevMonth = document.getElementById('prev-month');
    const nextMonth = document.getElementById('next-month');

    let year = date.getFullYear();
    let month = date.getMonth();

    // Calendar setup
    let currentDate = new Date();
    let selectedDay = null;

    function renderCalendar() {
        const calendarDays = document.getElementById('calendar-days');
        const currentMonthElem = document.getElementById('current-month');
        calendarDays.innerHTML = ''; // clear previous days

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Set Month Title
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthElem.textContent = `${monthNames[month]} ${year}`;

        // Blank days before 1st
        for (let i = 0; i < firstDayOfMonth; i++) {
            const blankDay = document.createElement('div');
            blankDay.classList.add('calendar-day', 'disabled');
            calendarDays.appendChild(blankDay);
        }

        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElem = document.createElement('div');
            dayElem.classList.add('calendar-day');
            dayElem.textContent = day;

            // Disable past days
            const today = new Date();
            const thisDate = new Date(year, month, day);
            if (thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                dayElem.classList.add('disabled');
            } else {
                // Make clickable
                dayElem.addEventListener('click', () => {
                    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                    dayElem.classList.add('selected');
                    selectedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    document.getElementById('selected-date').textContent = selectedDate;
                    document.getElementById('step2-next').disabled = false; // enable Next button
                });
            }

            // Append day
            calendarDays.appendChild(dayElem);
        }
    }

    // Navigation buttons
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Run on load
    document.addEventListener('DOMContentLoaded', renderCalendar);


    renderCalendar();

    prevMonth.addEventListener('click', () => {
        month--;
        if (month < 0) { month = 11; year--; }
        renderCalendar();
    });

    nextMonth.addEventListener('click', () => {
        month++;
        if (month > 11) { month = 0; year++; }
        renderCalendar();
    });
}

// Enable Time Slot Clicking
function enableTimeSlotSelection() {
    document.querySelectorAll('.time-slot.available').forEach(slot => {
        slot.addEventListener('click', () => {
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
            selectedTime = slot.getAttribute('data-time');
            document.getElementById("step2-next").disabled = false;
        });
    });
}
function saveAppointment(professorId, appointmentData) {
    const appointmentsRef = db.collection("users").doc(professorId).collection("appointments");

    // Query to check for existing bookings at this date and time
    appointmentsRef
        .where("date", "==", appointmentData.date)
        .where("time", "==", appointmentData.time)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.size >= 3) {
                // Already 3 or more bookings for this slot
                alert("Sorry, this time slot is fully booked. Please select another time.");
                return;
            }

            // Otherwise, proceed to save
            appointmentsRef.add(appointmentData)
                .then((docRef) => {
                    console.log("Appointment saved with ID:", docRef.id);
                    document.getElementById("step3-content").classList.remove("active");
                    document.getElementById("step4-content").classList.add("active");
                    document.getElementById("confirmation-name").textContent = appointmentData.studentName;
                    document.querySelector(".confirmation-success").classList.remove("hidden");
                })
                .catch((error) => {
                    console.error("Error adding appointment:", error);
                    alert("Error saving appointment.");
                });
        })
        .catch((error) => {
            console.error("Error checking existing appointments:", error);
            alert("Error checking booking slot availability.");
        });
}

