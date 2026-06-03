import { m } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import { useBoolean } from 'src/hooks/use-boolean';

import axios, { endpoints } from 'src/utils/axios';
import { extractErrorMessage } from 'src/utils/extract-error-message';
import { normalizeListResponse } from 'src/utils/normalize-list-response';

import { useAuthContext } from 'src/auth/hooks';

import { Iconify } from 'src/components/iconify';
import { varHover } from 'src/components/animate';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomTabs } from 'src/components/custom-tabs';

import { fToNow } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export function ShopNotificationsDrawer({ sx, ...other }) {
  const drawer = useBoolean();
  const { authenticated } = useAuthContext();

  const [currentTab, setCurrentTab] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(endpoints.services.notifications);
      setItems(normalizeListResponse(res.data));
    } catch (e) {
      setError(extractErrorMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  useEffect(() => {
    if (drawer.value && authenticated) {
      load();
    }
  }, [drawer.value, authenticated, load]);

  const filtered = useMemo(() => {
    if (currentTab === 'unread') return items.filter((n) => !n.is_read);
    if (currentTab === 'archived') return items.filter((n) => n.is_read);
    return items;
  }, [items, currentTab]);

  const counts = useMemo(
    () => ({
      all: items.length,
      unread: items.filter((n) => !n.is_read).length,
      read: items.filter((n) => n.is_read).length,
    }),
    [items]
  );

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await axios.post(endpoints.services.notificationsMarkAllRead);
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await axios.post(endpoints.services.notificationMarkRead(id));
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const totalUnRead = counts.unread;

  const tabs = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'unread', label: 'Unread', count: counts.unread },
    { value: 'archived', label: 'Read', count: counts.read },
  ];

  const renderHead = (
    <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 2.5, pr: 1, minHeight: 68 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Notifications
      </Typography>

      {!!totalUnRead && authenticated && (
        <IconButton color="primary" onClick={handleMarkAllRead} title="Mark all as read">
          <Iconify icon="eva:done-all-fill" />
        </IconButton>
      )}

      <IconButton onClick={drawer.onFalse} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>
    </Stack>
  );

  const renderTabs = (
    <CustomTabs variant="fullWidth" value={currentTab} onChange={handleChangeTab}>
      {tabs.map((tab) => (
        <Tab key={tab.value} value={tab.value} label={`${tab.label} (${tab.count})`} />
      ))}
    </CustomTabs>
  );

  const renderList = (
    <Scrollbar sx={{ maxHeight: 480 }}>
      <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
        {!authenticated && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Sign in to see notifications.
            </Typography>
          </Box>
        )}
        {authenticated && loading && (
          <Typography variant="body2" sx={{ p: 2 }} color="text.secondary">
            Loading…
          </Typography>
        )}
        {authenticated && error && (
          <Typography variant="body2" sx={{ p: 2 }} color="error">
            {error}
          </Typography>
        )}
        {authenticated &&
          !loading &&
          filtered.map((n) => (
            <Box component="li" key={n.id}>
              <ListItemButton
                onClick={() => {
                  if (!n.is_read) handleMarkRead(n.id);
                }}
                sx={{
                  alignItems: 'flex-start',
                  py: 2,
                  borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                }}
              >
                {!n.is_read && (
                  <Box
                    sx={{
                      mt: 1,
                      mr: 1,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'info.main',
                      flexShrink: 0,
                    }}
                  />
                )}
                <ListItemText
                  primaryTypographyProps={{ variant: 'subtitle2' }}
                  secondaryTypographyProps={{ variant: 'caption', color: 'text.disabled' }}
                  primary={n.title || 'Notification'}
                  secondary={
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {n.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {n.created_at ? fToNow(n.created_at) : ''}
                      </Typography>
                    </Stack>
                  }
                />
              </ListItemButton>
            </Box>
          ))}
        {authenticated && !loading && !filtered.length && !error && (
          <Typography variant="body2" sx={{ p: 2 }} color="text.secondary">
            No notifications.
          </Typography>
        )}
      </Box>
    </Scrollbar>
  );

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={drawer.onTrue}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={authenticated ? totalUnRead : 0} color="error">
          <SvgIcon>
            <path
              fill="currentColor"
              d="M18.75 9v.704c0 .845.24 1.671.692 2.374l1.108 1.723c1.011 1.574.239 3.713-1.52 4.21a25.794 25.794 0 0 1-14.06 0c-1.759-.497-2.531-2.636-1.52-4.21l1.108-1.723a4.393 4.393 0 0 0 .693-2.374V9c0-3.866 3.022-7 6.749-7s6.75 3.134 6.75 7"
              opacity="0.5"
            />
            <path
              fill="currentColor"
              d="M12.75 6a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0zM7.243 18.545a5.002 5.002 0 0 0 9.513 0c-3.145.59-6.367.59-9.513 0"
            />
          </SvgIcon>
        </Badge>
      </IconButton>

      <Drawer
        open={drawer.value}
        onClose={drawer.onFalse}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 1, maxWidth: 420 } }}
      >
        {renderHead}
        {authenticated ? renderTabs : null}
        {renderList}
        <Box sx={{ p: 1 }}>
          <Button fullWidth size="large" onClick={drawer.onFalse}>
            Close
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
