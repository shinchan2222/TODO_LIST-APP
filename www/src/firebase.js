// src/firebase.js
// Firebase initialization and authentication helper for RoutineCraft
// This module mirrors the functionality previously in src/plugins/firebase-auth.js
// but is provided as a separate ES module for easier imports.

// Export a singleton object
export const RC_FIREBASE = {
  // Firebase config – replace with your project's values if needed
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
    firebase.auth().onAuthStateChanged(user => {
      this.currentUser = user;
      if (typeof cb === "function") cb(user);
    });
  },

  /** Check redirect result (used for mobile redirect flow) */
  async checkRedirectResult() {
    if (!this.initialized && !this.init()) return null;
    try {
      const res = await firebase.auth().getRedirectResult();
      return res && res.user ? res.user : null;
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
          clientId: "1037852256619-web.apps.googleusercontent.com",
          scopes: ["profile", "email"],
          grantOfflineAccess: true
        });
        console.log("[RC_FIREBASE] Native GoogleAuth plugin initialized.");
      } catch (e) {
        console.warn("[RC_FIREBASE] GoogleAuth init warning:", e);
      }
    }
  },

  /** Sign‑in with Google (Native Android Account Picker or Web Popup) */
  async signInWithGoogle() {
    if (!this.initialized && !this.init()) throw new Error("Firebase not initialized");

    const isNative = (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
                     window.location.protocol === 'capacitor:' ||
                     window.location.protocol === 'file:';

    const googleAuthPlugin = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) || window.GoogleAuth;

    // 1. Native Android flow using device Google Play Services
    if (isNative && googleAuthPlugin) {
      try {
        console.log("[RC_FIREBASE] Starting Native Android Google Sign-In...");
        const googleUser = await googleAuthPlugin.signIn();
        if (!googleUser) throw new Error("Google Sign-In cancelled");

        const idToken = (googleUser.authentication && googleUser.authentication.idToken) || googleUser.idToken;
        if (idToken && firebase.auth && firebase.auth.GoogleAuthProvider) {
          const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
          const userCred = await firebase.auth().signInWithCredential(credential);
          return userCred.user;
        }

        return {
          email: googleUser.email,
          displayName: googleUser.name || googleUser.displayName || (googleUser.givenName ? `${googleUser.givenName} ${googleUser.familyName || ''}`.trim() : googleUser.email.split('@')[0]),
          photoURL: googleUser.imageUrl || googleUser.photoURL || null,
          uid: googleUser.id || googleUser.uid || googleUser.email
        };
      } catch (nativeErr) {
        console.warn("[RC_FIREBASE] Native Google Sign-In error:", nativeErr);
        throw nativeErr;
      }
    }

    // 2. Web Browser flow
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await firebase.auth().signInWithPopup(provider);
      return result.user;
    } catch (e) {
      console.warn("[RC_FIREBASE] Web Google sign‑in error:", e?.message);
      throw e;
    }
  },

  /** Sign‑out */
  async signOut() {
    const isNative = (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    const googleAuthPlugin = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) || window.GoogleAuth;
    if (isNative && googleAuthPlugin && typeof googleAuthPlugin.signOut === 'function') {
      try { await googleAuthPlugin.signOut(); } catch (e) {}
    }
    if (firebase?.auth) await firebase.auth().signOut();
    this.currentUser = null;
    console.log("[RC_FIREBASE] Signed out");
  }
};

// Auto‑initialize if firebase SDK is already present
if (typeof firebase !== "undefined") {
  RC_FIREBASE.init();
  RC_FIREBASE.initGoogleAuth();
}
window.RC_FIREBASE = RC_FIREBASE;
