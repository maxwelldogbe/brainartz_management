import { z as zod } from 'zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useParams, useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { signUp } from '../../context/jwt';
import { useAuthContext } from '../../hooks';
import { FormHead } from '../../components/form-head';

// ----------------------------------------------------------------------

const buildSignUpSchema = (tokenFromPath, tokenFromQuery) =>
  zod
    .object({
      invitationToken: zod.string().optional(),
      username: zod.string().min(1, { message: 'Username is required!' }),
      email: zod
        .string()
        .email({ message: 'Email must be a valid email address!' })
        .or(zod.literal(''))
        .optional(),
      password: zod
        .string()
        .min(1, { message: 'Password is required!' })
        .min(8, { message: 'Password must be at least 8 characters!' }),
      confirmPassword: zod.string().min(1, { message: 'Please confirm your password!' }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
    .superRefine((data, ctx) => {
      const t = (tokenFromPath || tokenFromQuery || data.invitationToken || '').trim();
      if (!t) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message:
            'Invitation is missing. Use the registration link from your invitation SMS (do not share it publicly).',
          path: ['invitationToken'],
        });
      }
    });

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  const params = useParams();

  const searchParams = useSearchParams();

  const { checkUserSession } = useAuthContext();

  const router = useRouter();

  const password = useBoolean();

  const [errorMsg, setErrorMsg] = useState('');

  const tokenFromPath = params?.token;
  const tokenFromQuery = searchParams.get('token');

  const invitationToken = useMemo(
    () => tokenFromPath || tokenFromQuery || '',
    [tokenFromPath, tokenFromQuery]
  );

  const SignUpSchema = useMemo(
    () => buildSignUpSchema(tokenFromPath, tokenFromQuery),
    [tokenFromPath, tokenFromQuery]
  );

  const defaultValues = {
    invitationToken,
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const resolvedToken = (tokenFromPath || tokenFromQuery || data.invitationToken || '').trim();
    try {
      await signUp({
        invitationToken: resolvedToken,
        username: data.username,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      await checkUserSession?.();

      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMsg(typeof error === 'string' ? error : error?.message || 'Unable to complete registration');
    }
  });

  const showInvitationTokenField = !tokenFromPath;

  const renderForm = (
    <Box gap={3} display="flex" flexDirection="column">
      {showInvitationTokenField && (
        <Field.Text name="invitationToken" label="Invitation token" InputLabelProps={{ shrink: true }} />
      )}
      <Field.Text name="username" label="Username" InputLabelProps={{ shrink: true }} />
      <Field.Text name="email" label="Email address (optional)" InputLabelProps={{ shrink: true }} />

      <Field.Text
        name="password"
        label="Password"
        placeholder="8+ characters"
        type={password.value ? 'text' : 'password'}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Field.Text
        name="confirmPassword"
        label="Confirm password"
        placeholder="Re-enter password"
        type={password.value ? 'text' : 'password'}
        InputLabelProps={{ shrink: true }}
      />

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Completing..."
      >
        Complete registration
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <FormHead
        title="Complete your invitation"
        description={
          <>
            {`Already have an account? `}
            <Link component={RouterLink} href={paths.auth.jwt.signIn} variant="subtitle2">
              Sign in
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>
    </>
  );
}
