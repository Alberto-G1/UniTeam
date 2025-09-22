// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const themeIcon = themeToggle.querySelector('i');

function updateThemeIcon(isDark) {
    themeIcon.classList.toggle('fa-sun', !isDark);
    themeIcon.classList.toggle('fa-moon', isDark);
}

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme === 'dark');
}

themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme === 'dark');
});

// Sidebar toggle functionality
const leftSidebar = document.getElementById('leftSidebar');
const rightSidebar = document.getElementById('rightSidebar');
const mainContent = document.getElementById('mainContent');
const leftToggle = document.getElementById('leftSidebarToggle');
const rightToggle = document.getElementById('rightSidebarToggle');
const rightClose = document.getElementById('rightSidebarClose');
const mobileOverlay = document.getElementById('mobileOverlay');

let leftSidebarCollapsed = true;
let rightSidebarOpen = false;

function updateMainContentMargin() {
    if (window.innerWidth <= 640) {
        // On very small screens, sidebar overlays content
        mainContent.style.marginLeft = leftSidebarCollapsed ? '0' : '16rem';
    } else if (window.innerWidth <= 768) {
        // On tablets
        mainContent.style.marginLeft = leftSidebarCollapsed ? '4rem' : '16rem';
    } else {
        // On desktop
        const leftMargin = leftSidebarCollapsed ? '4rem' : '16rem';
        mainContent.style.marginLeft = leftMargin;
    }
    
    // Handle right sidebar margin
    if (window.innerWidth >= 768 && rightSidebarOpen) {
        mainContent.style.marginRight = '20rem';
    } else {
        mainContent.style.marginRight = '0';
    }
}

function toggleLeftSidebar() {
    leftSidebarCollapsed = !leftSidebarCollapsed;
    leftSidebar.classList.toggle('sidebar-collapsed', leftSidebarCollapsed);
    leftSidebar.classList.toggle('sidebar-expanded', !leftSidebarCollapsed);
    
    updateMainContentMargin();
}

leftToggle.addEventListener('click', toggleLeftSidebar);

// Close sidebar when clicking on overlay (mobile)
mobileOverlay.addEventListener('click', () => {
    if (!leftSidebarCollapsed && window.innerWidth <= 768) {
        toggleLeftSidebar();
    }
});

rightToggle.addEventListener('click', () => {
    rightSidebarOpen = !rightSidebarOpen;
    rightSidebar.classList.toggle('right-sidebar-collapsed', !rightSidebarOpen);
    rightSidebar.classList.toggle('right-sidebar-expanded', rightSidebarOpen);
    updateMainContentMargin();
});

rightClose.addEventListener('click', () => {
    rightSidebarOpen = false;
    rightSidebar.classList.add('right-sidebar-collapsed');
    rightSidebar.classList.remove('right-sidebar-expanded');
    updateMainContentMargin();
});

// Handle window resize
window.addEventListener('resize', () => {
    updateMainContentMargin();
    
    // Auto-close right sidebar on small screens
    if (window.innerWidth < 768 && rightSidebarOpen) {
        rightSidebarOpen = false;
        rightSidebar.classList.add('right-sidebar-collapsed');
        rightSidebar.classList.remove('right-sidebar-expanded');
    }
    
    // Auto-collapse left sidebar on very small screens
    if (window.innerWidth <= 640 && !leftSidebarCollapsed) {
        leftSidebarCollapsed = true;
        leftSidebar.classList.add('sidebar-collapsed');
        leftSidebar.classList.remove('sidebar-expanded');
    }
    
    updateMainContentMargin();
});

// Navigation active state
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            // Auto-close sidebar on mobile after clicking a link
            leftSidebarCollapsed = true;
            leftSidebar.classList.add('sidebar-collapsed');
            leftSidebar.classList.remove('sidebar-expanded');
            updateMainContentMargin();
        }
        
        navItems.forEach(nav => nav.classList.remove('active'));
        e.currentTarget.classList.add('active');
    });
});

// Close right sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth < 768 && rightSidebarOpen) {
        if (!rightSidebar.contains(e.target) && !rightToggle.contains(e.target)) {
            rightSidebarOpen = false;
            rightSidebar.classList.add('right-sidebar-collapsed');
            rightSidebar.classList.remove('right-sidebar-expanded');
            updateMainContentMargin();
        }
    }
});

// Initialize on page load
updateMainContentMargin();

// Profile dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    const profileDropdown = document.querySelector('.profile-dropdown');
    const profileButton = document.querySelector('.profile-button');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    // Toggle dropdown on button click
    profileButton.addEventListener('click', function(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('open');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('open');
        }
    });
    
    // Close dropdown when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            profileDropdown.classList.remove('open');
        }
    });
    
    // Prevent dropdown from closing when clicking inside it
    dropdownMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});