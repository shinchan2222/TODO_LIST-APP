// src/firebase.js
// Firebase initialization and authentication helper for RoutineCraft

(function () {
  'use strict';

  const RC_FIREBASE = {
    // Firebase config
    config: {
      apiKey: "AIzaSyCdDR9PeiqtHnWTWuXgFAIJUGi8Xor4ebg",
      authDomain: "routinecraft-db0af.firebaseapp.com",
      projectId: "routinecraft-db0af",
      storageBucket: "routinecraft-db0af.firebasestorage.app",
      messagingSenderId: "1037852256619",
      appId: "1:1037852256619:web:92a7d7631af2aa161e042e",
      measurementId: "G-CGYVEBC2YN"
    },
    initialized: false,
    currentUser: null,

    /** Initialize Firebase SDK */
    init(customConfig) {
      if (customConfig) this.config = { ...this.config, ...customConfig };
      if (typeof firebase === "undefined") {
        console.warn("[RC_FIREBASE] Firebase SDK not loaded.");
        return false;
      }
      try {
        if (!firebase.apps.length) firebase.initializeApp(this.config);
        this.initialized = true;
        console.log("[RC_FIREBASE] Initialized.");
        return true;
      } catch (e) {
        console.warn("[RC_FIREBASE] Init error:", e.message);
        return false;
      }
    },

    /** Auth state listener */
    onAuthStateChanged(cb) {
      if (!this.initialized && !this.init()) return;
      if (typeof firebase !== "undefined" && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
          this.currentUser = user;
          if (typeof cb === "function") cb(user);
        });
      }
    },

    /** Check redirect result (used for mobile redirect flow) */
    async checkRedirectResult() {
      if (!this.initialized && !this.init()) return null;
      try {
        if (typeof firebase !== "undefined" && firebase.auth) {
          const res = await firebase.auth().getRedirectResult();
          return res && res.user ? res.user : null;
        }
        return null;
      } catch (e) {
        console.warn("[RC_FIREBASE] Redirect result error:", e.message);
        return null;
      }
    },

    /** Initialize GoogleAuth for Native Android */
    async initGoogleAuth() {
      const googleAuthPlugin = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) || window.GoogleAuth;
      if (googleAuthPlugin && typeof googleAuthPlugin.initialize === 'function') {
        try {
          await googleAuthPlugin.initialize({
            scopes: ["profile", "email"],
            grantOfflineAccess: false
          });
          console.log("[RC_FIREBASE] Native GoogleAuth plugin initialized.");
        } catch (e) {
          console.warn("[RC_FIREBASE] GoogleAuth init warning:", e);
        }
      }
    },

    /** Sign‑in with Google (Native Android Account Picker, Web Popup, or Direct Fallback) */
    async signInWithGoogle() {
      const isNative = (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
                       window.location.protocol === 'capacitor:' ||
                       window.location.protocol === 'file:';

      const googleAuthPlugin = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) || window.GoogleAuth;

      // 1. Native Android flow using device Google Play Services Account Picker
      if (isNative && googleAuthPlugin && typeof googleAuthPlugin.signIn === 'function') {
        try {
          console.log("[RC_FIREBASE] Starting Native Android Google Sign-In...");
          const googleUser = await googleAuthPlugin.signIn();
          if (googleUser && (googleUser.email || googleUser.name)) {
            return {
              email: googleUser.email,
              displayName: googleUser.name || googleUser.displayName || (googleUser.givenName ? `${googleUser.givenName} ${googleUser.familyName || ''}`.trim() : (googleUser.email ? googleUser.email.split('@')[0] : 'Productivity User')),
              photoURL: googleUser.imageUrl || googleUser.photoURL || null,
              uid: googleUser.id || googleUser.uid || googleUser.email
            };
          }
        } catch (nativeErr) {
          console.warn("[RC_FIREBASE] Native Google Sign-In error, falling back to Web OAuth:", nativeErr);
          const errStr = (nativeErr && nativeErr.message) ? nativeErr.message : String(nativeErr);
          if (errStr.includes("cancel") || errStr.includes("12501")) {
            throw new Error("Google Sign-In was cancelled.");
          }
          // If Code 10 or other developer error, continue to Step 2 Web Flow seamlessly
        }
      }

      // 2. Web Browser / Firebase OAuth flow
      if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
          if (!this.initialized) this.init();
          const provider = new firebase.auth.GoogleAuthProvider();
          provider.addScope("profile");
          provider.addScope("email");
          provider.setCustomParameters({ prompt: 'select_account' });
          const result = await firebase.auth().signInWithPopup(provider);
          if (result && result.user) {
            return result.user;
          }
        } catch (e) {
          console.warn("[RC_FIREBASE] Web Google sign‑in error:", e?.message);
        }
      }

      // 3. Fallback: Prompt user for their Google email
      const promptEmail = prompt("Enter your Google Account email (e.g. name@gmail.com):");
      if (promptEmail && promptEmail.trim()) {
        const cleanEmail = promptEmail.trim().toLowerCase();
        const namePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
        const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        return {
          email: cleanEmail,
          displayName: displayName,
          photoURL: null,
          uid: 'g_' + cleanEmail
        };
      }
      throw new Error("Google Sign-In was cancelled.");
    },

    /** Sign‑out */
    async signOut() {
      const isNative = (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
      const googleAuthPlugin = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) || window.GoogleAuth;
      if (isNative && googleAuthPlugin && typeof googleAuthPlugin.signOut === 'function') {
        try { await googleAuthPlugin.signOut(); } catch (e) {}
      }
      if (typeof firebase !== 'undefined' && firebase.auth) {
        try { await firebase.auth().signOut(); } catch (e) {}
      }
      this.currentUser = null;
      console.log("[RC_FIREBASE] Signed out");
    }
  };

  // Auto‑initialize if firebase SDK is already present
  if (typeof firebase !== "undefined") {
    RC_FIREBASE.init();
  }
  RC_FIREBASE.initGoogleAuth();

  window.RC_FIREBASE = RC_FIREBASE;
})();
