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

import axios, { endpoints } from 'src/utils/axios';
import { extractErrorMessage } from 'src/utils/extract-error-message';
import { normalizeListResponse } from 'src/utils/normalize-list-response';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const metadata = { title: `Marketing templates | Dashboard - ${CONFIG.appName}` };

export default function MarketingMessagesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', link_url: '', link_text: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(endpoints.services.marketingMessages);
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

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.post(endpoints.services.marketingMessages, {
        title: form.title,
        message: form.message,
        link_url: form.link_url || '',
        link_text: form.link_text || '',
        is_active: true,
      });
      setOpen(false);
      setForm({ title: '', message: '', link_url: '', link_text: '' });
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id) => {
    setError('');
    try {
      await axios.post(endpoints.services.marketingMessageToggle(id));
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
          <Typography variant="h4">Marketing templates</Typography>
          <Button variant="contained" onClick={() => setOpen(true)}>
            New template
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
                <TableCell>Title</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">Used</TableCell>
                <TableCell align="right">Actions</TableCell>
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
                    <TableCell>{r.title}</TableCell>
                    <TableCell sx={{ maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.message}
                    </TableCell>
                    <TableCell>{r.is_active ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">{r.times_used}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => toggle(r.id)}>
                        Toggle active
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>New template</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                label="Title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Message"
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                fullWidth
                multiline
                minRows={3}
              />
              <TextField
                label="Link URL (optional)"
                value={form.link_url}
                onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Link text (optional)"
                value={form.link_text}
                onChange={(e) => setForm((p) => ({ ...p, link_text: e.target.value }))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <LoadingButton variant="contained" loading={saving} onClick={handleCreate}>
              Save
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
