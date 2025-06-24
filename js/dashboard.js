// Firebase Initialization
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
const auth = firebase.auth();
const db = firebase.firestore();

// Get logged-in user data and display in sidebar and header
auth.onAuthStateChanged(user => {
    if (user) {
        const userId = user.uid;
        db.collection('users').doc(userId).get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                const professorName = `${userData.firstName} ${userData.lastName}`;
                const department = userData.department || 'Unknown Department';
                const currentStatus = userData.status || 'Not Set';

                // Set name and department in sidebar
                document.querySelector('.professor-details h3').textContent = professorName;
                document.querySelector('.professor-details p').textContent = department;

                // Optionally set status display if you added the element in HTML
                const currentStatusEl = document.querySelector('.current-status');
                if (currentStatusEl) {
                    currentStatusEl.textContent = `Current Status: ${currentStatus}`;
                }

                // Set initials in avatar (sidebar and header)
                const initials = userData.firstName.charAt(0).toUpperCase() + userData.lastName.charAt(0).toUpperCase();
                document.querySelectorAll('.professor-avatar, .user-avatar').forEach(el => {
                    el.textContent = initials;
                });

                loadAppointments(userId);        // Load appointments table
                updateDashboardCards(userId);   // Update dashboard cards
            } else {
                console.error('User data not found in Firestore');
            }
        }).catch(error => {
            console.error('Error getting user data:', error);
        });
    } else {
        // User not logged in
        window.location.href = "index.html"; // Redirect to login
    }
});

// Load Appointments from Firestore subcollection
function loadAppointments(professorId) {
    const tableBody = document.querySelector('.appointments-table tbody');
    tableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

    db.collection('users')
        .doc(professorId)
        .collection('appointments')
        .get()
        .then(snapshot => {
            tableBody.innerHTML = ''; // Clear loading row
            if (snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="5">No appointments found.</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const row = `
                  <tr>
                      <td>
                          <div class="student-info">
                              <div class="student-avatar">${getInitials(data.studentName)}</div>
                              <div>
                                  <div class="student-name">${data.studentName}</div>
                                  <div class="student-id">ID: ${data.studentId}</div>
                              </div>
                          </div>
                      </td>
                      <td>
                          <div class="appointment-time">${data.time}</div>
                          <div class="appointment-date">${data.date}</div>
                      </td>
                      <td>
                          <span class="appointment-purpose">${data.purpose}</span>
                      </td>
                      <td>
                          <span class="status-badge status-${data.status.toLowerCase()}">${data.status}</span>
                      </td>
                      <td>
                          <button class="action-btn"><i class="fas fa-check"></i></button>
                          <button class="action-btn"><i class="fas fa-times"></i></button>
                          <button class="action-btn"><i class="fas fa-comment"></i></button>
                      </td>
                  </tr>
              `;
                tableBody.innerHTML += row;
            });

            // Reattach action buttons
            attachActionButtons();
        })
        .catch(error => {
            console.error('Error loading appointments:', error);
            tableBody.innerHTML = '<tr><td colspan="5">Failed to load appointments.</td></tr>';
        });
}

// Update dashboard cards dynamically (Upcoming, Today's Appointments)
function updateDashboardCards(professorId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Midnight today

    db.collection('users')
        .doc(professorId)
        .collection('appointments')
        .get()
        .then(snapshot => {
            let upcomingCount = 0;
            let todayCount = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                const [year, month, day] = data.date.split('-'); // Assuming 'YYYY-MM-DD'
                const apptDate = new Date(year, month - 1, day);

                if (apptDate >= today) {
                    upcomingCount++;
                }

                if (apptDate.toDateString() === today.toDateString()) {
                    todayCount++;
                }
            });

            // Update HTML card values
            document.querySelector('.card:nth-child(1) .card-value').textContent = upcomingCount; // Upcoming
            document.querySelector('.card:nth-child(3) .card-value').textContent = todayCount;    // Today's
        });

    // Optional: For Pending Requests (if stored this way)
    db.collection('users')
        .doc(professorId)
        .collection('appointments')
        .where('status', '==', 'Pending')
        .get()
        .then(snapshot => {
            const pendingCount = snapshot.size;
            document.querySelector('.card:nth-child(2) .card-value').textContent = pendingCount; // Pending
        });
}

// Helper functions
function getInitials(name) {
    return name.split(' ').map(n => n.charAt(0).toUpperCase()).join('');
}

function attachActionButtons() {
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const statusCell = row.querySelector('.status-badge');

            if (this.querySelector('.fa-check')) {
                statusCell.textContent = 'Completed';
                statusCell.className = 'status-badge status-completed';
            } else if (this.querySelector('.fa-times')) {
                statusCell.textContent = 'Canceled';
                statusCell.className = 'status-badge status-canceled';
            }
        });
    });
}

// Update Professor Status (Availability)
function updateProfessorStatus(status) {
    const user = auth.currentUser;
    if (user) {
        const userId = user.uid;
        db.collection('users').doc(userId).update({
            status: status
        }).then(() => {
            console.log('Status updated to:', status);
        }).catch(error => {
            console.error('Error updating status:', error);
        });
    }
}

// Status selection functionality
const statusButtons = document.querySelectorAll('.status-btn');
statusButtons.forEach(button => {
    button.addEventListener('click', () => {
        statusButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const selectedStatus = button.textContent.trim();
        updateProfessorStatus(selectedStatus);
    });
});

// Save status message functionality
document.querySelector('.save-status').addEventListener('click', function () {
    const statusBtn = document.querySelector('.status-btn.active');
    const statusText = statusBtn.textContent;
    const originalText = this.textContent;
    const statusMessage = document.querySelector('.status-message textarea').value;
    const statusDisplay = document.querySelector('.professor-details p');

    this.textContent = '✓ Saved!';
    this.style.background = '#4BB543';

    setTimeout(() => {
        this.textContent = originalText;
        this.style.background = '';
    }, 2000);

    if (statusMessage) {
        statusDisplay.textContent = `Status: ${statusText} - ${statusMessage}`;
    } else {
        statusDisplay.textContent = `Status: ${statusText}`;
    }
});

// Notification badge reset
document.querySelector('.notification').addEventListener('click', function () {
    this.querySelector('.notification-badge').style.display = 'none';
});
