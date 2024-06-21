import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDS2292cFwmIl9RoQ1lO0GxVQphw9gTsLo",
  authDomain: "meet-add58.firebaseapp.com",
  projectId: "meet-add58",
  storageBucket: "meet-add58.appspot.com",
  messagingSenderId: "848047552420",
  appId: "1:848047552420:web:f1e80e0ec92ec34d58b331",
  measurementId: "G-8P9VTDC4MH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const meetingsCollection = collection(db, "meetings");
const addMeeting = async (roomId: string, ownerId: string) => {
  try {
    await addDoc(meetingsCollection, {
      roomId: roomId,
      ownerId: ownerId
    });
    console.log("Meeting added successfully!");
  } catch (error) {
    console.error("Error adding meeting:", error);
  }
};

export { app, auth, db, onAuthStateChanged, signOut, addMeeting };