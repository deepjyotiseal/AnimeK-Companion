import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail, deleteUser } from 'firebase/auth';

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

export const deleteAccount = async () => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('No authenticated user found');
        }
        
        // Get the user ID before deleting the account
        const userId = currentUser.uid;
        
        // Import callFirestore dynamically to avoid circular dependencies
        const { callFirestore } = await import('../api/firebaseApi');
        
        try {
            // First get all watchlist items
            const watchlistItems = await callFirestore('get', `users/${userId}/watchlist`);
            
            // Delete each watchlist item individually
            if (watchlistItems && Array.isArray(watchlistItems)) {
                for (const item of watchlistItems) {
                    await callFirestore('delete', `users/${userId}/watchlist`, { document: item.id });
                }
            }
            
            // Delete the user document itself if it exists
            try {
                await callFirestore('delete', 'users', { document: userId });
            } catch (userDocError) {
                console.log('User document may not exist, continuing with deletion');
            }
            
            console.log('User data deleted from Firestore');
        } catch (firestoreError) {
            console.error('Error deleting user data from Firestore:', firestoreError);
            // Continue with account deletion even if Firestore deletion fails
        }
        
        // Clear local user data
        try {
            const { clearLocalUserData } = await import('../utils/userDataCleanup');
            await clearLocalUserData();
        } catch (localDataError) {
            console.error('Error clearing local user data:', localDataError);
            // Continue with account deletion even if local data cleanup fails
        }
        
        // Now delete the Firebase Auth user
        await deleteUser(currentUser);
    } catch (error: any) {
        throw new Error(error.message);
    }
};