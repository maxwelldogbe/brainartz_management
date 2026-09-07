import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import axios, { endpoints } from 'src/utils/axios';
import { normalizeListResponse } from 'src/utils/normalize-list-response';

const steps = ['Work and material', 'Billing and discount', 'Payment and due date', 'Customer details'];
const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Transfer' },
  { value: 'none', label: 'None' },
];

const initialState = {
  category: '', title: '', description: '', quantity: '', width: '', height: '',
  discount_amount: '0', amount_paid: '0', payment_method: 'none',
  payment_tracking_number: '', payment_note: '', due_date: '',
  customer_name: '', customer_phone: '', note: '',
};

const messageFromError = (error) => {
  if (typeof error === 'string') return error;
  if (error?.detail) return error.detail;
  if (error?.non_field_errors?.length) return error.non_field_errors[0];
  if (error && typeof error === 'object') {
    const field = Object.values(error).find((value) => Array.isArray(value) && value.length);
    if (field) return field[0];
  }
  return 'Request failed';
};

export default function CreateWorkWizard({ open, onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialState);
  const [categories, setCategories] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    Promise.all([
      axios.get(endpoints.services.categoriesSelect),
      axios.get(endpoints.services.customerContacts),
    ]).then(([categoriesResponse, contactsResponse]) => {
      setCategories(normalizeListResponse(categoriesResponse.data));
      setContacts(normalizeListResponse(contactsResponse.data));
    }).catch((requestError) => setError(messageFromError(requestError)));
  }, [open]);

  const category = categories.find((item) => String(item.id) === String(form.category));
  const materialName = category?.material_name || category?.default_material_name;
  const materialStock = category?.material_stock ?? category?.default_material_stock ?? 0;
  const pricingUnit = category?.pricing_unit || 'flat';
  const quantity = pricingUnit === 'sq_ft'
    ? Number(form.width || 0) * Number(form.height || 0)
    : Number(form.quantity || 0);
  const calculatedAmount = quantity * Number(category?.unit_rate || 0);
  const discountAmount = Number(form.discount_amount || 0);
  const netAmount = Math.max(calculatedAmount - discountAmount, 0);
  const amountPaid = Number(form.amount_paid || 0);
  const balance = Math.max(netAmount - amountPaid, 0);
  const stockAvailable = Boolean(category && quantity > 0 && quantity <= Number(materialStock));

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError('');
  };

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(category && stockAvailable && form.title.trim() && form.description.trim());
    if (step === 1) return discountAmount >= 0 && discountAmount <= calculatedAmount;
    if (step === 2) return amountPaid >= 0 && amountPaid <= netAmount && (balance === 0 || Boolean(form.due_date));
    return Boolean(form.customer_name.trim() && form.customer_phone.trim());
  }, [amountPaid, balance, calculatedAmount, category, discountAmount, form, netAmount, pricingUnit, stockAvailable, step]);

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.post(endpoints.services.works, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: Number(form.category),
        material_quantity: quantity,
        material_quantity_used: quantity,
        discount_amount: discountAmount,
        amount_paid: amountPaid,
        payment_method: amountPaid > 0 ? form.payment_method : 'none',
        payment_tracking_number: form.payment_tracking_number,
        payment_note: form.payment_note,
        due_date: balance > 0 ? form.due_date : null,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        note: form.note,
      });
      setForm(initialState);
      setStep(0);
      onClose();
      onCreated();
    } catch (requestError) {
      setError(messageFromError(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create work</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ py: 2 }}>
          {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {step === 0 && (
            <>
              <TextField select label="Job category" value={form.category} onChange={(event) => update('category', event.target.value)}>
                <MenuItem value="">Select category</MenuItem>
                {categories.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
              </TextField>
              {category && <Alert severity="info">{materialName || 'No material configured'} | {pricingUnit} | {materialStock} base units available</Alert>}
              <TextField label="Title" value={form.title} onChange={(event) => update('title', event.target.value)} />
              <TextField label="Description" multiline minRows={2} value={form.description} onChange={(event) => update('description', event.target.value)} />
              {pricingUnit === 'sq_ft' ? (
                <Stack direction="row" spacing={2}>
                  <TextField label="Width" type="number" value={form.width} onChange={(event) => update('width', event.target.value)} />
                  <TextField label="Height" type="number" value={form.height} onChange={(event) => update('height', event.target.value)} />
                </Stack>
              ) : <TextField label={`Quantity (${pricingUnit})`} type="number" value={form.quantity} onChange={(event) => update('quantity', event.target.value)} />}
              {category && quantity > Number(materialStock) && <Alert severity="error">Insufficient stock. Available: {materialStock}; required: {quantity}.</Alert>}
            </>
          )}
          {step === 1 && (
            <>
              <Typography>Calculated base amount: {calculatedAmount.toFixed(2)}</Typography>
              <TextField label="Discount amount" type="number" value={form.discount_amount} onChange={(event) => update('discount_amount', event.target.value)} />
              <Typography variant="h6">Net amount payable: {netAmount.toFixed(2)}</Typography>
            </>
          )}
          {step === 2 && (
            <>
              <Typography>Amount due: {netAmount.toFixed(2)}</Typography>
              <TextField label="Amount paid" type="number" value={form.amount_paid} onChange={(event) => update('amount_paid', event.target.value)} />
              <TextField select label="Payment method" value={form.payment_method} onChange={(event) => update('payment_method', event.target.value)}>
                {paymentMethods.map((method) => <MenuItem key={method.value} value={method.value}>{method.label}</MenuItem>)}
              </TextField>
              {amountPaid > 0 && <TextField label="Tracking number" value={form.payment_tracking_number} onChange={(event) => update('payment_tracking_number', event.target.value)} />}
              {balance > 0 && <TextField label="Payment due date" type="date" InputLabelProps={{ shrink: true }} value={form.due_date} onChange={(event) => update('due_date', event.target.value)} />}
              <Alert severity={balance > 0 ? 'warning' : 'success'}>{balance > 0 ? `Credit balance: ${balance.toFixed(2)}` : 'Fully paid'}</Alert>
            </>
          )}
          {step === 3 && (
            <>
              <TextField select label="Existing customer" value="" onChange={(event) => {
                const selected = contacts.find((item) => String(item.id) === event.target.value);
                if (selected) setForm((previous) => ({ ...previous, customer_name: selected.name, customer_phone: selected.phone }));
              }}>
                <MenuItem value="">New customer</MenuItem>
                {contacts.map((contact) => <MenuItem key={contact.id} value={contact.id}>{contact.name} ({contact.phone})</MenuItem>)}
              </TextField>
              <TextField label="Customer name" value={form.customer_name} onChange={(event) => update('customer_name', event.target.value)} />
              <TextField label="Customer phone" value={form.customer_phone} onChange={(event) => update('customer_phone', event.target.value)} />
              <TextField label="Work note" multiline minRows={2} value={form.note} onChange={(event) => update('note', event.target.value)} />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={step === 0 ? onClose : () => setStep((previous) => previous - 1)}> {step === 0 ? 'Cancel' : 'Back'} </Button>
        {step < steps.length - 1 ? <Button variant="contained" disabled={!canContinue} onClick={() => setStep((previous) => previous + 1)}>Next</Button> : <LoadingButton variant="contained" loading={saving} disabled={!canContinue} onClick={submit}>Create work</LoadingButton>}
      </DialogActions>
    </Dialog>
  );
}
