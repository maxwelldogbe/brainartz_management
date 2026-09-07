import { Helmet } from 'react-helmet-async';
import { useCallback, useEffect, useState } from 'react';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import axios, { endpoints } from 'src/utils/axios';
import { extractErrorMessage } from 'src/utils/extract-error-message';
import { normalizeListResponse } from 'src/utils/normalize-list-response';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const metadata = { title: `Job materials | Dashboard - ${CONFIG.appName}` };

export default function JobMaterialsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(endpoints.services.jobMaterials);
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

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4">Job materials</Typography>
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
                <TableCell>Job</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Material</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell>Recorded by</TableCell>
                <TableCell>When</TableCell>
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
                    <TableCell>{r.job_title}</TableCell>
                    <TableCell>{r.job_customer}</TableCell>
                    <TableCell>
                      {r.material_name} ({r.material_unit})
                    </TableCell>
                    <TableCell align="right">{r.quantity_used}</TableCell>
                    <TableCell>{r.created_by_name || r.created_by}</TableCell>
                    <TableCell>{r.created_at}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

      </Container>
    </>
  );
}
