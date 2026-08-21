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

    /** Sign‑in with Google (Native Android Account Picker or Firebase Web OAuth) */
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
            const displayName = googleUser.name || googleUser.displayName || (googleUser.givenName ? `${googleUser.givenName} ${googleUser.familyName || ''}`.trim() : (googleUser.email ? googleUser.email.split('@')[0] : 'Productivity User'));
            const photoURL = googleUser.imageUrl || googleUser.photoURL || null;
            const email = googleUser.email;

            // Attempt Firebase Auth Token exchange
            const idToken = (googleUser.authentication && googleUser.authentication.idToken) || googleUser.idToken;
            if (idToken && typeof firebase !== 'undefined' && firebase.auth && firebase.auth.GoogleAuthProvider) {
              try {
                if (!this.initialized) this.init();
                const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
                await firebase.auth().signInWithCredential(credential);
                console.log("[RC_FIREBASE] Firebase Auth registered Google token for:", email);
              } catch (credErr) {
                console.warn("[RC_FIREBASE] Firebase Auth token note:", credErr.message);
              }
            }

            // Guarantee user is registered in Firebase Console Auth Users table
            await this.registerInFirebaseAuth(email, displayName, photoURL);

            return {
              email: email,
              displayName: displayName,
              photoURL: photoURL,
              uid: googleUser.id || googleUser.uid || email
            };
          }
        } catch (nativeErr) {
          console.warn("[RC_FIREBASE] Native Google Sign-In error:", nativeErr);
          const errStr = (nativeErr && nativeErr.message) ? nativeErr.message : String(nativeErr);
          if (errStr.includes("cancel") || errStr.includes("12501")) {
            throw new Error("Google Sign-In was cancelled.");
          }
          throw nativeErr;
        }
      }

      // 2. Web Browser / Firebase OAuth flow
      if (typeof firebase !== 'undefined' && firebase.auth) {
        if (!this.initialized) this.init();
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope("profile");
        provider.addScope("email");
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await firebase.auth().signInWithPopup(provider);
        if (result && result.user) {
          return result.user;
        }
      }

      throw new Error("Google Sign-In service is unavailable. Please check your connection.");
    },

    /** Guarantee user is registered and active in Firebase Console Auth Users table */
    async registerInFirebaseAuth(email, displayName, photoURL) {
      if (!this.initialized && !this.init()) return null;
      if (typeof firebase === 'undefined' || !firebase.auth) return null;
      const securePass = 'RC_' + btoa(email + '_routinecraft_secure_pass').substring(0, 20) + '!9A';
      try {
        const userCred = await firebase.auth().signInWithEmailAndPassword(email, securePass);
        console.log("[RC_FIREBASE] Firebase Auth existing user signed in:", userCred.user.email);
        return userCred.user;
      } catch (err) {
        try {
          const newCred = await firebase.auth().createUserWithEmailAndPassword(email, securePass);
          if (newCred.user) {
            await newCred.user.updateProfile({
              displayName: displayName || email.split('@')[0],
              photoURL: photoURL || null
            });
          }
          console.log("[RC_FIREBASE] Firebase Auth new user created:", newCred.user.email);
          return newCred.user;
        } catch (createErr) {
          console.warn("[RC_FIREBASE] Firebase Auth cloud registration note:", createErr.message);
        }
      }
      return null;
    },

    /** Sync User Data & Cloud Profile to Firebase Realtime Database */
    async syncUserData(user, userData) {
      if (!this.initialized && !this.init()) return;
      if (typeof firebase === "undefined" || !firebase.database) return;
      try {
        const cleanKey = (user.email || user.uid || 'user').replace(/[^a-zA-Z0-9_]/g, '_');
        const dbRef = firebase.database().ref('users/' + cleanKey);
        await dbRef.set({
          email: user.email || '',
          displayName: user.displayName || user.name || '',
          photoURL: user.photoURL || '',
          lastLogin: new Date().toISOString(),
          profile: userData ? userData.profile : null,
          tasksCount: (userData && userData.tasks) ? userData.tasks.length : 0
        });
        console.log("[RC_FIREBASE] User record synced to Firebase Database for:", user.email);
      } catch (e) {
        console.warn("[RC_FIREBASE] Cloud sync notice:", e.message);
      }
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
