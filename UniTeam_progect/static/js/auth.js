// auth.js - Consolidated JavaScript for all auth pages

// Theme functionality
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const body = document.body;

    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark' || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme'))) {
        body.setAttribute('data-theme', 'dark');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = body.getAttribute('data-theme') === 'dark';
            body.setAttribute('data-theme', isDark ? 'light' : 'dark');
            
            // Update icon
            if (themeIcon) {
                if (isDark) {
                    themeIcon.classList.remove('fa-moon');
                    themeIcon.classList.add('fa-sun');
                } else {
                    themeIcon.classList.remove('fa-sun');
                    themeIcon.classList.add('fa-moon');
                }
            }
            
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
        });
    }
}

// Password visibility toggle
function setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll('#togglePassword');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = this.parentElement.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    });
}

// Password strength indicator
function setupPasswordStrengthIndicator() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', function() {
        const strengthBars = [
            document.getElementById('strength-bar-1'),
            document.getElementById('strength-bar-2'),
            document.getElementById('strength-bar-3'),
            document.getElementById('strength-bar-4')
        ];
        
        const strengthText = document.getElementById('password-strength-text');
        if (!strengthText) return;
        
        const password = this.value;
        let strength = 0;
        
        // Check password strength
        if (password.length > 0) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        // Update strength bars
        strengthBars.forEach((bar, index) => {
            if (bar && index < strength) {
                if (strength === 1) bar.style.backgroundColor = '#EF4444';
                else if (strength === 2 || strength === 3) bar.style.backgroundColor = '#F59E0B';
                else bar.style.backgroundColor = '#10B981';
            } else if (bar) {
                bar.style.backgroundColor = '';
            }
        });
        
        // Update strength text
        if (password.length === 0) {
            strengthText.textContent = 'Password strength';
            strengthText.className = 'text-xs text-gray-500';
        } else if (strength <= 2) {
            strengthText.textContent = 'Weak password';
            strengthText.className = 'text-xs text-red-500';
        } else if (strength <= 4) {
            strengthText.textContent = 'Medium strength';
            strengthText.className = 'text-xs text-yellow-500';
        } else {
            strengthText.textContent = 'Strong password';
            strengthText.className = 'text-xs text-green-500';
        }
    });
}

// Password confirmation check
function setupPasswordConfirmation() {
    const passwordInput = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const passwordMatchText = document.getElementById('password-match-text');
    
    if (!passwordInput || !confirmPassword || !passwordMatchText) return;
    
    confirmPassword.addEventListener('input', function() {
        if (this.value !== passwordInput.value && this.value.length > 0) {
            passwordMatchText.classList.remove('hidden');
        } else {
            passwordMatchText.classList.add('hidden');
        }
    });
}

// Role selection functionality
function setupRoleSelection() {
    const roleCards = document.querySelectorAll('.role-card');
    const selectedRoleInput = document.getElementById('selectedRole');
    const roleError = document.getElementById('role-error');
    
    if (!roleCards.length || !selectedRoleInput) return;
    
    roleCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove selected class from all cards
            roleCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            card.classList.add('selected');
            
            // Set the selected role value
            const role = card.getAttribute('data-role');
            selectedRoleInput.value = role;
            
            // Hide error message if visible
            if (roleError) {
                roleError.classList.add('hidden');
            }
        });
    });
}

// Form validation and submission
function setupFormValidation() {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    // Signup form
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Check if role is selected
            const selectedRoleInput = document.getElementById('selectedRole');
            const roleError = document.getElementById('role-error');
            
            if (selectedRoleInput && !selectedRoleInput.value) {
                if (roleError) roleError.classList.remove('hidden');
                return;
            }
            
            // Basic validation
            const passwordInput = document.getElementById('password');
            const confirmPassword = document.getElementById('confirmPassword');
            
            if (passwordInput && confirmPassword && passwordInput.value !== confirmPassword.value) {
                alert('Passwords do not match!');
                return;
            }
            
            const terms = document.getElementById('terms');
            if (terms && !terms.checked) {
                alert('You must accept the Terms of Service and Privacy Policy');
                return;
            }
            
            // Simulate successful signup
            const selectedRole = selectedRoleInput ? selectedRoleInput.value : 'user';
            alert(`Account created successfully as ${selectedRole}! Redirecting to login...`);
            this.reset();
            
            // Reset role selection
            const roleCards = document.querySelectorAll('.role-card');
            roleCards.forEach(c => c.classList.remove('selected'));
            if (selectedRoleInput) selectedRoleInput.value = '';
            
            // Reset strength indicators
            document.querySelectorAll('.password-strength').forEach(bar => {
                bar.style.backgroundColor = '';
            });
            
            const strengthText = document.getElementById('password-strength-text');
            if (strengthText) {
                strengthText.textContent = 'Password strength';
                strengthText.className = 'text-xs text-gray-500';
            }
            
            const passwordMatchText = document.getElementById('password-match-text');
            if (passwordMatchText) passwordMatchText.classList.add('hidden');
        });
    }
    
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailOrUsername = document.getElementById('emailOrUsername');
            const password = document.getElementById('password');
            const rememberMe = document.getElementById('rememberMe');
            
            if ((!emailOrUsername || !emailOrUsername.value) || (!password || !password.value)) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Simulate successful login
            alert('Login successful! Redirecting to dashboard...');
            
            // In a real application, you would send the data to your server
            console.log('Login attempt:', {
                emailOrUsername: emailOrUsername ? emailOrUsername.value : '',
                password: '***hidden***',
                rememberMe: rememberMe ? rememberMe.checked : false
            });
            
            // Reset form
            this.reset();
        });
    }
    
    // Forgot password form
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email');
            if (!email || !email.value) {
                alert('Please enter your email address.');
                return;
            }
            
            // Simulate email sending
            const sentEmailAddress = document.getElementById('sentEmailAddress');
            if (sentEmailAddress) sentEmailAddress.textContent = email.value;
            
            setTimeout(() => {
                showStep('emailSent');
            }, 800);
        });
    }
}

// Demo login functionality
function setupDemoLogin() {
    const demoLogin = document.getElementById('demoLogin');
    if (!demoLogin) return;
    
    demoLogin.addEventListener('click', () => {
        const emailOrUsername = document.getElementById('emailOrUsername');
        const password = document.getElementById('password');
        
        if (emailOrUsername) emailOrUsername.value = 'demo@projecthub.com';
        if (password) password.value = 'DemoPassword123!';
        
        // Simulate login
        setTimeout(() => {
            alert('Demo login successful! Welcome to PROJECT HUB.');
        }, 500);
    });
}

// Forgot password step functionality
function setupForgotPasswordSteps() {
    // Only run if we're on the forgot password page
    if (!document.getElementById('requestStep')) return;
    
    const steps = {
        request: document.getElementById('requestStep'),
        emailSent: document.getElementById('emailSentStep'),
        success: document.getElementById('successStep')
    };

    const stepIndicators = {
        step1: document.getElementById('step1'),
        step2: document.getElementById('step2'),
        step3: document.getElementById('step3')
    };

    window.showStep = function(step) {
        // Hide all steps
        Object.values(steps).forEach(s => s.classList.add('hidden'));
        
        // Show current step
        steps[step].classList.remove('hidden');
        steps[step].classList.add('fade-in');

        // Update step indicators
        switch(step) {
            case 'request':
                updateStepIndicator(1, 'active');
                updateStepIndicator(2, 'pending');
                updateStepIndicator(3, 'pending');
                break;
            case 'emailSent':
                updateStepIndicator(1, 'completed');
                updateStepIndicator(2, 'active');
                updateStepIndicator(3, 'pending');
                startCountdown();
                break;
            case 'success':
                updateStepIndicator(1, 'completed');
                updateStepIndicator(2, 'completed');
                updateStepIndicator(3, 'active');
                break;
        }
    }

    function updateStepIndicator(stepNum, state) {
        const step = stepIndicators[`step${stepNum}`];
        if (!step) return;
        
        step.className = `step-indicator step-${state} w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold`;
        
        if (state === 'completed') {
            step.innerHTML = '<i class="fas fa-check text-xs"></i>';
        } else {
            step.textContent = stepNum;
        }
    }

    // Countdown timer
    let countdownTimer;
    function startCountdown() {
        let seconds = 60;
        const countdownElement = document.getElementById('countdown');
        const resendButton = document.getElementById('resendEmail');
        
        if (!countdownElement || !resendButton) return;
        
        resendButton.disabled = true;
        resendButton.classList.add('opacity-50', 'cursor-not-allowed');
        
        countdownTimer = setInterval(() => {
            seconds--;
            countdownElement.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(countdownTimer);
                resendButton.disabled = false;
                resendButton.classList.remove('opacity-50', 'cursor-not-allowed');
                countdownElement.parentElement.innerHTML = '<span class="text-green-600">You can now resend the email</span>';
            }
        }, 1000);
    }

    // Button event listeners for forgot password
    const backToLogin = document.getElementById('backToLogin');
    const resendEmail = document.getElementById('resendEmail');
    const openEmail = document.getElementById('openEmail');
    const loginNow = document.getElementById('loginNow');
    
    if (backToLogin) {
        backToLogin.addEventListener('click', () => {
            window.location.href = 'login.html'; // Update with your actual login page URL
        });
    }
    
    if (resendEmail) {
        resendEmail.addEventListener('click', function() {
            if (!this.disabled) {
                alert('Reset email resent successfully!');
                startCountdown();
            }
        });
    }
    
    if (openEmail) {
        openEmail.addEventListener('click', () => {
            // Simulate opening email client
            setTimeout(() => {
                showStep('success');
            }, 2000);
        });
    }
    
    if (loginNow) {
        loginNow.addEventListener('click', () => {
            window.location.href = 'login.html'; // Update with your actual login page URL
        });
    }
}

// Input animations
function setupInputAnimations() {
    const inputs = document.querySelectorAll('.input-field');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.style.transform = 'scale(1)';
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    setupPasswordToggles();
    setupPasswordStrengthIndicator();
    setupPasswordConfirmation();
    setupRoleSelection();
    setupFormValidation();
    setupDemoLogin();
    setupForgotPasswordSteps();
    setupInputAnimations();
    
    // Keyboard navigation enhancement
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            const demoLogin = document.getElementById('demoLogin');
            if (demoLogin) demoLogin.click();
        }
    });
});