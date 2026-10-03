/* ==========================================================================
   RoutineCraft - Personal Daily Task & Habit Tracker Logic
   Complete Logic Engine: Local Timezone, Accurate Recurrence & Streak,
   Real Analytics, Instant Quick-Add, Overdue Handling & Responsive UX
   ========================================================================== */

(function () {
    'use strict';

    const APP_VERSION = 24;
    const APP_RELEASE_VERSION = '2.3.0';
    const DEFAULT_GITHUB_REPO = 'shinchan2222/TODO_LIST-APP';

    // --- ACCURATE LOCAL DATE HELPERS (TIMEZONE AWARE) ---
    const formatLocalDate = (d = new Date()) => {
        const date = (d instanceof Date) ? d : new Date(d);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getTodayStr = () => formatLocalDate(new Date());

    const getPastDateStr = (daysAgo = 1) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return formatLocalDate(d);
    };

    const getFutureDateStr = (daysAhead = 1) => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        return formatLocalDate(d);
    };

    // --- RECURRENCE & DATE COMPARISON RULES ---
    function isDayApplicableForRecurrence(recurring, dateObj = new Date()) {
        if (!recurring || recurring === 'none') return false;
        if (recurring === 'daily') return true;
        const day = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
        const isWeekend = (day === 0 || day === 6);
        if (recurring === 'weekdays') return !isWeekend;
        if (recurring === 'weekends') return isWeekend;
        // Weekly: repeat on the same weekday as the task's dueDate
        if (recurring === 'weekly') return true; // handled via dueDate weekday in isTaskToday
        return false;
    }

    function isTaskToday(task) {
        const today = getTodayStr();
        if (task.recurring && task.recurring !== 'none') {
            if (task.dueDate && task.dueDate > today) return false; // future recurring
            if (task.recurring === 'weekly') {
                // Same day of week as original dueDate
                if (!task.dueDate) return false;
                const origDay = new Date(task.dueDate + 'T00:00:00').getDay();
                return new Date().getDay() === origDay;
            }
            return isDayApplicableForRecurrence(task.recurring, new Date());
        }
        return task.dueDate === today;
    }

    function isTaskOverdue(task) {
        if (task.completed) return false;
        if (task.recurring && task.recurring !== 'none') return false; // recurring tasks reset daily
        const today = getTodayStr();
        return Boolean(task.dueDate && task.dueDate < today);
    }

    function isTaskUpcoming(task) {
        if (task.completed) return false;
        const today = getTodayStr();
        return Boolean(task.dueDate && task.dueDate > today);
    }

    // --- DEFAULT STARTER DATA ---
    const DEFAULT_PROFILE = {
        email: 'default_user@routinecraft.app',
        name: 'Productivity Hero',
        avatar: '🚀',
        theme: 'light',
        streak: 1,
        lastActiveDate: getTodayStr(),
        lastCompletedDate: getTodayStr(),
        totalCompletedCount: 3,
        notificationsEnabled: false,
        lastBackupTime: null,
        backupFrequency: 'daily',
        isGoogleSynced: false,
        showCategoryFilters: true,
        showQuickAddBar: true
    };

    const DEFAULT_TASKS = [
        {
            id: 'task-1',
            title: 'Gym workout & stretch',
            category: 'health',
            priority: 'high',
            dueDate: getTodayStr(),
            dueTime: '08:00',
            recurring: 'daily',
            completed: true,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            subtasks: [
                { id: 'sub-1', title: 'Cardio warmup (10m)', completed: true },
                { id: 'sub-2', title: 'Strength sets', completed: true }
            ]
        },
        {
            id: 'task-2',
            title: 'Daily goals review',
            category: 'work',
            priority: 'high',
            dueDate: getTodayStr(),
            dueTime: '10:00',
            recurring: 'weekdays',
            completed: true,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-3',
            title: 'Drink 2.5L water',
            category: 'health',
            priority: 'medium',
            dueDate: getTodayStr(),
            dueTime: '12:00',
            recurring: 'daily',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-4',
            title: 'Team sync & project status',
            category: 'work',
            priority: 'high',
            dueDate: getTodayStr(),
            dueTime: '15:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-5',
            title: 'Read 15 pages',
            category: 'personal',
            priority: 'medium',
            dueDate: getTodayStr(),
            dueTime: '20:30',
            recurring: 'daily',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        // Tomorrow Starter Task
        {
            id: 'task-tomorrow-1',
            title: 'Weekly planning session',
            category: 'work',
            priority: 'medium',
            dueDate: getFutureDateStr(1),
            dueTime: '11:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        }
    ];

    // --- MULTI-USER STORAGE & STATE INITIALIZATION ---
    let usersStore = {};
    try {
        usersStore = JSON.parse(localStorage.getItem('routinecraft_users')) || {};
    } catch (e) {
        usersStore = {};
    }

    let activeEmail = localStorage.getItem('routinecraft_active_email') || 'default_user@routinecraft.app';
    const savedVersion = parseInt(localStorage.getItem('routinecraft_version') || '0', 10);

    if (savedVersion < APP_VERSION || !usersStore[activeEmail]) {
        usersStore[activeEmail] = {
            profile: { ...DEFAULT_PROFILE },
            tasks: [...DEFAULT_TASKS],
            history: {
                [getTodayStr()]: 2,
                [getPastDateStr(1)]: 3,
                [getPastDateStr(2)]: 4,
                [getPastDateStr(3)]: 2
            }
        };
        localStorage.setItem('routinecraft_users', JSON.stringify(usersStore));
        localStorage.setItem('routinecraft_active_email', activeEmail);
        localStorage.setItem('routinecraft_version', APP_VERSION.toString());
    }

    let state = {
        profile: usersStore[activeEmail].profile,
        tasks: usersStore[activeEmail].tasks,
        history: usersStore[activeEmail].history || {},
        customCategories: usersStore[activeEmail].customCategories || {},
        activeCategory: 'all',
        activeFilter: 'today',
        searchQuery: '',
        sortBy: 'default',
        tempSubtasks: [],
        lastDeletedTask: null,
        pendingGoogleUser: null
    };

    // Ensure theme is only light or dark
    if (state.profile.theme !== 'light' && state.profile.theme !== 'dark') {
        state.profile.theme = (state.profile.theme === 'dark-glass' || state.profile.theme === 'neon-cyber') ? 'dark' : 'light';
    }

    // Migrate: ensure new interface prefs exist for existing users
    if (state.profile.showCategoryFilters === undefined) state.profile.showCategoryFilters = true;
    if (state.profile.showQuickAddBar === undefined) state.profile.showQuickAddBar = true;
    if (state.profile.dailyDigestEnabled === undefined) state.profile.dailyDigestEnabled = false;
    if (!state.profile.dailyDigestTime) state.profile.dailyDigestTime = '08:00';
    if (!state.customCategories) state.customCategories = {};

    // Ensure all tasks have proper dueDates
    state.tasks.forEach(t => {
        if (!t.dueDate) t.dueDate = getTodayStr();
    });

    // --- CATEGORY CONFIGURATION ---
    const DEFAULT_CATEGORIES = {
        morning: { label: 'Morning', icon: 'fa-sun', color: '#fbbf24' },
        work: { label: 'Work', icon: 'fa-briefcase', color: '#60a5fa' },
        health: { label: 'Health', icon: 'fa-heart-pulse', color: '#34d399' },
        personal: { label: 'Personal', icon: 'fa-user', color: '#a78bfa' },
        evening: { label: 'Evening', icon: 'fa-moon', color: '#f472b6' }
    };

    function getAllCategories() {
        return { ...DEFAULT_CATEGORIES, ...(state.customCategories || {}) };
    }

    const CATEGORIES = new Proxy({}, {
        get: (target, prop) => getAllCategories()[prop]
    });

    let draggedTaskId = null;

    // --- DOM REFERENCES ---
    const dom = {
        body: document.body,
        userNameDisplay: document.getElementById('user-name-display'),
        userAvatar: document.getElementById('user-avatar'),
        timeGreeting: document.getElementById('time-greeting'),
        streakCount: document.getElementById('streak-count'),
        streakBtn: document.getElementById('streak-btn'),
        notifyBtn: document.getElementById('notify-btn'),
        quickThemeBtn: document.getElementById('quick-theme-btn'),
        headerGoogleLoginBtn: document.getElementById('header-google-login-btn'),
        googleBtnText: document.getElementById('google-btn-text'),

        // Multi-User Account Bar
        accountStatusBar: document.getElementById('account-status-bar'),
        accountEmailDisplay: document.getElementById('account-email-display'),
        accountFreqBadge: document.getElementById('account-freq-badge'),
        switchAccountBtn: document.getElementById('switch-account-btn'),

        // Google Permission Modal
        gdrivePermissionModal: document.getElementById('gdrive-permission-modal'),
        closeGdrivePermModalBtn: document.getElementById('close-gdrive-perm-modal'),
        guserNameDisplay: document.getElementById('guser-name-display'),
        guserEmailDisplay: document.getElementById('guser-email-display'),
        guserAvatarDisplay: document.getElementById('guser-avatar-display'),
        gdriveEmailInput: document.getElementById('gdrive-email-input'),
        btnChipAccounts: document.querySelectorAll('.btn-chip-account'),
        confirmGdrivePermBtn: document.getElementById('confirm-gdrive-perm-btn'),
        skipGdrivePermBtn: document.getElementById('skip-gdrive-perm-btn'),

        // Settings Modal
        usersListGrid: document.getElementById('users-list-grid'),
        addNewAccountBtn: document.getElementById('add-new-account-btn'),
        backupFrequencySelect: document.getElementById('backup-frequency-select'),
        gdriveStatusTitle: document.getElementById('gdrive-status-title'),
        gdriveLastBackupText: document.getElementById('gdrive-last-backup-text'),
        gdriveBackupBtn: document.getElementById('gdrive-backup-btn'),
        gdriveRestoreBtn: document.getElementById('gdrive-restore-btn'),

        // Overall Progress Dashboard
        overallBarsWrapper: document.getElementById('overall-bars-wrapper'),
        overallRingFill: document.getElementById('overall-ring-fill'),
        overallPctText: document.getElementById('overall-pct-text'),
        overallRatioVal: document.getElementById('overall-ratio-val'),

        // Progress Card & Counters
        tasksTodayPendingCount: document.getElementById('tasks-today-pending-count'),
        tasksOverduePendingCount: document.getElementById('tasks-overdue-pending-count'),
        tasksDoneCount: document.getElementById('tasks-done-count'),
        overdueTabCount: document.getElementById('overdue-tab-count'),
        upcomingTabCount: document.getElementById('upcoming-tab-count'),
        progressCircle: document.getElementById('progress-circle'),
        progressPercentageText: document.getElementById('progress-percentage-text'),

        // Quick Add & Overdue Banner
        quickTaskInput: document.getElementById('quick-task-input'),
        quickAddSubmitBtn: document.getElementById('quick-add-submit-btn'),
        overdueActionBanner: document.getElementById('overdue-action-banner'),
        overdueBannerCount: document.getElementById('overdue-banner-count'),
        rescheduleAllBtn: document.getElementById('reschedule-all-btn'),

        // Weekly Planner & Analytics
        weeklyPlannerGrid: document.getElementById('weekly-planner-grid'),
        heatmapGrid: document.getElementById('heatmap-grid'),
        categoryBarsContainer: document.getElementById('category-bars-container'),

        // Reminder Banner
        reminderBanner: document.getElementById('reminder-banner'),
        reminderTitle: document.getElementById('reminder-title'),
        reminderDesc: document.getElementById('reminder-desc'),
        dismissReminderBtn: document.getElementById('dismiss-reminder-btn'),

        // Search & Filters
        searchInput: document.getElementById('search-input'),
        clearSearchBtn: document.getElementById('clear-search-btn'),
        categoriesContainer: document.getElementById('categories-container'),
        filterTabs: document.querySelectorAll('.filter-tabs .tab-btn'),

        // Task List & Navigation
        taskList: document.getElementById('task-list'),
        emptyState: document.getElementById('empty-state'),
        emptyTitle: document.getElementById('empty-title'),
        emptyDesc: document.getElementById('empty-desc'),
        currentViewTitle: document.getElementById('current-view-title'),
        sortTrigger: document.getElementById('sort-trigger'),
        sortMenu: document.getElementById('sort-menu'),
        fabAddBtn: document.getElementById('fab-add-btn'),
        emptyAddBtn: document.getElementById('empty-add-btn'),
        bottomNavItems: document.querySelectorAll('.bottom-nav .nav-item'),

        // Modals
        taskModal: document.getElementById('task-modal'),
        taskForm: document.getElementById('task-form'),
        taskIdInput: document.getElementById('task-id'),
        taskTitleInput: document.getElementById('task-title-input'),
        taskCategorySelect: document.getElementById('task-category-select'),
        taskPrioritySelect: document.getElementById('task-priority-select'),
        taskDateInput: document.getElementById('task-date-input'),
        datePresetBtns: document.querySelectorAll('.date-preset-btn'),
        taskTimeInput: document.getElementById('task-time-input'),
        taskRecurringSelect: document.getElementById('task-recurring-select'),
        subtaskBuilderInput: document.getElementById('subtask-builder-input'),
        addSubtaskBtn: document.getElementById('add-subtask-btn'),
        subtaskBuilderList: document.getElementById('subtask-builder-list'),
        closeTaskModalBtn: document.getElementById('close-task-modal'),
        cancelTaskBtn: document.getElementById('cancel-task-btn'),
        modalHeading: document.getElementById('modal-heading'),

        profileTrigger: document.getElementById('profile-trigger'),
        profileModal: document.getElementById('profile-modal'),
        closeProfileModalBtn: document.getElementById('close-profile-modal'),
        saveProfileBtn: document.getElementById('save-profile-btn'),
        profileNameInput: document.getElementById('profile-name-input'),
        avatarOpts: document.querySelectorAll('.avatar-opt'),
        themeToggleIcon: document.getElementById('theme-toggle-icon'),
        themeModeBtns: document.querySelectorAll('.theme-mode-btn'),
        exportDataBtn: document.getElementById('export-data-btn'),
        importDataBtn: document.getElementById('import-data-btn'),
        importFileInput: document.getElementById('import-file-input'),
        resetDataBtn: document.getElementById('reset-data-btn'),

        analyticsModal: document.getElementById('analytics-modal'),
        closeAnalyticsModalBtn: document.getElementById('close-analytics-modal'),
        closeAnalyticsBtn: document.getElementById('close-analytics-btn'),
        toastContainer: document.getElementById('toast-container'),

        // App Version & In-App Updates
        currentVersionDisplay: document.getElementById('current-version-display'),
        checkUpdatesBtn: document.getElementById('check-updates-btn'),
        githubRepoInput: document.getElementById('github-repo-input'),
        updateStatusText: document.getElementById('update-status-text'),
        updateModal: document.getElementById('update-modal'),
        closeUpdateModalBtn: document.getElementById('close-update-modal'),
        dismissUpdateBtn: document.getElementById('dismiss-update-btn'),
        modalCurrVer: document.getElementById('modal-curr-ver'),
        modalNewVer: document.getElementById('modal-new-ver'),
        updateReleaseTitle: document.getElementById('update-release-title'),
        updateReleaseNotes: document.getElementById('update-release-notes'),
        downloadUpdateBtn: document.getElementById('download-update-btn')
    };

    // --- ONBOARDING (first-time users) ---
    const ONBOARDING_KEY = 'routinecraft_onboarded_v2';

    function showOnboarding() {
        if (localStorage.getItem(ONBOARDING_KEY)) return;
        const overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.innerHTML = `
            <div class="onboarding-card">
                <div class="onboarding-slides" id="onboarding-slides">
                    <div class="onboarding-slide active" data-slide="0">
                        <div class="onboarding-emoji">📋</div>
                        <h2 class="onboarding-title">Welcome to RoutineCraft</h2>
                        <p class="onboarding-desc">Your personal daily task manager and habit tracker. Stay on top of your routines with ease.</p>
                    </div>
                    <div class="onboarding-slide" data-slide="1">
                        <div class="onboarding-emoji">👆</div>
                        <h2 class="onboarding-title">Swipe & Focus</h2>
                        <p class="onboarding-desc">Swipe right to complete tasks instantly. Swipe left for quick reschedule or delete. Tap ⏱ to start a Pomodoro focus timer.</p>
                    </div>
                    <div class="onboarding-slide" data-slide="2">
                        <div class="onboarding-emoji">🚀</div>
                        <h2 class="onboarding-title">Build Your Routine</h2>
                        <p class="onboarding-desc">Use Templates to instantly add a Morning, Work, or Evening routine. Track streaks and celebrate every win!</p>
                    </div>
                </div>
                <div class="onboarding-dots">
                    <span class="onboarding-dot active" data-dot="0"></span>
                    <span class="onboarding-dot" data-dot="1"></span>
                    <span class="onboarding-dot" data-dot="2"></span>
                </div>
                <div class="onboarding-actions">
                    <button class="btn btn-secondary" id="onboarding-skip-btn">Skip</button>
                    <button class="btn btn-primary" id="onboarding-next-btn">Next <i class="fa-solid fa-arrow-right"></i></button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        let currentSlide = 0;
        const slides = overlay.querySelectorAll('.onboarding-slide');
        const dots = overlay.querySelectorAll('.onboarding-dot');
        const nextBtn = overlay.querySelector('#onboarding-next-btn');
        const skipBtn = overlay.querySelector('#onboarding-skip-btn');

        function goToSlide(idx) {
            slides.forEach(s => s.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));
            slides[idx].classList.add('active');
            dots[idx].classList.add('active');
            currentSlide = idx;
            if (idx === slides.length - 1) {
                nextBtn.innerHTML = 'Get Started <i class="fa-solid fa-check"></i>';
            } else {
                nextBtn.innerHTML = 'Next <i class="fa-solid fa-arrow-right"></i>';
            }
        }

        nextBtn.addEventListener('click', () => {
            if (currentSlide < slides.length - 1) {
                goToSlide(currentSlide + 1);
            } else {
                dismissOnboarding(overlay);
            }
        });

        skipBtn.addEventListener('click', () => dismissOnboarding(overlay));
        dots.forEach(d => d.addEventListener('click', () => goToSlide(parseInt(d.dataset.dot))));
    }

    function dismissOnboarding(overlay) {
        localStorage.setItem(ONBOARDING_KEY, '1');
        overlay.classList.add('onboarding-exit');
        setTimeout(() => overlay.remove(), 400);
    }

    // --- TASK TEMPLATES ---
    const TASK_TEMPLATES = {
        morning: [
            { title: 'Morning meditation (10 min)', category: 'morning', priority: 'medium', dueTime: '06:30', recurring: 'daily' },
            { title: 'Gym workout & stretch', category: 'health', priority: 'high', dueTime: '07:00', recurring: 'daily' },
            { title: 'Healthy breakfast', category: 'morning', priority: 'medium', dueTime: '07:45', recurring: 'daily' },
            { title: 'Review daily goals', category: 'morning', priority: 'high', dueTime: '08:15', recurring: 'daily' },
            { title: 'Drink 2.5L water', category: 'health', priority: 'medium', dueTime: '09:00', recurring: 'daily' }
        ],
        work: [
            { title: 'Check & respond to emails', category: 'work', priority: 'high', dueTime: '09:00', recurring: 'weekdays' },
            { title: 'Daily standup / team sync', category: 'work', priority: 'high', dueTime: '10:00', recurring: 'weekdays' },
            { title: 'Deep work focus block (2h)', category: 'work', priority: 'high', dueTime: '10:30', recurring: 'weekdays' },
            { title: 'Review & prioritize tasks', category: 'work', priority: 'medium', dueTime: '14:00', recurring: 'weekdays' },
            { title: 'End-of-day wrap-up & notes', category: 'work', priority: 'medium', dueTime: '17:30', recurring: 'weekdays' }
        ],
        evening: [
            { title: 'Evening walk or light exercise', category: 'health', priority: 'medium', dueTime: '18:30', recurring: 'daily' },
            { title: 'Cook or prep dinner', category: 'personal', priority: 'medium', dueTime: '19:00', recurring: 'daily' },
            { title: 'Read 15 pages', category: 'personal', priority: 'medium', dueTime: '20:30', recurring: 'daily' },
            { title: 'Plan tomorrow\'s tasks', category: 'evening', priority: 'high', dueTime: '21:00', recurring: 'daily' },
            { title: 'Wind-down: no screens (30 min)', category: 'evening', priority: 'medium', dueTime: '21:30', recurring: 'daily' }
        ]
    };

    function applyTemplate(templateKey) {
        const template = TASK_TEMPLATES[templateKey];
        if (!template) return;
        const today = getTodayStr();
        template.forEach(t => {
            const newTask = {
                id: 'task-tmpl-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                title: t.title,
                category: t.category,
                priority: t.priority,
                dueDate: today,
                dueTime: t.dueTime || '',
                recurring: t.recurring || 'none',
                completed: false,
                completedAt: null,
                createdAt: new Date().toISOString(),
                subtasks: []
            };
            state.tasks.push(newTask);
        });
        saveState();
        renderTasks();
        renderCategoryFilters();
        showToast(`${templateKey.charAt(0).toUpperCase() + templateKey.slice(1)} routine added! 🎉`);
    }

    // --- CONFETTI ON 100% COMPLETION ---
    function launchConfetti() {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#a855f7'];
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);

        for (let i = 0; i < 60; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.cssText = [
                `left: ${Math.random() * 100}%`,
                `background: ${colors[Math.floor(Math.random() * colors.length)]}`,
                `width: ${6 + Math.random() * 8}px`,
                `height: ${8 + Math.random() * 10}px`,
                `animation-delay: ${Math.random() * 0.8}s`,
                `animation-duration: ${1.8 + Math.random() * 1.4}s`,
                `border-radius: ${Math.random() > 0.5 ? '50%' : '2px'}`
            ].join('; ');
            container.appendChild(piece);
        }

        setTimeout(() => container.remove(), 3500);
        showToast('🎉 All tasks completed! Amazing work today!');
    }

    let lastCompletionPercent = 0;
    function checkConfetti() {
        const today = getTodayStr();
        const todayTasks = state.tasks.filter(t => isTaskToday(t) || (t.completed && t.completedAt && formatLocalDate(new Date(t.completedAt)) === today));
        if (todayTasks.length === 0) return;
        const completedCount = todayTasks.filter(t => t.completed).length;
        const pct = Math.round((completedCount / todayTasks.length) * 100);
        if (pct === 100 && lastCompletionPercent < 100) {
            launchConfetti();
        }
        lastCompletionPercent = pct;
    }

    // --- APP INITIALIZATION ---
    function init() {
        const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        const isCapacitor = window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();

        if (isCapacitor || isStandalone || isMobileDevice) {
            document.documentElement.classList.add('is-mobile-app');
        }

        checkDailyReset();
        applyTheme(state.profile.theme);
        updateGreeting();
        renderHeaderProfile();
        renderCategoryFilters();
        renderCategorySelectOptions();
        renderTasks();
        applyInterfacePrefs();
        renderAccountStatusBar();
        checkAutoBackupSchedule();
        checkReminderNotification();
        checkDailyDigestNotification();
        setupTemplateButtons();

        if (dom.currentVersionDisplay) {
            dom.currentVersionDisplay.textContent = 'v' + APP_RELEASE_VERSION;
        }

        setupEventListeners();

        // Show onboarding for new users
        setTimeout(() => showOnboarding(), 600);

        // Check for updates in the background on startup (silent check)
        setTimeout(() => {
            checkForAppUpdates(false);
        }, 2500);
    }

    function setupTemplateButtons() {
        document.querySelectorAll('[data-template]').forEach(btn => {
            btn.addEventListener('click', () => applyTemplate(btn.dataset.template));
        });
    }

    // --- PERSISTENCE ---
    function saveState() {
        usersStore[activeEmail] = {
            profile: state.profile,
            tasks: state.tasks,
            history: state.history || {},
            customCategories: state.customCategories || {}
        };
        try {
            localStorage.setItem('routinecraft_users', JSON.stringify(usersStore));
            localStorage.setItem('routinecraft_active_email', activeEmail);
            localStorage.setItem('routinecraft_version', APP_VERSION.toString());
        } catch (e) {
            console.error('Failed to save state to localStorage', e);
        }
        updateProgressCard();
        renderAccountStatusBar();
    }

    function switchUserAccount(targetEmail) {
        if (!usersStore[targetEmail]) {
            usersStore[targetEmail] = {
                profile: { ...DEFAULT_PROFILE, email: targetEmail, name: targetEmail.split('@')[0] },
                tasks: [...DEFAULT_TASKS],
                history: {}
            };
        }
        activeEmail = targetEmail;
        state.profile = usersStore[activeEmail].profile;
        state.tasks = usersStore[activeEmail].tasks;
        state.history = usersStore[activeEmail].history || {};
        saveState();
        applyTheme(state.profile.theme);
        renderHeaderProfile();
        renderTasks();
        renderAccountStatusBar();
        showToast(`Switched account to: ${state.profile.name} 👤`);
    }

    // --- ACCURATE DAILY RESET & REAL STREAK CALCULATION ---
    function checkDailyReset() {
        const today = getTodayStr();
        const yesterday = getPastDateStr(1);
        const lastActive = state.profile.lastActiveDate;

        if (lastActive !== today) {
            // Check if streak was broken (user missed yesterday completely)
            if (lastActive && lastActive !== yesterday) {
                const yestCompletions = state.history ? (state.history[yesterday] || 0) : 0;
                if (yestCompletions === 0 && state.profile.lastCompletedDate !== yesterday) {
                    state.profile.streak = 0;
                }
            }

            // Reset recurring tasks that are active today
            state.tasks.forEach(task => {
                if (task.recurring && task.recurring !== 'none') {
                    task.completed = false;
                    task.completedAt = null;
                    if (task.subtasks) {
                        task.subtasks.forEach(s => s.completed = false);
                    }
                }
            });

            state.profile.lastActiveDate = today;
            saveState();
        }
    }

    function recordCompletionActivity(isCompleted) {
        const today = getTodayStr();
        const yesterday = getPastDateStr(1);
        if (!state.history) state.history = {};

        if (isCompleted) {
            state.history[today] = (state.history[today] || 0) + 1;
            state.profile.totalCompletedCount = (state.profile.totalCompletedCount || 0) + 1;

            // Real Streak Logic:
            if (state.profile.lastCompletedDate !== today) {
                if (state.profile.lastCompletedDate === yesterday) {
                    state.profile.streak = (state.profile.streak || 0) + 1;
                } else {
                    state.profile.streak = 1;
                }
                state.profile.lastCompletedDate = today;
            }
        } else {
            if (state.history[today] && state.history[today] > 0) {
                state.history[today] -= 1;
            }
            if (state.profile.totalCompletedCount && state.profile.totalCompletedCount > 0) {
                state.profile.totalCompletedCount -= 1;
            }
        }
    }

    // --- GREETING & PROFILE UI ---
    function updateGreeting() {
        const now = new Date();
        const hour = now.getHours();
        let greeting = 'Good Morning';
        if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
        else if (hour >= 17 && hour < 22) greeting = 'Good Evening';
        else if (hour >= 22 || hour < 5) greeting = 'Good Night';
        if (dom.timeGreeting) dom.timeGreeting.textContent = greeting;

        const headerDateTitle = document.getElementById('header-date-title');
        const headerDateBadge = document.getElementById('header-date-badge');
        if (headerDateTitle) {
            headerDateTitle.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        }
        if (headerDateBadge) {
            headerDateBadge.textContent = 'TODAY';
        }
    }

    function renderHeaderProfile() {
        if (dom.userNameDisplay) dom.userNameDisplay.textContent = state.profile.name || 'Productivity Hero';
        if (dom.userAvatar) dom.userAvatar.textContent = state.profile.avatar || '🚀';
        if (dom.streakCount) dom.streakCount.textContent = state.profile.streak || 0;

        if (dom.googleBtnText) {
            dom.googleBtnText.textContent = state.profile.isGoogleSynced ? 'Account' : 'Sign In';
        }

        if (dom.notifyBtn) {
            if (state.profile.notificationsEnabled) {
                dom.notifyBtn.classList.add('active');
            } else {
                dom.notifyBtn.classList.remove('active');
            }
        }
    }

    function renderAccountStatusBar() {
        if (state.profile.isGoogleSynced) {
            dom.accountStatusBar.classList.remove('hide');
            dom.accountEmailDisplay.textContent = state.profile.email;
            dom.accountFreqBadge.textContent = `Auto: ${(state.profile.backupFrequency || 'daily').toUpperCase()}`;
        } else {
            dom.accountStatusBar.classList.add('hide');
        }

        if (state.profile.lastBackupTime) {
            dom.gdriveLastBackupText.textContent = `Last backup: ${state.profile.lastBackupTime}`;
            dom.gdriveStatusTitle.textContent = `Google Drive Backup (${(state.profile.backupFrequency || 'daily').toUpperCase()})`;
        } else {
            dom.gdriveLastBackupText.textContent = 'Last backup: Never';
        }
        dom.backupFrequencySelect.value = state.profile.backupFrequency || 'daily';
    }

    // --- GOOGLE SIGN IN & BACKUP MODAL (NO PROMPT) ---
    function openGoogleLoginModal() {
        if (dom.gdriveEmailInput) {
            dom.gdriveEmailInput.value = state.profile.isGoogleSynced ? state.profile.email : (state.profile.email.includes('@routinecraft.app') ? 'user@gmail.com' : state.profile.email);
        }
        dom.guserNameDisplay.textContent = state.profile.name;
        dom.guserEmailDisplay.textContent = state.profile.email;
        dom.gdrivePermissionModal.classList.remove('hide');
    }

    function confirmGoogleBackupPermission() {
        const emailInput = dom.gdriveEmailInput ? dom.gdriveEmailInput.value.trim() : '';
        const userEmail = emailInput && emailInput.includes('@') ? emailInput : state.profile.email;
        const selectedFreq = document.querySelector('input[name="backup-freq-choice"]:checked')?.value || 'daily';

        state.profile.email = userEmail;
        state.profile.isGoogleSynced = true;
        state.profile.backupFrequency = selectedFreq;
        state.profile.lastBackupTime = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        state.profile.lastBackupTimestamp = Date.now();

        saveState();
        renderHeaderProfile();
        renderAccountStatusBar();
        dom.gdrivePermissionModal.classList.add('hide');
        showToast(`Connected ${userEmail} with ${selectedFreq.toUpperCase()} auto-backup! ☁️🎉`);
    }

    function checkAutoBackupSchedule() {
        if (!state.profile.isGoogleSynced || state.profile.backupFrequency === 'custom') return;
        const now = Date.now();
        const lastTime = state.profile.lastBackupTimestamp || 0;
        const oneDayMs = 24 * 60 * 60 * 1000;
        const oneWeekMs = 7 * oneDayMs;

        const isDueDaily = (state.profile.backupFrequency === 'daily' && (now - lastTime > oneDayMs));
        const isDueWeekly = (state.profile.backupFrequency === 'weekly' && (now - lastTime > oneWeekMs));

        if (isDueDaily || isDueWeekly || !state.profile.lastBackupTime) {
            state.profile.lastBackupTime = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
            state.profile.lastBackupTimestamp = Date.now();
            saveState();
        }
    }

    function performManualBackup() {
        state.profile.lastBackupTime = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        state.profile.lastBackupTimestamp = Date.now();
        saveState();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `routinecraft_backup_${getTodayStr()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast(`Backed up tasks for ${state.profile.name}! ☁️`);
    }

    // --- THEME ENGINE (LIGHT & DARK ONLY) ---
    function applyTheme(themeName) {
        const mode = (themeName === 'dark') ? 'dark' : 'light';
        state.profile.theme = mode;
        dom.body.setAttribute('data-theme', mode);

        // Update Android Status Bar & Theme Color
        const metaTheme = document.getElementById('theme-color-meta');
        if (metaTheme) {
            metaTheme.setAttribute('content', mode === 'dark' ? '#090d16' : '#f8fafc');
        }

        // Update Header Icon
        if (dom.themeToggleIcon) {
            dom.themeToggleIcon.className = (mode === 'dark') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            dom.themeToggleIcon.style.color = (mode === 'dark') ? '#f59e0b' : '';
        }

        // Update Settings Mode Buttons
        if (dom.themeModeBtns) {
            dom.themeModeBtns.forEach(btn => {
                if (btn.dataset.themeMode === mode) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
    }

    function toggleThemeMode() {
        const next = state.profile.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        saveState();
        showToast(`${next === 'dark' ? 'Dark Mode 🌙' : 'Light Mode ☀️'} enabled`);
    }

    // --- ACCURATE PROGRESS CARD MATH ---
    function updateProgressCard() {
        const today = getTodayStr();

        const todayPending = state.tasks.filter(t => !t.completed && isTaskToday(t)).length;
        const overduePending = state.tasks.filter(t => isTaskOverdue(t)).length;
        const upcomingPending = state.tasks.filter(t => isTaskUpcoming(t)).length;

        // Completed today tasks: either due today and checked, or completed timestamp is today
        const completedToday = state.tasks.filter(t => {
            if (!t.completed) return false;
            const completedDate = t.completedAt ? formatLocalDate(new Date(t.completedAt)) : null;
            return isTaskToday(t) || completedDate === today;
        }).length;

        const totalWorkload = todayPending + overduePending + completedToday;
        const percentage = totalWorkload === 0 ? 0 : Math.round((completedToday / totalWorkload) * 100);

        if (dom.tasksTodayPendingCount) dom.tasksTodayPendingCount.textContent = todayPending;
        if (dom.tasksOverduePendingCount) dom.tasksOverduePendingCount.textContent = overduePending;
        if (dom.tasksDoneCount) dom.tasksDoneCount.textContent = completedToday;
        if (dom.overdueTabCount) {
            dom.overdueTabCount.textContent = overduePending;
            if (overduePending > 0) {
                dom.overdueTabCount.classList.remove('hide');
            } else {
                dom.overdueTabCount.classList.add('hide');
            }
        }
        if (dom.upcomingTabCount) {
            dom.upcomingTabCount.textContent = upcomingPending;
            if (upcomingPending > 0) {
                dom.upcomingTabCount.classList.remove('hide');
            } else {
                dom.upcomingTabCount.classList.add('hide');
            }
        }

        if (dom.overdueActionBanner && dom.overdueBannerCount) {
            dom.overdueBannerCount.textContent = overduePending;
            if (overduePending > 0 && (state.activeFilter === 'today' || state.activeFilter === 'overdue')) {
                dom.overdueActionBanner.classList.remove('hide');
            } else {
                dom.overdueActionBanner.classList.add('hide');
            }
        }

        if (dom.progressPercentageText) dom.progressPercentageText.textContent = `${percentage}%`;

        // Update Minimal Linear Progress Bar & Subtitle
        const minimalProgressText = document.getElementById('minimal-progress-text');
        if (minimalProgressText) {
            minimalProgressText.textContent = `${completedToday} of ${totalWorkload} completed (${percentage}%)`;
        }
        const linearProgressFill = document.getElementById('linear-progress-fill');
        if (linearProgressFill) {
            linearProgressFill.style.width = `${percentage}%`;
        }
        const headerStatusSub = document.getElementById('header-status-sub');
        if (headerStatusSub) {
            headerStatusSub.textContent = totalWorkload === 0 
                ? 'No tasks for today' 
                : `${completedToday} of ${totalWorkload} completed`;
        }

        if (dom.progressCircle) {
            const circumference = 226.19;
            const offset = circumference - (percentage / 100) * circumference;
            dom.progressCircle.style.strokeDashoffset = offset;
        }
        if (dom.streakCount) dom.streakCount.textContent = state.profile.streak || 0;
        checkReminderNotification();
    }

    // --- REAL ANALYTICS DASHBOARD ENGINE ---
    function renderOverallProgressCard() {
        const totalAll = state.tasks.length;
        const completedAll = state.tasks.filter(t => t.completed).length;
        const overallPct = totalAll === 0 ? 0 : Math.round((completedAll / totalAll) * 100);

        dom.overallPctText.textContent = `${overallPct}%`;
        dom.overallRatioVal.textContent = `${completedAll} / ${totalAll} completed`;

        const circumference = 213.62;
        const offset = circumference - (overallPct / 100) * circumference;
        dom.overallRingFill.style.strokeDashoffset = offset;

        // Real Mon-Sun Completion Bar Chart
        dom.overallBarsWrapper.innerHTML = '';
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const now = new Date();
        const currentDayMonBased = (now.getDay() + 6) % 7; // 0 is Mon, 6 is Sun
        const mondayDate = new Date(now);
        mondayDate.setDate(now.getDate() - currentDayMonBased);

        const countsPerDay = [];
        let maxCount = 4;

        for (let i = 0; i < 7; i++) {
            const dayObj = new Date(mondayDate);
            dayObj.setDate(mondayDate.getDate() + i);
            const dateStr = formatLocalDate(dayObj);

            // Count from real task completedAt and history records
            const historyCount = state.history ? (state.history[dateStr] || 0) : 0;
            const tasksOnDayCount = state.tasks.filter(t => t.completed && t.completedAt && formatLocalDate(new Date(t.completedAt)) === dateStr).length;
            const count = Math.max(historyCount, tasksOnDayCount);

            countsPerDay.push(count);
            if (count > maxCount) maxCount = count;
        }

        weekDays.forEach((dayName, idx) => {
            const count = countsPerDay[idx];
            const heightPct = maxCount === 0 ? 5 : Math.max(8, Math.min(100, (count / maxCount) * 100));

            const col = document.createElement('div');
            col.className = 'overall-bar-col';
            col.innerHTML = `
                <div class="overall-bar-track">
                    <div class="overall-bar-fill" style="height: ${heightPct}%;" title="${dayName}: ${count} completed"></div>
                </div>
                <span class="overall-bar-day" style="${idx === currentDayMonBased ? 'color:var(--accent-primary); font-weight:800;' : ''}">${dayName}</span>
            `;
            dom.overallBarsWrapper.appendChild(col);
        });
    }

    function renderWeeklyPlannerGrid() {
        dom.weeklyPlannerGrid.innerHTML = '';
        const curr = new Date();
        const first = curr.getDate() - ((curr.getDay() + 6) % 7);

        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(curr);
            nextDay.setDate(first + i);
            const dayStr = formatLocalDate(nextDay);
            const dayName = nextDay.toLocaleDateString('en-US', { weekday: 'long' });
            const dateFormatted = nextDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const dayTasks = state.tasks.filter(t => {
                if (t.recurring && t.recurring !== 'none') {
                    if (t.dueDate && t.dueDate > dayStr) return false;
                    return isDayApplicableForRecurrence(t.recurring, nextDay);
                }
                return t.dueDate === dayStr;
            });

            const dayTotal = dayTasks.length;
            const dayCompleted = dayTasks.filter(t => t.completed).length;
            const dayPct = dayTotal === 0 ? 0 : Math.round((dayCompleted / dayTotal) * 100);

            const dayCard = document.createElement('div');
            dayCard.className = 'planner-day-card';

            const circumference = 175.92;
            const offset = circumference - (dayPct / 100) * circumference;

            let tasksListHtml = '';
            if (dayTasks.length > 0) {
                tasksListHtml = dayTasks.map(t => `
                    <div class="day-task-item ${t.completed ? 'completed' : ''}">
                        <input type="checkbox" class="custom-checkbox planner-task-chk" data-id="${t.id}" ${t.completed ? 'checked' : ''}>
                        <span>${escapeHtml(t.title)}</span>
                    </div>
                `).join('');
            } else {
                tasksListHtml = '<div style="font-size:0.78rem; color:var(--text-muted); padding:10px 0; text-align:center;">No scheduled tasks</div>';
            }

            dayCard.innerHTML = `
                <div class="day-card-header">
                    <span class="day-card-name">${dayName}</span>
                    <span class="day-card-date">${dateFormatted}</span>
                </div>
                <div class="day-card-donut-wrapper">
                    <div class="day-donut">
                        <svg width="70" height="70">
                            <circle class="ring-bg" fill="none" stroke-width="6" r="28" cx="35" cy="35"/>
                            <circle class="ring-fill" fill="none" stroke-width="6" r="28" cx="35" cy="35" style="stroke-dasharray:${circumference}; stroke-dashoffset:${offset};"/>
                        </svg>
                        <span class="day-donut-pct">${dayPct}%</span>
                    </div>
                </div>
                <div class="day-tasks-section">
                    <div class="day-tasks-subbanner">${dayCompleted}/${dayTotal} Tasks</div>
                    <div class="day-tasks-list">
                        ${tasksListHtml}
                    </div>
                </div>
            `;

            dayCard.querySelectorAll('.planner-task-chk').forEach(chk => {
                chk.addEventListener('change', (e) => {
                    const taskId = chk.dataset.id;
                    toggleTaskComplete(taskId, e.target.checked);
                    renderOverallProgressCard();
                });
            });

            dom.weeklyPlannerGrid.appendChild(dayCard);
        }
    }

    function renderAnalyticsContent() {
        renderOverallProgressCard();
        renderWeeklyPlannerGrid();

        // 30-Day Real Heatmap Grid
        dom.heatmapGrid.innerHTML = '';
        for (let i = 29; i >= 0; i--) {
            const tileDate = getPastDateStr(i);
            const historyCount = state.history ? (state.history[tileDate] || 0) : 0;
            const completedCount = state.tasks.filter(t => t.completed && t.completedAt && formatLocalDate(new Date(t.completedAt)) === tileDate).length;
            const totalCount = Math.max(historyCount, completedCount);

            let lvlClass = 'lvl-0';
            if (totalCount >= 5) lvlClass = 'lvl-3';
            else if (totalCount >= 3) lvlClass = 'lvl-2';
            else if (totalCount >= 1) lvlClass = 'lvl-1';

            const tile = document.createElement('div');
            tile.className = `heatmap-tile ${lvlClass}`;
            tile.title = `${tileDate}: ${totalCount} task(s) completed`;
            dom.heatmapGrid.appendChild(tile);
        }

        // Category Breakdown
        dom.categoryBarsContainer.innerHTML = '';
        Object.keys(getAllCategories()).forEach(catKey => {
            const catInfo = CATEGORIES[catKey];
            const catTasks = state.tasks.filter(t => t.category === catKey);
            const catTotal = catTasks.length;
            const catDone = catTasks.filter(t => t.completed).length;
            const catPct = catTotal === 0 ? 0 : Math.round((catDone / catTotal) * 100);

            const item = document.createElement('div');
            item.className = 'category-bar-item';
            item.innerHTML = `
                <div class="cat-bar-header">
                    <span><i class="fa-solid ${catInfo.icon}"></i> ${catInfo.label}</span>
                    <span>${catDone}/${catTotal} (${catPct}%)</span>
                </div>
                <div class="cat-bar-track">
                    <div class="cat-bar-fill" style="width: ${catPct}%;"></div>
                </div>
            `;
            dom.categoryBarsContainer.appendChild(item);
        });
    }

    function switchPageView(viewName) {
        const target = (viewName === 'stats' || viewName === 'analytics') ? 'analytics' : (viewName === 'settings' ? 'settings' : 'tasks');
        const tasksPage = document.getElementById('page-tasks');

        // Update bottom navigation bar active state
        dom.bottomNavItems.forEach(n => {
            if (n.dataset.nav === target) {
                n.classList.add('active');
            } else {
                n.classList.remove('active');
            }
        });

        // Close transient floating modals
        dom.taskModal.classList.add('hide');
        if (dom.updateModal) dom.updateModal.classList.add('hide');
        if (dom.gdrivePermissionModal) dom.gdrivePermissionModal.classList.add('hide');
        if (dom.sortMenu) dom.sortMenu.classList.add('hide');

        let activePageEl = null;
        if (target === 'tasks') {
            if (tasksPage) tasksPage.classList.remove('hide');
            if (dom.analyticsModal) dom.analyticsModal.classList.add('hide');
            if (dom.profileModal) dom.profileModal.classList.add('hide');
            activePageEl = tasksPage;
            renderTasks();
        } else if (target === 'analytics') {
            if (tasksPage) tasksPage.classList.add('hide');
            if (dom.profileModal) dom.profileModal.classList.add('hide');
            if (dom.analyticsModal) dom.analyticsModal.classList.remove('hide');
            activePageEl = dom.analyticsModal;
            renderAnalyticsContent();
        } else if (target === 'settings') {
            if (tasksPage) tasksPage.classList.add('hide');
            if (dom.analyticsModal) dom.analyticsModal.classList.add('hide');
            if (dom.profileModal) dom.profileModal.classList.remove('hide');
            activePageEl = dom.profileModal;
            renderSettingsContent();
        }

        if (activePageEl) activePageEl.scrollTop = 0;
    }

    function openAnalyticsModal() {
        switchPageView('analytics');
    }

    function closeAnalyticsModal() {
        switchPageView('tasks');
    }

    // --- TASK FILTERING & RENDERING ENGINE ---
    function getFilteredTasks() {
        const today = getTodayStr();

        return state.tasks.filter(task => {
            // Category Filter
            if (state.activeCategory !== 'all' && task.category !== state.activeCategory) {
                return false;
            }

            // Tab Filter
            if (state.activeFilter === 'today') {
                const isTodayTask = isTaskToday(task);
                const isOverdueTask = isTaskOverdue(task);
                const wasCompletedToday = task.completed && task.completedAt && formatLocalDate(new Date(task.completedAt)) === today;
                if (!isTodayTask && !isOverdueTask && !wasCompletedToday) return false;
            } else if (state.activeFilter === 'overdue') {
                if (!isTaskOverdue(task)) return false;
            } else if (state.activeFilter === 'upcoming') {
                if (!isTaskUpcoming(task)) return false;
            } else if (state.activeFilter === 'completed') {
                if (!task.completed) return false;
            }

            // Search Query
            if (state.searchQuery.trim() !== '') {
                const query = state.searchQuery.toLowerCase();
                const titleMatch = task.title.toLowerCase().includes(query);
                const categoryMatch = (CATEGORIES[task.category]?.label || '').toLowerCase().includes(query);
                return titleMatch || categoryMatch;
            }

            return true;
        }).sort((a, b) => {
            if (state.sortBy === 'priority') {
                const pOrder = { high: 1, medium: 2, low: 3 };
                return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
            } else if (state.sortBy === 'time') {
                return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
            } else if (state.sortBy === 'date') {
                return (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99');
            } else if (state.sortBy === 'alphabetical') {
                return a.title.localeCompare(b.title);
            }

            // Default Sort: Overdue first, then pending, then completed
            const aOverdue = isTaskOverdue(a);
            const bOverdue = isTaskOverdue(b);
            if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return 0;
        });
    }

    function renderTasks() {
        const filtered = getFilteredTasks();
        dom.taskList.innerHTML = '';

        const viewTitles = {
            today: "Today's Checklist",
            overdue: "Overdue Pending Tasks",
            upcoming: "Upcoming Scheduled Tasks",
            all: "All Tasks",
            completed: "Completed Task History"
        };
        dom.currentViewTitle.textContent = viewTitles[state.activeFilter] || "Checklist";

        if (filtered.length === 0) {
            dom.emptyState.classList.remove('hide');
            if (state.activeFilter === 'upcoming') {
                dom.emptyTitle.textContent = 'No upcoming tasks!';
                dom.emptyDesc.textContent = 'Schedule a future task with the date picker to plan ahead.';
            } else if (state.activeFilter === 'overdue') {
                dom.emptyTitle.textContent = 'Zero Overdue Tasks! 🎯';
                dom.emptyDesc.textContent = 'Awesome job! You are 100% caught up on all past items.';
            } else if (state.activeFilter === 'completed') {
                dom.emptyTitle.textContent = 'No completed tasks yet';
                dom.emptyDesc.textContent = 'Check off tasks as you finish them to see your accomplishments here.';
            } else {
                dom.emptyTitle.textContent = 'All tasks completed! 🎉';
                dom.emptyDesc.textContent = "You're all caught up for today. Add a new task to keep your momentum going!";
            }
        } else {
            dom.emptyState.classList.add('hide');

            // If in "Today" tab, organize into clean sections so completed tasks don't vanish!
            if (state.activeFilter === 'today') {
                const overdueList = filtered.filter(t => isTaskOverdue(t));
                const pendingTodayList = filtered.filter(t => !t.completed && !isTaskOverdue(t));
                const completedTodayList = filtered.filter(t => t.completed);

                if (overdueList.length > 0) {
                    const overdueHeading = document.createElement('div');
                    overdueHeading.className = 'task-group-heading overdue-heading';
                    overdueHeading.innerHTML = `<span><i class="fa-solid fa-triangle-exclamation"></i> Overdue Tasks (${overdueList.length})</span>`;
                    dom.taskList.appendChild(overdueHeading);
                    overdueList.forEach(t => dom.taskList.appendChild(createTaskCardElement(t)));
                }

                if (pendingTodayList.length > 0) {
                    if (overdueList.length > 0) {
                        const todayHeading = document.createElement('div');
                        todayHeading.className = 'task-group-heading';
                        todayHeading.innerHTML = `<span>Today's Tasks (${pendingTodayList.length})</span>`;
                        dom.taskList.appendChild(todayHeading);
                    }
                    pendingTodayList.forEach(t => dom.taskList.appendChild(createTaskCardElement(t)));
                }

                if (completedTodayList.length > 0) {
                    const completedHeading = document.createElement('div');
                    completedHeading.className = 'task-group-heading completed-heading';
                    completedHeading.innerHTML = `<span><i class="fa-solid fa-circle-check"></i> Completed Today (${completedTodayList.length})</span>`;
                    dom.taskList.appendChild(completedHeading);
                    completedTodayList.forEach(t => dom.taskList.appendChild(createTaskCardElement(t)));
                }
            } else {
                filtered.forEach(task => {
                    dom.taskList.appendChild(createTaskCardElement(task));
                });
            }
        }

        updateProgressCard();
    }

    // --- CATEGORY RENDERING & MANAGEMENT ---
    function renderCategoryFilters() {
        if (!dom.categoriesContainer) return;
        const allCats = getAllCategories();
        dom.categoriesContainer.innerHTML = '';

        const allChip = document.createElement('button');
        allChip.className = `category-chip ${state.activeCategory === 'all' ? 'active' : ''}`;
        allChip.dataset.category = 'all';
        allChip.textContent = 'All';
        allChip.addEventListener('click', () => {
            dom.categoriesContainer.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            allChip.classList.add('active');
            state.activeCategory = 'all';
            renderTasks();
        });
        dom.categoriesContainer.appendChild(allChip);

        Object.entries(allCats).forEach(([key, cat]) => {
            const chip = document.createElement('button');
            chip.className = `category-chip ${state.activeCategory === key ? 'active' : ''}`;
            chip.dataset.category = key;
            chip.innerHTML = `<i class="fa-solid ${cat.icon}"></i> ${cat.label}`;
            chip.addEventListener('click', () => {
                dom.categoriesContainer.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                state.activeCategory = key;
                renderTasks();
            });
            dom.categoriesContainer.appendChild(chip);
        });
    }

    function renderCategorySelectOptions() {
        if (!dom.taskCategorySelect) return;
        const currentVal = dom.taskCategorySelect.value;
        const allCats = getAllCategories();
        dom.taskCategorySelect.innerHTML = '';
        Object.entries(allCats).forEach(([key, cat]) => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = `${cat.label}`;
            dom.taskCategorySelect.appendChild(opt);
        });
        if (allCats[currentVal]) {
            dom.taskCategorySelect.value = currentVal;
        }
    }

    function renderCategoriesManageList() {
        const container = document.getElementById('categories-manage-list');
        if (!container) return;
        container.innerHTML = '';
        const allCats = getAllCategories();

        Object.entries(allCats).forEach(([key, cat]) => {
            const isPreset = Boolean(DEFAULT_CATEGORIES[key]);
            const item = document.createElement('div');
            item.className = 'cat-manage-item';
            item.innerHTML = `
                <i class="fa-solid ${cat.icon}" style="color:${cat.color || 'var(--accent-primary)'};"></i>
                <span>${escapeHtml(cat.label)}</span>
                ${!isPreset ? `<button type="button" class="cat-delete-btn" data-key="${key}" title="Delete Category"><i class="fa-solid fa-xmark"></i></button>` : ''}
            `;
            if (!isPreset) {
                item.querySelector('.cat-delete-btn').addEventListener('click', () => {
                    deleteCustomCategory(key);
                });
            }
            container.appendChild(item);
        });
    }

    function deleteCustomCategory(key) {
        if (!state.customCategories || !state.customCategories[key]) return;
        const name = state.customCategories[key].label;
        delete state.customCategories[key];
        if (state.activeCategory === key) state.activeCategory = 'all';
        saveState();
        renderCategoryFilters();
        renderCategorySelectOptions();
        renderCategoriesManageList();
        renderTasks();
        showToast(`Category "${name}" removed`);
    }

    // --- DRAG & DROP REORDERING ---
    function reorderTasks(draggedId, targetId, insertAfter = false) {
        if (!draggedId || !targetId || draggedId === targetId) return;

        const fromIndex = state.tasks.findIndex(t => t.id === draggedId);
        if (fromIndex === -1) return;

        const originalTargetIndex = state.tasks.findIndex(t => t.id === targetId);
        if (originalTargetIndex === -1) return;

        let destinationIndex = insertAfter ? originalTargetIndex + 1 : originalTargetIndex;
        if (fromIndex < destinationIndex) {
            destinationIndex--;
        }

        if (fromIndex === destinationIndex) return;

        const [movedTask] = state.tasks.splice(fromIndex, 1);
        state.tasks.splice(destinationIndex, 0, movedTask);

        // Reset sort mode to default so custom drag order takes effect
        if (state.sortBy !== 'default') {
            state.sortBy = 'default';
            if (dom.sortMenu) {
                dom.sortMenu.querySelectorAll('button').forEach(b => {
                    b.classList.toggle('active', b.dataset.sort === 'default');
                });
            }
        }

        saveState();
        renderTasks();
        if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}
        showToast('Task order updated! 📌');
    }

    function attachDragHandleListeners(handle, card, task) {
        if (!handle || !card || !task) return;

        function startDragging(e) {
            if (e.type === 'mousedown' && e.button !== 0) return;

            const isTouch = e.type.startsWith('touch');
            const getPointerCoord = (evt) => {
                if (evt.touches && evt.touches.length > 0) {
                    return { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
                }
                return { x: evt.clientX, y: evt.clientY };
            };

            const startPos = getPointerCoord(e);
            let isActivelyDragging = false;
            let currentTargetCard = null;
            let currentInsertAfter = false;

            // Close any swipe actions currently revealed
            document.querySelectorAll('.task-card.swipe-revealed').forEach(c => {
                c.classList.remove('swipe-revealed');
                const inEl = c.querySelector('.task-card-inner');
                if (inEl) inEl.style.transform = '';
            });

            const scrollContainer = card.closest('.page-view') || document.documentElement;

            function onPointerMove(moveEvt) {
                const pos = getPointerCoord(moveEvt);

                if (!isActivelyDragging) {
                    const diffY = Math.abs(pos.y - startPos.y);
                    const diffX = Math.abs(pos.x - startPos.x);
                    if (diffY < 6 && diffX < 6) return;

                    isActivelyDragging = true;
                    card.classList.add('is-dragging');
                    if (navigator.vibrate) try { navigator.vibrate(25); } catch (err) {}
                }

                if (moveEvt.cancelable) {
                    moveEvt.preventDefault();
                }

                // Smooth auto-scroll when reaching list bounds
                const containerRect = scrollContainer.getBoundingClientRect();
                const edgeThreshold = 65;
                if (pos.y < containerRect.top + edgeThreshold) {
                    scrollContainer.scrollTop -= 7;
                } else if (pos.y > containerRect.bottom - edgeThreshold) {
                    scrollContainer.scrollTop += 7;
                }

                // Locate target card under pointer
                const cards = Array.from(dom.taskList.querySelectorAll('.task-card:not(.is-dragging)'));
                let targetCard = null;
                let insertAfter = false;

                for (const otherCard of cards) {
                    const rect = otherCard.getBoundingClientRect();
                    if (pos.y >= rect.top && pos.y <= rect.bottom) {
                        targetCard = otherCard;
                        insertAfter = pos.y > (rect.top + rect.height / 2);
                        break;
                    }
                }

                // Edge cases: dragged above all or below all cards
                if (!targetCard && cards.length > 0) {
                    const firstRect = cards[0].getBoundingClientRect();
                    const lastRect = cards[cards.length - 1].getBoundingClientRect();
                    if (pos.y < firstRect.top) {
                        targetCard = cards[0];
                        insertAfter = false;
                    } else if (pos.y > lastRect.bottom) {
                        targetCard = cards[cards.length - 1];
                        insertAfter = true;
                    }
                }

                // Update visual target indicators
                cards.forEach(c => c.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over'));
                if (targetCard) {
                    targetCard.classList.add(insertAfter ? 'drag-over-bottom' : 'drag-over-top');
                    currentTargetCard = targetCard;
                    currentInsertAfter = insertAfter;
                } else {
                    currentTargetCard = null;
                }
            }

            function onPointerUp() {
                cleanup();

                if (isActivelyDragging) {
                    card.classList.remove('is-dragging');
                    document.querySelectorAll('.task-card').forEach(c => {
                        c.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over');
                    });

                    if (currentTargetCard && currentTargetCard.dataset.id && currentTargetCard.dataset.id !== task.id) {
                        reorderTasks(task.id, currentTargetCard.dataset.id, currentInsertAfter);
                    }
                }
            }

            function cleanup() {
                if (isTouch) {
                    window.removeEventListener('touchmove', onPointerMove, { passive: false });
                    window.removeEventListener('touchend', onPointerUp);
                    window.removeEventListener('touchcancel', onPointerUp);
                } else {
                    window.removeEventListener('mousemove', onPointerMove);
                    window.removeEventListener('mouseup', onPointerUp);
                }
            }

            if (isTouch) {
                window.addEventListener('touchmove', onPointerMove, { passive: false });
                window.addEventListener('touchend', onPointerUp);
                window.addEventListener('touchcancel', onPointerUp);
            } else {
                window.addEventListener('mousemove', onPointerMove);
                window.addEventListener('mouseup', onPointerUp);
            }
        }

        handle.addEventListener('touchstart', startDragging, { passive: false });
        handle.addEventListener('mousedown', startDragging);
    }

    // --- FOCUS / POMODORO TIMER ENGINE ---
    let focusState = {
        taskId: null,
        taskTitle: '',
        totalSeconds: 25 * 60,
        remainingSeconds: 25 * 60,
        isRunning: false,
        intervalId: null
    };

    function playFocusChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.3); // A5
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 1.2);
        } catch (e) {
            // Audio context not available
        }
    }

    function openFocusModal(task) {
        focusState.taskId = task.id;
        focusState.taskTitle = task.title;
        focusState.totalSeconds = 25 * 60;
        focusState.remainingSeconds = 25 * 60;
        focusState.isRunning = false;
        clearInterval(focusState.intervalId);

        const modal = document.getElementById('focus-modal');
        const titleEl = document.getElementById('focus-task-title');
        const toggleIcon = document.getElementById('focus-toggle-icon');
        const toggleLabel = document.getElementById('focus-toggle-label');
        const statusLabel = document.getElementById('focus-status-label');

        if (titleEl) titleEl.textContent = task.title;
        if (toggleIcon) toggleIcon.className = 'fa-solid fa-play';
        if (toggleLabel) toggleLabel.textContent = 'Start Focus';
        if (statusLabel) statusLabel.textContent = 'Ready to Focus';

        document.querySelectorAll('.btn-focus-preset').forEach(b => {
            b.classList.toggle('active', b.dataset.minutes === '25');
        });

        updateFocusTimerDisplay();
        if (modal) modal.classList.remove('hide');
    }

    function closeFocusModal() {
        const modal = document.getElementById('focus-modal');
        if (modal) modal.classList.add('hide');
        if (focusState.isRunning) {
            clearInterval(focusState.intervalId);
            focusState.isRunning = false;
        }
    }

    function updateFocusTimerDisplay() {
        const timeText = document.getElementById('focus-time-text');
        const ringFill = document.getElementById('focus-ring-fill');
        const mins = Math.floor(focusState.remainingSeconds / 60);
        const secs = focusState.remainingSeconds % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        if (timeText) timeText.textContent = timeStr;

        if (ringFill) {
            const circumference = 2 * Math.PI * 88; // ~553
            const progress = (focusState.totalSeconds - focusState.remainingSeconds) / focusState.totalSeconds;
            const offset = circumference * (1 - progress);
            ringFill.style.strokeDashoffset = offset;
        }
    }

    function toggleFocusTimer() {
        const toggleIcon = document.getElementById('focus-toggle-icon');
        const toggleLabel = document.getElementById('focus-toggle-label');
        const statusLabel = document.getElementById('focus-status-label');

        if (focusState.isRunning) {
            clearInterval(focusState.intervalId);
            focusState.isRunning = false;
            if (toggleIcon) toggleIcon.className = 'fa-solid fa-play';
            if (toggleLabel) toggleLabel.textContent = 'Resume';
            if (statusLabel) statusLabel.textContent = 'Paused';
        } else {
            focusState.isRunning = true;
            if (toggleIcon) toggleIcon.className = 'fa-solid fa-pause';
            if (toggleLabel) toggleLabel.textContent = 'Pause';
            if (statusLabel) statusLabel.textContent = 'Session Active';

            focusState.intervalId = setInterval(() => {
                if (focusState.remainingSeconds > 0) {
                    focusState.remainingSeconds--;
                    updateFocusTimerDisplay();
                } else {
                    clearInterval(focusState.intervalId);
                    focusState.isRunning = false;
                    playFocusChime();
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                    if (statusLabel) statusLabel.textContent = 'Session Complete! 🎉';
                    if (toggleIcon) toggleIcon.className = 'fa-solid fa-play';
                    if (toggleLabel) toggleLabel.textContent = 'Start Focus';

                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('Focus Session Complete! 🏆', {
                            body: `Awesome job! You completed a focus session for "${focusState.taskTitle}".`,
                            icon: 'assets/icon/favicon.png'
                        });
                    }
                    showToast('Focus session complete! 🎉 Great job!');
                }
            }, 1000);
        }
    }

    function resetFocusTimer() {
        clearInterval(focusState.intervalId);
        focusState.isRunning = false;
        focusState.remainingSeconds = focusState.totalSeconds;
        const toggleIcon = document.getElementById('focus-toggle-icon');
        const toggleLabel = document.getElementById('focus-toggle-label');
        const statusLabel = document.getElementById('focus-status-label');
        if (toggleIcon) toggleIcon.className = 'fa-solid fa-play';
        if (toggleLabel) toggleLabel.textContent = 'Start Focus';
        if (statusLabel) statusLabel.textContent = 'Ready to Focus';
        updateFocusTimerDisplay();
    }

    // --- DAILY MORNING DIGEST NOTIFICATION ---
    function checkDailyDigestNotification() {
        if (!state.profile.dailyDigestEnabled) return;
        const today = getTodayStr();
        if (state.profile.lastDigestDate === today) return;

        const now = new Date();
        const currentHH = String(now.getHours()).padStart(2, '0');
        const currentMM = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHH}:${currentMM}`;
        const targetTime = state.profile.dailyDigestTime || '08:00';

        if (currentTime >= targetTime) {
            const todayCount = state.tasks.filter(t => isTaskToday(t) && !t.completed).length;
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('☀️ RoutineCraft Daily Briefing', {
                    body: `Good morning! You have ${todayCount} task${todayCount === 1 ? '' : 's'} scheduled for today.`,
                    icon: 'assets/icon/favicon.png'
                });
            }
            state.profile.lastDigestDate = today;
            saveState();
        }
    }

    function createTaskCardElement(task) {
        const card = document.createElement('div');
        const overdue = isTaskOverdue(task);
        const upcoming = isTaskUpcoming(task);
        card.className = `task-card ${task.completed ? 'completed' : ''} ${overdue ? 'is-overdue' : ''}`;
        card.dataset.id = task.id;

        const catInfo = CATEGORIES[task.category] || { label: task.category, icon: 'fa-tag' };
        const priorityLabels = { high: 'High', medium: 'Med', low: 'Low' };

        let subtasksHtml = '';
        if (task.subtasks && task.subtasks.length > 0) {
            const completedSub = task.subtasks.filter(s => s.completed).length;
            subtasksHtml = `
                <div class="subtasks-container">
                    <div class="subtask-progress-summary" style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px;">
                        Checklist: ${completedSub}/${task.subtasks.length}
                    </div>
                    ${task.subtasks.map(s => `
                        <div class="subtask-item ${s.completed ? 'completed' : ''}">
                            <input type="checkbox" class="custom-checkbox subtask-checkbox" data-sub-id="${s.id}" ${s.completed ? 'checked' : ''}>
                            <span>${escapeHtml(s.title)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Quick Reschedule / Postpone button text
        let quickDateActionBtn = '';
        if (overdue) {
            quickDateActionBtn = `<button class="action-btn postpone-btn" data-action="to-today" title="Move to Today"><i class="fa-solid fa-calendar-check"></i></button>`;
        } else if (!task.completed) {
            quickDateActionBtn = `<button class="action-btn postpone-btn" data-action="to-tomorrow" title="Postpone to Tomorrow"><i class="fa-solid fa-calendar-plus"></i></button>`;
        }

        card.innerHTML = `
            <div class="swipe-reveal-left"><i class="fa-solid fa-check"></i> <span>Complete</span></div>
            <div class="swipe-reveal-right">
                <button type="button" class="swipe-action-btn swipe-action-reschedule" data-action="reschedule" title="Postpone to Tomorrow"><i class="fa-solid fa-calendar-plus"></i></button>
                <button type="button" class="swipe-action-btn swipe-action-delete" data-action="delete" title="Delete Task"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <div class="task-card-inner">
                <div class="drag-handle" title="Hold & drag to reorder"><i class="fa-solid fa-grip-vertical"></i></div>
                <input type="checkbox" class="custom-checkbox task-main-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <div class="task-meta-row">
                        <span class="badge badge-category"><i class="fa-solid ${catInfo.icon}"></i> ${catInfo.label}</span>
                        <span class="badge badge-priority-${task.priority}">${priorityLabels[task.priority]}</span>
                        ${overdue ? `<span class="badge badge-overdue"><i class="fa-solid fa-clock"></i> Overdue</span>` : ''}
                        ${upcoming ? `<span class="badge badge-date"><i class="fa-regular fa-calendar"></i> ${task.dueDate}</span>` : ''}
                        ${!overdue && !upcoming && task.dueDate && task.dueDate !== getTodayStr() ? `<span class="badge badge-date"><i class="fa-regular fa-calendar"></i> ${task.dueDate}</span>` : ''}
                        ${task.dueTime ? `<span class="badge badge-time"><i class="fa-regular fa-clock"></i> ${task.dueTime}</span>` : ''}
                        ${task.recurring && task.recurring !== 'none' ? `<span class="badge badge-recurring"><i class="fa-solid fa-repeat"></i> ${task.recurring}</span>` : ''}
                    </div>
                    ${subtasksHtml}
                </div>
                <div class="task-actions">
                    ${quickDateActionBtn}
                    <button type="button" class="action-btn focus-btn" title="Focus Timer (Pomodoro)"><i class="fa-solid fa-stopwatch"></i></button>
                    <button type="button" class="action-btn edit-btn" title="Edit Task"><i class="fa-solid fa-pen"></i></button>
                    <button type="button" class="action-btn delete-btn" title="Delete Task"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;

        // Checkbox Listener
        const mainCheckbox = card.querySelector('.task-main-checkbox');
        mainCheckbox.addEventListener('change', (e) => {
            toggleTaskComplete(task.id, e.target.checked);
        });

        // Subtask Checkbox Listeners
        card.querySelectorAll('.subtask-checkbox').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const subId = chk.dataset.subId;
                toggleSubtaskComplete(task.id, subId, e.target.checked);
            });
        });

        // Quick Postpone / Move button
        const postponeBtn = card.querySelector('.postpone-btn');
        if (postponeBtn) {
            postponeBtn.addEventListener('click', () => {
                const act = postponeBtn.dataset.action;
                if (act === 'to-today') {
                    task.dueDate = getTodayStr();
                    saveState();
                    renderTasks();
                    showToast(`Moved "${task.title}" to Today! 🗓️`);
                } else if (act === 'to-tomorrow') {
                    task.dueDate = getFutureDateStr(1);
                    saveState();
                    renderTasks();
                    showToast(`Postponed "${task.title}" to Tomorrow! 🗓️`);
                }
            });
        }

        // Focus button listener
        const focusBtn = card.querySelector('.focus-btn');
        if (focusBtn) {
            focusBtn.addEventListener('click', () => {
                openFocusModal(task);
            });
        }

        // Edit button
        card.querySelector('.edit-btn').addEventListener('click', () => {
            openTaskModal(task);
        });

        // Delete button with undo option
        card.querySelector('.delete-btn').addEventListener('click', () => {
            deleteTask(task.id);
        });

        // --- SWIPE GESTURE INTERACTIONS ---
        const inner = card.querySelector('.task-card-inner');
        let startX = 0;
        let startY = 0;
        let currentDiffX = 0;

        inner.addEventListener('touchstart', (e) => {
            if (e.target.closest('.drag-handle') || e.target.closest('.custom-checkbox') || e.target.closest('.action-btn')) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            currentDiffX = 0;
        }, { passive: true });

        inner.addEventListener('touchmove', (e) => {
            if (!startX) return;
            const diffX = e.touches[0].clientX - startX;
            const diffY = e.touches[0].clientY - startY;

            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
                if (diffX > 0) {
                    card.classList.add('is-swiping-right');
                    card.classList.remove('is-swiping-left');
                } else {
                    card.classList.add('is-swiping-left');
                    card.classList.remove('is-swiping-right');
                }
                card.classList.add('is-swiping');
                currentDiffX = Math.max(-100, Math.min(110, diffX));
                inner.style.transform = `translateX(${currentDiffX}px)`;
            }
        }, { passive: true });

        inner.addEventListener('touchend', () => {
            card.classList.remove('is-swiping', 'is-swiping-left', 'is-swiping-right');
            if (currentDiffX > 75) {
                inner.style.transform = 'translateX(100%)';
                card.classList.remove('swipe-revealed');
                if (navigator.vibrate) try { navigator.vibrate(35); } catch(e) {}
                setTimeout(() => {
                    toggleTaskComplete(task.id, !task.completed);
                }, 180);
            } else if (currentDiffX < -60) {
                inner.style.transform = 'translateX(-85px)';
                card.classList.add('swipe-revealed');
            } else {
                inner.style.transform = '';
                card.classList.remove('swipe-revealed');
            }
            startX = 0;
            currentDiffX = 0;
        });

        inner.addEventListener('click', () => {
            if (card.classList.contains('swipe-revealed') || (inner.style.transform && inner.style.transform !== 'translateX(0px)')) {
                inner.style.transform = '';
                card.classList.remove('swipe-revealed');
            }
        });

        // Swipe Action Buttons (Reschedule / Delete)
        card.querySelector('.swipe-action-reschedule').addEventListener('click', () => {
            task.dueDate = getFutureDateStr(1);
            saveState();
            renderTasks();
            showToast(`Postponed "${task.title}" to Tomorrow! 🗓️`);
        });

        card.querySelector('.swipe-action-delete').addEventListener('click', () => {
            deleteTask(task.id);
        });

        // --- DRAG AND DROP REORDERING HANDLERS ---
        const dragHandle = card.querySelector('.drag-handle');
        attachDragHandleListeners(dragHandle, card, task);

        // Native HTML5 fallback drag-over and drop support
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
            const rect = card.getBoundingClientRect();
            const insertAfter = e.clientY > (rect.top + rect.height / 2);
            card.classList.toggle('drag-over-bottom', insertAfter);
            card.classList.toggle('drag-over-top', !insertAfter);
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
            const targetId = card.dataset.id;
            const rect = card.getBoundingClientRect();
            const insertAfter = e.clientY > (rect.top + rect.height / 2);
            if (draggedTaskId && targetId && draggedTaskId !== targetId) {
                reorderTasks(draggedTaskId, targetId, insertAfter);
            }
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('is-dragging');
            document.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom'));
            draggedTaskId = null;
        });

        return card;
    }

    function toggleTaskComplete(taskId, isCompleted) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = isCompleted;
            task.completedAt = isCompleted ? new Date().toISOString() : null;

            if (task.subtasks) {
                task.subtasks.forEach(s => s.completed = isCompleted);
            }

            // Haptic feedback for tactile satisfaction on Android
            if (navigator.vibrate) {
                try { navigator.vibrate(isCompleted ? 24 : 12); } catch (e) {}
            }

            recordCompletionActivity(isCompleted);

            if (isCompleted) {
                showToast('Task completed! 🎉');
            }

            saveState();
            renderTasks();
            checkAutoBackupSchedule();

            // Confetti on 100% completion
            if (isCompleted) {
                setTimeout(() => checkConfetti(), 400);
            }
        }
    }

    function toggleSubtaskComplete(taskId, subId, isCompleted) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task && task.subtasks) {
            const sub = task.subtasks.find(s => s.id === subId);
            if (sub) {
                sub.completed = isCompleted;

                // Subtle haptic tick for subtasks
                if (navigator.vibrate) {
                    try { navigator.vibrate(14); } catch (e) {}
                }

                const allSubDone = task.subtasks.every(s => s.completed);
                if (allSubDone) {
                    task.completed = true;
                    task.completedAt = new Date().toISOString();
                    recordCompletionActivity(true);
                } else if (task.completed) {
                    task.completed = false;
                    task.completedAt = null;
                    recordCompletionActivity(false);
                }

                saveState();
                renderTasks();
                checkAutoBackupSchedule();
            }
        }
    }

    function deleteTask(taskId) {
        const index = state.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            const deleted = state.tasks[index];
            state.lastDeletedTask = { task: deleted, index: index };
            state.tasks.splice(index, 1);
            saveState();
            renderTasks();
            showToastWithUndo(`Deleted "${deleted.title}"`, () => {
                if (state.lastDeletedTask) {
                    state.tasks.splice(state.lastDeletedTask.index, 0, state.lastDeletedTask.task);
                    state.lastDeletedTask = null;
                    saveState();
                    renderTasks();
                    showToast('Task restored! ↩️');
                }
            });
        }
    }

    // --- QUICK ADD HANDLER ---
    function handleQuickAdd() {
        const title = dom.quickTaskInput.value.trim();
        if (!title) return;

        const newTask = {
            id: 'task-' + Date.now(),
            title: title,
            category: state.activeCategory === 'all' ? 'personal' : state.activeCategory,
            priority: 'medium',
            dueDate: getTodayStr(),
            dueTime: '',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        };

        state.tasks.unshift(newTask);
        dom.quickTaskInput.value = '';
        saveState();
        renderTasks();
        showToast(`Added "${title}" to Today! 🎯`);
    }

    // --- RESCHEDULE ALL OVERDUE TO TODAY ---
    function rescheduleAllOverdueToToday() {
        const today = getTodayStr();
        let count = 0;
        state.tasks.forEach(t => {
            if (isTaskOverdue(t)) {
                t.dueDate = today;
                count++;
            }
        });

        if (count > 0) {
            saveState();
            renderTasks();
            showToast(`Moved ${count} overdue task(s) to Today! 🗓️`);
        }
    }

    // --- REMINDER BANNER ---
    function checkReminderNotification() {
        if (!dom.reminderBanner) return;
        if (state.reminderDismissedToday) {
            dom.reminderBanner.classList.add('hide');
            return;
        }
        const todayPending = state.tasks.filter(t => !t.completed && isTaskToday(t));
        if (todayPending.length > 0) {
            dom.reminderBanner.classList.remove('hide');
            if (dom.reminderTitle) dom.reminderTitle.textContent = `Today's Action Items (${todayPending.length})`;
            if (dom.reminderDesc) dom.reminderDesc.textContent = `Next task: "${todayPending[0].title}"`;
        } else {
            dom.reminderBanner.classList.add('hide');
        }
    }

    // --- TASK MODAL (CREATE / EDIT) ---
    function openTaskModal(taskToEdit = null) {
        state.tempSubtasks = [];
        dom.subtaskBuilderList.innerHTML = '';
        renderCategorySelectOptions();

        if (taskToEdit) {
            dom.modalHeading.textContent = 'Edit Task';
            dom.taskIdInput.value = taskToEdit.id;
            dom.taskTitleInput.value = taskToEdit.title;
            dom.taskCategorySelect.value = taskToEdit.category;
            dom.taskPrioritySelect.value = taskToEdit.priority;
            dom.taskDateInput.value = taskToEdit.dueDate || getTodayStr();
            dom.taskTimeInput.value = taskToEdit.dueTime || '';
            dom.taskRecurringSelect.value = taskToEdit.recurring || 'none';

            if (taskToEdit.subtasks) {
                state.tempSubtasks = JSON.parse(JSON.stringify(taskToEdit.subtasks));
                renderTempSubtasks();
            }
        } else {
            dom.modalHeading.textContent = 'Create New Task';
            dom.taskForm.reset();
            dom.taskIdInput.value = '';
            dom.taskDateInput.value = getTodayStr();
            dom.taskCategorySelect.value = state.activeCategory === 'all' ? 'personal' : state.activeCategory;
            dom.taskPrioritySelect.value = 'medium';
        }

        dom.taskModal.classList.remove('hide');
        setTimeout(() => dom.taskTitleInput.focus(), 100);
    }

    function closeTaskModal() {
        dom.taskModal.classList.add('hide');
    }

    function renderTempSubtasks() {
        dom.subtaskBuilderList.innerHTML = '';
        state.tempSubtasks.forEach((sub, idx) => {
            const li = document.createElement('li');
            li.className = 'subtask-builder-item';
            li.innerHTML = `
                <span>${escapeHtml(sub.title)}</span>
                <button type="button" class="remove-temp-sub" data-idx="${idx}"><i class="fa-solid fa-xmark"></i></button>
            `;
            li.querySelector('.remove-temp-sub').addEventListener('click', () => {
                state.tempSubtasks.splice(idx, 1);
                renderTempSubtasks();
            });
            dom.subtaskBuilderList.appendChild(li);
        });
    }

    function handleAddSubtask() {
        const val = dom.subtaskBuilderInput.value.trim();
        if (val) {
            state.tempSubtasks.push({
                id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                title: val,
                completed: false
            });
            dom.subtaskBuilderInput.value = '';
            renderTempSubtasks();
        }
    }

    // --- PROFILE & SETTINGS MODAL ---
    function renderUsersGrid() {
        dom.usersListGrid.innerHTML = '';
        Object.keys(usersStore).forEach(email => {
            const userObj = usersStore[email];
            const isActive = (email === activeEmail);

            const item = document.createElement('div');
            item.className = `user-account-item ${isActive ? 'active' : ''}`;
            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:1.1rem;">${userObj.profile.avatar || '👤'}</span>
                    <div style="display:flex; flex-direction:column;">
                        <strong style="font-size:0.86rem; color:var(--text-primary);">${escapeHtml(userObj.profile.name || email)}</strong>
                        <span style="font-size:0.72rem; color:var(--text-secondary);">${escapeHtml(email)}</span>
                    </div>
                </div>
                ${isActive ? '<span style="font-size:0.74rem; font-weight:700; color:var(--accent-primary);"><i class="fa-solid fa-check"></i> Active</span>' : '<span style="font-size:0.74rem; color:var(--text-muted);">Switch</span>'}
            `;

            item.addEventListener('click', () => {
                if (!isActive) switchUserAccount(email);
            });
            dom.usersListGrid.appendChild(item);
        });
    }

    function renderSettingsContent() {
        dom.profileNameInput.value = state.profile.name;
        dom.avatarOpts.forEach(opt => {
            if (opt.dataset.avatar === state.profile.avatar) opt.classList.add('active');
            else opt.classList.remove('active');
        });
        renderAccountStatusBar();
        renderUsersGrid();

        // Sync interface preference toggles
        const catToggle = document.getElementById('toggle-category-filters');
        const qaToggle = document.getElementById('toggle-quick-add-bar');
        if (catToggle) catToggle.checked = state.profile.showCategoryFilters !== false;
        if (qaToggle) qaToggle.checked = state.profile.showQuickAddBar !== false;

        // Render categories management list in Settings
        renderCategoriesManageList();

        // Sync Daily Digest Notification settings
        const digestToggle = document.getElementById('toggle-daily-digest');
        const digestTimeContainer = document.getElementById('digest-time-container');
        const digestTimeInput = document.getElementById('digest-time-input');
        if (digestToggle) digestToggle.checked = Boolean(state.profile.dailyDigestEnabled);
        if (digestTimeContainer) digestTimeContainer.classList.toggle('hide', !state.profile.dailyDigestEnabled);
        if (digestTimeInput) digestTimeInput.value = state.profile.dailyDigestTime || '08:00';
    }

    // Apply interface preferences to the Tasks page elements
    function applyInterfacePrefs() {
        const catContainer = document.getElementById('categories-container');
        const qaBar = document.querySelector('.quick-add-bar');

        if (catContainer) {
            catContainer.classList.toggle('hide', !state.profile.showCategoryFilters);
        }
        if (qaBar) {
            qaBar.classList.toggle('hide', !state.profile.showQuickAddBar);
        }
    }

    function openProfileModal() {
        switchPageView('settings');
    }

    function closeProfileModal() {
        switchPageView('tasks');
    }

    function closeAllModals() {
        dom.taskModal.classList.add('hide');
        if (dom.gdrivePermissionModal) dom.gdrivePermissionModal.classList.add('hide');
        if (dom.updateModal) dom.updateModal.classList.add('hide');
        const focusModal = document.getElementById('focus-modal');
        if (focusModal) focusModal.classList.add('hide');
        const catModal = document.getElementById('add-category-modal');
        if (catModal) catModal.classList.add('hide');
    }

    // --- GITHUB RELEASES IN-APP UPDATE ENGINE ---
    function isNewerVersion(remoteVer, currentVer) {
        const r = String(remoteVer).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
        const c = String(currentVer).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
        for (let i = 0; i < Math.max(r.length, c.length); i++) {
            const rPart = r[i] || 0;
            const cPart = c[i] || 0;
            if (rPart > cPart) return true;
            if (rPart < cPart) return false;
        }
        return false;
    }

    async function checkForAppUpdates(isManual = false) {
        const repo = (dom.githubRepoInput && dom.githubRepoInput.value.trim()) || DEFAULT_GITHUB_REPO;
        if (dom.updateStatusText) {
            dom.updateStatusText.textContent = `Checking GitHub (${repo})...`;
        }
        if (isManual) {
            showToast('Checking GitHub for new APK release... 🔄');
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });

            if (response.status === 200) {
                const release = await response.json();
                const remoteTag = release.tag_name || release.name || '';

                if (isNewerVersion(remoteTag, APP_RELEASE_VERSION)) {
                    // Look for APK download asset
                    const apkAsset = (release.assets || []).find(a => a.name && a.name.toLowerCase().endsWith('.apk'));
                    const downloadUrl = apkAsset ? apkAsset.browser_download_url : (release.html_url || `https://github.com/${repo}/releases`);

                    if (dom.modalCurrVer) dom.modalCurrVer.textContent = 'v' + APP_RELEASE_VERSION;
                    if (dom.modalNewVer) dom.modalNewVer.textContent = remoteTag.startsWith('v') ? remoteTag : 'v' + remoteTag;
                    if (dom.updateReleaseTitle) dom.updateReleaseTitle.textContent = release.name || `Release ${remoteTag}`;
                    if (dom.updateReleaseNotes) dom.updateReleaseNotes.textContent = release.body || 'New features, bug fixes, and performance updates!';
                    if (dom.downloadUpdateBtn) dom.downloadUpdateBtn.href = downloadUrl;

                    if (dom.updateModal) dom.updateModal.classList.remove('hide');
                    if (dom.updateStatusText) dom.updateStatusText.textContent = `New update ${remoteTag} available! 🚀`;
                    showToast(`New update ${remoteTag} available! 🚀`);
                    return;
                } else {
                    if (dom.updateStatusText) dom.updateStatusText.textContent = `Up to date (v${APP_RELEASE_VERSION}) on GitHub`;
                    if (isManual) {
                        showToast(`You have the latest version (v${APP_RELEASE_VERSION})! ✨`);
                    }
                    return;
                }
            } else if (response.status === 404) {
                if (dom.updateStatusText) dom.updateStatusText.textContent = `No releases published on ${repo} yet.`;
                if (isManual) {
                    showToast(`No releases published on GitHub yet. You are on v${APP_RELEASE_VERSION}.`);
                }
            } else {
                if (dom.updateStatusText) dom.updateStatusText.textContent = `GitHub status: ${response.statusText}`;
                if (isManual) {
                    showToast(`GitHub status: ${response.statusText}`);
                }
            }
        } catch (err) {
            console.warn('Update check failed:', err);
            if (dom.updateStatusText) dom.updateStatusText.textContent = 'Could not connect to GitHub. Check internet.';
            if (isManual) {
                showToast('Could not check updates. Check your internet connection.');
            }
        }
    }

    // --- EVENT LISTENERS SETUP ---
    function setupEventListeners() {
        // In-App Updates Listeners
        if (dom.checkUpdatesBtn) {
            dom.checkUpdatesBtn.addEventListener('click', () => checkForAppUpdates(true));
        }
        if (dom.closeUpdateModalBtn) {
            dom.closeUpdateModalBtn.addEventListener('click', () => dom.updateModal.classList.add('hide'));
        }
        if (dom.dismissUpdateBtn) {
            dom.dismissUpdateBtn.addEventListener('click', () => dom.updateModal.classList.add('hide'));
        }
        // Quick Add Listeners
        if (dom.quickAddSubmitBtn) {
            dom.quickAddSubmitBtn.addEventListener('click', handleQuickAdd);
        }
        if (dom.quickTaskInput) {
            dom.quickTaskInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAdd();
                }
            });
        }

        // Reschedule All Overdue to Today
        if (dom.rescheduleAllBtn) {
            dom.rescheduleAllBtn.addEventListener('click', rescheduleAllOverdueToToday);
        }

        // Search Input & Toggle
        const searchToggleBtn = document.getElementById('search-toggle-btn');
        const collapsibleSearchBar = document.getElementById('collapsible-search-bar');
        if (searchToggleBtn && collapsibleSearchBar) {
            searchToggleBtn.addEventListener('click', () => {
                collapsibleSearchBar.classList.toggle('hide');
                if (!collapsibleSearchBar.classList.contains('hide') && dom.searchInput) {
                    dom.searchInput.focus();
                }
            });
        }

        if (dom.searchInput) {
            dom.searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value;
                if (dom.clearSearchBtn) {
                    if (state.searchQuery) dom.clearSearchBtn.classList.remove('hide');
                    else dom.clearSearchBtn.classList.add('hide');
                }
                renderTasks();
            });
        }

        if (dom.clearSearchBtn) {
            dom.clearSearchBtn.addEventListener('click', () => {
                if (dom.searchInput) dom.searchInput.value = '';
                state.searchQuery = '';
                dom.clearSearchBtn.classList.add('hide');
                renderTasks();
            });
        }

        // Category Chips
        dom.categoriesContainer.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                dom.categoriesContainer.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                state.activeCategory = chip.dataset.category;
                renderTasks();
            });
        });

        // Filter Tabs
        dom.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                dom.filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.activeFilter = tab.dataset.filter;
                renderTasks();
            });
        });

        // Sort Menu
        dom.sortTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dom.sortMenu.classList.toggle('hide');
        });

        document.addEventListener('click', () => {
            dom.sortMenu.classList.add('hide');
        });

        dom.sortMenu.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                dom.sortMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.sortBy = btn.dataset.sort;
                dom.sortMenu.classList.add('hide');
                renderTasks();
            });
        });

        // FAB and Add Buttons
        dom.fabAddBtn.addEventListener('click', () => openTaskModal());
        dom.emptyAddBtn.addEventListener('click', () => openTaskModal());
        dom.closeTaskModalBtn.addEventListener('click', closeTaskModal);
        dom.cancelTaskBtn.addEventListener('click', closeTaskModal);

        // Date Presets in Modal
        dom.datePresetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                if (preset === 'today') dom.taskDateInput.value = getTodayStr();
                else if (preset === 'tomorrow') dom.taskDateInput.value = getFutureDateStr(1);
                else if (preset === 'in3days') dom.taskDateInput.value = getFutureDateStr(3);
                else if (preset === 'nextweek') dom.taskDateInput.value = getFutureDateStr(7);
            });
        });

        // Subtask Input Keyboard & Button
        dom.addSubtaskBtn.addEventListener('click', handleAddSubtask);
        dom.subtaskBuilderInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSubtask();
            }
        });

        // Task Form Submit
        dom.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = dom.taskIdInput.value;
            const title = dom.taskTitleInput.value.trim();
            const category = dom.taskCategorySelect.value;
            const priority = dom.taskPrioritySelect.value;
            const dueDate = dom.taskDateInput.value || getTodayStr();
            const dueTime = dom.taskTimeInput.value;
            const recurring = dom.taskRecurringSelect.value;

            if (!title) return;

            if (id) {
                const task = state.tasks.find(t => t.id === id);
                if (task) {
                    task.title = title;
                    task.category = category;
                    task.priority = priority;
                    task.dueDate = dueDate;
                    task.dueTime = dueTime;
                    task.recurring = recurring;
                    task.subtasks = [...state.tempSubtasks];
                }
                showToast('Task updated!');
            } else {
                const newTask = {
                    id: 'task-' + Date.now(),
                    title: title,
                    category: category,
                    priority: priority,
                    dueDate: dueDate,
                    dueTime: dueTime,
                    recurring: recurring,
                    completed: false,
                    completedAt: null,
                    createdAt: new Date().toISOString(),
                    subtasks: [...state.tempSubtasks]
                };
                state.tasks.unshift(newTask);

                if (dueDate > getTodayStr()) {
                    showToast(`Scheduled for ${dueDate}! 🗓️`);
                } else {
                    showToast('Task added to Today! 🎯');
                }
            }

            saveState();
            renderTasks();
            checkReminderNotification();
            checkAutoBackupSchedule();
            closeTaskModal();
        });

        // Notification Permission Toggle
        dom.notifyBtn.addEventListener('click', () => {
            if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                    state.profile.notificationsEnabled = !state.profile.notificationsEnabled;
                    saveState();
                    renderHeaderProfile();
                    showToast(state.profile.notificationsEnabled ? 'Reminders enabled! 🔔' : 'Reminders muted');
                } else {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            state.profile.notificationsEnabled = true;
                            saveState();
                            renderHeaderProfile();
                            showToast('Desktop notifications enabled! 🔔');
                        } else {
                            showToast('Notification permission denied.');
                        }
                    });
                }
            } else {
                showToast('Notifications not supported in this browser.');
            }
        });

        dom.dismissReminderBtn.addEventListener('click', () => {
            state.reminderDismissedToday = true;
            dom.reminderBanner.classList.add('hide');
        });

        // Profile, Theme & Account Controls
        dom.profileTrigger.addEventListener('click', openProfileModal);
        dom.closeProfileModalBtn.addEventListener('click', closeProfileModal);
        dom.quickThemeBtn.addEventListener('click', toggleThemeMode);
        dom.streakBtn.addEventListener('click', openAnalyticsModal);
        dom.closeAnalyticsModalBtn.addEventListener('click', closeAnalyticsModal);
        dom.closeAnalyticsBtn.addEventListener('click', closeAnalyticsModal);

        dom.avatarOpts.forEach(opt => {
            opt.addEventListener('click', () => {
                dom.avatarOpts.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                state.profile.avatar = opt.dataset.avatar;
            });
        });

        dom.themeModeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                applyTheme(btn.dataset.themeMode);
                saveState();
            });
        });

        dom.saveProfileBtn.addEventListener('click', () => {
            state.profile.name = dom.profileNameInput.value.trim() || 'Productivity Hero';
            state.profile.backupFrequency = dom.backupFrequencySelect.value;
            const catToggle = document.getElementById('toggle-category-filters');
            const qaToggle = document.getElementById('toggle-quick-add-bar');
            if (catToggle) state.profile.showCategoryFilters = catToggle.checked;
            if (qaToggle) state.profile.showQuickAddBar = qaToggle.checked;
            applyInterfacePrefs();
            saveState();
            renderHeaderProfile();
            closeProfileModal();
            showToast('Profile & Settings saved! ✅');
        });

        // Interface preference toggles (category filters & quick-add bar)
        document.addEventListener('change', (e) => {
            if (e.target.id === 'toggle-category-filters') {
                state.profile.showCategoryFilters = e.target.checked;
                saveState();
                applyInterfacePrefs();
            }
            if (e.target.id === 'toggle-quick-add-bar') {
                state.profile.showQuickAddBar = e.target.checked;
                saveState();
                applyInterfacePrefs();
            }
            if (e.target.id === 'toggle-daily-digest') {
                state.profile.dailyDigestEnabled = e.target.checked;
                const timeBox = document.getElementById('digest-time-container');
                if (timeBox) timeBox.classList.toggle('hide', !e.target.checked);
                if (e.target.checked && 'Notification' in window && Notification.permission !== 'granted') {
                    Notification.requestPermission();
                }
                saveState();
            }
            if (e.target.id === 'digest-time-input') {
                state.profile.dailyDigestTime = e.target.value || '08:00';
                saveState();
            }
        });

        // --- Custom Category Modal Listeners ---
        let selectedCatIcon = 'fa-tag';
        let selectedCatColor = '#2563eb';

        const openAddCategoryBtn = document.getElementById('open-add-category-btn');
        const addCategoryModal = document.getElementById('add-category-modal');
        const closeCategoryModalBtn = document.getElementById('close-category-modal');
        const cancelCategoryBtn = document.getElementById('cancel-category-btn');
        const addCategoryForm = document.getElementById('add-category-form');
        const newCategoryNameInput = document.getElementById('new-category-name');

        if (openAddCategoryBtn) {
            openAddCategoryBtn.addEventListener('click', () => {
                selectedCatIcon = 'fa-tag';
                selectedCatColor = '#2563eb';
                if (newCategoryNameInput) newCategoryNameInput.value = '';
                document.querySelectorAll('.cat-icon-opt').forEach(b => b.classList.toggle('active', b.dataset.icon === 'fa-tag'));
                document.querySelectorAll('.cat-color-opt').forEach(b => b.classList.toggle('active', b.dataset.color === '#2563eb'));
                if (addCategoryModal) addCategoryModal.classList.remove('hide');
            });
        }

        if (closeCategoryModalBtn) {
            closeCategoryModalBtn.addEventListener('click', () => addCategoryModal.classList.add('hide'));
        }
        if (cancelCategoryBtn) {
            cancelCategoryBtn.addEventListener('click', () => addCategoryModal.classList.add('hide'));
        }

        document.querySelectorAll('.cat-icon-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-icon-opt').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedCatIcon = btn.dataset.icon || 'fa-tag';
            });
        });

        document.querySelectorAll('.cat-color-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-color-opt').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedCatColor = btn.dataset.color || '#2563eb';
            });
        });

        if (addCategoryForm) {
            addCategoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = (newCategoryNameInput.value || '').trim();
                if (!name) return;

                const catKey = 'custom_' + Date.now();
                if (!state.customCategories) state.customCategories = {};
                state.customCategories[catKey] = {
                    label: name,
                    icon: selectedCatIcon,
                    color: selectedCatColor
                };

                saveState();
                renderCategoryFilters();
                renderCategorySelectOptions();
                renderCategoriesManageList();
                renderTasks();
                addCategoryModal.classList.add('hide');
                showToast(`Category "${name}" added! 🏷️`);
            });
        }

        // --- Focus Modal Listeners ---
        const focusModal = document.getElementById('focus-modal');
        const closeFocusModalBtn = document.getElementById('close-focus-modal');
        const focusToggleBtn = document.getElementById('focus-toggle-btn');
        const focusResetBtn = document.getElementById('focus-reset-btn');
        const focusCompleteBtn = document.getElementById('focus-complete-btn');

        if (closeFocusModalBtn) closeFocusModalBtn.addEventListener('click', closeFocusModal);
        if (focusToggleBtn) focusToggleBtn.addEventListener('click', toggleFocusTimer);
        if (focusResetBtn) focusResetBtn.addEventListener('click', resetFocusTimer);

        if (focusCompleteBtn) {
            focusCompleteBtn.addEventListener('click', () => {
                if (focusState.taskId) {
                    toggleTaskComplete(focusState.taskId, true);
                    playFocusChime();
                    showToast('Task completed! 🏆 Session saved.');
                }
                closeFocusModal();
            });
        }

        document.querySelectorAll('.btn-focus-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-focus-preset').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mins = parseInt(btn.dataset.minutes, 10) || 25;
                focusState.totalSeconds = mins * 60;
                resetFocusTimer();
            });
        });

        // Google Account Modal Controls (No browser prompt)
        dom.headerGoogleLoginBtn.addEventListener('click', openGoogleLoginModal);
        dom.switchAccountBtn.addEventListener('click', openProfileModal);
        dom.addNewAccountBtn.addEventListener('click', openGoogleLoginModal);
        dom.confirmGdrivePermBtn.addEventListener('click', confirmGoogleBackupPermission);
        dom.skipGdrivePermBtn.addEventListener('click', () => dom.gdrivePermissionModal.classList.add('hide'));
        dom.closeGdrivePermModalBtn.addEventListener('click', () => dom.gdrivePermissionModal.classList.add('hide'));

        // Preset account buttons in Google modal
        dom.btnChipAccounts.forEach(chip => {
            chip.addEventListener('click', () => {
                const em = chip.dataset.email;
                if (dom.gdriveEmailInput) dom.gdriveEmailInput.value = em;
            });
        });

        // Backup & Restore
        dom.gdriveBackupBtn.addEventListener('click', performManualBackup);
        dom.gdriveRestoreBtn.addEventListener('click', () => dom.importFileInput.click());
        dom.exportDataBtn.addEventListener('click', performManualBackup);
        dom.importDataBtn.addEventListener('click', () => dom.importFileInput.click());

        dom.importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const imported = JSON.parse(evt.target.result);
                    if (imported.tasks && imported.profile) {
                        state.tasks = imported.tasks;
                        state.profile = imported.profile;
                        if (imported.history) state.history = imported.history;
                        saveState();
                        applyTheme(state.profile.theme);
                        renderHeaderProfile();
                        renderTasks();
                        closeProfileModal();
                        showToast('Backup restored successfully! 🎉');
                    } else {
                        alert('Invalid backup file format.');
                    }
                } catch (err) {
                    alert('Error parsing JSON file.');
                }
            };
            reader.readAsText(file);
        });

        dom.resetDataBtn.addEventListener('click', () => {
            if (confirm(`Reset all tasks for ${state.profile.name} to defaults?`)) {
                state.tasks = [...DEFAULT_TASKS];
                saveState();
                renderTasks();
                closeProfileModal();
                showToast('Reset to starter tasks!');
            }
        });

        // Bottom Navigation Bar with Direct Page View Switch
        dom.bottomNavItems.forEach(nav => {
            nav.addEventListener('click', () => {
                switchPageView(nav.dataset.nav);
            });
        });

        // Dismiss floating modals when tapping backdrop outside the sheet/card
        [dom.taskModal, dom.updateModal, dom.gdrivePermissionModal, document.getElementById('focus-modal'), document.getElementById('add-category-modal')].forEach(overlay => {
            if (!overlay) return;
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.add('hide');
                }
            });
        });

        // Android Hardware & Gesture Back Button Support
        function handleAndroidBack() {
            const modals = [
                dom.taskModal,
                dom.updateModal,
                dom.gdrivePermissionModal,
                document.getElementById('focus-modal'),
                document.getElementById('add-category-modal')
            ];
            const openModal = modals.filter(m => m && !m.classList.contains('hide')).pop();
            if (openModal) {
                openModal.classList.add('hide');
                return true;
            }

            if (dom.sortMenu && !dom.sortMenu.classList.contains('hide')) {
                dom.sortMenu.classList.add('hide');
                return true;
            }

            // If not on tasks tab, return to Tasks tab first
            const activeNav = Array.from(dom.bottomNavItems).find(n => n.classList.contains('active'));
            if (activeNav && activeNav.dataset.nav !== 'tasks') {
                switchPageView('tasks');
                return true;
            }

            return false;
        }

        // Capacitor App back button event
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
                const handled = handleAndroidBack();
                if (!handled) {
                    if (canGoBack) {
                        window.history.back();
                    } else {
                        window.Capacitor.Plugins.App.exitApp();
                    }
                }
            });
        }

        // Cordova / Standard Android Back Button
        document.addEventListener('backbutton', (e) => {
            if (handleAndroidBack()) {
                e.preventDefault();
            }
        });

        // Browser history popstate (handles edge swipe back on mobile Chrome / WebViews)
        window.addEventListener('popstate', () => {
            handleAndroidBack();
        });
    }

    // --- TOAST NOTIFICATIONS & FEEDBACK ---
    function showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--accent-success);"></i> <span>${msg}</span>`;
        dom.toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    }

    function showToastWithUndo(msg, undoCallback) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <i class="fa-solid fa-trash-can" style="color:var(--accent-danger);"></i>
            <span>${msg}</span>
            <button class="toast-undo-btn">Undo</button>
        `;
        const undoBtn = toast.querySelector('.toast-undo-btn');
        undoBtn.addEventListener('click', () => {
            undoCallback();
            toast.remove();
        });
        dom.toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 4500);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
