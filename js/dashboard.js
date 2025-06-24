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

auth.onAuthStateChanged(user => {
    if (user) {
        const userId = user.uid;
        db.collection('users').doc(userId).get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                const professorName = `${userData.firstName} ${userData.lastName}`;
                const department = userData.department || '';
                const currentStatus = userData.status || 'Not Set';

                document.querySelector('.professor-details h3').textContent = professorName;
                document.querySelector('.professor-details p').textContent = department;

                const currentStatusEl = document.querySelector('.current-status');
                if (currentStatusEl) {
                    currentStatusEl.textContent = `Current Status: ${currentStatus}`;
                }

                const initials = userData.firstName.charAt(0).toUpperCase() + userData.lastName.charAt(0).toUpperCase();
                const avatarElements = document.querySelectorAll('.professor-avatar, .user-avatar');
                avatarElements.forEach(el => {
                    el.innerHTML = '';

                    let imageSrc = '';

                    if (userData.photoURL) {
                        if (userData.photoURL.startsWith('data:image')) {
                            imageSrc = userData.photoURL;
                        } else {
                            imageSrc = `data:image/png;base64,${userData.photoURL}`;
                        }

                        const img = document.createElement('img');
                        img.src = imageSrc;
                        img.alt = "Avatar";
                        img.classList.add('avatar-img');
                        el.appendChild(img);
                    } else {
                        el.textContent = initials;
                    }
                });
                loadFinishedAppointments(userId);
                loadAppointments(userId);
                updateDashboardCards(userId);


            } else {
                console.error('User data not found in Firestore');
            }
        }).catch(error => {
            console.error('Error getting user data:', error);
        });
    } else {
        window.location.href = "index.html";
    }
});


let finishedPageSize = 10;
let finishedCurrentPage = 1;
let finishedLastVisible = null;
let finishedFirstVisible = null;
let finishedPageStack = [];

function loadFinishedAppointments(professorId, direction = 'next') {
    const finishedBody = document.querySelector('.finished-appointments-body');
    const pageNumberEl = document.querySelector('.page-number');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    let query = db.collection('users')
        .doc(professorId)
        .collection('finishedAppointments')
        .orderBy('date', 'desc')
        .limit(finishedPageSize);

    if (direction === 'next' && finishedLastVisible) {
        query = query.startAfter(finishedLastVisible);
    } else if (direction === 'prev' && finishedPageStack.length > 1) {
    
        finishedPageStack.pop();
        const prevStartAt = finishedPageStack[finishedPageStack.length - 1];
        query = query.startAt(prevStartAt);
        finishedCurrentPage--;
    } else if (direction === 'prev') {
        return;
    }

    query.get().then(snapshot => {
        finishedBody.innerHTML = '';
        if (snapshot.empty) {
            finishedBody.innerHTML = '<tr><td colspan="4">No finished appointments found.</td></tr>';
            nextBtn.disabled = true;
            return;
        }
        finishedFirstVisible = snapshot.docs[0];
        finishedLastVisible = snapshot.docs[snapshot.docs.length - 1];

        if (direction === 'next') {
            finishedPageStack.push(finishedFirstVisible);
            finishedCurrentPage++;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const row = `
                <tr>
                    <td>
                        <div class="student-info">
                            <div class="student-avatar">${getInitials(data.studentName || 'N/A')}</div>
                            <div>
                                <div class="student-name">${data.studentName || 'Unknown Student'}</div>
                                <div class="student-id">ID: ${data.studentID || 'N/A'}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="appointment-time">${data.time || '-'}</div>
                        <div class="appointment-date">${data.date || '-'}</div>
                    </td>
                    <td>${data.purpose || '-'}</td>
                    <td>${data.confirmationNumber || 'N/A'}</td>
                </tr>
            `;
            finishedBody.innerHTML += row;
        });

        pageNumberEl.textContent = `Page ${finishedCurrentPage}`;
        prevBtn.disabled = finishedPageStack.length <= 1;
        nextBtn.disabled = snapshot.size < finishedPageSize;
    }).catch(error => {
        console.error('Error loading finished appointments:', error);
        finishedBody.innerHTML = '<tr><td colspan="4">Error loading data.</td></tr>';
    });
}

function loadAppointments(professorId) {
    const tableBody = document.querySelector('.appointments-table tbody');
    tableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

    db.collection('users').doc(professorId).collection('appointments')
        .get()
        .then(snapshot => {
            tableBody.innerHTML = '';
            if (snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="5">No appointments found.</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();

                const studentName = data.studentName || 'Unknown Student';
                const studentId = data.studentID || 'N/A';
                const time = data.time || 'Not set';
                const date = data.date || 'Not set';
                const purpose = data.purpose || 'No purpose';
                const confirmation = data.confirmationNumber || 'N/A';

                const row = `
                    <tr>
                        <td>
                            <div class="student-info">
                                <div class="student-avatar">${getInitials(studentName)}</div>
                                <div>
                                    <div class="student-name">${studentName}</div>
                                    <div class="student-id">ID: ${studentId}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="appointment-time">${time}</div>
                            <div class="appointment-date">${date}</div>
                        </td>
                        <td>
                            <span class="appointment-purpose">${purpose}</span>
                        </td>
                        <td>
                            <span class="confirmation-number">${confirmation}</span>
                        </td>
                        <td>
                            <button class="action-btn done-btn" data-id="${doc.id}">Done</button>
                            <button class="action-btn reject-btn" data-id="${doc.id}">Reject</button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });

            attachActionButtons();
        })
        .catch(error => {
            console.error('Error loading appointments:', error);
            tableBody.innerHTML = '<tr><td colspan="5">Failed to load appointments.</td></tr>';
        });
}
document.querySelector('.appointments-link').addEventListener('click', () => {
    document.querySelector('.appointments-table').style.display = 'block';
    document.querySelector('.finished-appointments-table').style.display = 'none';
});

document.querySelector('.finished-appointments-link').addEventListener('click', () => {
    document.querySelector('.appointments-table').style.display = 'none';
    document.querySelector('.finished-appointments-table').style.display = 'block';

    finishedPageStack = [];
    finishedCurrentPage = 0;
    finishedLastVisible = null;

    const professorId = auth.currentUser.uid;
    loadFinishedAppointments(professorId);
});

document.querySelector('.next-btn').addEventListener('click', () => {
    const professorId = auth.currentUser.uid;
    loadFinishedAppointments(professorId, 'next');
});

document.querySelector('.prev-btn').addEventListener('click', () => {
    const professorId = auth.currentUser.uid;
    loadFinishedAppointments(professorId, 'prev');
});

function updateDashboardCards(professorId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    db.collection('users')
        .doc(professorId)
        .collection('appointments')
        .get()
        .then(snapshot => {
            let upcomingCount = 0;
            let todayCount = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                const [year, month, day] = data.date.split('-');
                const apptDate = new Date(year, month - 1, day);

                if (apptDate >= today) {
                    upcomingCount++;
                }

                if (apptDate.toDateString() === today.toDateString()) {
                    todayCount++;
                }
            });
            document.querySelector('.card:nth-child(1) .card-value').textContent = upcomingCount; // Upcoming
            document.querySelector('.card:nth-child(3) .card-value').textContent = todayCount;    // Today's
        });

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

function getInitials(name) {
    return name.split(' ').map(n => n.charAt(0).toUpperCase()).join('');
}

function attachActionButtons() {
    const userId = auth.currentUser.uid;

    document.querySelectorAll('.done-btn').forEach(button => {
        button.addEventListener('click', () => {
            const docId = button.getAttribute('data-id');

            db.collection('users').doc(userId).collection('appointments').doc(docId).get()
                .then(docSnap => {
                    if (docSnap.exists) {
                        const data = docSnap.data();
                        db.collection('users').doc(userId).collection('finishedAppointments').add(data)
                            .then(() => {
                                return db.collection('users').doc(userId).collection('appointments').doc(docId).delete();
                            })
                            .then(() => {
                                button.closest('tr').remove();
                                console.log('Appointment moved to finished and deleted from active.');
                            })
                            .catch(error => console.error('Error finishing appointment:', error));
                    }
                });
        });
    });

    document.querySelectorAll('.reject-btn').forEach(button => {
        button.addEventListener('click', () => {
            const docId = button.getAttribute('data-id');

            db.collection('users').doc(userId).collection('appointments').doc(docId).delete()
                .then(() => {
                    button.closest('tr').remove();
                    console.log('Appointment rejected and deleted.');
                })
                .catch(error => console.error('Error rejecting appointment:', error));
        });
    });
}

function updateProfessorStatus(status, message) {
    const user = auth.currentUser;
    if (user) {
        const userId = user.uid;
        db.collection('users').doc(userId).update({
            status: status,
            statusMessage: message
        }).then(() => {
            console.log('Status updated to:', status, message);
        }).catch(error => {
            console.error('Error updating status:', error);
        });
    }
}

const statusButtons = document.querySelectorAll('.status-btn');
statusButtons.forEach(button => {
    button.addEventListener('click', () => {
        statusButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const selectedStatus = button.textContent.trim();
        updateProfessorStatus(selectedStatus);
    });
});

document.querySelector('.save-status').addEventListener('click', function () {
    const statusBtn = document.querySelector('.status-btn.active');
    const statusText = statusBtn ? statusBtn.textContent.trim() : 'Unavailable';
    const statusMessage = document.querySelector('.status-message textarea').value.trim();
    const originalText = this.textContent;
    const statusDisplay = document.querySelector('.professor-details p');

    updateProfessorStatus(statusText, statusMessage);
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

document.querySelector('.logout-link').addEventListener('click', (e) => {
    e.preventDefault();

    const confirmed = confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    auth.signOut()
        .then(() => {
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error('Logout failed:', error);
            alert("Logout failed. Try again.");
        });
});

document.querySelector('.notification').addEventListener('click', function () {
    this.querySelector('.notification-badge').style.display = 'none';
});
