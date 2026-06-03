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

const metadata = { title: `Procurement | Dashboard - ${CONFIG.appName}` };

export default function ProcurementPage() {
  const { user } = useAuthContext();
  const admin = isAdmin(user?.role);

  const [rows, setRows] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ material: '', quantity_ordered: '', unit_cost: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, mRes] = await Promise.all([
        axios.get(endpoints.services.procurements),
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

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.post(endpoints.services.procurements, {
        material: Number(form.material),
        quantity_ordered: Number(form.quantity_ordered),
        unit_cost: form.unit_cost,
      });
      setOpen(false);
      setForm({ material: '', quantity_ordered: '', unit_cost: '' });
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const markDelivered = async (id) => {
    setError('');
    try {
      await axios.post(endpoints.services.procurementMarkDelivered(id), {});
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4">Procurement</Typography>
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
                <TableCell align="right">Unit cost</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created by</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7}>
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.material_name}</TableCell>
                    <TableCell align="right">{r.quantity_ordered}</TableCell>
                    <TableCell align="right">{Number(r.unit_cost || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(r.total_cost || 0).toFixed(2)}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{r.created_by_name || r.created_by}</TableCell>
                    <TableCell align="right">
                      {admin && r.status === 'pending' && (
                        <Button size="small" variant="contained" onClick={() => markDelivered(r.id)}>
                          Mark delivered
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>New procurement</DialogTitle>
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
                    {m.name} ({m.unit})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Quantity ordered"
                type="number"
                value={form.quantity_ordered}
                onChange={(e) => setForm((p) => ({ ...p, quantity_ordered: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Unit cost"
                type="number"
                value={form.unit_cost}
                onChange={(e) => setForm((p) => ({ ...p, unit_cost: e.target.value }))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <LoadingButton variant="contained" loading={saving} onClick={handleCreate}>
              Submit
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
