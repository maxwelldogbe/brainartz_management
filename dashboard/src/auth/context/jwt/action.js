import axios, { endpoints } from 'src/utils/axios';

import { setSession } from './utils';
import { REFRESH_STORAGE_KEY } from './constant';

const getErrorMessage = (error, fallbackMessage) => {
  if (typeof error === 'string') return error;

  if (error?.non_field_errors?.length) return error.non_field_errors[0];
  if (error?.detail) return error.detail;

  if (error && typeof error === 'object') {
    const firstFieldErrors = Object.values(error).find((value) => Array.isArray(value) && value.length);
    if (firstFieldErrors) return firstFieldErrors[0];
  }

  return fallbackMessage;
};

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }) => {
  try {
    const params = { email, password };

    const res = await axios.post(endpoints.auth.signIn, params);

    const { access, refresh } = res.data;

    if (!access) {
      throw new Error('Access token not found in response');
    }

    setSession(access);

    if (refresh) {
      sessionStorage.setItem(REFRESH_STORAGE_KEY, refresh);
    }
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to sign in'));
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({ invitationToken, username, email, password, confirmPassword }) => {
  const params = {
    username,
    email: email || undefined,
    password,
    re_password: confirmPassword,
  };

  try {
    const endpoint = `${endpoints.auth.inviteRegister}${invitationToken}/`;

    const res = await axios.post(endpoint, params);

    const { access, refresh } = res.data;

    if (!access) {
      throw new Error('Access token not found in response');
    }

    await setSession(access);

    if (refresh) {
      sessionStorage.setItem(REFRESH_STORAGE_KEY, refresh);
    }
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to complete registration'));
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async () => {
  try {
    sessionStorage.removeItem(REFRESH_STORAGE_KEY);
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
