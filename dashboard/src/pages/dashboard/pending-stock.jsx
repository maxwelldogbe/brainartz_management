import { Helmet } from 'react-helmet-async';
import { useCallback, useEffect, useState } from 'react';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import LoadingButton from '@mui/lab/LoadingButton';

import axios, { endpoints } from 'src/utils/axios';
import { extractErrorMessage } from 'src/utils/extract-error-message';
import { normalizeListResponse } from 'src/utils/normalize-list-response';

import { useAuthContext } from 'src/auth/hooks';
import { isAdmin } from 'src/utils/roles';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const metadata = { title: `Stock adjustment requests | Dashboard - ${CONFIG.appName}` };

export default function PendingStockPage() {
  const { user } = useAuthContext();
  const admin = isAdmin(user?.role);

  const [rows, setRows] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ material: '', quantity: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRow, setRejectRow] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, mRes] = await Promise.all([
        axios.get(endpoints.services.pendingStockAdjustments),
        axios.get(endpoints.services.materials),
      ]);
      setRows(normalizeListResponse(pRes.data));
      setMaterials(normalizeListResponse(mRes.data));
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submitRequest = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.post(endpoints.services.pendingStockAdjustments, {
        material: Number(form.material),
        quantity: Number(form.quantity),
        reason: form.reason,
      });
      setOpen(false);
      setForm({ material: '', quantity: '', reason: '' });
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const approve = async (id) => {
    setError('');
    try {
      await axios.post(endpoints.services.pendingStockApprove(id));
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const reject = async () => {
    if (!rejectRow) return;
    setSaving(true);
    setError('');
    try {
      await axios.post(endpoints.services.pendingStockReject(rejectRow.id), {
        rejection_reason: rejectReason,
      });
      setRejectOpen(false);
      setRejectRow(null);
      setRejectReason('');
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4">Stock adjustment requests</Typography>
          <Button variant="contained" onClick={() => setOpen(true)}>
            New request
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Card}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Material</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted by</TableCell>
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
                    <TableCell>
                      {r.material_name} ({r.material_unit})
                    </TableCell>
                    <TableCell align="right">{r.quantity}</TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>{r.reason}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{r.submitted_by_name}</TableCell>
                    <TableCell align="right">
                      {admin && r.status === 'pending' && (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="contained" onClick={() => approve(r.id)}>
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              setRejectRow(r);
                              setRejectReason('');
                              setRejectOpen(true);
                            }}
                          >
                            Reject
                          </Button>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Request stock addition</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                select
                label="Material"
                value={form.material}
                onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))}
                fullWidth
              >
                <MenuItem value="">
                  <em>Select</em>
                </MenuItem>
                {materials.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Quantity to add"
                type="number"
                value={form.quantity}
                onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Reason"
                value={form.reason}
                onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <LoadingButton variant="contained" loading={saving} onClick={submitRequest}>
              Submit
            </LoadingButton>
          </DialogActions>
        </Dialog>

        <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Reject request</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              label="Rejection reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
            <LoadingButton color="error" variant="contained" loading={saving} onClick={reject}>
              Reject
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
