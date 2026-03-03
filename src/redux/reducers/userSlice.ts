import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { ReduxUserData, ReduxUserSliceState } from '../../types';
import { setCookie, deleteCookie } from '../../utils/cookies';

export const loginUser = createAsyncThunk<
  ReduxUserData,
  { email: string; password: string },
  { rejectValue: string }
>('user/loginUser', async ({ email, password }, { rejectWithValue }) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const userDocRef = doc(db, 'members', uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('User data not found in members collection.');
    }

    const userData = userDoc.data() as Omit<ReduxUserData, 'uid'>;
    const role = userData.role;

    setCookie('userRole', role, 7 * 24 * 60 * 60);
    setCookie('nasna_session', '1', 12 * 60 * 60);

    return { uid, ...userData };
  } catch (error) {
    const authError = error as AuthError;
    return rejectWithValue(authError.code || authError.message);
  }
});

const initialState: ReduxUserSliceState = {
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
      deleteCookie('userRole');
      deleteCookie('nasna_session');
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
        state.error = action.payload ?? null;
        state.loading = false;
      });
  },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;
