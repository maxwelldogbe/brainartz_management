import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Container from '@mui/material/Container';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import axios, { endpoints } from 'src/utils/axios';
import { extractErrorMessage } from 'src/utils/extract-error-message';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const metadata = { title: `Admin insights | Dashboard - ${CONFIG.appName}` };

export default function AdminInsightsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      try {
        const res = await axios.get(endpoints.services.adminDashboard);
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) setError(extractErrorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 2 }}>
          Admin insights
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {data && (
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Card sx={{ flex: 1 }}>
                <CardHeader title="Works" />
                <CardContent>
                  <Typography variant="body2">Total: {data.total_works}</Typography>
                  <Typography variant="body2">Completed: {data.completed_works}</Typography>
                  <Typography variant="body2">Pending: {data.pending_works}</Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardHeader title="Payments" />
                <CardContent>
                  <Typography variant="body2">Transactions: {data.total_payment_transactions}</Typography>
                  <Typography variant="body2">
                    Revenue:{' '}
                    {Number(data.total_revenue || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardHeader title="Customers & categories" />
                <CardContent>
                  <Typography variant="body2">Unique customers (from works): {data.total_customers}</Typography>
                  <Typography variant="body2">Active categories: {data.total_categories}</Typography>
                </CardContent>
              </Card>
            </Stack>

            <Card>
              <CardHeader title="Works by category" />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Works</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.works_by_category || []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{row.works_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Card>
              <CardHeader title="Works by employee" />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell align="right">Works</TableCell>
                      <TableCell align="right">Completed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.works_by_employee || []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.username}</TableCell>
                        <TableCell align="right">{row.works_count}</TableCell>
                        <TableCell align="right">{row.completed_works}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Card>
              <CardHeader title="Payments by employee" />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.payments_by_employee || []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.username}</TableCell>
                        <TableCell align="right">{row.payments_count}</TableCell>
                        <TableCell align="right">
                          {Number(row.payments_total || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Stack>
        )}
      </Container>
    </>
  );
}
