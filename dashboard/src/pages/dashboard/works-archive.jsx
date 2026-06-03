import { Helmet } from 'react-helmet-async';
import { useEffect, useState, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';

import axios, { endpoints } from 'src/utils/axios';
import { CONFIG } from 'src/config-global';
import { Iconify } from 'src/components/iconify';

const metadata = { title: `Works Archive | Dashboard - ${CONFIG.appName}` };

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

export default function WorksArchivePage() {
  const [works, setWorks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedDate, setExpandedDate] = useState(null);
  const [searchTitle, setSearchTitle] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [worksRes, categoriesRes] = await Promise.all([
        axios.get(`${endpoints.services.works}?type=archive`),
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
    loadData();
  }, []);

  // Group works by completion date
  const groupedWorks = useMemo(() => {
    let filtered = works;

    if (searchTitle) {
      filtered = filtered.filter((w) =>
        w.title.toLowerCase().includes(searchTitle.toLowerCase()) ||
        (w.customer_name && w.customer_name.toLowerCase().includes(searchTitle.toLowerCase()))
      );
    }

    if (filterCategory) {
      filtered = filtered.filter((w) => w.category === Number(filterCategory));
    }

    const grouped = {};
    filtered.forEach((work) => {
      const date = new Date(work.completed_at).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(work);
    });

    // Sort dates in descending order (most recent first)
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .reduce((acc, date) => {
        acc[date] = grouped[date].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
        return acc;
      }, {});
  }, [works, searchTitle, filterCategory]);

  const totalWorks = works.length;
  const totalArchived = useMemo(
    () => Object.values(groupedWorks).reduce((sum, workItems) => sum + workItems.length, 0),
    [groupedWorks]
  );

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <Container maxWidth={false}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>
              Works Archive
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Historical records of completed works grouped by completion date.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              placeholder="Search by title or customer..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              sx={{ flex: 1 }}
              size="small"
            />
            <TextField
              select
              label="Filter by category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              sx={{ minWidth: 200 }}
              size="small"
              SelectProps={{
                native: true,
              }}
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </TextField>
            <Button startIcon={<Iconify icon="solar:restart-bold-duotone" />} variant="outlined" onClick={loadData}>
              Refresh
            </Button>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Chip color="default" label={`Total archived: ${totalArchived}`} />
            <Chip color="info" label={`All works: ${totalWorks}`} />
          </Stack>

          {!!errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          {!loading && Object.keys(groupedWorks).length === 0 ? (
            <Alert severity="info">No archived works found.</Alert>
          ) : (
            Object.entries(groupedWorks).map(([date, dateWorks]) => (
              <Card key={date}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'action.hover',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                    <IconButton size="small" sx={{ transform: expandedDate === date ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <Iconify icon="eva:chevron-down-fill" />
                    </IconButton>
                    <Typography variant="subtitle2">{date}</Typography>
                    <Chip size="small" label={`${dateWorks.length} works`} variant="outlined" />
                  </Stack>
                </Box>

                <Collapse in={expandedDate === date} timeout="auto" unmountOnExit>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Title</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Paid</TableCell>
                          <TableCell>Completed</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dateWorks.map((work) => (
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
                            <TableCell align="right">{formatCurrency(work.total_payments)}</TableCell>
                            <TableCell>{new Date(work.completed_at).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </Card>
            ))
          )}
        </Stack>
      </Container>
    </>
  );
}
