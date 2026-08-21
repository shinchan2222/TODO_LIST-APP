/* ==========================================================================
   RoutineCraft - Personal Daily Task & Habit Tracker Logic
   With Native Android Local Push Notifications & Google Drive Backup
   ========================================================================== */

(function () {
    'use strict';

    const APP_VERSION = 19; // updated version
    const getTodayStr = () => new Date().toISOString().split('T')[0];

    const getPastDateStr = (daysAgo = 1) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
    };

    const getFutureDateStr = (daysAhead = 1) => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        return d.toISOString().split('T')[0];
    };

    // --- DEFAULT STARTER DATA ---
    const DEFAULT_PROFILE = {
        email: 'default_user@routinecraft.app',
        name: 'Productivity Hero',
        avatar: '🚀',
        theme: 'neon-cyber',
        streak: 5,
        completedDates: [
            getPastDateStr(5),
            getPastDateStr(4),
            getPastDateStr(3),
            getPastDateStr(2),
            getPastDateStr(1)
        ],
        completionHistory: {
            [getPastDateStr(5)]: 3,
            [getPastDateStr(4)]: 4,
            [getPastDateStr(3)]: 3,
            [getPastDateStr(2)]: 5,
            [getPastDateStr(1)]: 4
        },
        lastActiveDate: getTodayStr(),
        totalCompletedCount: 24,
        memberSince: getPastDateStr(30),
        bestStreak: 5,
        notificationsEnabled: true,
        summaryNotificationTime: '20:00',
        lastBackupTime: null,
        backupFrequency: 'daily',
        isGoogleSynced: false,
        restDays: [0], // Sunday
        streakFreezes: 2,
        soundHapticsEnabled: true,
        focusMinutes: 0,
        focusSessions: 0
    };

    const DEFAULT_TASKS = [
        {
            id: 'task-1',
            title: 'Gym workout',
            category: 'health',
            priority: 'high',
            dueDate: getTodayStr(),
            dueTime: '08:00',
            recurring: 'daily',
            completed: true,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-2',
            title: 'Project progress analysis',
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
            title: 'Laundry',
            category: 'personal',
            priority: 'medium',
            dueDate: getTodayStr(),
            dueTime: '11:30',
            recurring: 'none',
            completed: true,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-4',
            title: 'Meet up with friends',
            category: 'personal',
            priority: 'medium',
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
            title: 'Create an IG story',
            category: 'work',
            priority: 'medium',
            dueDate: getTodayStr(),
            dueTime: '17:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-6',
            title: 'Research flight deals',
            category: 'personal',
            priority: 'low',
            dueDate: getTodayStr(),
            dueTime: '19:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-7',
            title: 'Therapy session',
            category: 'health',
            priority: 'high',
            dueDate: getTodayStr(),
            dueTime: '20:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        // Tomorrow Tasks
        {
            id: 'task-tomorrow-1',
            title: 'Meal preparation',
            category: 'health',
            priority: 'high',
            dueDate: getFutureDateStr(1),
            dueTime: '09:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-tomorrow-2',
            title: 'Grocery shopping',
            category: 'personal',
            priority: 'medium',
            dueDate: getFutureDateStr(1),
            dueTime: '11:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-tomorrow-3',
            title: 'Study for next week\'s exam',
            category: 'work',
            priority: 'high',
            dueDate: getFutureDateStr(1),
            dueTime: '14:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-tomorrow-4',
            title: 'Delivery pickup',
            category: 'personal',
            priority: 'low',
            dueDate: getFutureDateStr(1),
            dueTime: '18:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-tomorrow-5',
            title: 'Bake a cake',
            category: 'personal',
            priority: 'low',
            dueDate: getFutureDateStr(1),
            dueTime: '20:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        }
    ];

    // --- MULTI-USER STORAGE & VERSION MIGRATION ---
    const savedVersion = parseInt(localStorage.getItem('routinecraft_version') || '0', 10);
    let usersStore = JSON.parse(localStorage.getItem('routinecraft_users')) || {};
    let activeEmail = localStorage.getItem('routinecraft_active_email') || 'default_user@routinecraft.app';

    if (!usersStore[activeEmail]) {
        usersStore[activeEmail] = {
            profile: JSON.parse(localStorage.getItem('routinecraft_profile')) || { ...DEFAULT_PROFILE },
            tasks: JSON.parse(localStorage.getItem('routinecraft_tasks')) || [...DEFAULT_TASKS]
        };
        localStorage.setItem('routinecraft_users', JSON.stringify(usersStore));
        localStorage.setItem('routinecraft_active_email', activeEmail);
        localStorage.setItem('routinecraft_version', APP_VERSION.toString());
    } else {
        Object.keys(usersStore).forEach(email => {
            if (!usersStore[email].profile.theme || usersStore[email].profile.theme === 'sunset-glow') {
                usersStore[email].profile.theme = 'neon-cyber';
            }
        });
        localStorage.setItem('routinecraft_users', JSON.stringify(usersStore));
    }

    // --- CURRENT ACTIVE USER STATE ---
    let state = {
        profile: usersStore[activeEmail].profile,
        tasks: usersStore[activeEmail].tasks,
        activeCategory: 'all',
        activeFilter: 'today',
        searchQuery: '',
        sortBy: 'default',
        tempSubtasks: [],
        pendingGoogleUser: null,
        statsTimeRange: 'week'
    };

    state.tasks.forEach(t => {
        if (!t.dueDate) t.dueDate = getTodayStr();
    });

    // --- CATEGORY CONFIGURATION ---
    const CATEGORIES = {
        morning: { label: 'Morning Routine', icon: 'fa-sun', color: '#fbbf24' },
        work: { label: 'Work & Study', icon: 'fa-briefcase', color: '#60a5fa' },
        health: { label: 'Health & Fitness', icon: 'fa-heart-pulse', color: '#34d399' },
        personal: { label: 'Personal Growth', icon: 'fa-user', color: '#a78bfa' },
        evening: { label: 'Evening Routine', icon: 'fa-moon', color: '#f472b6' }
    };

    // --- DOM ELEMENTS ---
    const dom = {
        body: document.body,
        userNameDisplay: document.getElementById('user-name-display'),
        userAvatar: document.getElementById('user-avatar'),
        onlineIndicator: document.querySelector('.online-indicator'),
        timeGreeting: document.getElementById('time-greeting'),
        streakCount: document.getElementById('streak-count'),
        streakBtn: document.getElementById('streak-btn'),
        notifyBtn: document.getElementById('notify-btn'),
        quickThemeBtn: document.getElementById('quick-theme-btn'),
        headerGoogleLoginBtn: document.getElementById('header-google-login-btn'),
        googleBtnText: document.getElementById('google-btn-text'),

        accountStatusBar: document.getElementById('account-status-bar'),
        accountEmailDisplay: document.getElementById('account-email-display'),
        accountFreqBadge: document.getElementById('account-freq-badge'),
        switchAccountBtn: document.getElementById('switch-account-btn'),
        logoutSettingsBtn: document.getElementById('logout-settings-btn'),

        gdrivePermissionModal: document.getElementById('gdrive-permission-modal'),
        closeGdrivePermModalBtn: document.getElementById('close-gdrive-perm-modal'),
        guserNameDisplay: document.getElementById('guser-name-display'),
        guserEmailDisplay: document.getElementById('guser-email-display'),
        guserAvatarDisplay: document.getElementById('guser-avatar-display'),
        confirmGdrivePermBtn: document.getElementById('confirm-gdrive-perm-btn'),
        skipGdrivePermBtn: document.getElementById('skip-gdrive-perm-btn'),

        usersListGrid: document.getElementById('users-list-grid'),
        addNewAccountBtn: document.getElementById('add-new-account-btn'),
        backupFrequencySelect: document.getElementById('backup-frequency-select'),
        gdriveStatusTitle: document.getElementById('gdrive-status-title'),
        gdriveLastBackupText: document.getElementById('gdrive-last-backup-text'),
        gdriveBackupBtn: document.getElementById('gdrive-backup-btn'),
        gdriveRestoreBtn: document.getElementById('gdrive-restore-btn'),

        overallBarsWrapper: document.getElementById('overall-bars-wrapper'),
        overallRingFill: document.getElementById('overall-ring-fill'),
        overallPctText: document.getElementById('overall-pct-text'),
        overallRatioVal: document.getElementById('overall-ratio-val'),

        tasksTodayPendingCount: document.getElementById('tasks-today-pending-count'),
        tasksOverduePendingCount: document.getElementById('tasks-overdue-pending-count'),
        tasksDoneCount: document.getElementById('tasks-done-count'),
        overdueTabCount: document.getElementById('overdue-tab-count'),
        upcomingTabCount: document.getElementById('upcoming-tab-count'),
        progressCircle: document.getElementById('progress-circle'),
        progressPercentageText: document.getElementById('progress-percentage-text'),

        weeklyPlannerGrid: document.getElementById('weekly-planner-grid'),

        reminderBanner: document.getElementById('reminder-banner'),
        reminderTitle: document.getElementById('reminder-title'),
        reminderDesc: document.getElementById('reminder-desc'),
        dismissReminderBtn: document.getElementById('dismiss-reminder-btn'),

        updateBanner: document.getElementById('update-banner'),
        updateBannerTitle: document.getElementById('update-banner-title'),
        updateBannerDesc: document.getElementById('update-banner-desc'),
        updateActionBtn: document.getElementById('update-action-btn'),
        dismissUpdateBtn: document.getElementById('dismiss-update-btn'),
        updateSettingsTitle: document.getElementById('update-settings-title'),
        updateSettingsSubtext: document.getElementById('update-settings-subtext'),
        updateSettingsIcon: document.getElementById('update-settings-icon'),
        checkUpdateSettingsBtn: document.getElementById('check-update-settings-btn'),
        applyUpdateSettingsBtn: document.getElementById('apply-update-settings-btn'),

        searchInput: document.getElementById('search-input'),
        clearSearchBtn: document.getElementById('clear-search-btn'),
        categoriesContainer: document.getElementById('categories-container'),
        filterTabs: document.querySelectorAll('.filter-tabs .tab-btn'),
        
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
        authModal: document.getElementById('auth-modal'),
        closeAuthModalBtn: document.getElementById('close-auth-modal'),
        googleLoginModalBtn: document.getElementById('google-login-modal-btn'),
        authErrorMsg: document.getElementById('auth-error-msg'),

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
        themeCards: document.querySelectorAll('.theme-card'),
        exportDataBtn: document.getElementById('export-data-btn'),
        exportCsvBtn: document.getElementById('export-csv-btn'),
        importDataBtn: document.getElementById('import-data-btn'),
        importFileInput: document.getElementById('import-file-input'),
        resetDataBtn: document.getElementById('reset-data-btn'),

        streakFreezeCountBadge: document.getElementById('streak-freeze-count-badge'),
        restDayPills: document.querySelectorAll('#rest-days-selector .rest-day-pill'),
        soundHapticsToggle: document.getElementById('sound-haptics-toggle'),

        focusModal: document.getElementById('focus-modal'),
        closeFocusModalBtn: document.getElementById('close-focus-modal'),
        focusModesTabs: document.querySelectorAll('#focus-modes-tabs .tab-btn'),
        focusTaskSelect: document.getElementById('focus-task-select'),
        focusRingFill: document.getElementById('focus-ring-fill'),
        focusTimeDisplay: document.getElementById('focus-time-display'),
        focusStatusLabel: document.getElementById('focus-status-label'),
        focusToggleBtn: document.getElementById('focus-toggle-btn'),
        focusToggleIcon: document.getElementById('focus-toggle-icon'),
        focusToggleText: document.getElementById('focus-toggle-text'),
        focusResetBtn: document.getElementById('focus-reset-btn'),
        focusSoundChips: document.querySelectorAll('#focus-sound-chips .sound-chip'),
        focusTodayMinutesVal: document.getElementById('focus-today-minutes-val'),
        focusCompletedSessionsVal: document.getElementById('focus-completed-sessions-val'),

        analyticsModal: document.getElementById('analytics-modal'),
        closeAnalyticsModalBtn: document.getElementById('close-analytics-modal'),
        closeAnalyticsBtn: document.getElementById('close-analytics-btn'),
        printPdfReportBtn: document.getElementById('print-pdf-report-btn'),
        statsTimeRangeTabs: document.querySelectorAll('#stats-time-range-tabs .tab-btn'),
        statsMemberSinceVal: document.getElementById('stats-member-since-val'),
        statsLifetimeCompletedVal: document.getElementById('stats-lifetime-completed-val'),
        statsBestStreakVal: document.getElementById('stats-best-streak-val'),
        statsActiveDaysVal: document.getElementById('stats-active-days-val'),
        statsChartTitle: document.getElementById('stats-chart-title'),
        heatmapSectionTitle: document.getElementById('heatmap-section-title'),
        heatmapGrid: document.getElementById('heatmap-grid'),
        heatmapDayDetail: document.getElementById('heatmap-day-detail'),
        heatmapDetailDate: document.getElementById('heatmap-detail-date'),
        heatmapDetailTasksList: document.getElementById('heatmap-detail-tasks-list'),
        closeHeatmapDetailBtn: document.getElementById('close-heatmap-detail-btn'),
        historyDaysList: document.getElementById('history-days-list'),
        historyTotalDaysCount: document.getElementById('history-total-days-count'),
        weeklyPlannerSection: document.getElementById('weekly-planner-section'),
        categoryBarsContainer: document.getElementById('category-bars-container'),

        toastContainer: document.getElementById('toast-container'),

        authModal: document.getElementById('auth-modal'),
        closeAuthModalBtn: document.getElementById('close-auth-modal'),
        googleLoginModalBtn: document.getElementById('google-login-modal-btn'),
        authErrorMsg: document.getElementById('auth-error-msg')
    };

    function scrollToTaskChecklist() {
        const target = document.querySelector('.controls-section') || document.getElementById('current-view-title');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function updateNetworkStatus(showToastNotice = false) {
        const isOnline = navigator.onLine !== false;
        if (dom.onlineIndicator) {
            if (isOnline) {
                dom.onlineIndicator.classList.remove('offline');
                dom.onlineIndicator.classList.add('online');
                dom.onlineIndicator.setAttribute('title', 'Online — Connected to Network');
                if (showToastNotice) {
                    showToast('Connected to internet 🟢');
                    checkAutoBackupSchedule();
                }
            } else {
                dom.onlineIndicator.classList.remove('online');
                dom.onlineIndicator.classList.add('offline');
                dom.onlineIndicator.setAttribute('title', 'Offline — No Internet Connection');
                if (showToastNotice) {
                    showToast('Offline — Changes saved locally 🔴');
                }
            }
        }
    }

    function checkNativePlatform() {
        const isNative = (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
                         window.location.protocol === 'capacitor:' ||
                         window.location.protocol === 'file:';
        if (isNative) {
            document.querySelectorAll('.hide-on-native').forEach(el => el.classList.add('hide'));
        }
    }

    // --- INIT APP ---
    function init() {
        updateNetworkStatus(false);
        checkNativePlatform();
        checkDailyReset();
        applyTheme(state.profile.theme);
        updateGreeting();
        renderHeaderProfile();
        renderTasks();
        renderAccountStatusBar();
        checkAutoBackupSchedule();
        checkReminderNotification();
        checkForAppUpdates();
        // Register Android notification channels, then schedule
        if (window.RC_NOTIFICATIONS) {
            window.RC_NOTIFICATIONS.registerChannels().then(() => {
                scheduleNativeLocalNotifications();
                scheduleSummaryNotification();
            });
        } else {
            scheduleNativeLocalNotifications();
            scheduleSummaryNotification();
        }
        setupEventListeners();

        // Load persisted state
        loadAppState();

        // Clear stale service‑worker caches on every launch (as requested)
        if ("caches" in window) {
            caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
        }
        // Optionally unregister old SWs to force fresh install
        if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
            navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
        }

        // Auto‑login from persisted session
        if (typeof getItem === 'function') {
            const persisted = getItem('rc_user');
            if (persisted && persisted.email) {
                // Simulate a Firebase user object
                const fakeUser = { email: persisted.email, displayName: persisted.name };
                handleFirebaseUserAuthenticated(fakeUser);
            }
        }

        // Listen for Firebase auth state changes on launch
        if (window.RC_FIREBASE) {
            RC_FIREBASE.checkRedirectResult().then(function(user) {
                if (user) handleFirebaseUserAuthenticated(user);
            });
            RC_FIREBASE.onAuthStateChanged(function(user) {
                if (user && !state.profile.isGoogleSynced) {
                    handleFirebaseUserAuthenticated(user);
                }
            });
        }

        // For returning signed in users, start page directly at Today's Checklist & Reminders
        if (state.profile.isGoogleSynced) {
            setTimeout(scrollToTaskChecklist, 350);
        }
    }

    // --- STORAGE & MULTI-USER ---
    function saveState() {
        updateStreakAndHistory();
        usersStore[activeEmail] = {
            profile: state.profile,
            tasks: state.tasks
        };
        localStorage.setItem('routinecraft_users', JSON.stringify(usersStore));
        localStorage.setItem('routinecraft_active_email', activeEmail);
        localStorage.setItem('routinecraft_version', APP_VERSION.toString());
        updateProgressCard();
        renderAccountStatusBar();
        scheduleNativeLocalNotifications();
    }

    function switchUserAccount(targetEmail) {
        if (!usersStore[targetEmail]) {
            usersStore[targetEmail] = {
                profile: { ...DEFAULT_PROFILE, email: targetEmail, name: targetEmail.split('@')[0] },
                tasks: [...DEFAULT_TASKS]
            };
        }
        activeEmail = targetEmail;
        state.profile = usersStore[activeEmail].profile;
        state.tasks = usersStore[activeEmail].tasks;
        saveState();
        applyTheme(state.profile.theme);
        renderHeaderProfile();
        renderTasks();
        renderAccountStatusBar();
        showToast(`Switched to user: ${state.profile.name} 👤`);
    }

    // --- DAILY RESET & STREAK CHECK ---
    function checkDailyReset() {
        const today = getTodayStr();
        if (state.profile.lastActiveDate !== today) {
            const dayOfWeek = new Date().getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

            state.tasks.forEach(task => {
                if (task.recurring === 'daily') {
                    task.completed = false;
                    if (task.subtasks) task.subtasks.forEach(s => s.completed = false);
                } else if (task.recurring === 'weekdays' && !isWeekend) {
                    task.completed = false;
                    if (task.subtasks) task.subtasks.forEach(s => s.completed = false);
                } else if (task.recurring === 'weekends' && isWeekend) {
                    task.completed = false;
                    if (task.subtasks) task.subtasks.forEach(s => s.completed = false);
                }
            });

            state.profile.lastActiveDate = today;
            saveState();
        }
    }

    function calculateStreak(completedDates = []) {
        if (!completedDates) completedDates = [];
        const restDays = state.profile.restDays || [0]; // default Sun
        let availableFreezes = state.profile.streakFreezes !== undefined ? state.profile.streakFreezes : 2;
        
        let currentCheckDate = new Date();
        const todayDayOfWeek = currentCheckDate.getDay();
        const todayStr = getTodayStr();
        const yesterdayStr = getPastDateStr(1);
        
        let streak = 0;
        
        if (completedDates.includes(todayStr)) {
            streak = 1;
            currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        } else if (restDays.includes(todayDayOfWeek)) {
            // Today is a planned rest day, so check from yesterday
            currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        } else if (completedDates.includes(yesterdayStr)) {
            streak = 1;
            currentCheckDate.setDate(currentCheckDate.getDate() - 2);
        } else if (availableFreezes > 0 && completedDates.includes(getPastDateStr(2))) {
            // Yesterday was missed but preserved via Streak Freeze
            streak = 1;
            currentCheckDate.setDate(currentCheckDate.getDate() - 2);
        } else {
            return 0;
        }
        
        while (true) {
            const checkStr = currentCheckDate.toISOString().split('T')[0];
            const checkDayOfWeek = currentCheckDate.getDay();
            
            if (completedDates.includes(checkStr)) {
                streak++;
                currentCheckDate.setDate(currentCheckDate.getDate() - 1);
            } else if (restDays.includes(checkDayOfWeek)) {
                // Rest day: keep streak continuous without incrementing or breaking
                currentCheckDate.setDate(currentCheckDate.getDate() - 1);
            } else if (availableFreezes > 0) {
                // Use streak freeze for this missed non-rest day
                availableFreezes--;
                currentCheckDate.setDate(currentCheckDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }

    // --- SYNTHESIZED WEB AUDIO & HAPTIC ENGINE ---
    const AudioEngine = {
        ctx: null,
        ambientNode: null,
        ambientGain: null,
        
        init() {
            if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
        },

        playTaskComplete() {
            if (!state.profile.soundHapticsEnabled) return;
            this.init();
            if (!this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                
                // Arpeggio C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.05);
                osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.10);
                osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15);
                
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.32);
                
                this.vibrate([35]);
            } catch(e) {}
        },

        playStreakCelebration() {
            if (!state.profile.soundHapticsEnabled) return;
            this.init();
            if (!this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + i * 0.07);
                    gain.gain.setValueAtTime(0.22, now + i * 0.07);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.07);
                    osc.stop(now + i * 0.07 + 0.40);
                });
                this.vibrate([50, 40, 70]);
            } catch(e) {}
        },

        playFocusEnd() {
            if (!state.profile.soundHapticsEnabled) return;
            this.init();
            if (!this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                [440, 880].forEach((freq) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now);
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 1.25);
                });
                this.vibrate([100, 100, 200]);
            } catch(e) {}
        },

        playAmbient(type) {
            this.stopAmbient();
            if (type === 'none') return;
            this.init();
            if (!this.ctx) return;
            try {
                if (type === 'lofi') {
                    const osc = this.ctx.createOscillator();
                    const filter = this.ctx.createBiquadFilter();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
                    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start();
                    this.ambientNode = osc;
                    this.ambientGain = gain;
                } else if (type === 'rain' || type === 'waves') {
                    const bufferSize = this.ctx.sampleRate * 2;
                    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                    const output = noiseBuffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        output[i] = Math.random() * 2 - 1;
                    }
                    const whiteNoise = this.ctx.createBufferSource();
                    whiteNoise.buffer = noiseBuffer;
                    whiteNoise.loop = true;

                    const filter = this.ctx.createBiquadFilter();
                    filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
                    filter.frequency.setValueAtTime(type === 'rain' ? 700 : 380, this.ctx.currentTime);

                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);

                    whiteNoise.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);
                    whiteNoise.start();
                    this.ambientNode = whiteNoise;
                    this.ambientGain = gain;
                }
            } catch(e) {
                console.warn('Ambient audio error:', e);
            }
        },

        stopAmbient() {
            if (this.ambientNode) {
                try {
                    this.ambientNode.stop();
                    this.ambientNode.disconnect();
                } catch(e) {}
                this.ambientNode = null;
            }
        },

        vibrate(pattern = [35]) {
            if (!state.profile.soundHapticsEnabled) return;
            if (navigator.vibrate) {
                navigator.vibrate(pattern);
            }
        }
    };

    // --- POMODORO FOCUS TIMER ENGINE ---
    const FocusEngine = {
        mode: 'pomodoro',
        duration: 25 * 60,
        remaining: 25 * 60,
        isRunning: false,
        timerInterval: null,
        activeTaskId: '',
        ambientSound: 'none',

        DURATIONS: {
            pomodoro: 25 * 60,
            shortBreak: 5 * 60,
            longBreak: 15 * 60
        },

        init() {
            this.setMode('pomodoro');
            this.updateDisplay();
            this.populateTaskDropdown();
        },

        open(taskId = '') {
            this.populateTaskDropdown();
            if (taskId) {
                this.activeTaskId = taskId;
                if (dom.focusTaskSelect) dom.focusTaskSelect.value = taskId;
            }
            if (dom.focusModal) dom.focusModal.classList.remove('hide');
            this.updateDisplay();
        },

        close() {
            if (dom.focusModal) dom.focusModal.classList.add('hide');
        },

        populateTaskDropdown() {
            if (!dom.focusTaskSelect) return;
            dom.focusTaskSelect.innerHTML = '<option value="">🎯 General Focus Session</option>';
            const pendingTasks = state.tasks.filter(t => !t.completed && isTaskToday(t));
            pendingTasks.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = `🎯 ${t.title}`;
                dom.focusTaskSelect.appendChild(opt);
            });
        },

        setMode(newMode) {
            this.mode = newMode;
            this.duration = this.DURATIONS[newMode] || (25 * 60);
            this.remaining = this.duration;
            this.pause();
            
            if (dom.focusModesTabs) {
                dom.focusModesTabs.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.focusMode === newMode);
                });
            }
            
            if (dom.focusStatusLabel) {
                dom.focusStatusLabel.textContent = newMode === 'pomodoro' ? 'Ready to Focus' : 'Break Time';
            }
            this.updateDisplay();
        },

        toggle() {
            if (this.isRunning) {
                this.pause();
            } else {
                this.start();
            }
        },

        start() {
            AudioEngine.init();
            this.isRunning = true;
            if (dom.focusToggleBtn) {
                if (dom.focusToggleIcon) dom.focusToggleIcon.className = 'fa-solid fa-pause';
                if (dom.focusToggleText) dom.focusToggleText.textContent = 'Pause';
            }
            if (dom.focusStatusLabel) {
                dom.focusStatusLabel.textContent = this.mode === 'pomodoro' ? '⚡ Focusing...' : '☕ Resting...';
            }
            if (this.ambientSound !== 'none') {
                AudioEngine.playAmbient(this.ambientSound);
            }
            
            clearInterval(this.timerInterval);
            this.timerInterval = setInterval(() => this.tick(), 1000);
        },

        pause() {
            this.isRunning = false;
            clearInterval(this.timerInterval);
            AudioEngine.stopAmbient();
            if (dom.focusToggleBtn) {
                if (dom.focusToggleIcon) dom.focusToggleIcon.className = 'fa-solid fa-play';
                if (dom.focusToggleText) dom.focusToggleText.textContent = this.remaining < this.duration ? 'Resume' : 'Start Focus';
            }
            if (dom.focusStatusLabel) {
                dom.focusStatusLabel.textContent = 'Paused';
            }
        },

        reset() {
            this.pause();
            this.remaining = this.duration;
            this.updateDisplay();
            if (dom.focusStatusLabel) {
                dom.focusStatusLabel.textContent = this.mode === 'pomodoro' ? 'Ready to Focus' : 'Break Time';
            }
        },

        tick() {
            if (this.remaining > 0) {
                this.remaining--;
                this.updateDisplay();
            } else {
                this.complete();
            }
        },

        complete() {
            this.pause();
            AudioEngine.playFocusEnd();
            
            if (this.mode === 'pomodoro') {
                const focusMins = Math.round(this.duration / 60);
                state.profile.focusMinutes = (state.profile.focusMinutes || 0) + focusMins;
                state.profile.focusSessions = (state.profile.focusSessions || 0) + 1;
                saveState();
                
                showToast(`🎉 Focus session complete! (+${focusMins} mins)`);
                if (dom.focusTodayMinutesVal) dom.focusTodayMinutesVal.textContent = state.profile.focusMinutes;
                if (dom.focusCompletedSessionsVal) dom.focusCompletedSessionsVal.textContent = state.profile.focusSessions;
                
                this.setMode('shortBreak');
            } else {
                showToast('☕ Break finished! Ready to focus again.');
                this.setMode('pomodoro');
            }
        },

        updateDisplay() {
            const mins = Math.floor(this.remaining / 60);
            const secs = this.remaining % 60;
            const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            if (dom.focusTimeDisplay) dom.focusTimeDisplay.textContent = str;
            
            if (dom.focusRingFill) {
                const total = this.duration || 1;
                const offset = 534.07 * (1 - (this.remaining / total));
                dom.focusRingFill.style.strokeDashoffset = offset;
            }
            if (dom.focusTodayMinutesVal) dom.focusTodayMinutesVal.textContent = state.profile.focusMinutes || 0;
            if (dom.focusCompletedSessionsVal) dom.focusCompletedSessionsVal.textContent = state.profile.focusSessions || 0;
        },

        setAmbient(soundType) {
            this.ambientSound = soundType;
            if (dom.focusSoundChips) {
                dom.focusSoundChips.forEach(chip => {
                    chip.classList.toggle('active', chip.dataset.sound === soundType);
                });
            }
            if (this.isRunning) {
                AudioEngine.playAmbient(soundType);
            }
        }
    };

    function updateStreakAndHistory() {
        const todayStr = getTodayStr();
        state.profile.completedDates = state.profile.completedDates || [];
        state.profile.completionHistory = state.profile.completionHistory || {};

        // 1. Calculate today's completed tasks
        const completedToday = state.tasks.filter(t => t.completed && isTaskToday(t)).length;
        state.profile.completionHistory[todayStr] = completedToday;

        // 2. Also register completion counts for any specific past or scheduled dates
        state.tasks.forEach(t => {
            if (t.completed) {
                const compDate = t.completedAt ? t.completedAt.split('T')[0] : t.dueDate;
                if (compDate) {
                    const countForDate = state.tasks.filter(x => x.completed && ((x.completedAt && x.completedAt.startsWith(compDate)) || x.dueDate === compDate)).length;
                    state.profile.completionHistory[compDate] = countForDate;
                }
            }
        });

        // 3. Update completedDates for streak
        const todayTasks = state.tasks.filter(t => isTaskToday(t));
        const allCompleted = todayTasks.length > 0 && todayTasks.every(t => t.completed);

        if (allCompleted || completedToday > 0) {
            if (!state.profile.completedDates.includes(todayStr)) {
                state.profile.completedDates.push(todayStr);
            }
        } else {
            const idx = state.profile.completedDates.indexOf(todayStr);
            if (idx > -1) {
                state.profile.completedDates.splice(idx, 1);
            }
        }

        state.profile.streak = calculateStreak(state.profile.completedDates);
        if (dom.streakCount) dom.streakCount.textContent = state.profile.streak || 0;
    }

    // --- TIME BASED GREETING ---
    function updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Good Morning,';
        if (hour >= 12 && hour < 17) greeting = 'Good Afternoon,';
        else if (hour >= 17 && hour < 22) greeting = 'Good Evening,';
        else if (hour >= 22 || hour < 5) greeting = 'Good Night,';

        dom.timeGreeting.textContent = greeting;
    }

    function renderHeaderProfile() {
        dom.userNameDisplay.textContent = state.profile.name || 'Productivity Hero';
        dom.userAvatar.textContent = state.profile.avatar || '🚀';
        dom.streakCount.textContent = state.profile.streak || 0;

        if (state.profile.isGoogleSynced) {
            // Once user is signed in, remove/hide the Account button on Home page
            if (dom.headerGoogleLoginBtn) {
                dom.headerGoogleLoginBtn.classList.add('hide');
            }
        } else {
            // When signed out, show the Sign In button on Home page
            if (dom.headerGoogleLoginBtn) {
                dom.headerGoogleLoginBtn.classList.remove('hide');
                dom.headerGoogleLoginBtn.title = 'Sign In with Google';
                dom.headerGoogleLoginBtn.innerHTML = '<i class="fa-brands fa-google" style="color:#4285F4;"></i> <span id="google-btn-text">Sign In</span>';
            }
        }

        if (state.profile.notificationsEnabled) {
            dom.notifyBtn.classList.add('active');
            dom.notifyBtn.setAttribute('aria-pressed', 'true');
        } else {
            dom.notifyBtn.classList.remove('active');
            dom.notifyBtn.setAttribute('aria-pressed', 'false');
        }
    }

    function logoutUserAccount() {
        if (window.RC_FIREBASE) {
            RC_FIREBASE.signOut();
        }

        const prevEmail = state.profile.email;
        // Delete the signed-out account from local storage so it does not persist in Accounts & Sync
        if (prevEmail && prevEmail !== 'default_user@routinecraft.app') {
            delete usersStore[prevEmail];
        }

        activeEmail = 'default_user@routinecraft.app';
        if (!usersStore[activeEmail]) {
            usersStore[activeEmail] = {
                profile: { ...DEFAULT_PROFILE },
                tasks: [...DEFAULT_TASKS]
            };
        }
        state.profile = usersStore[activeEmail].profile;
        state.tasks = usersStore[activeEmail].tasks;

        localStorage.setItem('routinecraft_active_email', activeEmail);
        localStorage.setItem('routinecraft_users', JSON.stringify(usersStore));

        saveState();
        applyTheme(state.profile.theme);
        renderHeaderProfile();
        renderTasks();
        renderAccountStatusBar();
        closeProfileModal();
        closeAuthModal();
        showToast('Signed out & account removed from device 👋');
    }

    function removeUserAccount(emailToRemove) {
        if (emailToRemove === activeEmail) {
            logoutUserAccount();
            return;
        }
        delete usersStore[emailToRemove];
        localStorage.setItem('routinecraft_users', JSON.stringify(usersStore));
        renderUsersGrid();
        showToast(`Removed ${emailToRemove} from device`);
    }

    function renderAccountStatusBar() {
        if (dom.accountStatusBar) dom.accountStatusBar.classList.add('hide');

        if (state.profile.isGoogleSynced) {
            if (dom.accountEmailDisplay) dom.accountEmailDisplay.textContent = state.profile.email;
            if (dom.logoutSettingsBtn) dom.logoutSettingsBtn.classList.remove('hide');
        } else {
            if (dom.logoutSettingsBtn) dom.logoutSettingsBtn.classList.add('hide');
        }

        if (state.profile.lastBackupTime) {
            if (dom.gdriveLastBackupText) dom.gdriveLastBackupText.textContent = `Last backup: ${state.profile.lastBackupTime}`;
            if (dom.gdriveStatusTitle) dom.gdriveStatusTitle.textContent = `Google Drive Backup (${state.profile.backupFrequency.toUpperCase()})`;
        } else {
            if (dom.gdriveLastBackupText) dom.gdriveLastBackupText.textContent = 'Last backup: Never';
        }
        if (dom.backupFrequencySelect) dom.backupFrequencySelect.value = state.profile.backupFrequency || 'daily';
    }

    // --- NOTIFICATION SCHEDULING: ANDROID (CAPACITOR) + PWA FALLBACK ---

    // Active PWA setTimeout handles keyed by task ID (or '__summary__')
    const _pwaTimerHandles = {};

    function requestPwaPermission() {
        if (!('Notification' in window)) return Promise.resolve(false);
        if (Notification.permission === 'granted') return Promise.resolve(true);
        if (Notification.permission === 'denied') return Promise.resolve(false);
        return Notification.requestPermission().then(function(r) { return r === 'granted'; });
    }

    function showPwaNotification(title, body, channelId) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        var n = new Notification(title, { body: body, tag: channelId || 'task_reminder', renotify: true });
        n.onclick = function() { window.focus(); n.close(); };
    }

    function schedulePwaTaskReminder(task) {
        if (_pwaTimerHandles[task.id]) {
            clearTimeout(_pwaTimerHandles[task.id]);
            delete _pwaTimerHandles[task.id];
        }
        if (!task.dueTime || task.completed) return;
        var p = task.dueTime.split(':');
        var fireAt = new Date();
        fireAt.setHours(parseInt(p[0], 10), parseInt(p[1], 10), 0, 0);
        if (fireAt.getTime() <= Date.now()) {
            if (task.recurring && task.recurring !== 'none') {
                fireAt.setDate(fireAt.getDate() + 1);
            } else {
                return;
            }
        }
        var msUntil = fireAt.getTime() - Date.now();
        if (msUntil > 0 && msUntil < 86400000 * 7) {
            _pwaTimerHandles[task.id] = setTimeout(function() {
                if (!state.profile.notificationsEnabled) return;
                var t = state.tasks.find(function(x) { return x.id === task.id; });
                if (t && !t.completed) {
                    showPwaNotification(
                        '🔔 Task Reminder: ' + t.title,
                        'Time to complete your ' + ((CATEGORIES[t.category] && CATEGORIES[t.category].label) || 'daily') + ' goal!',
                        'task_reminder'
                    );
                }
                delete _pwaTimerHandles[task.id];
                if (t && t.recurring && t.recurring !== 'none') {
                    schedulePwaTaskReminder(t);
                }
            }, msUntil);
        }
    }

    /** Cancel all timers and native notification for a given task. */
    function cancelNotificationForTask(taskId) {
        if (_pwaTimerHandles[taskId]) {
            clearTimeout(_pwaTimerHandles[taskId]);
            delete _pwaTimerHandles[taskId];
        }
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
            window.Capacitor.Plugins.LocalNotifications
                .cancel({ notifications: [{ id: Math.abs(hashCode(taskId)) }] })
                .catch(function() {});
        }
    }

    function scheduleNativeLocalNotifications() {
        if (!state.profile.notificationsEnabled) return;
        var CHANNELS = (window.RC_NOTIFICATIONS && window.RC_NOTIFICATIONS.CHANNELS) ? window.RC_NOTIFICATIONS.CHANNELS : {};
        var ch = CHANNELS.task_reminder || {};

        // 1. Capacitor Android path
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
            var LN = window.Capacitor.Plugins.LocalNotifications;
            LN.requestPermissions().then(function(perm) {
                if (perm.display !== 'granted') return;
                
                // Collect all possible IDs to cancel before rescheduling
                var cancelList = [];
                state.tasks.forEach(function(t) {
                    cancelList.push({ id: Math.abs(hashCode(t.id)) });
                    for (var w = 1; w <= 7; w++) {
                        cancelList.push({ id: Math.abs(hashCode(t.id + '_w_' + w)) });
                    }
                });

                var cancelP = cancelList.length > 0 ? LN.cancel({ notifications: cancelList }).catch(function(){}) : Promise.resolve();
                cancelP.then(function() {
                    var notifList = [];

                    state.tasks.forEach(function(t) {
                        var dueTimeStr = t.dueTime || (t.recurring && t.recurring !== 'none' ? '09:00' : '');
                        if (!dueTimeStr) return;
                        var p = dueTimeStr.split(':');
                        if (p.length < 2) return;
                        var hour = parseInt(p[0], 10);
                        var minute = parseInt(p[1], 10);
                        var title = '🔔 Task Reminder: ' + t.title;
                        var body = 'Time to complete your ' + ((CATEGORIES[t.category] && CATEGORIES[t.category].label) || 'daily') + ' goal!';

                        if (t.recurring === 'daily') {
                            // Repeating Daily: Use 'on' DateMatch for endless background repeating
                            notifList.push({
                                id: Math.abs(hashCode(t.id)),
                                title: title,
                                body: body,
                                schedule: {
                                    on: { hour: hour, minute: minute },
                                    allowWhileIdle: true
                                },
                                channelId: ch.id || 'task_reminder',
                                actionTypeId: 'TASK_REMINDER_ACTIONS',
                                iconColor: '#00f2fe',
                                extra: { taskId: t.id }
                            });
                        } else if (t.recurring === 'weekdays') {
                            // Repeating Weekdays: Mon(2), Tue(3), Wed(4), Thu(5), Fri(6) in Java Calendar
                            [2, 3, 4, 5, 6].forEach(function(wday) {
                                notifList.push({
                                    id: Math.abs(hashCode(t.id + '_w_' + wday)),
                                    title: title,
                                    body: body,
                                    schedule: {
                                        on: { weekday: wday, hour: hour, minute: minute },
                                        allowWhileIdle: true
                                    },
                                    channelId: ch.id || 'task_reminder',
                                    actionTypeId: 'TASK_REMINDER_ACTIONS',
                                    iconColor: '#00f2fe',
                                    extra: { taskId: t.id }
                                });
                            });
                        } else if (t.recurring === 'weekends') {
                            // Repeating Weekends: Sun(1), Sat(7) in Java Calendar
                            [1, 7].forEach(function(wday) {
                                notifList.push({
                                    id: Math.abs(hashCode(t.id + '_w_' + wday)),
                                    title: title,
                                    body: body,
                                    schedule: {
                                        on: { weekday: wday, hour: hour, minute: minute },
                                        allowWhileIdle: true
                                    },
                                    channelId: ch.id || 'task_reminder',
                                    actionTypeId: 'TASK_REMINDER_ACTIONS',
                                    iconColor: '#00f2fe',
                                    extra: { taskId: t.id }
                                });
                            });
                        } else if (!t.completed) {
                            // One-off Task: Schedule exact time if in future
                            var d = new Date();
                            if (t.dueDate) {
                                var dp = t.dueDate.split('-');
                                if (dp.length === 3) {
                                    d = new Date(parseInt(dp[0], 10), parseInt(dp[1], 10) - 1, parseInt(dp[2], 10));
                                }
                            }
                            d.setHours(hour, minute, 0, 0);
                            if (d.getTime() > Date.now()) {
                                notifList.push({
                                    id: Math.abs(hashCode(t.id)),
                                    title: title,
                                    body: body,
                                    schedule: {
                                        at: d,
                                        allowWhileIdle: true
                                    },
                                    channelId: ch.id || 'task_reminder',
                                    actionTypeId: 'TASK_REMINDER_ACTIONS',
                                    iconColor: '#00f2fe',
                                    extra: { taskId: t.id }
                                });
                            }
                        }
                    });

                    if (notifList.length > 0) {
                        LN.schedule({ notifications: notifList })
                            .then(function() { console.log('[RC] Scheduled ' + notifList.length + ' persistent Android notifications'); })
                            .catch(function(e) { console.warn('[RC] Android scheduling failed:', e); });
                    }
                });
            });
            return;
        }

        // 2. PWA / Browser fallback
        Object.keys(_pwaTimerHandles).forEach(function(id) {
            if (id !== '__summary__') { clearTimeout(_pwaTimerHandles[id]); delete _pwaTimerHandles[id]; }
        });
        requestPwaPermission().then(function(granted) {
            if (!granted) return;
            var activeTasks = state.tasks.filter(function(t) { return !t.completed && (isTaskToday(t) || isTaskUpcoming(t) || (t.recurring && t.recurring !== 'none')); });
            activeTasks.forEach(function(task) { schedulePwaTaskReminder(task); });
        });
    }

    function scheduleSummaryNotification() {
        if (!state.profile.notificationsEnabled) return;
        var timeStr = state.profile.summaryNotificationTime || '20:00';
        var p = timeStr.split(':');
        var hour = parseInt(p[0], 10);
        var minute = parseInt(p[1], 10);

        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
            var LN = window.Capacitor.Plugins.LocalNotifications;
            var CHANNELS = (window.RC_NOTIFICATIONS && window.RC_NOTIFICATIONS.CHANNELS) ? window.RC_NOTIFICATIONS.CHANNELS : {};
            var ch = CHANNELS.summary || {};
            LN.cancel({ notifications: [{ id: 99999 }] }).catch(function(){}).then(function() {
                LN.schedule({
                    notifications: [{
                        id: 99999,
                        title: '📊 RoutineCraft Daily Summary',
                        body: 'Review your habit progress and keep your streak alive! 🔥',
                        schedule: {
                            on: { hour: hour, minute: minute },
                            allowWhileIdle: true
                        },
                        channelId: ch.id || 'summary',
                        iconColor: '#00f2fe'
                    }]
                }).catch(function(){});
            });
            return;
        }

        if (_pwaTimerHandles['__summary__']) { clearTimeout(_pwaTimerHandles['__summary__']); }
        var fireAt = new Date();
        fireAt.setHours(hour, minute, 0, 0);
        if (fireAt.getTime() <= Date.now()) {
            fireAt.setDate(fireAt.getDate() + 1);
        }
        var msUntil = fireAt.getTime() - Date.now();
        requestPwaPermission().then(function(granted) {
            if (!granted || msUntil <= 0) return;
            _pwaTimerHandles['__summary__'] = setTimeout(function() {
                if (!state.profile.notificationsEnabled) return;
                var c = state.tasks.filter(function(t) { return t.completed; }).length;
                var tot = state.tasks.filter(function(t) { return isTaskToday(t) || t.completed; }).length;
                showPwaNotification(
                    '📊 RoutineCraft Daily Summary',
                    'You completed ' + c + ' of ' + tot + ' tasks today. Keep the streak going! 🔥',
                    'summary'
                );
                scheduleSummaryNotification();
            }, msUntil);
        });
    }

    function hashCode(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }

    // --- GOOGLE FIREBASE AUTHENTICATION MODAL CONTROLLER ---
    function openAuthModal() {
        if (!dom.authModal) return;
        if (dom.authErrorMsg) dom.authErrorMsg.classList.add('hide');
        dom.authModal.classList.remove('hide');
    }

    function closeAuthModal() {
        if (dom.authModal) dom.authModal.classList.add('hide');
    }

    function showAuthError(msg) {
        const str = String(msg || '');
        if (str.includes('popup-closed-by-user') || str.includes('closed by user')) {
            showToast('Google Sign-In was cancelled.');
            return;
        }
        if (dom.authErrorMsg) {
            dom.authErrorMsg.textContent = str || 'Sign-In failed. Please try again.';
            dom.authErrorMsg.classList.remove('hide');
        } else {
            showToast(str || 'Google Sign-In failed. Please try again.');
        }
    }

    function triggerGoogleLogin() {
        openAuthModal();
    }

    function handleFirebaseUserAuthenticated(user) {
        const userEmail = user.email;
        const userName = user.displayName || userEmail.split('@')[0];

        // Persist user session using storage helper
        if (typeof saveItem === 'function') {
            saveItem('rc_user', { email: userEmail, name: userName });
        }

        if (!usersStore[userEmail]) {
            usersStore[userEmail] = {
                profile: {
                    ...DEFAULT_PROFILE,
                    email: userEmail,
                    name: userName,
                    avatar: '🔥',
                    isGoogleSynced: true,
                    backupFrequency: 'daily',
                    lastBackupTime: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                },
                tasks: [...DEFAULT_TASKS]
            };
        } else {
            usersStore[userEmail].profile.isGoogleSynced = true;
            usersStore[userEmail].profile.name = userName;
        }

        switchUserAccount(userEmail);
        if (window.RC_FIREBASE && typeof window.RC_FIREBASE.syncUserData === 'function') {
            window.RC_FIREBASE.syncUserData(user, usersStore[userEmail]);
        }
        showToast(`Signed in as ${userEmail}! 🔥`);
        closeAuthModal();
        setTimeout(scrollToTaskChecklist, 200);
    }

    function confirmGoogleBackupPermission() {
        if (!state.pendingGoogleUser) return;

        const selectedFreq = document.querySelector('input[name="backup-freq-choice"]:checked')?.value || 'daily';
        const userEmail = state.pendingGoogleUser.email;

        if (!usersStore[userEmail]) {
            usersStore[userEmail] = {
                profile: {
                    ...DEFAULT_PROFILE,
                    email: userEmail,
                    name: state.pendingGoogleUser.name,
                    avatar: state.pendingGoogleUser.avatar,
                    isGoogleSynced: true,
                    backupFrequency: selectedFreq,
                    lastBackupTime: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                },
                tasks: [...DEFAULT_TASKS]
            };
        } else {
            usersStore[userEmail].profile.isGoogleSynced = true;
            usersStore[userEmail].profile.backupFrequency = selectedFreq;
            usersStore[userEmail].profile.lastBackupTime = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        }

        switchUserAccount(userEmail);
        dom.gdrivePermissionModal.classList.add('hide');
        showToast(`Signed in as ${userEmail}! Auto-Backup set to ${selectedFreq.toUpperCase()} ☁️🎉`);
    }

    // --- AUTOMATIC BACKUP SCHEDULER ---
    function checkAutoBackupSchedule() {
        if (!state.profile.isGoogleSynced || state.profile.backupFrequency === 'custom') return;

        const now = Date.now();
        const lastTime = state.profile.lastBackupTimestamp || 0;
        const oneDayMs = 24 * 60 * 60 * 1000;
        const oneWeekMs = 7 * oneDayMs;

        const isDueDaily = (state.profile.backupFrequency === 'daily' && (now - lastTime > oneDayMs));
        const isDueWeekly = (state.profile.backupFrequency === 'weekly' && (now - lastTime > oneWeekMs));

        if (isDueDaily || isDueWeekly || !state.profile.lastBackupTime) {
            performAutoBackup();
        }
    }

    function performAutoBackup() {
        const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        state.profile.lastBackupTime = nowStr;
        state.profile.lastBackupTimestamp = Date.now();
        saveState();
        renderAccountStatusBar();

        if (window.firebase && window.firebase.database && state.profile.isGoogleSynced) {
            try {
                // Use a safe key (replace '.' with '_')
                const safeEmailKey = (state.profile.email || 'unknown').replace(/\./g, '_');
                firebase.database().ref('users/' + safeEmailKey).set(state)
                    .then(() => console.log(`[FIREBASE] Auto-backup completed for ${state.profile.email}`))
                    .catch(err => console.error('[FIREBASE] Backup error:', err));
            } catch (e) {
                console.error('[FIREBASE] Backup exception:', e);
            }
        }
    }

    function performManualBackup() {
        performAutoBackup();
        showToast(`☁️ Backup synced to Firebase Cloud (${state.profile.email || 'Cloud Account'})!`);
    }

    // --- THEME ENGINE ---
    function applyTheme(themeName) {
        state.profile.theme = themeName;
        dom.body.setAttribute('data-theme', themeName);

        dom.themeCards.forEach(card => {
            if (card.dataset.setTheme === themeName) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    // --- HELPER DATE COMPARISONS ---
    function isTaskScheduledForDate(task, dateStr) {
        if (!task || !dateStr) return false;
        const taskStartDate = task.dueDate || (task.createdAt ? task.createdAt.split('T')[0] : getTodayStr());
        
        // Rule: A task cannot appear on days before its start / creation date
        if (dateStr < taskStartDate) {
            return false;
        }

        const recurring = task.recurring || 'none';
        if (recurring === 'none') {
            return task.dueDate === dateStr;
        }

        const d = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

        if (recurring === 'daily') {
            return true;
        } else if (recurring === 'weekdays') {
            return !isWeekend;
        } else if (recurring === 'weekends') {
            return isWeekend;
        }

        return false;
    }

    function isTaskOverdue(task) {
        if (task.completed) return false;
        if (task.recurring && task.recurring !== 'none') return false;
        const today = getTodayStr();
        return Boolean(task.dueDate && task.dueDate < today);
    }

    function isTaskToday(task) {
        const today = getTodayStr();
        return isTaskScheduledForDate(task, today);
    }

    function isTaskUpcoming(task) {
        if (task.completed) return false;
        const today = getTodayStr();
        return Boolean(task.dueDate && task.dueDate > today);
    }

    // --- RENDER STATS MILESTONES (All-Time / Member Since Data) ---
    function renderStatsMilestones() {
        if (!dom.statsMemberSinceVal) return;
        
        let memberDateStr = state.profile.memberSince || getPastDateStr(30);
        try {
            const d = new Date(memberDateStr + 'T00:00:00');
            dom.statsMemberSinceVal.textContent = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch(e) {
            dom.statsMemberSinceVal.textContent = memberDateStr;
        }

        const currentCompleted = state.tasks.filter(t => t.completed).length;
        const totalCompleted = Math.max(state.profile.totalCompletedCount || 0, currentCompleted);
        dom.statsLifetimeCompletedVal.textContent = `${totalCompleted} task${totalCompleted === 1 ? '' : 's'}`;

        const best = Math.max(state.profile.bestStreak || 0, state.profile.streak || 0, calculateStreak(state.profile.completedDates));
        state.profile.bestStreak = best;
        dom.statsBestStreakVal.textContent = `${best} day${best === 1 ? '' : 's'}`;

        const activeDatesSet = new Set(state.profile.completedDates || []);
        if (state.profile.completionHistory) {
            Object.keys(state.profile.completionHistory).forEach(d => {
                if (state.profile.completionHistory[d] > 0) activeDatesSet.add(d);
            });
        }
        state.tasks.forEach(t => {
            if (t.completed) {
                const compD = t.completedAt ? t.completedAt.split('T')[0] : t.dueDate;
                if (compD) activeDatesSet.add(compD);
            }
        });
        const activeCount = Math.max(activeDatesSet.size, 1);
        dom.statsActiveDaysVal.textContent = `${activeCount} day${activeCount === 1 ? '' : 's'}`;
    }

    // --- RENDER OVERALL PROGRESS DASHBOARD CARD (Range Aware: Week / Month / All-Time) ---
    function renderOverallProgressCard() {
        const range = state.statsTimeRange || 'week';
        const totalAll = state.tasks.length;
        const completedAll = state.tasks.filter(t => t.completed).length;
        const overallPct = totalAll === 0 ? 0 : Math.round((completedAll / totalAll) * 100);

        dom.overallPctText.textContent = `${overallPct}%`;
        dom.overallRatioVal.textContent = `${completedAll} / ${Math.max(totalAll, 20)} completed`;

        const circumference = 213.62;
        const offset = circumference - (overallPct / 100) * circumference;
        dom.overallRingFill.style.strokeDashoffset = offset;
        dom.overallBarsWrapper.innerHTML = '';

        if (range === 'week') {
            if (dom.statsChartTitle) dom.statsChartTitle.textContent = "This Week's Progress";
            const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const now = new Date();
            const mondayOffset = ((now.getDay() + 6) % 7);
            const mondayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
            
            const realTaskCounts = [];
            for (let i = 0; i < 7; i++) {
                const day = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + i);
                const dayStr = day.toISOString().split('T')[0];
                let count = 0;
                if (dayStr === getTodayStr()) {
                    count = state.tasks.filter(t => t.completed && isTaskToday(t)).length;
                } else {
                    const tasksDoneOnDate = state.tasks.filter(t => t.completed && ((t.completedAt && t.completedAt.startsWith(dayStr)) || t.dueDate === dayStr)).length;
                    const historyCount = (state.profile.completionHistory && state.profile.completionHistory[dayStr]) || 0;
                    count = Math.max(tasksDoneOnDate, historyCount);
                }
                realTaskCounts.push(count);
            }

            weekDays.forEach((dayName, idx) => {
                const count = realTaskCounts[idx];
                const heightPct = Math.min(100, (count / 10) * 100);
                const col = document.createElement('div');
                col.className = 'overall-bar-col';
                col.innerHTML = `
                    <div class="overall-bar-track" title="${dayName}: ${count} completed">
                        <div class="overall-bar-fill" style="height: ${heightPct}%;"></div>
                    </div>
                    <span class="overall-bar-day">${dayName}</span>
                `;
                dom.overallBarsWrapper.appendChild(col);
            });
        } else if (range === 'month') {
            if (dom.statsChartTitle) dom.statsChartTitle.textContent = "Last 30 Days (5-Day Intervals)";
            const intervals = ['Day 1-5', '6-10', '11-15', '16-20', '21-25', '26-30'];
            for (let b = 5; b >= 0; b--) {
                let intervalTotal = 0;
                for (let d = 0; d < 5; d++) {
                    const daysAgo = b * 5 + d;
                    const dayStr = getPastDateStr(daysAgo);
                    let count = 0;
                    if (dayStr === getTodayStr()) {
                        count = state.tasks.filter(t => t.completed && isTaskToday(t)).length;
                    } else {
                        const tasksDoneOnDate = state.tasks.filter(t => t.completed && ((t.completedAt && t.completedAt.startsWith(dayStr)) || t.dueDate === dayStr)).length;
                        const historyCount = (state.profile.completionHistory && state.profile.completionHistory[dayStr]) || 0;
                        count = Math.max(tasksDoneOnDate, historyCount);
                    }
                    intervalTotal += count;
                }
                const label = intervals[5 - b];
                const heightPct = Math.min(100, (intervalTotal / 20) * 100);
                const col = document.createElement('div');
                col.className = 'overall-bar-col';
                col.innerHTML = `
                    <div class="overall-bar-track" title="${label}: ${intervalTotal} completed">
                        <div class="overall-bar-fill" style="height: ${heightPct}%;"></div>
                    </div>
                    <span class="overall-bar-day" style="font-size:0.65rem;">${label}</span>
                `;
                dom.overallBarsWrapper.appendChild(col);
            }
        } else {
            // 'all' time
            if (dom.statsChartTitle) dom.statsChartTitle.textContent = "All-Time Category Breakdown";
            Object.keys(CATEGORIES).forEach(catKey => {
                const catInfo = CATEGORIES[catKey];
                const catTasks = state.tasks.filter(t => t.category === catKey);
                const catDone = catTasks.filter(t => t.completed).length;
                const catPct = catTasks.length === 0 ? 0 : Math.round((catDone / catTasks.length) * 100);

                const col = document.createElement('div');
                col.className = 'overall-bar-col';
                col.innerHTML = `
                    <div class="overall-bar-track" title="${catInfo.label}: ${catDone}/${catTasks.length}">
                        <div class="overall-bar-fill" style="height: ${catPct}%; background:${catInfo.color};"></div>
                    </div>
                    <span class="overall-bar-day" style="font-size:0.65rem;">${catKey.substring(0, 4)}</span>
                `;
                dom.overallBarsWrapper.appendChild(col);
            });
        }
    }

    // --- RENDER WEEKLY PLANNER DAY COLUMNS (Inside Stats Modal) ---
    function renderWeeklyPlannerGrid() {
        dom.weeklyPlannerGrid.innerHTML = '';
        const now = new Date();
        const mondayOffset = ((now.getDay() + 6) % 7);
        const mondayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);

        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + i);
            const dayStr = nextDay.toISOString().split('T')[0];
            const dayName = nextDay.toLocaleDateString('en-US', { weekday: 'long' });
            const dateFormatted = nextDay.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

            const dayTasks = state.tasks.filter(t => isTaskScheduledForDate(t, dayStr));
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
                tasksListHtml = '<div style="font-size:0.78rem; color:var(--text-muted); padding:8px 0; text-align:center;">No scheduled tasks</div>';
            }

            dayCard.innerHTML = `
                <div class="day-card-header">
                    <span class="day-card-name">${dayName}</span>
                    <span class="day-card-date">${dateFormatted}</span>
                </div>
                <div class="day-card-donut-wrapper">
                    <div class="day-donut">
                        <svg width="70" height="70">
                            <circle class="ring-bg" stroke-width="6" r="28" cx="35" cy="35"/>
                            <circle class="ring-fill" stroke-width="6" r="28" cx="35" cy="35" style="stroke-dasharray:${circumference}; stroke-dashoffset:${offset};"/>
                        </svg>
                        <span class="day-donut-pct">${dayPct}%</span>
                    </div>
                </div>
                <div class="day-tasks-section">
                    <div class="day-tasks-subbanner">Tasks</div>
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

    // --- RENDER LIST VIEW TASKS & PROGRESS ---
    function getFilteredTasks() {
        return state.tasks.filter(task => {
            if (state.activeCategory !== 'all' && task.category !== state.activeCategory) {
                return false;
            }

            if (state.activeFilter === 'today') {
                if (!isTaskToday(task) && !isTaskOverdue(task)) return false;
            } else if (state.activeFilter === 'overdue') {
                if (!isTaskOverdue(task)) return false;
            } else if (state.activeFilter === 'upcoming') {
                if (!isTaskUpcoming(task)) return false;
            } else if (state.activeFilter === 'completed') {
                if (!task.completed) return false;
            }

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
                return pOrder[a.priority] - pOrder[b.priority];
            } else if (state.sortBy === 'time') {
                return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
            } else if (state.sortBy === 'date') {
                return (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99');
            } else if (state.sortBy === 'alphabetical') {
                return a.title.localeCompare(b.title);
            }

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
            today: "Today's Checklist & Reminders",
            overdue: "Overdue Pending Tasks",
            upcoming: "Upcoming Scheduled Tasks",
            all: "All Checklist Tasks",
            completed: "Completed Task History"
        };
        dom.currentViewTitle.textContent = viewTitles[state.activeFilter] || "Checklist";

        if (filtered.length === 0) {
            dom.emptyState.classList.remove('hide');
            if (state.activeFilter === 'upcoming') {
                dom.emptyTitle.textContent = 'No upcoming scheduled tasks!';
                dom.emptyDesc.textContent = 'Schedule a future task to get reminded on that specific day.';
            } else if (state.activeFilter === 'overdue') {
                dom.emptyTitle.textContent = 'No overdue tasks! 🎯';
                dom.emptyDesc.textContent = 'You are 100% caught up on all past scheduled items!';
            } else {
                dom.emptyTitle.textContent = 'All tasks completed! 🎉';
                dom.emptyDesc.textContent = 'You\'re all caught up for today. Add a new task to keep building your routine.';
            }
        } else {
            dom.emptyState.classList.add('hide');
            filtered.forEach(task => {
                const card = createTaskCardElement(task);
                dom.taskList.appendChild(card);
            });
        }

        updateProgressCard();
    }

    function createTaskCardElement(task) {
        const card = document.createElement('div');
        const overdue = isTaskOverdue(task);
        const upcoming = isTaskUpcoming(task);
        card.className = `task-card ${task.completed ? 'completed' : ''} ${overdue ? 'is-overdue' : ''}`;
        card.dataset.id = task.id;

        const catInfo = CATEGORIES[task.category] || { label: task.category, icon: 'fa-tag' };
        const priorityLabels = { high: '🔥 High', medium: '⚡ Med', low: '🟢 Low' };

        let subtasksHtml = '';
        if (task.subtasks && task.subtasks.length > 0) {
            const completedSub = task.subtasks.filter(s => s.completed).length;
            subtasksHtml = `
                <div class="subtasks-container">
                    <div class="subtask-progress-summary" style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px;">
                        Subtasks: ${completedSub}/${task.subtasks.length}
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

        card.innerHTML = `
            <div class="task-card-main">
                <input type="checkbox" class="custom-checkbox task-main-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <div class="task-meta-row">
                        <span class="badge badge-category"><i class="fa-solid ${catInfo.icon}"></i> ${catInfo.label}</span>
                        <span class="badge badge-priority-${task.priority}">${priorityLabels[task.priority]}</span>
                        ${overdue ? `<span class="badge badge-overdue"><i class="fa-solid fa-triangle-exclamation"></i> Overdue (${task.dueDate})</span>` : ''}
                        ${upcoming ? `<span class="badge badge-date" style="background:rgba(236,72,153,0.18); color:var(--accent-primary);"><i class="fa-regular fa-calendar-check"></i> Scheduled for ${task.dueDate}</span>` : ''}
                        ${!overdue && !upcoming && task.dueDate ? `<span class="badge badge-date"><i class="fa-regular fa-calendar"></i> Today</span>` : ''}
                        ${task.dueTime ? `<span class="badge badge-time"><i class="fa-regular fa-clock"></i> ${task.dueTime}</span>` : ''}
                        ${task.recurring !== 'none' ? `<span class="badge badge-recurring"><i class="fa-solid fa-repeat"></i> ${task.recurring}</span>` : ''}
                    </div>
                    ${subtasksHtml}
                </div>
                <div class="task-actions">
                    <button class="action-btn focus-task-btn" title="Start Focus Timer"><i class="fa-solid fa-stopwatch" style="color:var(--accent-primary);"></i></button>
                    <button class="action-btn edit-btn" title="Edit Task"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete-btn" title="Delete Task"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;

        const mainCheckbox = card.querySelector('.task-main-checkbox');
        mainCheckbox.addEventListener('change', (e) => {
            toggleTaskComplete(task.id, e.target.checked);
        });

        card.querySelectorAll('.subtask-checkbox').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const subId = chk.dataset.subId;
                toggleSubtaskComplete(task.id, subId, e.target.checked);
            });
        });

        const focusBtn = card.querySelector('.focus-task-btn');
        if (focusBtn) {
            focusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                FocusEngine.open(task.id);
            });
        }

        card.querySelector('.edit-btn').addEventListener('click', () => {
            openTaskModal(task);
        });

        card.querySelector('.delete-btn').addEventListener('click', () => {
            deleteTask(task.id);
        });

        return card;
    }

    function toggleTaskComplete(taskId, isCompleted) {
        var task = state.tasks.find(function(t) { return t.id === taskId; });
        if (task) {
            task.completed = isCompleted;
            task.completedAt = isCompleted ? new Date().toISOString() : null;

            if (task.subtasks) {
                task.subtasks.forEach(function(s) { s.completed = isCompleted; });
            }

            if (isCompleted) {
                state.profile.totalCompletedCount = (state.profile.totalCompletedCount || 0) + 1;
                if (!task.recurring || task.recurring === 'none') {
                    cancelNotificationForTask(taskId); // Only cancel one-off tasks
                }
                AudioEngine.playTaskComplete();
                
                const todayPending = state.tasks.filter(function(t) { return isTaskToday(t) && !t.completed; });
                if (todayPending.length === 0) {
                    AudioEngine.playStreakCelebration();
                    showToast('🏆 All tasks completed for today! Awesome!');
                } else {
                    showToast('Task completed! 🎉');
                }
            } else {
                // Re-schedule reminder if task is unchecked
                scheduleNativeLocalNotifications();
            }

            updateStreakAndHistory();
            saveState();
            renderTasks();
            checkAutoBackupSchedule();
        }
    }

    function toggleSubtaskComplete(taskId, subId, isCompleted) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task && task.subtasks) {
            const sub = task.subtasks.find(s => s.id === subId);
            if (sub) {
                sub.completed = isCompleted;
                const allSubDone = task.subtasks.every(s => s.completed);
                if (allSubDone) {
                    task.completed = true;
                    task.completedAt = new Date().toISOString();
                } else {
                    task.completed = false;
                }

                saveState();
                renderTasks();
                checkAutoBackupSchedule();
            }
        }
    }

    function deleteTask(taskId) {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        saveState();
        renderTasks();
        showToast('Task deleted');
    }

    // --- PROGRESS RING & COUNTERS UPDATE ---
    function updateProgressCard() {
        const todayPending = state.tasks.filter(t => !t.completed && isTaskToday(t)).length;
        const overduePending = state.tasks.filter(t => isTaskOverdue(t)).length;
        const upcomingPending = state.tasks.filter(t => isTaskUpcoming(t)).length;
        const completed = state.tasks.filter(t => t.completed).length;

        const totalWorkload = todayPending + overduePending + completed;
        const percentage = totalWorkload === 0 ? 0 : Math.round((completed / totalWorkload) * 100);

        dom.tasksTodayPendingCount.textContent = todayPending;
        dom.tasksOverduePendingCount.textContent = overduePending;
        dom.tasksDoneCount.textContent = completed;
        dom.overdueTabCount.textContent = overduePending;
        dom.upcomingTabCount.textContent = upcomingPending;

        dom.progressPercentageText.textContent = `${percentage}%`;

        const circumference = 226.19;
        const offset = circumference - (percentage / 100) * circumference;
        dom.progressCircle.style.strokeDashoffset = offset;
    }

    // --- REMINDER BANNER & NOTIFICATIONS ---
    function checkReminderNotification() {
        var todayPending = state.tasks.filter(function(t) { return !t.completed && isTaskToday(t); });
        if (todayPending.length > 0) {
            dom.reminderBanner.classList.remove('hide');
            var firstTaskTitle = todayPending[0].title;
            dom.reminderTitle.textContent = `🎯 Next Goal: "${firstTaskTitle}"`;
            dom.reminderDesc.textContent = todayPending.length === 1 
                ? '1 task pending for today' 
                : `${todayPending.length} tasks pending for today`;
        } else {
            dom.reminderBanner.classList.add('hide');
        }
    }

    // --- IN-APP UPDATE CHECKER (VIA VERCEL / GITHUB RAW / RELATIVE VERSION.JSON) ---
    function checkForAppUpdates(isManualCheck = false) {
        const timestamp = Date.now();
        const endpoints = [
            'https://todo-list-app-eight-pi.vercel.app/version.json?t=' + timestamp,
            'https://raw.githubusercontent.com/shinchan2222/TODO_LIST-APP/main/version.json?t=' + timestamp,
            './version.json?t=' + timestamp
        ];

        let highestData = null;

        function evaluate(data) {
            if (data && typeof data.version === 'number') {
                if (!highestData || data.version > highestData.version) {
                    highestData = data;
                }
            }
        }

        const promises = endpoints.map(function(url) {
            return fetch(url)
                .then(function(res) {
                    if (res && res.ok) return res.json();
                    return null;
                })
                .then(evaluate)
                .catch(function() { return null; });
        });

        Promise.all(promises).finally(function() {
            if (highestData && highestData.version && highestData.version > APP_VERSION) {
                const rawApkUrl = highestData.apkUrl || (`https://todo-list-app-eight-pi.vercel.app/RoutineCraft_v${highestData.version}.apk`);
                try {
                    window.latestApkUrl = new URL(rawApkUrl, 'https://todo-list-app-eight-pi.vercel.app/').href;
                } catch(e) {
                    window.latestApkUrl = rawApkUrl;
                }
                if (dom.updateBanner) dom.updateBanner.classList.remove('hide');
                if (dom.updateBannerTitle) dom.updateBannerTitle.textContent = `New update v${highestData.versionName || highestData.version} available`;

                // Update Settings Modal section
                if (dom.updateSettingsTitle) dom.updateSettingsTitle.textContent = `Update v${highestData.versionName || highestData.version} Available! 🎉`;
                if (dom.updateSettingsSubtext) dom.updateSettingsSubtext.textContent = highestData.releaseNotes || 'Tap "Update Now" to get the latest version.';
                if (dom.updateSettingsIcon) {
                    dom.updateSettingsIcon.className = 'fa-solid fa-wand-magic-sparkles cloud-icon';
                    dom.updateSettingsIcon.style.color = '#f59e0b';
                }
                if (dom.checkUpdateSettingsBtn) dom.checkUpdateSettingsBtn.classList.add('hide');
                if (dom.applyUpdateSettingsBtn) dom.applyUpdateSettingsBtn.classList.remove('hide');
                if (isManualCheck) showToast(`New update v${highestData.versionName || highestData.version} available! 🚀`);
            } else {
                if (dom.updateBanner) dom.updateBanner.classList.add('hide');

                // Update Settings Modal section: Already in latest version
                if (dom.updateSettingsTitle) dom.updateSettingsTitle.textContent = 'Already in latest version';
                if (dom.updateSettingsSubtext) dom.updateSettingsSubtext.textContent = `RoutineCraft v${(highestData && highestData.versionName) ? highestData.versionName : '1.8.0'} (Build ${APP_VERSION}) — Latest`;
                if (dom.updateSettingsIcon) {
                    dom.updateSettingsIcon.className = 'fa-solid fa-circle-check cloud-icon';
                    dom.updateSettingsIcon.style.color = 'var(--accent-success)';
                }
                if (dom.checkUpdateSettingsBtn) dom.checkUpdateSettingsBtn.classList.remove('hide');
                if (dom.applyUpdateSettingsBtn) dom.applyUpdateSettingsBtn.classList.add('hide');
                if (isManualCheck) showToast('Already in latest version! ✨');
            }
        });
    }

    // --- TASK MODAL & FORM ---
    function openTaskModal(taskToEdit = null) {
        state.tempSubtasks = [];
        dom.subtaskBuilderList.innerHTML = '';

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
                state.tempSubtasks = [...taskToEdit.subtasks];
                renderTempSubtasks();
            }
        } else {
            dom.modalHeading.textContent = 'Create New Task';
            dom.taskForm.reset();
            dom.taskIdInput.value = '';
            dom.taskDateInput.value = getTodayStr();
        }

        dom.taskModal.classList.remove('hide');
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

    dom.datePresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            if (preset === 'today') dom.taskDateInput.value = getTodayStr();
            else if (preset === 'tomorrow') dom.taskDateInput.value = getFutureDateStr(1);
            else if (preset === 'in3days') dom.taskDateInput.value = getFutureDateStr(3);
            else if (preset === 'nextweek') dom.taskDateInput.value = getFutureDateStr(7);
        });
    });

    dom.addSubtaskBtn.addEventListener('click', () => {
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
    });

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
                showToast(`Task scheduled for ${dueDate}! 🗓️`);
            } else {
                showToast('New task added to Today! 🎯');
            }
        }

        saveState();
        renderTasks();
        checkReminderNotification();
        checkAutoBackupSchedule();
        closeTaskModal();
    });

    // --- NOTIFICATION PERMISSION TOGGLE ---
    dom.notifyBtn.addEventListener('click', function() {
        state.profile.notificationsEnabled = !state.profile.notificationsEnabled;
        saveState();
        renderHeaderProfile();

        if (state.profile.notificationsEnabled) {
            requestPwaPermission().then(function(granted) {
                scheduleNativeLocalNotifications();
                scheduleSummaryNotification();
                if (granted) {
                    showToast('Notifications enabled! \uD83D\uDD14');
                } else {
                    showToast('Notifications enabled \u2014 allow in browser for PWA alerts \uD83D\uDD14');
                }
            });
        } else {
            // Clear all PWA timers
            Object.keys(_pwaTimerHandles).forEach(function(id) {
                clearTimeout(_pwaTimerHandles[id]);
                delete _pwaTimerHandles[id];
            });
            showToast('Notifications muted');
        }
    });

    dom.dismissReminderBtn.addEventListener('click', () => {
        dom.reminderBanner.classList.add('hide');
    });

    if (dom.dismissUpdateBtn) {
        dom.dismissUpdateBtn.addEventListener('click', () => {
            if (dom.updateBanner) dom.updateBanner.classList.add('hide');
        });
    }

    function handleApplyUpdate() {
        if (window.latestApkUrl && (window.Capacitor || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))) {
            showToast('Downloading latest APK update... 📥');
            const link = document.createElement('a');
            link.href = window.latestApkUrl;
            link.download = window.latestApkUrl.split('/').pop() || 'RoutineCraft.apk';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            showToast('Updating web app assets... 🚀');
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                        registration.update();
                    }
                });
            }
            if ('caches' in window) {
                caches.keys().then(function(names) {
                    for (let name of names) caches.delete(name);
                });
            }
            setTimeout(() => {
                window.location.reload();
            }, 350);
        }
    }

    if (dom.updateActionBtn) {
        dom.updateActionBtn.addEventListener('click', handleApplyUpdate);
    }

    if (dom.checkUpdateSettingsBtn) {
        dom.checkUpdateSettingsBtn.addEventListener('click', () => {
            showToast('Checking for updates... 🔄');
            checkForAppUpdates(true);
        });
    }

    if (dom.applyUpdateSettingsBtn) {
        dom.applyUpdateSettingsBtn.addEventListener('click', handleApplyUpdate);
    }

    // --- PROFILE & SETTINGS MODAL ---
    function renderUsersGrid() {
        dom.usersListGrid.innerHTML = '';
        const emails = Object.keys(usersStore);

        emails.forEach(email => {
            const userObj = usersStore[email];
            const isActive = (email === activeEmail);
            const isDefault = (email === 'default_user@routinecraft.app');

            const item = document.createElement('div');
            item.className = `user-account-item ${isActive ? 'active' : ''}`;
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';
            item.style.padding = '8px 12px';

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; cursor:pointer; flex:1;" class="account-select-area">
                    <span style="font-size:1.1rem;">${userObj.profile.avatar || '👤'}</span>
                    <div style="display:flex; flex-direction:column;">
                        <strong style="font-size:0.86rem; color:var(--text-primary);">${escapeHtml(userObj.profile.name || email)}</strong>
                        <span style="font-size:0.72rem; color:var(--text-secondary);">${escapeHtml(isDefault ? 'Local Guest Profile' : email)}</span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    ${isActive ? '<span style="font-size:0.74rem; font-weight:700; color:var(--accent-primary);"><i class="fa-solid fa-check"></i> Active</span>' : '<span style="font-size:0.74rem; color:var(--text-muted); cursor:pointer;" class="account-select-area">Select</span>'}
                    ${!isDefault ? `<button type="button" class="action-btn delete-acc-btn" data-email="${escapeHtml(email)}" title="Remove account from device" style="background:none; border:none; color:var(--accent-danger); cursor:pointer; padding:4px 6px;"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                </div>
            `;

            item.querySelectorAll('.account-select-area').forEach(el => {
                el.addEventListener('click', () => {
                    if (!isActive) switchUserAccount(email);
                });
            });

            const delBtn = item.querySelector('.delete-acc-btn');
            if (delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Remove account ${email} from this device?`)) {
                        removeUserAccount(email);
                    }
                });
            }

            dom.usersListGrid.appendChild(item);
        });
    }

    function closeAllModals() {
        if (dom.taskModal) dom.taskModal.classList.add('hide');
        if (dom.profileModal) dom.profileModal.classList.add('hide');
        if (dom.analyticsModal) dom.analyticsModal.classList.add('hide');
        if (dom.authModal) dom.authModal.classList.add('hide');
        if (dom.focusModal) dom.focusModal.classList.add('hide');
        if (dom.gdrivePermissionModal) dom.gdrivePermissionModal.classList.add('hide');
    }

    function setActiveNav(navName) {
        if (!dom.bottomNavItems) return;
        dom.bottomNavItems.forEach(n => {
            if (n.dataset.nav === navName) n.classList.add('active');
            else n.classList.remove('active');
        });
    }

    function openProfileModal() {
        closeAllModals();
        setActiveNav('settings');
        dom.profileNameInput.value = state.profile.name;
        dom.avatarOpts.forEach(function(opt) {
            if (opt.dataset.avatar === state.profile.avatar) opt.classList.add('active');
            else opt.classList.remove('active');
        });
        // Populate notification summary time
        var summaryInput = document.getElementById('summary-notif-time-input');
        if (summaryInput) {
            summaryInput.value = state.profile.summaryNotificationTime || '20:00';
        }
        // Populate rest days
        state.profile.restDays = state.profile.restDays || [0];
        if (dom.restDayPills) {
            dom.restDayPills.forEach(pill => {
                const dayNum = parseInt(pill.dataset.day, 10);
                pill.classList.toggle('active', state.profile.restDays.includes(dayNum));
            });
        }
        // Populate streak freeze badge
        if (dom.streakFreezeCountBadge) {
            const count = state.profile.streakFreezes !== undefined ? state.profile.streakFreezes : 2;
            dom.streakFreezeCountBadge.textContent = `${count} / 2 Active`;
        }
        // Populate sound & haptics toggle
        if (dom.soundHapticsToggle) {
            dom.soundHapticsToggle.checked = state.profile.soundHapticsEnabled !== false;
        }

        renderAccountStatusBar();
        renderUsersGrid();
        dom.profileModal.classList.remove('hide');
    }

    function closeProfileModal() {
        if (dom.profileModal) dom.profileModal.classList.add('hide');
        setActiveNav('tasks');
    }

    if (dom.restDayPills) {
        dom.restDayPills.forEach(pill => {
            pill.addEventListener('click', () => {
                pill.classList.toggle('active');
            });
        });
    }

    dom.avatarOpts.forEach(opt => {
        opt.addEventListener('click', () => {
            dom.avatarOpts.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            state.profile.avatar = opt.dataset.avatar;
        });
    });

    dom.themeCards.forEach(card => {
        card.addEventListener('click', () => {
            applyTheme(card.dataset.setTheme);
        });
    });

    dom.saveProfileBtn.addEventListener('click', function() {
        state.profile.name = dom.profileNameInput.value.trim() || 'Productivity Hero';
        state.profile.backupFrequency = dom.backupFrequencySelect.value;
        
        // Save sound & haptic preferences
        if (dom.soundHapticsToggle) {
            state.profile.soundHapticsEnabled = dom.soundHapticsToggle.checked;
        }

        // Save planned rest days
        const activeRestDays = [];
        if (dom.restDayPills) {
            dom.restDayPills.forEach(pill => {
                if (pill.classList.contains('active')) {
                    activeRestDays.push(parseInt(pill.dataset.day, 10));
                }
            });
        }
        state.profile.restDays = activeRestDays;

        // Read summary notification time from UI if the input exists
        var summaryInput = document.getElementById('summary-notif-time-input');
        if (summaryInput && summaryInput.value) {
            state.profile.summaryNotificationTime = summaryInput.value;
        }
        
        updateStreakAndHistory();
        saveState();
        renderHeaderProfile();
        scheduleSummaryNotification();
        closeProfileModal();
        showToast('Settings & preferences saved! 💾');
    });

    // --- CSV & PRINTABLE REPORT EXPORT ---
    function exportTasksToCSV() {
        const rows = [
            ['Task ID', 'Title', 'Category', 'Priority', 'Due Date', 'Due Time', 'Recurring', 'Completed', 'Completed At', 'Subtasks Count', 'Completed Subtasks']
        ];
        
        state.tasks.forEach(t => {
            const subCount = (t.subtasks || []).length;
            const subDone = (t.subtasks || []).filter(s => s.completed).length;
            rows.push([
                `"${t.id}"`,
                `"${(t.title || '').replace(/"/g, '""')}"`,
                `"${t.category || 'personal'}"`,
                `"${t.priority || 'medium'}"`,
                `"${t.dueDate || ''}"`,
                `"${t.dueTime || ''}"`,
                `"${t.recurring || 'none'}"`,
                `"${t.completed ? 'Yes' : 'No'}"`,
                `"${t.completedAt || ''}"`,
                subCount,
                subDone
            ]);
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `RoutineCraft_Tasks_${getTodayStr()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('📄 Tasks exported to CSV successfully!');
    }

    function printMonthlyReport() {
        if (dom.analyticsModal) dom.analyticsModal.classList.remove('hide');
        setTimeout(() => {
            window.print();
        }, 300);
    }

    // --- GOOGLE DRIVE BACKUP BUTTONS ---
    dom.headerGoogleLoginBtn.addEventListener('click', () => {
        if (state.profile.isGoogleSynced) {
            openProfileModal();
        } else {
            triggerGoogleLogin();
        }
    });

    if (dom.logoutSettingsBtn) {
        dom.logoutSettingsBtn.addEventListener('click', () => {
            if (confirm(`Sign out of ${state.profile.email || 'your account'}?`)) {
                logoutUserAccount();
            }
        });
    }

    if (dom.switchAccountBtn) {
        dom.switchAccountBtn.addEventListener('click', () => {
            openProfileModal();
        });
    }

    dom.addNewAccountBtn.addEventListener('click', () => {
        triggerGoogleLogin();
    });

    dom.confirmGdrivePermBtn.addEventListener('click', () => {
        confirmGoogleBackupPermission();
    });

    dom.skipGdrivePermBtn.addEventListener('click', () => {
        dom.gdrivePermissionModal.classList.add('hide');
    });

    dom.closeGdrivePermModalBtn.addEventListener('click', () => {
        dom.gdrivePermissionModal.classList.add('hide');
    });

    dom.gdriveBackupBtn.addEventListener('click', () => {
        performManualBackup();
    });

    dom.gdriveRestoreBtn.addEventListener('click', () => {
        dom.importFileInput.click();
    });

    // --- LOCAL DATA IMPORT / EXPORT / RESET ---
    dom.exportDataBtn.addEventListener('click', async () => {
        const jsonString = JSON.stringify(state, null, 2);
        const fileName = `routinecraft_backup_${state.profile.name}_${getTodayStr()}.json`;

        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
            try {
                const { Filesystem, Share } = window.Capacitor.Plugins;
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: jsonString,
                    directory: 'CACHE',
                    encoding: 'utf8'
                });
                
                await Share.share({
                    title: 'RoutineCraft Backup',
                    text: 'Here is your local JSON backup.',
                    url: result.uri,
                    dialogTitle: 'Save or Share Backup'
                });
                showToast('Backup shared! 💾');
            } catch (err) {
                console.error('Capacitor export error:', err);
                showToast('Failed to export on mobile.');
            }
        } else {
            // Web / PWA fallback
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", fileName);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast('Backup file saved! 💾');
        }
    });

    dom.importDataBtn.addEventListener('click', () => {
        dom.importFileInput.click();
    });

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
                    saveState();
                    applyTheme(state.profile.theme);
                    renderHeaderProfile();
                    renderTasks();
                    closeProfileModal();
                    showToast('Backup restored successfully! 🎉');
                    // After restoring data, refresh notifications to reflect new tasks
                    if (state.profile.notificationsEnabled) {
                        scheduleNativeLocalNotifications();
                        scheduleSummaryNotification();
                    }
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
        if (confirm(`Reset tasks for ${state.profile.name}?`)) {
            state.tasks = [...DEFAULT_TASKS];
            saveState();
            renderTasks();
            closeProfileModal();
            showToast('Reset to starter tasks!');
        }
    });

    // --- OPEN STATS ANALYTICS DASHBOARD MODAL ---
    function showHeatmapDayDetail(dateStr) {
        if (!dom.heatmapDayDetail) return;
        const d = new Date(dateStr + 'T00:00:00');
        const formattedDate = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        
        dom.heatmapDetailDate.textContent = formattedDate;
        dom.heatmapDetailTasksList.innerHTML = '';

        const matchingTasks = state.tasks.filter(t => {
            return isTaskScheduledForDate(t, dateStr) || 
                   (t.completed && ((t.completedAt && t.completedAt.startsWith(dateStr)) || t.dueDate === dateStr));
        });

        if (matchingTasks.length === 0) {
            const historyCount = (state.profile.completionHistory && state.profile.completionHistory[dateStr]) || 0;
            if (historyCount > 0) {
                dom.heatmapDetailTasksList.innerHTML = `<div style="color:var(--text-muted); padding:4px 0;"><i class="fa-solid fa-check" style="color:var(--accent-success);"></i> ${historyCount} completed tasks recorded in history.</div>`;
            } else {
                dom.heatmapDetailTasksList.innerHTML = `<div style="color:var(--text-muted); padding:4px 0;">No tasks recorded for this day.</div>`;
            }
        } else {
            matchingTasks.forEach(task => {
                const item = document.createElement('div');
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.justifyContent = 'space-between';
                item.style.padding = '4px 0';
                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px;">
                        <i class="${task.completed ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}" style="color:${task.completed ? 'var(--accent-success)' : 'var(--text-muted)'};"></i>
                        <span style="text-decoration:${task.completed ? 'line-through' : 'none'}; color:${task.completed ? 'var(--text-secondary)' : 'var(--text-primary)'};">${escapeHtml(task.title)}</span>
                    </div>
                    <span style="font-size:0.72rem; color:var(--text-secondary);">${task.dueTime || ''}</span>
                `;
                dom.heatmapDetailTasksList.appendChild(item);
            });
        }

        dom.heatmapDayDetail.classList.remove('hide');
    }

    function renderHistoryLog() {
        if (!dom.historyDaysList) return;
        dom.historyDaysList.innerHTML = '';

        const allRecordedDates = new Set(state.profile.completedDates || []);
        if (state.profile.completionHistory) {
            Object.keys(state.profile.completionHistory).forEach(d => allRecordedDates.add(d));
        }
        state.tasks.forEach(t => {
            if (t.dueDate) allRecordedDates.add(t.dueDate);
            if (t.completedAt) allRecordedDates.add(t.completedAt.split('T')[0]);
        });

        const sortedDates = Array.from(allRecordedDates)
            .filter(d => Boolean(d) && d <= getTodayStr())
            .sort((a, b) => b.localeCompare(a));

        if (dom.historyTotalDaysCount) {
            dom.historyTotalDaysCount.textContent = `${sortedDates.length} Days Recorded`;
        }

        if (sortedDates.length === 0) {
            dom.historyDaysList.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-muted); font-size:0.85rem;">No past activity recorded yet. Complete tasks to build your history!</div>`;
            return;
        }

        sortedDates.slice(0, 30).forEach(dayStr => {
            const d = new Date(dayStr + 'T00:00:00');
            const dayFormatted = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
            
            const dayTasks = state.tasks.filter(t => {
                return (t.dueDate === dayStr) || (t.completed && t.completedAt && t.completedAt.startsWith(dayStr));
            });

            const completedCount = dayTasks.filter(t => t.completed).length || (state.profile.completionHistory && state.profile.completionHistory[dayStr]) || 0;
            const totalCount = Math.max(dayTasks.length, completedCount);

            const card = document.createElement('div');
            card.className = 'history-day-card';
            card.style.cursor = 'pointer';

            let tasksListPreview = '';
            if (dayTasks.length > 0) {
                tasksListPreview = dayTasks.slice(0, 3).map(t => `
                    <div class="history-task-item">
                        <i class="${t.completed ? 'fa-solid fa-check' : 'fa-regular fa-circle'}"></i>
                        <span style="text-decoration:${t.completed ? 'line-through' : 'none'};">${escapeHtml(t.title)}</span>
                    </div>
                `).join('');
                if (dayTasks.length > 3) {
                    tasksListPreview += `<span style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">+${dayTasks.length - 3} more tasks</span>`;
                }
            } else if (completedCount > 0) {
                tasksListPreview = `<div class="history-task-item"><i class="fa-solid fa-check"></i> <span>${completedCount} tasks completed</span></div>`;
            }

            card.innerHTML = `
                <div class="history-day-header">
                    <span class="history-day-title">${dayStr === getTodayStr() ? "Today (" + dayFormatted + ")" : dayFormatted}</span>
                    <span class="history-day-badge">${completedCount} / ${totalCount} Done</span>
                </div>
                <div>${tasksListPreview}</div>
            `;

            card.addEventListener('click', () => {
                showHeatmapDayDetail(dayStr);
            });

            dom.historyDaysList.appendChild(card);
        });
    }

    function openAnalyticsModal() {
        closeAllModals();
        setActiveNav('analytics');
        renderStatsMilestones();
        renderOverallProgressCard();
        renderWeeklyPlannerGrid();
        renderHistoryLog();

        if (dom.heatmapDayDetail) dom.heatmapDayDetail.classList.add('hide');

        dom.heatmapGrid.innerHTML = '';
        for (let i = 29; i >= 0; i--) {
            const tile = document.createElement('div');
            const tileDate = getPastDateStr(i);
            let count = 0;
            if (tileDate === getTodayStr()) {
                count = state.tasks.filter(t => t.completed && isTaskToday(t)).length;
            } else {
                const tasksDoneOnDate = state.tasks.filter(t => t.completed && ((t.completedAt && t.completedAt.startsWith(tileDate)) || t.dueDate === tileDate)).length;
                const historyCount = (state.profile.completionHistory && state.profile.completionHistory[tileDate]) || 0;
                count = Math.max(tasksDoneOnDate, historyCount);
            }

            let lvlClass = 'lvl-0';
            if (count > 0 && count <= 2) {
                lvlClass = 'lvl-1';
            } else if (count >= 3 && count <= 4) {
                lvlClass = 'lvl-2';
            } else if (count >= 5) {
                lvlClass = 'lvl-3';
            }

            tile.className = `heatmap-tile ${lvlClass}`;
            tile.title = `${tileDate}: ${count} task${count === 1 ? '' : 's'} completed (Click to inspect)`;
            tile.style.cursor = 'pointer';
            tile.addEventListener('click', () => {
                showHeatmapDayDetail(tileDate);
            });
            dom.heatmapGrid.appendChild(tile);
        }

        dom.categoryBarsContainer.innerHTML = '';
        Object.keys(CATEGORIES).forEach(catKey => {
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

        dom.analyticsModal.classList.remove('hide');
    }

    function closeAnalyticsModal() {
        if (dom.analyticsModal) dom.analyticsModal.classList.add('hide');
        setActiveNav('tasks');
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        dom.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            if (state.searchQuery) dom.clearSearchBtn.classList.remove('hide');
            else dom.clearSearchBtn.classList.add('hide');
            renderTasks();
        });

        dom.clearSearchBtn.addEventListener('click', () => {
            dom.searchInput.value = '';
            state.searchQuery = '';
            dom.clearSearchBtn.classList.add('hide');
            renderTasks();
        });

        dom.categoriesContainer.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                dom.categoriesContainer.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                state.activeCategory = chip.dataset.category;
                renderTasks();
            });
        });

        dom.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                dom.filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.activeFilter = tab.dataset.filter;
                renderTasks();
            });
        });

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

        dom.fabAddBtn.addEventListener('click', () => openTaskModal());
        dom.emptyAddBtn.addEventListener('click', () => openTaskModal());
        dom.closeTaskModalBtn.addEventListener('click', closeTaskModal);
        dom.cancelTaskBtn.addEventListener('click', closeTaskModal);

        // Firebase Auth Modal Listeners
        if (dom.closeAuthModalBtn) dom.closeAuthModalBtn.addEventListener('click', closeAuthModal);

        if (dom.googleLoginModalBtn) {
            dom.googleLoginModalBtn.addEventListener('click', function() {
                if (navigator.onLine === false) {
                    showAuthError('⚠️ Internet connection required to sign in with Google. Please reconnect and try again.');
                    return;
                }
                var fb = window.RC_FIREBASE;
                if (fb && typeof fb.signInWithGoogle === 'function') {
                    fb.signInWithGoogle()
                        .then(function(user) {
                            if (user) {
                                handleFirebaseUserAuthenticated(user);
                                closeAuthModal();
                            }
                        })
                        .catch(function(err) {
                            const errStr = (err && err.message) ? err.message : String(err);
                            showAuthError(errStr || 'Google Sign-In failed');
                        });
                } else if (typeof firebase !== 'undefined' && firebase.auth) {
                    var provider = new firebase.auth.GoogleAuthProvider();
                    firebase.auth().signInWithPopup(provider)
                        .then(function(result) {
                            if (result && result.user) {
                                handleFirebaseUserAuthenticated(result.user);
                                closeAuthModal();
                            }
                        })
                        .catch(function(err) {
                            const errStr = (err && err.message) ? err.message : String(err);
                            showAuthError(errStr || 'Google Sign-In failed');
                        });
                } else {
                    showAuthError('Google Sign-In service is initializing. Please tap again in a moment.');
                }
            });
        }

        dom.profileTrigger.addEventListener('click', openProfileModal);
        dom.closeProfileModalBtn.addEventListener('click', closeProfileModal);
        dom.quickThemeBtn.addEventListener('click', openProfileModal);
        dom.streakBtn.addEventListener('click', openAnalyticsModal);

        dom.closeAnalyticsModalBtn.addEventListener('click', closeAnalyticsModal);
        dom.closeAnalyticsBtn.addEventListener('click', closeAnalyticsModal);

        // Focus Modal Controls
        FocusEngine.init();
        if (dom.closeFocusModalBtn) {
            dom.closeFocusModalBtn.addEventListener('click', () => {
                FocusEngine.close();
                setActiveNav('tasks');
            });
        }
        if (dom.focusToggleBtn) {
            dom.focusToggleBtn.addEventListener('click', () => {
                FocusEngine.toggle();
            });
        }
        if (dom.focusResetBtn) {
            dom.focusResetBtn.addEventListener('click', () => {
                FocusEngine.reset();
            });
        }
        if (dom.focusModesTabs && dom.focusModesTabs.length > 0) {
            dom.focusModesTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    FocusEngine.setMode(tab.dataset.focusMode);
                });
            });
        }
        if (dom.focusSoundChips && dom.focusSoundChips.length > 0) {
            dom.focusSoundChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    FocusEngine.setAmbient(chip.dataset.sound);
                });
            });
        }
        if (dom.focusTaskSelect) {
            dom.focusTaskSelect.addEventListener('change', (e) => {
                FocusEngine.activeTaskId = e.target.value;
            });
        }

        // Export Actions
        if (dom.exportCsvBtn) {
            dom.exportCsvBtn.addEventListener('click', exportTasksToCSV);
        }
        if (dom.printPdfReportBtn) {
            dom.printPdfReportBtn.addEventListener('click', printMonthlyReport);
        }

        if (dom.bottomNavItems && dom.bottomNavItems.length > 0) {
            dom.bottomNavItems.forEach(nav => {
                nav.addEventListener('click', () => {
                    const view = nav.dataset.nav;
                    closeAllModals();
                    setActiveNav(view);

                    if (view === 'tasks') {
                        renderTasks();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else if (view === 'focus') {
                        FocusEngine.open();
                    } else if (view === 'analytics') {
                        openAnalyticsModal();
                    } else if (view === 'settings') {
                        openProfileModal();
                    }
                });
            });
        }

        // Enhanced Stats Time-Range Switcher
        if (dom.statsTimeRangeTabs && dom.statsTimeRangeTabs.length > 0) {
            dom.statsTimeRangeTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    dom.statsTimeRangeTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    state.statsTimeRange = tab.dataset.statsRange || 'week';
                    renderOverallProgressCard();
                });
            });
        }

        if (dom.closeHeatmapDetailBtn) {
            dom.closeHeatmapDetailBtn.addEventListener('click', () => {
                if (dom.heatmapDayDetail) dom.heatmapDayDetail.classList.add('hide');
            });
        }

        // Native Android Notification Action Buttons Handler: [Mark Done] / [Snooze 15m]
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
            try {
                window.Capacitor.Plugins.LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
                    const { actionId, notification } = notificationAction;
                    const taskId = notification?.extra?.taskId;
                    if (actionId === 'MARK_DONE' && taskId) {
                        const task = state.tasks.find(t => t.id === taskId);
                        if (task) {
                            task.completed = true;
                            task.completedAt = new Date().toISOString();
                            updateStreakAndHistory();
                            saveState();
                            renderTasks();
                            AudioEngine.playTaskComplete();
                            showToast(`✅ "${task.title}" marked as complete!`);
                        }
                    } else if (actionId === 'SNOOZE_15' && taskId) {
                        const task = state.tasks.find(t => t.id === taskId);
                        if (task) {
                            const snoozeDate = new Date(Date.now() + 15 * 60 * 1000);
                            window.Capacitor.Plugins.LocalNotifications.schedule({
                                notifications: [
                                    {
                                        id: Math.abs(hashCode(taskId + '_snooze')),
                                        title: '⏰ Snoozed: ' + task.title,
                                        body: 'Snoozed task reminder',
                                        schedule: { at: snoozeDate },
                                        channelId: 'task_reminder',
                                        actionTypeId: 'TASK_REMINDER_ACTIONS',
                                        extra: { taskId: task.id }
                                    }
                                ]
                            }).catch(() => {});
                            showToast(`⏰ "${task.title}" snoozed for 15 minutes.`);
                        }
                    }
                });
            } catch(err) {
                console.warn('Action listener error:', err);
            }
        }

        // Online / Offline real-time network connection monitoring
        window.addEventListener('online', function() { updateNetworkStatus(true); });
        window.addEventListener('offline', function() { updateNetworkStatus(true); });

        // Auto-refresh notifications, midnight reset, and network status on app resume / screen unlock
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                updateNetworkStatus(false);
                checkDailyReset();
                updateStreakAndHistory();
                renderHeaderProfile();
                renderTasks();
                scheduleNativeLocalNotifications();
                scheduleSummaryNotification();
            }
        });

        // Handle notification clicks routed from the Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'NOTIF_CLICK') {
                    var channelId = event.data.channelId;
                    if (channelId === 'summary') {
                        openAnalyticsModal();
                    } else if (channelId === 'backup_completed') {
                        openProfileModal();
                    } else {
                        // task_reminder — ensure today view is active
                        state.activeFilter = 'today';
                        dom.filterTabs.forEach(function(t) {
                            if (t.dataset.filter === 'today') t.classList.add('active');
                            else t.classList.remove('active');
                        });
                        renderTasks();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }
            });
        }
    }

    function showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--accent-success);"></i> ${msg}`;
        dom.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
