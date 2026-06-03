import { useMemo, useEffect, useCallback } from 'react';

import { useSetState } from 'src/hooks/use-set-state';

import axios, { endpoints } from 'src/utils/axios';

import { STORAGE_KEY } from './constant';
import { AuthContext } from '../auth-context';
import { setSession, isValidToken } from './utils';

// ----------------------------------------------------------------------

const normalizeUser = (user, accessToken) => {
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || user?.email || 'User';
  const role = user?.is_admin ? 'admin' : user?.is_worker ? 'worker' : 'user';

  return {
    ...user,
    accessToken,
    role,
    worker_role: user?.worker_role ?? null,
    worker_roles: Array.isArray(user?.worker_roles) ? user.worker_roles : [],
    worker_permissions: Array.isArray(user?.worker_permissions) ? user.worker_permissions : [],
    displayName,
    photoURL: user?.profile?.avatar ?? '',
    phoneNumber: user?.profile?.phone ?? '',
  };
};

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({
    user: null,
    loading: true,
  });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem(STORAGE_KEY);

      if (accessToken && isValidToken(accessToken)) {
        setSession(accessToken);

        const res = await axios.get(endpoints.auth.me);
        setState({ user: normalizeUser(res.data, accessToken), loading: false });
      } else {
        setSession(null);
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      setSession(null);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user
        ? {
            ...state.user,
            role: state.user?.role ?? 'user',
          }
        : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
