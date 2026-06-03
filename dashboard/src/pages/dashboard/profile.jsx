import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import axios, { endpoints } from 'src/utils/axios';

import { CONFIG } from 'src/config-global';

import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

const metadata = { title: `Profile | Dashboard - ${CONFIG.appName}` };

const extractErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.detail) return error.detail;
  if (error && typeof error === 'object') {
    const firstFieldErrors = Object.values(error).find((value) => Array.isArray(value) && value.length);
    if (firstFieldErrors) return firstFieldErrors[0];
  }
  return 'Unable to update profile';
};

export default function Page() {
  const { user, checkUserSession } = useAuthContext();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const methods = useForm({
    defaultValues: {
      phone: '',
      bio: '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const profile = await axios.get(endpoints.auth.profile);
        if (mounted) {
          reset({
            phone: profile.data?.phone || '',
            bio: profile.data?.bio || '',
          });
        }
      } catch (error) {
        if (mounted) {
          setErrorMsg(extractErrorMessage(error));
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axios.patch(endpoints.auth.profile, {
        phone: data.phone || '',
        bio: data.bio || '',
      });

      await checkUserSession?.();
      setErrorMsg('');
      setSuccessMsg('Profile updated successfully');
    } catch (error) {
      setSuccessMsg('');
      setErrorMsg(extractErrorMessage(error));
    }
  });

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <Container maxWidth="md">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>
              Profile
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Manage your account details.
            </Typography>
          </Box>

          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={user?.photoURL || ''} sx={{ width: 56, height: 56 }}>
                  {user?.displayName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">{user?.displayName || user?.username || 'User'}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {user?.email || 'No email'}
                  </Typography>
                </Box>
              </Stack>

              {!!errorMsg && <Alert severity="error">{errorMsg}</Alert>}
              {!!successMsg && <Alert severity="success">{successMsg}</Alert>}

              <Form methods={methods} onSubmit={onSubmit}>
                <Stack spacing={3}>
                  <Field.Text name="phone" label="Phone number" InputLabelProps={{ shrink: true }} />
                  <Field.Text
                    name="bio"
                    label="Bio"
                    multiline
                    minRows={4}
                    InputLabelProps={{ shrink: true }}
                  />

                  <Box display="flex" justifyContent="flex-end">
                    <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                      Save changes
                    </LoadingButton>
                  </Box>
                </Stack>
              </Form>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </>
  );
}
