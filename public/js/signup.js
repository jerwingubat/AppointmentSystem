const passwordInput = document.getElementById('password');
const strengthMeter = document.getElementById('strength-meter');

passwordInput.addEventListener('input', function() {
    const password = this.value;
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
    if (password.match(/\d/)) strength += 1;
    if (password.match(/[^a-zA-Z\d]/)) strength += 1;
    
    const width = strength * 25;
    strengthMeter.style.width = width + '%';
    
    if (strength < 2) {
        strengthMeter.style.backgroundColor = 'var(--danger)';
    } else if (strength < 4) {
        strengthMeter.style.backgroundColor = '#ffbe0b';
    } else {
        strengthMeter.style.backgroundColor = 'var(--primary)';
    }
});