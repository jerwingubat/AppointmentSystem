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

const MAX_SLOTS_PER_TIME = 3;

let selectedProfessorId = null;
let selectedProfessorName = "";
let selectedDate = "";
let selectedTime = "";

document.addEventListener("DOMContentLoaded", () => {
    loadProfessors();
    generateCalendar(new Date());

    document.getElementById("step1-next").addEventListener("click", () => {
        if (selectedProfessorId) {
            document.getElementById("step1-content").classList.remove("active");
            document.getElementById("step2-content").classList.add("active");
            document.getElementById("selected-professor-name").textContent = selectedProfessorName;
        }
    });

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

    document.getElementById("step2-back").addEventListener("click", () => {
        document.getElementById("step2-content").classList.remove("active");
        document.getElementById("step1-content").classList.add("active");
    });

    document.getElementById("step3-back").addEventListener("click", () => {
        document.getElementById("step3-content").classList.remove("active");
        document.getElementById("step2-content").classList.add("active");
    });

    document.getElementById("new-booking").addEventListener("click", () => {
        location.reload();
    });
});

function loadProfessors() {
    const professorGrid = document.getElementById('professor-grid');
    professorGrid.innerHTML = '<p>Loading users...</p>';

    db.collection("users").get()
        .then((snapshot) => {
            professorGrid.innerHTML = '';
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
    }

    card.innerHTML = `
        <div class="professor-image" style="background-image: url('${imageUrl}');"></div>
        <div class="professor-info">
            <div class="professor-name">${name}</div>
            <div class="professor-department">${department}</div>
            <div class="professor-status ${statusClass}">${statusText}</div>
        </div>
    `;

    if (isAvailable) {
        card.addEventListener('click', () => {
            document.querySelectorAll('.professor-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedProfessorId = id;
            selectedProfessorName = name;
            document.getElementById("step1-next").disabled = false;
            enableTimeSlotSelection(); // reload time slots
        });
    }
    return card;
}

function generateCalendar(date) {
    const calendarDays = document.getElementById('calendar-days');
    const currentMonth = document.getElementById('current-month');

    let currentDate = new Date();

    function renderCalendar() {
        calendarDays.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonth.textContent = `${monthNames[month]} ${year}`;

        for (let i = 0; i < firstDayOfMonth; i++) {
            const blankDay = document.createElement('div');
            blankDay.classList.add('calendar-day', 'disabled');
            calendarDays.appendChild(blankDay);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElem = document.createElement('div');
            dayElem.classList.add('calendar-day');
            dayElem.textContent = day;

            const today = new Date();
            const thisDate = new Date(year, month, day);
            if (thisDate < today) {
                dayElem.classList.add('disabled');
            } else {
                dayElem.addEventListener('click', () => {
                    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                    dayElem.classList.add('selected');
                    selectedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    document.getElementById('selected-date').textContent = selectedDate;
                    enableTimeSlotSelection();
                });
            }
            calendarDays.appendChild(dayElem);
        }
    }

    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    renderCalendar();
}
function formatTimeTo12Hour(time24) {
    const [hour, minute] = time24.split(':');
    let hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    hourNum = hourNum % 12 || 12;
    return `${hourNum}:${minute} ${ampm}`;
}

function enableTimeSlotSelection() {
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        slot.classList.remove('selected', 'unavailable');
        const time = slot.getAttribute('data-time');
        const formattedTime = formatTimeTo12Hour(time);
        slot.textContent = `${formattedTime} (Loading...)`;
        slot.disabled = true;

        if (selectedProfessorId && selectedDate) {
            const appointmentsRef = db.collection("users").doc(selectedProfessorId).collection("appointments");
            appointmentsRef
                .where("date", "==", selectedDate)
                .where("time", "==", time)
                .get()
                .then((querySnapshot) => {
                    const remaining = MAX_SLOTS_PER_TIME - querySnapshot.size;
                    slot.textContent = `${formattedTime} (${remaining} slots left)`;

                    if (remaining <= 0) {
                        slot.classList.add('unavailable');
                        slot.disabled = true;
                    } else {
                        slot.disabled = false;
                        slot.addEventListener('click', () => {
                            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                            slot.classList.add('selected');
                            selectedTime = time;
                            document.getElementById("step2-next").disabled = false;
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error loading time slot:", error);
                    slot.textContent = `${time} (Error)`;
                });
        }
    });
}

function saveAppointment(professorId, appointmentData) {
    // Show spinner when booking starts
    document.getElementById("loading-spinner").classList.remove("hidden");

    const appointmentsRef = db.collection("users").doc(professorId).collection("appointments");

    // Query to check for existing bookings at this date and time
    appointmentsRef
        .where("date", "==", appointmentData.date)
        .where("time", "==", appointmentData.time)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.size >= 3) {
                alert("Sorry, this time slot is fully booked. Please select another time.");
                document.getElementById("loading-spinner").classList.add("hidden"); // Hide spinner on error
                return;
            }

            // Proceed to save
            appointmentsRef.add(appointmentData)
                .then((docRef) => {
                    console.log("Appointment saved with ID:", docRef.id);
                    document.getElementById("step3-content").classList.remove("active");
                    document.getElementById("step4-content").classList.add("active");
                    document.getElementById("confirmation-name").textContent = appointmentData.studentName;
                    document.querySelector(".confirmation-success").classList.remove("hidden");

                    document.getElementById("loading-spinner").classList.add("hidden"); // Hide spinner on success
                })
                .catch((error) => {
                    console.error("Error adding appointment:", error);
                    alert("Error saving appointment.");
                    document.getElementById("loading-spinner").classList.add("hidden"); // Hide spinner on failure
                });
        })
        .catch((error) => {
            console.error("Error checking existing appointments:", error);
            alert("Error checking booking slot availability.");
            document.getElementById("loading-spinner").classList.add("hidden"); // Hide spinner on error
        });
}
