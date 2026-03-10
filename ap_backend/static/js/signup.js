        // Navbar handled by partial script

        // Password toggle functionality
        function setupPasswordToggle(toggleId, inputId) {
            const toggle = document.getElementById(toggleId);
            const input = document.getElementById(inputId);

            toggle.addEventListener('click', () => {
                if (input.type === 'password') {
                    input.type = 'text';
                    toggle.classList.remove('fa-eye');
                    toggle.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    toggle.classList.remove('fa-eye-slash');
                    toggle.classList.add('fa-eye');
                }
            });
        }

        setupPasswordToggle('passwordToggle', 'password');
        setupPasswordToggle('confirmPasswordToggle', 'confirmPassword');

        // Form validation
        const signupForm = document.getElementById('signupForm');
        const inputs = {
            firstName: document.getElementById('firstName'),
            lastName: document.getElementById('lastName'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            userType: document.getElementById('userType'),
            password: document.getElementById('password'),
            confirmPassword: document.getElementById('confirmPassword'),
            terms: document.getElementById('terms')
        };

        const errors = {
            firstName: document.getElementById('firstNameError'),
            lastName: document.getElementById('lastNameError'),
            email: document.getElementById('emailError'),
            phone: document.getElementById('phoneError'),
            userType: document.getElementById('userTypeError'),
            password: document.getElementById('passwordError'),
            confirmPassword: document.getElementById('confirmPasswordError')
        };

        // Google signup/login
        document.querySelector('.btn-google').addEventListener('click', () => {
            const params = new URLSearchParams(window.location.search);
            const nextUrl = params.get('next') || '/';
            window.location.href = '/api/auth/google/start/?next=' + encodeURIComponent(nextUrl);
        });

        function validateEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        function validatePhone(phone) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
        }

        function checkPasswordStrength(password) {
            const strengthIndicator = document.getElementById('passwordStrength');
            let strength = 0;
            let feedback = '';

            if (password.length >= 8) strength++;
            if (/[a-z]/.test(password)) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;

            switch (strength) {
                case 0:
                case 1:
                case 2:
                    feedback = 'Weak password';
                    strengthIndicator.className = 'password-strength strength-weak';
                    break;
                case 3:
                case 4:
                    feedback = 'Medium password';
                    strengthIndicator.className = 'password-strength strength-medium';
                    break;
                case 5:
                    feedback = 'Strong password';
                    strengthIndicator.className = 'password-strength strength-strong';
                    break;
            }

            strengthIndicator.textContent = feedback;
            return strength >= 3;
        }

        function showError(input, errorElement, message) {
            input.classList.add('error');
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }

        function hideError(input, errorElement) {
            input.classList.remove('error');
            errorElement.style.display = 'none';
        }

        // Real-time validation
        inputs.password.addEventListener('input', () => {
            checkPasswordStrength(inputs.password.value);
        });

        inputs.confirmPassword.addEventListener('blur', () => {
            if (inputs.password.value !== inputs.confirmPassword.value) {
                showError(inputs.confirmPassword, errors.confirmPassword, 'Passwords do not match');
            } else {
                hideError(inputs.confirmPassword, errors.confirmPassword);
            }
        });

        inputs.email.addEventListener('blur', () => {
            if (!validateEmail(inputs.email.value)) {
                showError(inputs.email, errors.email, 'Please enter a valid email address');
            } else {
                hideError(inputs.email, errors.email);
            }
        });

        inputs.phone.addEventListener('blur', () => {
            if (!validatePhone(inputs.phone.value)) {
                showError(inputs.phone, errors.phone, 'Please enter a valid phone number');
            } else {
                hideError(inputs.phone, errors.phone);
            }
        });

        // Disable non-essential fields and enforce minimal signup (username + password)
        (function minimalSignupInit(){
            // Hide advanced fields and remove required attributes
            const keepIds = new Set(['username','password']);
            document.querySelectorAll('#signupForm input, #signupForm select').forEach(el => {
                if (!keepIds.has(el.id)) {
                    el.removeAttribute('required');
                    const group = el.closest('.form-group') || el.closest('.checkbox-group');
                    if (group) group.style.display = 'none';
                }
            });
            // Hide their error messages as well
            document.querySelectorAll('#signupForm .error-message').forEach(em => {
                if (em.id !== 'usernameError' && em.id !== 'passwordError') em.style.display = 'none';
            });
        })();

        // Form submission (username + password only)
        const usernameEl = document.getElementById('username');
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Basic validation
            let ok = true;
            if (!usernameEl.value.trim()) { showError(usernameEl, document.getElementById('usernameError'), 'Username is required'); ok = false; } else { hideError(usernameEl, document.getElementById('usernameError')); }
            if (!inputs.password.value || inputs.password.value.length < 8) { showError(inputs.password, errors.password, 'Password must be at least 8 characters'); ok = false; } else { hideError(inputs.password, errors.password); }
            if (!ok) return;

            const submitBtn = signupForm.querySelector('.btn-primary');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            submitBtn.disabled = true;

            fetch('/api/auth/signup/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameEl.value.trim(), password: inputs.password.value })
            }).then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.detail || data.username?.[0] || data.password?.[0] || 'Signup failed');
                // Store token and user (standard + backward compatibility)
                localStorage.setItem('ap_token', data.token);
                localStorage.setItem('ap_user', JSON.stringify({ id: data.id, username: data.username, email: data.email }));
                localStorage.setItem('authToken', data.token); // legacy
                localStorage.setItem('user', JSON.stringify({ id: data.id, username: data.username, email: data.email })); // legacy
                return data;
            }).then(() => {
                window.location.href = '/account/';
            }).catch((err) => {
                alert(err.message || 'Unable to sign up');
            }).finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });

        // Google signup simulation
        document.querySelector('.btn-google').addEventListener('click', () => {
            alert('Google authentication would be implemented here');
        });
