const firebaseConfig = {
    apiKey: "AIzaSyBRIyuxDhndABeMJng-fJRZJPaX_R7g7O8",
    authDomain: "appointment-system-6d7a5.firebaseapp.com",
    projectId: "appointment-system-6d7a5",
    storageBucket: "appointment-system-6d7a5.appspot.com",
    messagingSenderId: "764916211566",
    appId: "1:764916211566:web:551c88b55cba38ba446b7f",
    measurementId: "G-PF964W9HCQ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const MAX_SLOTS_PER_TIME = 3;

let selectedProfessorId = null;
let selectedProfessorName = "";
let selectedDate = "";
let selectedTime = "";
let slotUnsubscribe = null;

document.addEventListener("DOMContentLoaded", () => {
    loadProfessors();
    generateCalendar(new Date());

    document.getElementById("step1-next").addEventListener("click", () => {
        if (selectedProfessorId) {
            document.getElementById("step1-content").classList.remove("active");
            document.getElementById("step2-content").classList.add("active");
            document.getElementById("selected-professor-name").textContent = selectedProfessorName;
            setStepIndicator(1);
        }
    });

    document.getElementById("step2-next").addEventListener("click", () => {
        if (selectedDate && selectedTime) {
            document.getElementById("step2-content").classList.remove("active");
            document.getElementById("step3-content").classList.add("active");
            document.getElementById("confirm-professor").textContent = selectedProfessorName;
            document.getElementById("confirm-date").textContent = selectedDate;
            document.getElementById("confirm-time").textContent = formatTimeTo12Hour(selectedTime);
            setStepIndicator(2);
        } else {
            showCustomAlert("Please select a date and time.");
        }
    });

    document.getElementById("step3-next").addEventListener("click", () => {
        const studentName = document.getElementById("student-name").value;
        const studentID = document.getElementById("student-id").value;
        const studentEmail = document.getElementById("student-email").value;
        const appointmentPurpose = document.getElementById("appointment-purpose").value;

        if (!studentName || !studentID || !selectedDate || !selectedTime) {
            showCustomAlert("Please complete all required fields.");
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

        setStepIndicator(3);
        document.getElementById('booking-spinner').classList.remove('hidden');
        saveAppointment(selectedProfessorId, appointmentData);
    });

    document.getElementById("step2-back").addEventListener("click", () => {
        document.getElementById("step2-content").classList.remove("active");
        document.getElementById("step1-content").classList.add("active");
        setStepIndicator(0);
    });

    document.getElementById("step3-back").addEventListener("click", () => {
        document.getElementById("step3-content").classList.remove("active");
        document.getElementById("step2-content").classList.add("active");
        setStepIndicator(1);
    });

    document.getElementById("new-booking").addEventListener("click", () => {
        location.reload();
    });
});

function loadProfessors() {
    const professorGrid = document.getElementById('professor-grid');
    professorGrid.innerHTML = '<p>Loading users...</p>';

    db.collection("users").onSnapshot((snapshot) => {
        professorGrid.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = createProfessorCard(doc.id, data);
            professorGrid.appendChild(card);
        });
    }, (error) => {
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
    const statusCustom = data.statusMessage;

    let statusClass = 'status-unavailable';
    let statusText = `● ${status}`;
    let isAvailable = false;

    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === 'available') {
        statusClass = 'status-available';
        statusText = '● Available Now';
        isAvailable = true;
    } else if (normalizedStatus === 'busy') {
        statusClass = 'status-busy';
        statusText = '● Busy';
    } else if (normalizedStatus === 'away') {
        statusClass = 'status-away';
        statusText = '● Away';
    } else {
        statusClass = 'status-unavailable';
        statusText = `● ${status}`;
    }

    card.innerHTML = `
        <div class="professor-image" style="background-image: url('${imageUrl}');"></div>
        <div class="professor-info">
            <div class="professor-name">${name}</div>
            <div class="professor-department">${department}</div>
            <div class="professor-status ${statusClass}">${statusText}</div>
            ${statusCustom ? `<div class="professor-status-message">🛈 ${statusCustom}</div>` : ''}
        </div>
    `;

    if (isAvailable) {
        card.addEventListener('click', () => {
            document.querySelectorAll('.professor-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedProfessorId = id;
            selectedProfessorName = name;
            document.getElementById("step1-next").disabled = false;
            enableTimeSlotSelection();
            clearSelectedTimeDisplay();
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
            const dayOfWeek = thisDate.getDay();
            if (thisDate < today || dayOfWeek === 0 || dayOfWeek === 6) { // 0: Sunday, 6: Saturday
                dayElem.classList.add('disabled');
            } else {
                dayElem.addEventListener('click', () => {
                    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                    dayElem.classList.add('selected');
                    selectedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    document.getElementById('selected-date').textContent = selectedDate;
                    enableTimeSlotSelection();
                    clearSelectedTimeDisplay();
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

    if (!selectedProfessorId || !selectedDate) return;

    const appointmentsRef = db.collection("users").doc(selectedProfessorId).collection("appointments");

    slotUnsubscribe = appointmentsRef
        .where("date", "==", selectedDate)
        .onSnapshot((snapshot) => {
            const slotCounts = {};

            snapshot.forEach(doc => {
                const time = doc.data().time;
                slotCounts[time] = (slotCounts[time] || 0) + 1;
            });

            timeSlots.forEach(slot => {
                const time = slot.getAttribute('data-time');
                const count = slotCounts[time] || 0;
                const remaining = MAX_SLOTS_PER_TIME - count;
                const formattedTime = formatTimeTo12Hour(time);

                slot.textContent = `${formattedTime} (${remaining} slots left)`;
                slot.classList.remove('unavailable', 'selected');
                slot.disabled = remaining <= 0;

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
        });
    });
}


function getEstimatedWaitTime(position) {
    const avgTimePerPerson = 10;
    const wait = (position - 1) * avgTimePerPerson;
    return `${wait}-${wait + avgTimePerPerson} minutes`;
}

function generateConfirmationNumber(studentID) {
    return `DCS-${studentID}`;
}

function showCustomAlert(message) {
    const alertBox = document.getElementById('custom-alert');
    const alertMsg = document.getElementById('custom-alert-message');
    const alertOk = document.getElementById('custom-alert-ok');
    alertMsg.textContent = message;
    alertBox.classList.remove('hidden');
    alertOk.focus();
    function closeAlert() {
        alertBox.classList.add('hidden');
        alertOk.removeEventListener('click', closeAlert);
    }
    alertOk.addEventListener('click', closeAlert);
    // Also close on Enter key
    alertOk.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { closeAlert(); } };
}

function saveAppointment(professorId, appointmentData) {
    document.getElementById("loading-spinner").classList.remove("hidden");

    const appointmentsRef = db.collection("users").doc(professorId).collection("appointments");

    const confirmationNumber = generateConfirmationNumber(appointmentData.studentID);

    appointmentsRef
        .where("date", "==", appointmentData.date)
        .where("time", "==", appointmentData.time)
        .orderBy("timestamp", "asc")
        .get()
        .then((querySnapshot) => {
            const currentCount = querySnapshot.size;

            if (currentCount >= MAX_SLOTS_PER_TIME) {
                showCustomAlert("Sorry, this time slot is fully booked. Please select another time.");
                document.getElementById("loading-spinner").classList.add("hidden");
                document.getElementById("booking-spinner").classList.add("hidden");
                return;
            }
            const queuePosition = currentCount + 1;
            appointmentData.confirmationNumber = confirmationNumber;
            appointmentData.queueNumber = queuePosition;
            appointmentData.confirmed = true;

            appointmentsRef.add(appointmentData)
                .then((docRef) => {
                    console.log("Appointment saved with ID:", docRef.id);

                    document.getElementById("step3-content").classList.remove("active");
                    document.getElementById("step4-content").classList.add("active");

                    document.getElementById("confirmation-name").textContent = appointmentData.studentName;
                    document.getElementById("confirmation-professor").textContent = selectedProfessorName;
                    document.getElementById("confirmation-date").textContent = appointmentData.date;
                    document.getElementById("confirmation-time").textContent = formatTimeTo12Hour(appointmentData.time);
                    document.querySelector(".queue-position span").textContent = queuePosition;
                    document.querySelector(".queue-info p strong").textContent = getEstimatedWaitTime(queuePosition);
                    document.querySelector(".confirmation-success").classList.remove("hidden");
                    document.querySelector(".confirmation-details .detail-value.confirmation-code").textContent = confirmationNumber;

                    document.getElementById("loading-spinner").classList.add("hidden");
                    document.getElementById("booking-spinner").classList.add("hidden");
                })
                .catch((error) => {
                    console.error("Error saving appointment:", error);
                    showCustomAlert("Error saving appointment.");
                    document.getElementById("loading-spinner").classList.add("hidden");
                    document.getElementById("booking-spinner").classList.add("hidden");
                });
        })
        .catch((error) => {
            console.error("Error checking existing appointments:", error);
            showCustomAlert("Error checking booking slot availability.");
            document.getElementById("loading-spinner").classList.add("hidden");
            document.getElementById("booking-spinner").classList.add("hidden");
        });
}

function setStepIndicator(step) {
    const steps = [
        document.getElementById('step1-indicator'),
        document.getElementById('step2-indicator'),
        document.getElementById('step3-indicator'),
        document.getElementById('step4-indicator')
    ];
    steps.forEach((el, idx) => {
        el.classList.remove('active', 'completed');
        if (idx < step) {
            el.classList.add('completed');
        } else if (idx === step) {
            el.classList.add('active');
        }
    });
}


