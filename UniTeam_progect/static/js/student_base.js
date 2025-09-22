        // Mobile menu functionality
        document.addEventListener('DOMContentLoaded', function() {
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
            const hamburgerIcon = document.getElementById('hamburger-icon');
            const closeIcon = document.getElementById('close-icon');
            
            if (mobileMenuButton && mobileMenu && mobileMenuOverlay) {
                function toggleMenu() {
                    mobileMenu.classList.toggle('open');
                    mobileMenuOverlay.classList.toggle('hidden');
                    hamburgerIcon.classList.toggle('hidden');
                    closeIcon.classList.toggle('hidden');
                    document.body.classList.toggle('overflow-hidden');
                }
                
                mobileMenuButton.addEventListener('click', toggleMenu);
                mobileMenuOverlay.addEventListener('click', toggleMenu);
                
                // Close menu when clicking on links
                if (mobileMenu) {
                    const menuLinks = mobileMenu.querySelectorAll('a');
                    menuLinks.forEach(link => {
                        link.addEventListener('click', toggleMenu);
                    });
                }
            }

            // Profile dropdown functionality
            const profileButton = document.getElementById('profileButton');
            const profileDropdown = document.getElementById('profileDropdown');
            const profileArrow = document.getElementById('profileArrow');
            
            if (profileButton && profileDropdown) {
                profileButton.addEventListener('click', function(e) {
                    e.stopPropagation();
                    profileDropdown.classList.toggle('show');
                    profileArrow.classList.toggle('rotate-180');
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', function(e) {
                    if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
                        profileDropdown.classList.remove('show');
                        profileArrow.classList.remove('rotate-180');
                    }
                });
            }

            // Theme toggle functionality
            const themeToggle = document.getElementById('themeToggle');
            
            // Check for saved theme preference or respect OS preference
            if (localStorage.getItem('theme') === 'dark' || 
                (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme'))) {
                document.body.classList.add('dark');
                themeToggle.classList.add('dark');
            }
            
            if (themeToggle) {
                themeToggle.addEventListener('click', function() {
                    document.body.classList.toggle('dark');
                    themeToggle.classList.toggle('dark');
                    
                    // Save the theme preference
                    if (document.body.classList.contains('dark')) {
                        localStorage.setItem('theme', 'dark');
                    } else {
                        localStorage.setItem('theme', 'light');
                    }
                });
            }

            // Add rotate-180 utility class if not exists
            if (!document.querySelector('style').innerText.includes('.rotate-180')) {
                const style = document.createElement('style');
                style.textContent = '.rotate-180 { transform: rotate(180deg); }';
                document.head.appendChild(style);
            }
        });