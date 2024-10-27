import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const loginUser = createAsyncThunk(
    'user/loginUser',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;


            const userDocRef = doc(db, 'members', uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                throw new Error('User data not found in members collection.');
            }

            const userData = userDoc.data();
            const role = userData.role;

            localStorage.setItem('userRole', role);

            return { uid, role, ...userData };
        } catch (error) {
            return rejectWithValue(error.message || error.code);
        }
    }
);

const initialState = {
    user: null,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.loading = false;
            state.error = null;
            localStorage.removeItem('userRole');
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.user = action.payload;
                state.loading = false;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            });
    },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;
