import { Helmet } from 'react-helmet-async';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import axios, { endpoints } from 'src/utils/axios';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
import { extractErrorMessage } from 'src/utils/extract-error-message';
import CreateWorkWizard from './CreateWorkWizard';

const metadata = { title: `Works | Dashboard - ${CONFIG.appName}` };

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function Page() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadInitialData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const worksRes = await axios.get(`${endpoints.services.works}?type=daily`);
      setWorks(Array.isArray(worksRes.data) ? worksRes.data : []);
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
    setErrorMsg('');
    setSuccessMsg('');
    setOpenCreate(true);
  };

  const handleCloseCreate = () => {
    setOpenCreate(false);
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

      <CreateWorkWizard
        open={openCreate}
        onClose={handleCloseCreate}
        onCreated={async () => {
          setSuccessMsg('Work created successfully');
          await loadInitialData();
        }}
      />
    </>
  );
}
