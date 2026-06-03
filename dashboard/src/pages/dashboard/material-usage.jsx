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

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const metadata = { title: `Material pickup | Dashboard - ${CONFIG.appName}` };

export default function MaterialUsagePage() {
  const [rows, setRows] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ material_id: '', quantity_taken: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [uRes, mRes] = await Promise.all([
        axios.get(endpoints.services.materialUsage),
        axios.get(endpoints.services.materials),
      ]);
      setRows(normalizeListResponse(uRes.data));
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

  const handleRecord = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.post(endpoints.services.materialUsageRecord, {
        material_id: Number(form.material_id),
        quantity_taken: Number(form.quantity_taken),
        note: form.note,
      });
      setOpen(false);
      setForm({ material_id: '', quantity_taken: '', note: '' });
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
          <Typography variant="h4">Material pickup (warehouse)</Typography>
          <Button variant="contained" onClick={() => setOpen(true)}>
            Record pickup
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
                <TableCell>Taken by</TableCell>
                <TableCell>When</TableCell>
                <TableCell>Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5}>
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
                    <TableCell align="right">{r.quantity_taken}</TableCell>
                    <TableCell>{r.taken_by_name || r.taken_by}</TableCell>
                    <TableCell>{r.taken_at}</TableCell>
                    <TableCell>{r.note}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Record material pickup</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                select
                label="Material"
                value={form.material_id}
                onChange={(e) => setForm((p) => ({ ...p, material_id: e.target.value }))}
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
                label="Quantity taken"
                type="number"
                value={form.quantity_taken}
                onChange={(e) => setForm((p) => ({ ...p, quantity_taken: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Note (optional)"
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <LoadingButton variant="contained" loading={saving} onClick={handleRecord}>
              Save
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
