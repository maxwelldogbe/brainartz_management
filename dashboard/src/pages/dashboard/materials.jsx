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

const metadata = { title: `Materials | Dashboard - ${CONFIG.appName}` };

const MATERIAL_CATEGORIES = [
  { value: 'paper', label: 'Paper' },
  { value: 'ink', label: 'Ink' },
  { value: 'binding', label: 'Binding' },
  { value: 'other', label: 'Other' },
];

const defaultForm = {
  name: '',
  category: 'other',
  unit: '',
  current_stock: 0,
  reorder_level: 0,
};

export default function MaterialsPage() {
  const { user } = useAuthContext();
  const admin = isAdmin(user?.role);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const [adjOpen, setAdjOpen] = useState(false);
  const [adjMaterial, setAdjMaterial] = useState(null);
  const [adjQty, setAdjQty] = useState('');
  const [adjNote, setAdjNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(endpoints.services.materials);
      setRows(normalizeListResponse(res.data));
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      name: row.name,
      category: row.category,
      unit: row.unit,
      current_stock: row.current_stock,
      reorder_level: row.reorder_level,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        category: form.category,
        unit: form.unit,
        current_stock: Number(form.current_stock),
        reorder_level: Number(form.reorder_level),
      };
      if (editId) {
        await axios.patch(endpoints.services.material(editId), payload);
      } else {
        await axios.post(endpoints.services.materials, payload);
      }
      setOpen(false);
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjMaterial) return;
    setSaving(true);
    setError('');
    try {
      await axios.post(endpoints.services.materialAdjustStock(adjMaterial.id), {
        adjustment_quantity: adjQty,
        note: adjNote,
      });
      setAdjOpen(false);
      setAdjMaterial(null);
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
          <Typography variant="h4">Materials</Typography>
          {admin && (
            <Button variant="contained" onClick={openCreate}>
              Add material
            </Button>
          )}
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
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Reorder</TableCell>
                <TableCell>Low?</TableCell>
                {admin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={admin ? 7 : 6}>
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.category}</TableCell>
                    <TableCell>{r.unit}</TableCell>
                    <TableCell align="right">{r.current_stock}</TableCell>
                    <TableCell align="right">{r.reorder_level}</TableCell>
                    <TableCell>{r.is_low_stock ? 'Yes' : 'No'}</TableCell>
                    {admin && (
                      <TableCell align="right">
                        <Button size="small" onClick={() => openEdit(r)}>
                          Edit
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setAdjMaterial(r);
                            setAdjQty('');
                            setAdjNote('');
                            setAdjOpen(true);
                          }}
                        >
                          Adjust stock
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editId ? 'Edit material' : 'New material'}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                fullWidth
              />
              <TextField
                select
                label="Category"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                fullWidth
              >
                {MATERIAL_CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Unit"
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                fullWidth
                helperText="e.g. sheets, bottles, boxes"
              />
              <TextField
                label="Current stock"
                type="number"
                value={form.current_stock}
                onChange={(e) => setForm((p) => ({ ...p, current_stock: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Reorder level"
                type="number"
                value={form.reorder_level}
                onChange={(e) => setForm((p) => ({ ...p, reorder_level: e.target.value }))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <LoadingButton variant="contained" loading={saving} onClick={handleSave}>
              Save
            </LoadingButton>
          </DialogActions>
        </Dialog>

        <Dialog open={adjOpen} onClose={() => setAdjOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Adjust stock — {adjMaterial?.name}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                label="Adjustment (+/-)"
                type="number"
                value={adjQty}
                onChange={(e) => setAdjQty(e.target.value)}
                fullWidth
              />
              <TextField
                label="Note"
                value={adjNote}
                onChange={(e) => setAdjNote(e.target.value)}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdjOpen(false)}>Cancel</Button>
            <LoadingButton variant="contained" loading={saving} onClick={handleAdjust}>
              Apply
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
