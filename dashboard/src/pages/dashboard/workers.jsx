import { Helmet } from 'react-helmet-async';
import { useCallback, useEffect, useState } from 'react';

import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import LoadingButton from '@mui/lab/LoadingButton';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from 'src/components/iconify';

import axios, { endpoints } from 'src/utils/axios';
import { extractErrorMessage } from 'src/utils/extract-error-message';
import { normalizeListResponse } from 'src/utils/normalize-list-response';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const metadata = { title: `Workers | Dashboard - ${CONFIG.appName}` };

function normalizePhoneInput(value) {
  return value.replace(/[^\d+()\-\s]/g, '');
}

function formatRolesSummary(roleLabels) {
  if (!roleLabels.length) return '—';
  if (roleLabels.length === 1) return roleLabels[0];
  return `${roleLabels[0]} +${roleLabels.length - 1}`;
}

export default function WorkersPage() {
  const [rows, setRows] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [roleUpdatingId, setRoleUpdatingId] = useState(null);
  const [workerActionState, setWorkerActionState] = useState({ id: null, type: null });
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedWorkerRoles, setSelectedWorkerRoles] = useState([]);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleModalError, setRoleModalError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [invitePhone, setInvitePhone] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [manualValues, setManualValues] = useState({
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    worker_roles: ['generalist'],
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualSuccess, setManualSuccess] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(endpoints.services.workers);
      const workers = normalizeListResponse(res.data);
      setRows(workers);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoleOptions = useCallback(async () => {
    try {
      const res = await axios.get(endpoints.services.workerRoleOptions);
      setRoleOptions(normalizeListResponse(res.data));
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    load();
    loadRoleOptions();
  }, [load, loadRoleOptions]);

  const handleSendInvite = async (event) => {
    event.preventDefault();
    setInviteError('');
    setInviteSuccess(null);

    const phone = invitePhone.trim();
    if (!phone) {
      setInviteError('Phone number is required.');
      return;
    }
    const clean = phone.replace(/\s/g, '');
    if (!/\d/.test(clean)) {
      setInviteError('Enter a valid phone number (include country code, e.g. +233…).');
      return;
    }

    setInviteSubmitting(true);
    try {
      const payload = { phone };
      const email = inviteEmail.trim();
      if (email) payload.email = email;

      const { data } = await axios.post(endpoints.auth.inviteEmployee, payload);
      setInviteSuccess(data);
      setInvitePhone('');
      setInviteEmail('');
      await load();
    } catch (err) {
      setInviteError(extractErrorMessage(err));
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleManualChange = (field) => (event) => {
    let value = field === 'phone' ? normalizePhoneInput(event.target.value) : event.target.value;
    if (field === 'worker_roles') {
      value = Array.isArray(value) ? value : [value];
    }
    setManualValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateWorker = async (event) => {
    event.preventDefault();
    setManualError('');
    setManualSuccess(null);

    const requiredFields = [
      ['username', 'Username is required.'],
      ['first_name', 'First name is required.'],
      ['last_name', 'Last name is required.'],
      ['phone', 'Phone number is required.'],
    ];

    const firstMissingField = requiredFields.find(([field]) => !manualValues[field].trim());
    if (firstMissingField) {
      setManualError(firstMissingField[1]);
      return;
    }

    const clean = manualValues.phone.trim().replace(/\s/g, '');
    if (!/\d/.test(clean)) {
      setManualError('Enter a valid phone number (include country code, e.g. +233…).');
      return;
    }

    const payload = {
      username: manualValues.username.trim(),
      first_name: manualValues.first_name.trim(),
      last_name: manualValues.last_name.trim(),
      phone: manualValues.phone.trim(),
      worker_roles: manualValues.worker_roles,
    };

    const email = manualValues.email.trim();
    if (email) payload.email = email;

    const password = manualValues.password.trim();
    if (password) payload.password = password;

    setManualSubmitting(true);
    try {
      const { data } = await axios.post(endpoints.auth.createEmployee, payload);
      setManualSuccess(data);
      setManualValues({
        username: '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        password: '',
        worker_roles: ['generalist'],
      });
      await load();
    } catch (err) {
      setManualError(extractErrorMessage(err));
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleOpenWorkerRoleModal = (worker) => {
    setRoleModalError('');
    setSelectedWorker(worker);
    setSelectedWorkerRoles(worker.worker_roles || [worker.worker_role || 'generalist']);
    setRoleModalOpen(true);
  };

  const handleCloseWorkerRoleModal = () => {
    setRoleModalError('');
    setRoleModalOpen(false);
    setSelectedWorker(null);
    setSelectedWorkerRoles([]);
  };

  const handleSaveSelectedWorkerRoles = async () => {
    if (!selectedWorker) return;
    setRoleModalError('');
    setRoleUpdatingId(selectedWorker.id);
    try {
      await axios.patch(endpoints.services.worker(selectedWorker.id), {
        worker_roles: selectedWorkerRoles,
      });
      await load();
      handleCloseWorkerRoleModal();
    } catch (err) {
      setRoleModalError(extractErrorMessage(err));
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const handleToggleWorkerAccess = async (worker) => {
    setError('');
    setWorkerActionState({ id: worker.id, type: 'toggle-access' });
    try {
      await axios.patch(endpoints.services.worker(worker.id), {
        is_active: !worker.is_active,
      });
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setWorkerActionState({ id: null, type: null });
    }
  };

  const handleDeleteWorker = async (worker) => {
    const confirmed = window.confirm(
      `Delete account for ${worker.full_name || worker.username}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setError('');
    setWorkerActionState({ id: worker.id, type: 'delete' });
    try {
      await axios.delete(endpoints.services.worker(worker.id));
      await load();
      if (selectedWorker?.id === worker.id) {
        handleCloseWorkerRoleModal();
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setWorkerActionState({ id: null, type: null });
    }
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <Container maxWidth="md">
        <Typography variant="h4" sx={{ mb: 2 }}>
          Workers
        </Typography>

        <Card id="invite-employees" variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Invite a new user
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Only administrators signed into this dashboard can send invitations. The person receives an SMS with a
            private registration link.
          </Typography>

          {inviteError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setInviteError('')}>
              {inviteError}
            </Alert>
          )}

          {inviteSuccess && (
            <Alert severity={inviteSuccess.sms_sent ? 'success' : 'warning'} sx={{ mb: 2 }} onClose={() => setInviteSuccess(null)}>
              <Typography variant="body2">{inviteSuccess.message}</Typography>
              {inviteSuccess.invite_link && (
                <Typography variant="caption" display="block" sx={{ mt: 1, wordBreak: 'break-all' }}>
                  Link: {inviteSuccess.invite_link}
                </Typography>
              )}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSendInvite}>
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'flex-start' }}>
              <TextField
                required
                fullWidth
                label="Phone number"
                placeholder="+233241234567"
                value={invitePhone}
                onChange={(ev) => setInvitePhone(normalizePhoneInput(ev.target.value))}
                disabled={inviteSubmitting}
                helperText="Include country code."
              />
              <TextField
                fullWidth
                label="Email (optional)"
                type="email"
                value={inviteEmail}
                onChange={(ev) => setInviteEmail(ev.target.value)}
                disabled={inviteSubmitting}
              />
            </Stack>
            <LoadingButton type="submit" variant="contained" loading={inviteSubmitting} sx={{ mt: 2 }}>
              Send invitation
            </LoadingButton>
          </Box>
        </Card>

        <Card id="add-worker-manually" variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Add worker manually
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a worker account directly if invitation delivery fails or if you need to onboard immediately.
          </Typography>

          {manualError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setManualError('')}>
              {manualError}
            </Alert>
          )}

          {manualSuccess && (
            <Alert severity={manualSuccess.sms_sent ? 'success' : 'warning'} sx={{ mb: 2 }} onClose={() => setManualSuccess(null)}>
              <Typography variant="body2">{manualSuccess.message}</Typography>
              {manualSuccess.instructions && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {manualSuccess.instructions}
                </Typography>
              )}
              {manualSuccess.login_credentials && (
                <Typography variant="caption" display="block" sx={{ mt: 1, wordBreak: 'break-all' }}>
                  Username: {manualSuccess.login_credentials.username} | Email:{' '}
                  {manualSuccess.login_credentials.email} | Password: {manualSuccess.login_credentials.password}
                </Typography>
              )}
            </Alert>
          )}

          <Box component="form" onSubmit={handleCreateWorker}>
            <Stack spacing={2}>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <TextField
                  required
                  fullWidth
                  label="First name"
                  value={manualValues.first_name}
                  onChange={handleManualChange('first_name')}
                  disabled={manualSubmitting}
                />
                <TextField
                  required
                  fullWidth
                  label="Last name"
                  value={manualValues.last_name}
                  onChange={handleManualChange('last_name')}
                  disabled={manualSubmitting}
                />
              </Stack>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <TextField
                  required
                  fullWidth
                  label="Username"
                  value={manualValues.username}
                  onChange={handleManualChange('username')}
                  disabled={manualSubmitting}
                />
                <TextField
                  required
                  fullWidth
                  label="Phone number"
                  placeholder="+233241234567"
                  value={manualValues.phone}
                  onChange={handleManualChange('phone')}
                  disabled={manualSubmitting}
                />
              </Stack>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email (optional)"
                  value={manualValues.email}
                  onChange={handleManualChange('email')}
                  disabled={manualSubmitting}
                />
                <TextField
                  fullWidth
                  type="text"
                  label="Password (optional)"
                  value={manualValues.password}
                  onChange={handleManualChange('password')}
                  disabled={manualSubmitting}
                  helperText="Leave blank to auto-generate a password."
                />
                  <TextField
                    required
                    select
                    fullWidth
                    label="Worker roles"
                    value={manualValues.worker_roles}
                    onChange={handleManualChange('worker_roles')}
                    disabled={manualSubmitting}
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) =>
                        roleOptions
                          .filter((role) => selected.includes(role.value))
                          .map((role) => role.label)
                          .join(', '),
                    }}
                  >
                  {roleOptions.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Stack>

            <LoadingButton type="submit" variant="contained" loading={manualSubmitting} sx={{ mt: 2 }}>
              Create worker account
            </LoadingButton>
          </Box>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Card}>
          <Table size="small">
            <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6}>
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.full_name}</TableCell>
                    <TableCell>{r.username}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.is_active ? 'Active' : 'Restricted'}</TableCell>
                    <TableCell sx={{ minWidth: 220 }}>
                      {formatRolesSummary(
                        roleOptions
                        .filter((role) =>
                          (r.worker_roles?.length ? r.worker_roles : [r.worker_role || 'generalist']).includes(role.value)
                        )
                        .map((role) => role.label)
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Edit roles">
                          <LoadingButton
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenWorkerRoleModal(r)}
                            startIcon={<Iconify icon="eva:edit-fill" width={18} />}
                          />
                        </Tooltip>

                        <Tooltip title={r.is_active ? 'Restrict access' : 'Restore access'}>
                          <LoadingButton
                            size="small"
                            variant="outlined"
                            color={r.is_active ? 'warning' : 'success'}
                            loading={workerActionState.id === r.id && workerActionState.type === 'toggle-access'}
                            onClick={() => handleToggleWorkerAccess(r)}
                            startIcon={<Iconify icon={r.is_active ? 'eva:lock-fill' : 'eva:unlock-fill'} width={18} />}
                          />
                        </Tooltip>

                        <Tooltip title="Delete">
                          <LoadingButton
                            size="small"
                            variant="outlined"
                            color="error"
                            loading={workerActionState.id === r.id && workerActionState.type === 'delete'}
                            onClick={() => handleDeleteWorker(r)}
                            startIcon={<Iconify icon="eva:trash-2-outline" width={18} />}
                          />
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={roleModalOpen} onClose={handleCloseWorkerRoleModal} fullWidth maxWidth="sm">
          <DialogTitle>Worker details and roles</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {roleModalError && <Alert severity="error">{roleModalError}</Alert>}
              <TextField
                label="Full name"
                value={selectedWorker?.full_name || ''}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <TextField
                label="Username"
                value={selectedWorker?.username || ''}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <TextField
                label="Email"
                value={selectedWorker?.email || ''}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <TextField
                label="Phone"
                value={selectedWorker?.phone || ''}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <TextField
                required
                select
                fullWidth
                label="Worker roles"
                value={selectedWorkerRoles}
                onChange={(event) =>
                  setSelectedWorkerRoles(
                    Array.isArray(event.target.value) ? event.target.value : [event.target.value]
                  )
                }
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) =>
                    roleOptions
                      .filter((role) => selected.includes(role.value))
                      .map((role) => role.label)
                      .join(', '),
                }}
              >
                {roleOptions.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseWorkerRoleModal}>Close</Button>
            <LoadingButton
              variant="contained"
              loading={roleUpdatingId === selectedWorker?.id}
              disabled={
                !selectedWorker ||
                JSON.stringify([...(selectedWorkerRoles || [])].sort()) ===
                  JSON.stringify(
                    [...(selectedWorker.worker_roles?.length ? selectedWorker.worker_roles : [selectedWorker.worker_role || 'generalist'])].sort()
                  )
              }
              onClick={handleSaveSelectedWorkerRoles}
            >
              Save roles
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
