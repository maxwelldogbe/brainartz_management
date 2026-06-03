import { Helmet } from 'react-helmet-async';
import { useCallback, useEffect, useState } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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
import TableContainer from '@mui/material/TableContainer';
import LoadingButton from '@mui/lab/LoadingButton';
import MenuItem from '@mui/material/MenuItem';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import axios, { endpoints } from 'src/utils/axios';
import { extractErrorMessage } from 'src/utils/extract-error-message';
import { normalizeListResponse } from 'src/utils/normalize-list-response';
import { CONFIG } from 'src/config-global';
import { Iconify } from 'src/components/iconify';

const metadata = { title: `Credit works | Dashboard - ${CONFIG.appName}` };

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
];

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const defaultPaymentFormState = {
  amount: '',
  method: 'cash',
  tracking_number: '',
  note: '',
  auto_clear: true,
};

export default function CreditWorksPage() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('uncleared');
  const [clearingId, setClearingId] = useState(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [paymentForm, setPaymentForm] = useState(defaultPaymentFormState);
  const [savingPayment, setSavingPayment] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${endpoints.services.worksCredits}?status=${filter}`);
      setWorks(normalizeListResponse(res.data));
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClearCredit = async (workId) => {
    setClearingId(workId);
    setError('');
    setSuccess('');
    try {
      await axios.post(endpoints.services.workClearCredit(workId));
      setSuccess('Credit work cleared successfully.');
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setClearingId(null);
    }
  };

  const handleOpenPaymentDialog = (work) => {
    setSelectedWork(work);
    setPaymentForm(defaultPaymentFormState);
    setOpenPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedWork(null);
  };

  const handlePaymentFormChange = (field, value) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRecordPayment = async () => {
    if (!selectedWork || !paymentForm.amount) {
      setError('Please enter a payment amount');
      return;
    }

    const amount = Number(paymentForm.amount);
    const remaining = selectedWork.remaining_balance;

    if (amount > remaining) {
      setError(`Payment amount cannot exceed remaining balance of ${formatCurrency(remaining)}`);
      return;
    }

    setSavingPayment(true);
    setError('');

    try {
      const payload = {
        work: selectedWork.id,
        amount,
        method: paymentForm.method,
        tracking_number: paymentForm.tracking_number || '',
        note: paymentForm.note || '',
      };

      await axios.post(endpoints.services.payments, payload);

      // Auto-clear if fully paid and option is enabled
      if (paymentForm.auto_clear && Math.abs(amount - remaining) < 0.01 && !selectedWork.credit_cleared) {
        try {
          await axios.post(endpoints.services.workClearCredit(selectedWork.id));
          setSuccess('Payment recorded and credit work cleared automatically.');
        } catch {
          setSuccess('Payment recorded successfully.');
        }
      } else {
        setSuccess('Payment recorded successfully.');
      }

      handleClosePaymentDialog();
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <Container maxWidth={false}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
            <Typography variant="h4">Credit works</Typography>
            <TextField
              select
              label="Filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="uncleared">Pending clearance</MenuItem>
              <MenuItem value="cleared">Cleared</MenuItem>
              <MenuItem value="all">All credit works</MenuItem>
            </TextField>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell>Status</TableCell>
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
                        <TableCell>{work.customer_name || 'N/A'}</TableCell>
                        <TableCell align="right">{formatCurrency(work.price)}</TableCell>
                        <TableCell align="right">{formatCurrency(work.total_payments)}</TableCell>
                        <TableCell align="right">{formatCurrency(work.remaining_balance)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={work.credit_cleared ? 'success' : 'warning'}
                            label={work.credit_cleared ? 'Cleared' : 'Pending clearance'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {work.credit_cleared ? (
                            <Button size="small" variant="outlined" disabled>
                              Cleared
                            </Button>
                          ) : (
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Record payment">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => handleOpenPaymentDialog(work)}
                                >
                                  <Iconify icon="solar:plus-circle-bold-duotone" width={18} />
                                </IconButton>
                              </Tooltip>
                              {Number(work.remaining_balance || 0) <= 0 && (
                                <LoadingButton
                                  size="small"
                                  variant="contained"
                                  loading={clearingId === work.id}
                                  onClick={() => handleClearCredit(work.id)}
                                >
                                  Clear
                                </LoadingButton>
                              )}
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading && works.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" sx={{ py: 2, color: 'text.secondary' }}>
                          No credit works found.
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

      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} fullWidth maxWidth="sm">
        <DialogTitle>Record payment for {selectedWork?.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            <TextField
              label="Amount"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={paymentForm.amount}
              onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
              helperText={`Remaining balance: ${selectedWork ? formatCurrency(selectedWork.remaining_balance) : '0.00'}`}
            />
            <TextField
              select
              label="Payment method"
              value={paymentForm.method}
              onChange={(e) => handlePaymentFormChange('method', e.target.value)}
            >
              {PAYMENT_METHODS.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Tracking number"
              value={paymentForm.tracking_number}
              onChange={(e) => handlePaymentFormChange('tracking_number', e.target.value)}
            />
            <TextField
              label="Note"
              multiline
              minRows={2}
              value={paymentForm.note}
              onChange={(e) => handlePaymentFormChange('note', e.target.value)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={paymentForm.auto_clear}
                  onChange={(e) => handlePaymentFormChange('auto_clear', e.target.checked)}
                />
              }
              label={`Auto-clear credit work when fully paid ${selectedWork && Math.abs(Number(paymentForm.amount || 0) - Number(selectedWork.remaining_balance || 0)) < 0.01 ? '(will clear with this payment)' : ''}`}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <LoadingButton
            onClick={handleRecordPayment}
            loading={savingPayment}
            variant="contained"
          >
            Record Payment
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
