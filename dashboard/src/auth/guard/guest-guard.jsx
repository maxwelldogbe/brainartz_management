import { useState, useEffect } from 'react';

import { useRouter, useSearchParams } from '../../routes/hooks';

import { CONFIG } from '../../config-global';

import { SplashScreen } from '../../components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

export function GuestGuard({ children }) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const { loading, authenticated, user } = useAuthContext();

  const [isChecking, setIsChecking] = useState(true);

  const defaultDashboardPath = user?.role === 'worker' ? '/dashboard' : CONFIG.auth.redirectPath;
  const returnTo = searchParams.get('returnTo') || defaultDashboardPath;

  const checkPermissions = async () => {
    if (loading) {
      return;
    }

    if (authenticated) {
      router.replace(returnTo);
      return;
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, loading]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
