import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

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

import axios, { endpoints } from 'src/utils/axios';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';

const metadata = { title: `Payments | Dashboard - ${CONFIG.appName}` };

const defaultFormState = {
  work: '',
  amount: '',
  method: 'cash',
  tracking_number: '',
  note: '',
};

const defaultFilters = {
  query: '',
  method: 'all',
  dateFrom: '',
  dateTo: '',
};

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
];

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
  const [payments, setPayments] = useState([]);
  const [unpaidWorks, setUnpaidWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formState, setFormState] = useState(defaultFormState);
  const [filters, setFilters] = useState(defaultFilters);

  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()),
    [payments]
  );

  const filteredPayments = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return sortedPayments.filter((payment) => {
      const methodMatch = filters.method === 'all' || payment.method === filters.method;

      const paidDate = String(payment.paid_at || '').slice(0, 10);
      const fromMatch = !filters.dateFrom || paidDate >= filters.dateFrom;
      const toMatch = !filters.dateTo || paidDate <= filters.dateTo;

      const queryMatch =
        !query ||
        String(payment.work_title || '').toLowerCase().includes(query) ||
        String(payment.note || '').toLowerCase().includes(query) ||
        String(payment.tracking_number || '').toLowerCase().includes(query) ||
        String(payment.processed_by || '').toLowerCase().includes(query);

      return methodMatch && fromMatch && toMatch && queryMatch;
    });
  }, [sortedPayments, filters]);

  const loadInitialData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [paymentsRes, unpaidWorksRes] = await Promise.all([
        axios.get(endpoints.services.payments),
        axios.get(endpoints.services.worksUnpaid),
      ]);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      setUnpaidWorks(Array.isArray(unpaidWorksRes.data) ? unpaidWorksRes.data : []);
    } catch (error) {
      setErrorMsg(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

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
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const handleCreatePayment = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const payload = {
        work: Number(formState.work),
        amount: Number(formState.amount),
        method: formState.method,
        tracking_number: formState.tracking_number || '',
        note: formState.note || '',
      };

      await axios.post(endpoints.services.payments, payload);
      setSuccessMsg('Payment created successfully');
      setOpenCreate(false);
      await loadInitialData();
    } catch (error) {
      setErrorMsg(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    setErrorMsg('');
    try {
      await axios.delete(`${endpoints.services.payments}${paymentId}/`);
      setSuccessMsg('Payment deleted');
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
                Payments
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Record and track payments across works.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button startIcon={<Iconify icon="solar:restart-bold-duotone" />} variant="outlined" onClick={loadInitialData}>
                Refresh
              </Button>
              <Button startIcon={<Iconify icon="mingcute:add-line" />} variant="contained" onClick={handleOpenCreate}>
                New payment
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Chip color="default" label={`Showing: ${filteredPayments.length}`} />
            <Chip color="primary" label={`Total records: ${payments.length}`} />
            <Chip color="warning" label={`Unpaid works: ${unpaidWorks.length}`} />
          </Stack>

          <Card sx={{ p: 2 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', md: 'center' }}
            >
              <TextField
                label="Search payment"
                placeholder="Work title, note, tracking #, staff"
                value={filters.query}
                onChange={(event) => handleFilterChange('query', event.target.value)}
                fullWidth
              />
              <TextField
                select
                label="Method"
                value={filters.method}
                onChange={(event) => handleFilterChange('method', event.target.value)}
                sx={{ minWidth: { xs: '100%', md: 180 } }}
              >
                <MenuItem value="all">All methods</MenuItem>
                {PAYMENT_METHODS.map((method) => (
                  <MenuItem key={method.value} value={method.value}>
                    {method.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="From"
                type="date"
                value={filters.dateFrom}
                onChange={(event) => handleFilterChange('dateFrom', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="To"
                type="date"
                value={filters.dateTo}
                onChange={(event) => handleFilterChange('dateTo', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button variant="outlined" onClick={handleClearFilters}>
                Clear filters
              </Button>
            </Stack>
          </Card>

          {!!errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          {!!successMsg && <Alert severity="success">{successMsg}</Alert>}

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Work</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Tracking #</TableCell>
                    <TableCell>Processed by</TableCell>
                    <TableCell>Paid at</TableCell>
                    <TableCell>Note</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!loading &&
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{payment.work_title || `Work #${payment.work}`}</Typography>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell align="right">{formatCurrency(payment.work_balance)}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>{payment.tracking_number || '-'}</TableCell>
                        <TableCell>{payment.processed_by || '-'}</TableCell>
                        <TableCell>{new Date(payment.paid_at).toLocaleString()}</TableCell>
                        <TableCell>{payment.note || '-'}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Delete payment">
                            <IconButton size="small" color="error" onClick={() => handleDeletePayment(payment.id)}>
                              <Iconify icon="solar:trash-bin-trash-bold-duotone" width={18} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading && filteredPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body2" sx={{ py: 2, color: 'text.secondary' }}>
                          No payments found for the current filters.
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
        <DialogTitle>Create payment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Work"
              value={formState.work}
              onChange={(event) => handleFormChange('work', event.target.value)}
            >
              {unpaidWorks.map((work) => (
                <MenuItem key={work.id} value={work.id}>
                  {work.title} - Balance {formatCurrency(work.remaining_balance)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Amount"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={formState.amount}
              onChange={(event) => handleFormChange('amount', event.target.value)}
            />
            <TextField
              select
              label="Method"
              value={formState.method}
              onChange={(event) => handleFormChange('method', event.target.value)}
            >
              {PAYMENT_METHODS.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Tracking number"
              value={formState.tracking_number}
              onChange={(event) => handleFormChange('tracking_number', event.target.value)}
            />
            <TextField
              label="Note"
              multiline
              minRows={2}
              value={formState.note}
              onChange={(event) => handleFormChange('note', event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate}>Cancel</Button>
          <LoadingButton onClick={handleCreatePayment} loading={saving} variant="contained">
            Create
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
