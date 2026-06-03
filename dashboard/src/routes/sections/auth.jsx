import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { AuthSplitLayout } from '../../layouts/auth-split';
import { SplashScreen } from '../../components/loading-screen';
import { GuestGuard } from '../../auth/guard/guest-guard';

// ----------------------------------------------------------------------

const SignInPage = lazy(() => import('../../pages/auth/jwt/sign-in'));
const SignUpPage = lazy(() => import('../../pages/auth/jwt/sign-up'));

const authJwt = {
  path: 'jwt',
  children: [
    {
      path: 'sign-in',
      element: (
        <GuestGuard>
          <AuthSplitLayout section={{ title: 'Hi, Welcome back' }}>
            <SignInPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
  ],
};

export const authRoutes = [
  {
    path: 'portal/register/:token',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <GuestGuard>
          <AuthSplitLayout>
            <SignUpPage />
          </AuthSplitLayout>
        </GuestGuard>
      </Suspense>
    ),
  },
  {
    path: 'auth',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [authJwt],
  },
];


