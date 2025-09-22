document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const themeToggle = document.getElementById('themeToggle');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const desktopSidebarToggle = document.getElementById('desktopSidebarToggle');
    const profileButton = document.getElementById('profileButton');
    const profileDropdown = document.getElementById('profileDropdown');
    
    let isSidebarCollapsed = window.innerWidth < 1024;
    
    // Set initial sidebar state
    function setInitialSidebarState() {
        if (window.innerWidth < 768) {
            // Mobile - sidebar is hidden by default
            sidebar.classList.remove('collapsed');
            sidebar.classList.remove('mobile-expanded');
            mainContent.classList.remove('sidebar-collapsed');
            mobileOverlay.classList.remove('active');
        } else if (window.innerWidth < 1024) {
            // Tablet - sidebar is collapsed by default
            sidebar.classList.add('collapsed');
            mainContent.classList.add('sidebar-collapsed');
            isSidebarCollapsed = true;
        } else {
            // Desktop - sidebar is expanded by default
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('sidebar-collapsed');
            isSidebarCollapsed = false;
        }
    }
    
    // Toggle sidebar on desktop/tablet
    function toggleSidebar() {
        isSidebarCollapsed = !isSidebarCollapsed;
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
        
        // Save state to localStorage
        localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
    }
    
    // Toggle sidebar on mobile
    function toggleMobileSidebar() {
        sidebar.classList.toggle('mobile-expanded');
        mobileOverlay.classList.toggle('active');
    }
    
    // Toggle profile dropdown
    function toggleProfileDropdown() {
        profileDropdown.classList.toggle('show');
    }
    
    // Set up event listeners
    desktopSidebarToggle.addEventListener('click', toggleSidebar);
    sidebarToggle.addEventListener('click', toggleMobileSidebar);
    mobileMenuButton.addEventListener('click', toggleMobileSidebar);
    mobileOverlay.addEventListener('click', toggleMobileSidebar);
    profileButton.addEventListener('click', toggleProfileDropdown);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!profileButton.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove('show');
        }
    });
    
    // Close mobile sidebar when a sidebar item is clicked
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth < 768) {
                toggleMobileSidebar();
            }
        });
    });
    
    // Theme toggle functionality
    if (localStorage.getItem('theme') === 'dark' || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme'))) {
        document.body.classList.add('dark');
        themeToggle.classList.add('dark');
    }
    
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark');
        themeToggle.classList.toggle('dark');
        
        if (document.body.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
    
    // Check for saved sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null && window.innerWidth >= 768) {
        isSidebarCollapsed = savedSidebarState === 'true';
        if (isSidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('sidebar-collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('sidebar-collapsed');
        }
    }
    
    // Initialize sidebar state
    setInitialSidebarState();
    
    // Update on window resize
    window.addEventListener('resize', function() {
        setInitialSidebarState();
    });
});