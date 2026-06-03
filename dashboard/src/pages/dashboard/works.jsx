import { Helmet } from 'react-helmet-async';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import axios, { endpoints } from 'src/utils/axios';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';

const metadata = { title: `Works | Dashboard - ${CONFIG.appName}` };

const defaultFormState = {
  title: '',
  description: '',
  price: '',
  customer_name: '',
  customer_phone: '',
  category: '',
  note: '',
  is_credit: false,
  mark_as_paid: false,
  payment_method: 'cash',
  payment_tracking_number: '',
  payment_note: '',
};

const extractErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.detail) return error.detail;
  if (error?.non_field_errors?.length) return error.non_field_errors[0];
  if (error && typeof error === 'object') {
    const firstFieldErrors = Object.values(error).find((value) => Array.isArray(value) && value.length);
    if (firstFieldErrors) return firstFieldErrors[0];
  }
  return 'Request failed';
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function Page() {
  const [works, setWorks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formState, setFormState] = useState(defaultFormState);

  const loadInitialData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [worksRes, categoriesRes] = await Promise.all([
        axios.get(`${endpoints.services.works}?type=daily`),
        axios.get(endpoints.services.categoriesSelect),
      ]);
      setWorks(Array.isArray(worksRes.data) ? worksRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
    } catch (error) {
      setErrorMsg(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const pendingCount = useMemo(() => works.filter((item) => !item.completed).length, [works]);
  const completedCount = useMemo(() => works.filter((item) => item.completed).length, [works]);

  const handleOpenCreate = () => {
    setFormState(defaultFormState);
    setErrorMsg('');
    setSuccessMsg('');
    setOpenCreate(true);
  };

  const handleCloseCreate = () => {
    setOpenCreate(false);
  };

  const handleFormChange = (field, value) => {
    setFormState((prev) => {
      if (field === 'is_credit' && value) {
        return {
          ...prev,
          is_credit: true,
          mark_as_paid: false,
          payment_tracking_number: '',
          payment_note: '',
        };
      }

      if (field === 'mark_as_paid' && !value) {
        return {
          ...prev,
          mark_as_paid: false,
          payment_tracking_number: '',
          payment_note: '',
        };
      }

      return { ...prev, [field]: value };
    });
  };

  const handleCreateWork = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const payload = {
        ...formState,
        price: Number(formState.price),
        category: formState.category || null,
        mark_as_paid: formState.is_credit ? false : formState.mark_as_paid,
        payment_method: formState.is_credit || !formState.mark_as_paid ? '' : formState.payment_method,
        payment_tracking_number: formState.is_credit || !formState.mark_as_paid ? '' : formState.payment_tracking_number,
        payment_note: formState.is_credit || !formState.mark_as_paid ? '' : formState.payment_note,
      };

      await axios.post(endpoints.services.works, payload);
      setSuccessMsg(
        payload.mark_as_paid ? 'Work created and payment recorded successfully' : 'Work created successfully'
      );
      setOpenCreate(false);
      await loadInitialData();
    } catch (error) {
      setErrorMsg(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async (workId) => {
    setErrorMsg('');
    try {
      await axios.post(endpoints.services.worksMarkCompleted(workId));
      setSuccessMsg('Work marked as completed');
      await loadInitialData();
    } catch (error) {
      setErrorMsg(extractErrorMessage(error));
    }
  };

  const handleReopenWork = async (workId) => {
    setErrorMsg('');
    try {
      await axios.post(endpoints.services.worksReopen(workId));
      setSuccessMsg('Work reopened');
      await loadInitialData();
    } catch (error) {
      setErrorMsg(extractErrorMessage(error));
    }
  };

  const handleDeleteWork = async (workId) => {
    setErrorMsg('');
    try {
      await axios.delete(`${endpoints.services.works}${workId}/`);
      setSuccessMsg('Work deleted');
      await loadInitialData();
    } catch (error) {
      setErrorMsg(extractErrorMessage(error));
    }
  };

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <Container maxWidth={false}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                Works
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Manage customer jobs and completion status.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button startIcon={<Iconify icon="solar:restart-bold-duotone" />} variant="outlined" onClick={loadInitialData}>
                Refresh
              </Button>
              <Button startIcon={<Iconify icon="mingcute:add-line" />} variant="contained" onClick={handleOpenCreate}>
                New work
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Chip color="warning" label={`Pending: ${pendingCount}`} />
            <Chip color="success" label={`Completed: ${completedCount}`} />
            <Chip color="default" label={`Total: ${works.length}`} />
          </Stack>

          {!!errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          {!!successMsg && <Alert severity="success">{successMsg}</Alert>}

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!loading &&
                    works.map((work) => (
                      <TableRow key={work.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{work.title}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {work.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{work.customer_name || 'N/A'}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {work.customer_phone || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{work.category_name || '-'}</TableCell>
                        <TableCell align="right">{formatCurrency(work.price)}</TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Chip
                              size="small"
                              color={work.completed ? 'success' : 'warning'}
                              label={work.completed ? 'Completed' : 'Pending'}
                            />
                            <Chip
                              size="small"
                              color={work.is_fully_paid ? 'success' : 'default'}
                              label={work.is_fully_paid ? 'Paid' : 'Payment due'}
                            />
                            {work.is_overdue && !work.completed && (
                              <Chip
                                size="small"
                                color="error"
                                label={`Overdue (${work.days_outstanding} days)`}
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>{new Date(work.created_at).toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {work.completed ? (
                              <Tooltip title="Reopen work">
                                <IconButton size="small" color="warning" onClick={() => handleReopenWork(work.id)}>
                                  <Iconify icon="solar:refresh-bold-duotone" width={18} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Mark completed">
                                <IconButton size="small" color="success" onClick={() => handleMarkCompleted(work.id)}>
                                  <Iconify icon="solar:check-circle-bold" width={18} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete work">
                              <IconButton size="small" color="error" onClick={() => handleDeleteWork(work.id)}>
                                <Iconify icon="solar:trash-bin-trash-bold-duotone" width={18} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading && works.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} align="center">
                        <Typography variant="body2" sx={{ py: 2, color: 'text.secondary' }}>
                          No works found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      </Container>

      <Dialog open={openCreate} onClose={handleCloseCreate} fullWidth maxWidth="sm">
        <DialogTitle>Create new work</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Title"
              value={formState.title}
              onChange={(event) => handleFormChange('title', event.target.value)}
            />
            <TextField
              label="Description"
              multiline
              minRows={3}
              value={formState.description}
              onChange={(event) => handleFormChange('description', event.target.value)}
            />
            <TextField
              label="Price"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={formState.price}
              onChange={(event) => handleFormChange('price', event.target.value)}
            />
            <TextField
              label="Customer name"
              value={formState.customer_name}
              onChange={(event) => handleFormChange('customer_name', event.target.value)}
            />
            <TextField
              label="Customer phone"
              value={formState.customer_phone}
              onChange={(event) => handleFormChange('customer_phone', event.target.value)}
            />
            <TextField
              select
              label="Category"
              value={formState.category}
              onChange={(event) => handleFormChange('category', event.target.value)}
            >
              <MenuItem value="">No category</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Note"
              multiline
              minRows={2}
              value={formState.note}
              onChange={(event) => handleFormChange('note', event.target.value)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formState.is_credit}
                  onChange={(event) => handleFormChange('is_credit', event.target.checked)}
                />
              }
              label="This is a credit work"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formState.mark_as_paid}
                  disabled={formState.is_credit}
                  onChange={(event) => handleFormChange('mark_as_paid', event.target.checked)}
                />
              }
              label="Mark as paid now"
            />
            {formState.mark_as_paid && !formState.is_credit && (
              <Stack spacing={2} sx={{ pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Payment will be recorded automatically with the full work price.
                </Typography>
                <TextField
                  select
                  label="Payment method"
                  value={formState.payment_method}
                  onChange={(event) => handleFormChange('payment_method', event.target.value)}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="mobile_money">Mobile money</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="bank_transfer">Bank transfer</MenuItem>
                </TextField>
                <TextField
                  label="Tracking number"
                  value={formState.payment_tracking_number}
                  onChange={(event) => handleFormChange('payment_tracking_number', event.target.value)}
                />
                <TextField
                  label="Payment note"
                  multiline
                  minRows={2}
                  value={formState.payment_note}
                  onChange={(event) => handleFormChange('payment_note', event.target.value)}
                />
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate}>Cancel</Button>
          <LoadingButton onClick={handleCreateWork} loading={saving} variant="contained">
            Create
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
