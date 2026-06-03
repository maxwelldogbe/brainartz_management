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

const metadata = { title: `Job materials | Dashboard - ${CONFIG.appName}` };

export default function JobMaterialsPage() {
  const [rows, setRows] = useState([]);
  const [works, setWorks] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ work: '', material: '', quantity_used: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(endpoints.services.jobMaterials);
      setRows(normalizeListResponse(res.data));
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMeta = useCallback(async () => {
    try {
      const [wRes, mRes] = await Promise.all([
        axios.get(endpoints.services.works),
        axios.get(endpoints.services.materials),
      ]);
      setWorks(normalizeListResponse(wRes.data));
      setMaterials(normalizeListResponse(mRes.data));
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    load();
    loadMeta();
  }, [load, loadMeta]);

  const handleRecord = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.post(endpoints.services.worksRecordJobMaterial(form.work), {
        material: Number(form.material),
        quantity_used: form.quantity_used,
      });
      setOpen(false);
      setForm({ work: '', material: '', quantity_used: '' });
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
          <Typography variant="h4">Job materials</Typography>
          <Button variant="contained" onClick={() => setOpen(true)}>
            Record usage on job
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
                <TableCell>Job</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Material</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell>Recorded by</TableCell>
                <TableCell>When</TableCell>
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
                    <TableCell>{r.job_title}</TableCell>
                    <TableCell>{r.job_customer}</TableCell>
                    <TableCell>
                      {r.material_name} ({r.material_unit})
                    </TableCell>
                    <TableCell align="right">{r.quantity_used}</TableCell>
                    <TableCell>{r.created_by_name || r.created_by}</TableCell>
                    <TableCell>{r.created_at}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Record material on job</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                select
                label="Work / job"
                value={form.work}
                onChange={(e) => setForm((p) => ({ ...p, work: e.target.value }))}
                fullWidth
              >
                <MenuItem value="">
                  <em>Select work</em>
                </MenuItem>
                {works.map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    #{w.id} — {w.title}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Material"
                value={form.material}
                onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))}
                fullWidth
              >
                <MenuItem value="">
                  <em>Select material</em>
                </MenuItem>
                {materials.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Quantity used"
                type="number"
                value={form.quantity_used}
                onChange={(e) => setForm((p) => ({ ...p, quantity_used: e.target.value }))}
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
