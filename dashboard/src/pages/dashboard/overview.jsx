import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import axios, { endpoints } from 'src/utils/axios';
import { extractErrorMessage } from 'src/utils/extract-error-message';
import { canAccessFeature, isAdmin, WORKER_FEATURE } from 'src/utils/roles';

import { CONFIG } from 'src/config-global';

import { useAuthContext } from 'src/auth/hooks';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const metadata = { title: `Overview | Dashboard - ${CONFIG.appName}` };

export default function OverviewPage() {
  const { user } = useAuthContext();
  const canWorks = isAdmin(user?.role) || canAccessFeature(user, WORKER_FEATURE.WORKS);
  const canSalesReports = isAdmin(user?.role) || canAccessFeature(user, WORKER_FEATURE.SALES_REPORTS);
  const canInventory = isAdmin(user?.role) || canAccessFeature(user, WORKER_FEATURE.INVENTORY);
  const canCustomers = isAdmin(user?.role) || canAccessFeature(user, WORKER_FEATURE.CUSTOMERS);
  const [summary, setSummary] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      if (!canWorks) {
        setSummary(null);
        setStats(null);
        return;
      }
      try {
        const [sRes, wRes] = await Promise.all([
          axios.get(endpoints.services.dailySummary),
          axios.get(endpoints.services.workStatistics),
        ]);
        if (!cancelled) {
          setSummary(sRes.data);
          setStats(wRes.data);
        }
      } catch (e) {
        if (!cancelled) setError(extractErrorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canWorks]);

  const overall = stats?.overall;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h4">Hi, {user?.displayName || 'there'}</Typography>
          <Stack direction="row" spacing={1}>
            {canWorks && (
              <Button component={RouterLink} href={paths.dashboard.works} variant="contained" color="inherit">
                <Iconify icon="solar:clipboard-list-bold" width={20} sx={{ mr: 1 }} />
                Works
              </Button>
            )}
            {user?.role === 'admin' && (
              <Button component={RouterLink} href={paths.dashboard.adminInsights} variant="outlined">
                Admin insights
              </Button>
            )}
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {canWorks && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader title="Works today" subheader={summary?.date} />
                  <CardContent>
                    <Typography variant="h3">{summary?.new_works_today ?? '—'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed today: {summary?.total_works_done ?? '—'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader title="Open works" />
                  <CardContent>
                    <Typography variant="h3">{summary?.incomplete_works ?? '—'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Not yet completed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader title="Revenue (month)" />
                  <CardContent>
                    <Typography variant="h3">
                      {summary?.revenue_this_month != null
                        ? Number(summary.revenue_this_month).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '—'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All-time:{' '}
                      {summary?.total_revenue != null
                        ? Number(summary.total_revenue).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '—'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader title="Customers (today)" />
                  <CardContent>
                    <Typography variant="h3">{summary?.customers_count ?? '—'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Files uploaded today: {summary?.files_uploaded_today ?? '—'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {canWorks && (
            <Grid item xs={12} md={6}>
              <Card sx={{ height: 1 }}>
                <CardHeader title="Work pipeline" />
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      Total works: <strong>{overall?.total_works ?? '—'}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Completed: <strong>{overall?.completed_works ?? '—'}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Pending: <strong>{overall?.pending_works ?? '—'}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Completion rate:{' '}
                      <strong>
                        {overall?.completion_rate != null && !Number.isNaN(Number(overall.completion_rate))
                          ? `${Number(overall.completion_rate).toFixed(1)}%`
                          : '—'}
                      </strong>
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <Card sx={{ height: 1 }}>
              <CardHeader title="Shortcuts" />
              <CardContent>
                <Stack spacing={1}>
                  {canSalesReports && (
                    <Button component={RouterLink} href={paths.dashboard.salesReports} fullWidth variant="outlined">
                      Sales reports
                    </Button>
                  )}
                  {canInventory && (
                    <Button component={RouterLink} href={paths.dashboard.materials} fullWidth variant="outlined">
                      Materials
                    </Button>
                  )}
                  {canCustomers && (
                    <Button component={RouterLink} href={paths.dashboard.customerContacts} fullWidth variant="outlined">
                      Customer contacts
                    </Button>
                  )}
                  {!canWorks && !canSalesReports && !canInventory && !canCustomers && (
                    <Typography variant="body2" color="text.secondary">
                      No role modules assigned yet. Ask an admin to assign at least one role.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
