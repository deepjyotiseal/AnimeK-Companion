import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail } from 'firebase/auth';

export const signUp = async (email: string, password: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const signIn = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const resetPassword = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        throw new Error(error.message);
    }
};