import { Helmet } from 'react-helmet-async';
import { useCallback, useEffect, useState } from 'react';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
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
import MenuItem from '@mui/material/MenuItem';

import axios, { endpoints } from 'src/utils/axios';
import { extractErrorMessage } from 'src/utils/extract-error-message';
import { normalizeListResponse } from 'src/utils/normalize-list-response';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const metadata = { title: `Job categories | Dashboard - ${CONFIG.appName}` };

const defaultForm = {
  name: '',
  description: '',
  color: '#3B82F6',
  send_completion_notification: false,
  default_material: '',
  unit_rate: '0',
  pricing_unit: 'flat',
};

export default function JobCategoriesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [materials, setMaterials] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(endpoints.services.categories);
      setRows(normalizeListResponse(res.data));
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    axios.get(endpoints.services.materials).then((res) => setMaterials(normalizeListResponse(res.data))).catch(() => {});
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
      description: row.description || '',
      color: row.color || '#3B82F6',
      send_completion_notification: !!row.send_completion_notification,
      default_material: row.default_material || '',
      unit_rate: row.unit_rate || '0',
      pricing_unit: row.pricing_unit || 'flat',
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description,
        color: form.color,
        send_completion_notification: form.send_completion_notification,
        default_material: form.default_material || null,
        material: form.default_material || null,
        unit_rate: Number(form.unit_rate),
        pricing_unit: form.pricing_unit,
      };
      if (editId) {
        await axios.patch(endpoints.services.category(editId), payload);
      } else {
        await axios.post(endpoints.services.categories, payload);
      }
      setOpen(false);
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id) => {
    setError('');
    try {
      await axios.post(endpoints.services.categoryToggleActive(id));
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

      <Container maxWidth="md">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4">Job categories</Typography>
          <Button variant="contained" onClick={openCreate}>
            Add category
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
                <TableCell>Name</TableCell>
                  <TableCell>Default material</TableCell>
                <TableCell>Color</TableCell>
                <TableCell align="right">Works</TableCell>
                <TableCell>Active</TableCell>
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
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.default_material_name || 'Not configured'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BoxColor color={r.color} />
                        {r.color}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{r.works_count}</TableCell>
                    <TableCell>{r.is_active ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openEdit(r)}>
                        Edit
                      </Button>
                      <Button size="small" onClick={() => toggleActive(r.id)}>
                        Toggle active
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editId ? 'Edit category' : 'New category'}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />
              <TextField
                select
                label="Default material"
                value={form.default_material}
                onChange={(e) => setForm((p) => ({ ...p, default_material: e.target.value }))}
                fullWidth
              >
                <MenuItem value="">No material</MenuItem>
                {materials.map((material) => (
                  <MenuItem key={material.id} value={material.id}>
                    {material.name} ({material.current_stock} {material.unit})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Unit rate"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={form.unit_rate}
                onChange={(e) => setForm((p) => ({ ...p, unit_rate: e.target.value }))}
                fullWidth
              />
              <TextField
                select
                label="Pricing unit"
                value={form.pricing_unit}
                onChange={(e) => setForm((p) => ({ ...p, pricing_unit: e.target.value }))}
                fullWidth
              >
                <MenuItem value="pages">Pages</MenuItem>
                <MenuItem value="pieces">Pieces</MenuItem>
                <MenuItem value="sq_ft">Square feet</MenuItem>
                <MenuItem value="flat">Flat rate</MenuItem>
              </TextField>
              <TextField
                label="Color (hex)"
                value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                fullWidth
              />
              <TextField
                label="SMS on completion"
                select
                value={form.send_completion_notification ? 'yes' : 'no'}
                onChange={(e) =>
                  setForm((p) => ({ ...p, send_completion_notification: e.target.value === 'yes' }))
                }
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <LoadingButton variant="contained" loading={saving} onClick={handleSave}>
              Save
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

function BoxColor({ color }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        borderRadius: 2,
        background: color,
        border: '1px solid rgba(0,0,0,0.12)',
      }}
    />
  );
}
