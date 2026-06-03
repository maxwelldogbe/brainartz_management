import { Helmet } from 'react-helmet-async';
import { useCallback, useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';

import dayjs from 'dayjs';

import { useAuthContext } from 'src/auth/hooks';
import axios, { endpoints } from 'src/utils/axios';
import { extractErrorMessage } from 'src/utils/extract-error-message';
import { normalizeListResponse } from 'src/utils/normalize-list-response';
import { isAdmin } from 'src/utils/roles';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const metadata = { title: `Sales reports | Dashboard - ${CONFIG.appName}` };

const EXPENSE_CATEGORIES = [
  { value: 'office_supplies', label: 'Office supplies' },
  { value: 'transport', label: 'Transport' },
  { value: 'meals', label: 'Meals' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
];

function getReportStatusMeta(report) {
  const status = report.approval_status || (report.is_submitted ? 'approved' : 'draft');
  if (status === 'pending_approval') {
    return { label: 'Pending approval', color: 'warning' };
  }
  if (status === 'approved') {
    return { label: 'Approved', color: 'success' };
  }
  return { label: 'Draft', color: 'default' };
}

export default function SalesReportsPage() {
  const { user } = useAuthContext();
  const admin = isAdmin(user?.role);
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newDate, setNewDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [creating, setCreating] = useState(false);

  const [detail, setDetail] = useState(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'other',
    receipt_number: '',
  });
  const [expenseSaving, setExpenseSaving] = useState(false);
  const detailStatusMeta = detail ? getReportStatusMeta(detail) : null;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, sumRes] = await Promise.all([
        axios.get(endpoints.services.salesReports),
        axios.get(endpoints.services.salesReportSummary),
      ]);
      setReports(normalizeListResponse(listRes.data));
      setSummary(sumRes.data);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (row) => {
    setError('');
    try {
      const res = await axios.get(endpoints.services.salesReport(row.id));
      setDetail(res.data);
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      await axios.post(endpoints.services.salesReports, { date: newDate });
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  const runAction = async (reportId, path) => {
    setError('');
    try {
      const res = await axios.post(path);
      setDetail(res.data);
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const handleAddExpense = async () => {
    if (!detail?.id) return;
    setExpenseSaving(true);
    setError('');
    try {
      await axios.post(endpoints.services.dailyExpenses, {
        report_id: detail.id,
        description: expenseForm.description,
        amount: expenseForm.amount,
        category: expenseForm.category,
        receipt_number: expenseForm.receipt_number || '',
      });
      setExpenseOpen(false);
      setExpenseForm({ description: '', amount: '', category: 'other', receipt_number: '' });
      await openDetail({ id: detail.id });
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setExpenseSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 2 }}>
          Sales reports
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {summary && (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <Card sx={{ flex: 1 }}>
              <CardHeader title="Summary" />
              <CardContent>
                <Typography variant="body2">Total reports: {summary.total_reports}</Typography>
                <Typography variant="body2">
                  Pending approval: {summary.pending_approval_reports || 0}
                </Typography>
                <Typography variant="body2">Approved: {summary.approved_reports || 0}</Typography>
                <Typography variant="body2">Drafts: {summary.draft_reports}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardHeader title="This month" />
              <CardContent>
                <Typography variant="body2">
                  Sales: {Number(summary.total_sales_this_month || 0).toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Payments: {Number(summary.total_revenue_this_month || 0).toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Expenses: {Number(summary.total_expenses_this_month || 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        )}

        <Card sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <TextField
              label="New report date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <LoadingButton variant="contained" loading={creating} onClick={handleCreate}>
              Create report
            </LoadingButton>
          </Stack>
        </Card>

        <TableContainer component={Card}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Net</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2">Loading…</Typography>
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                reports.map((r) => {
                  const statusMeta = getReportStatusMeta(r);
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{r.generated_by_name || r.generated_by}</TableCell>
                      <TableCell>
                        <Chip size="small" color={statusMeta.color} label={statusMeta.label} />
                      </TableCell>
                      <TableCell align="right">{Number(r.net_total || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openDetail(r)}>
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="md" fullWidth>
          {detail && (
            <>
              <DialogTitle>
                Report {detail.date}{' '}
                <Chip sx={{ ml: 1 }} size="small" label={detailStatusMeta?.label} color={detailStatusMeta?.color} />
              </DialogTitle>
              <DialogContent dividers>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                      variant="outlined"
                      disabled={!detail.can_edit}
                      onClick={() => runAction(detail.id, endpoints.services.salesReportGenerateFromWorks(detail.id))}
                    >
                      Generate from payments
                    </Button>
                    <Button
                      variant="contained"
                      disabled={!detail.can_edit || detail.approval_status !== 'draft'}
                      onClick={() => runAction(detail.id, endpoints.services.salesReportSubmit(detail.id))}
                    >
                      Submit report
                    </Button>
                    {admin && detail.approval_status === 'pending_approval' && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => runAction(detail.id, endpoints.services.salesReportApprove(detail.id))}
                      >
                        Approve report
                      </Button>
                    )}
                    <Button variant="outlined" onClick={() => setExpenseOpen(true)} disabled={!detail.can_edit}>
                      Add expense
                    </Button>
                  </Stack>

                  <Typography variant="subtitle2">Category lines</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Works</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Paid</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(detail.report_items || []).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.category_name}</TableCell>
                          <TableCell align="right">{item.total_works}</TableCell>
                          <TableCell align="right">{Number(item.total_amount || 0).toFixed(2)}</TableCell>
                          <TableCell align="right">{Number(item.payments_received || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Typography variant="subtitle2">Expenses</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(detail.expenses || []).map((ex) => (
                        <TableRow key={ex.id}>
                          <TableCell>{ex.description}</TableCell>
                          <TableCell>{ex.category}</TableCell>
                          <TableCell align="right">{Number(ex.amount || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Typography variant="subtitle2">Notes</Typography>
                  <Stack spacing={1}>
                    {(detail.notes || []).length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No notes.
                      </Typography>
                    )}
                    {(detail.notes || []).map((n) => (
                      <Box key={n.id} sx={{ p: 1, borderRadius: 1, bgcolor: 'background.neutral' }}>
                        <Typography variant="caption" color="text.secondary">
                          {n.added_by_name || n.added_by} · {n.created_at}
                        </Typography>
                        <Typography variant="body2">{n.note}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDetail(null)}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        <Dialog open={expenseOpen} onClose={() => setExpenseOpen(false)}>
          <DialogTitle>Add expense</DialogTitle>
          <DialogContent sx={{ pt: 2, minWidth: 320 }}>
            <Stack spacing={2}>
              <TextField
                label="Description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Amount"
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))}
                fullWidth
              />
              <TextField
                select
                label="Category"
                value={expenseForm.category}
                onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}
                fullWidth
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Receipt # (optional)"
                value={expenseForm.receipt_number}
                onChange={(e) => setExpenseForm((p) => ({ ...p, receipt_number: e.target.value }))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExpenseOpen(false)}>Cancel</Button>
            <LoadingButton loading={expenseSaving} variant="contained" onClick={handleAddExpense}>
              Save
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
