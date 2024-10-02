import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';


const firebaseConfig = {
    apiKey: "AIzaSyCS6vvEiEiZ-GYHY42QQ-QXJjdWLJ9Q4HE",
    authDomain: "btrajek-se3dni.firebaseapp.com",
    projectId: "btrajek-se3dni",
    storageBucket: "btrajek-se3dni.appspot.com",
    messagingSenderId: "261651232882",
    appId: "1:261651232882:web:d99c881d03ed13f327eaeb"
};

let app;
if (firebase.apps.length === 0) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app();
}

const auth = app.auth(); // for authentication
const db = app.firestore();    // for firestore
const storage = app.storage(); // for storage
db.settings({ merge: true });   // for firestore offline support


export { auth, db, storage, firebase };