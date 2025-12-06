import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customerContactsAPI, marketingMessagesAPI } from '../utils/services';

export default function CustomerContacts() {
  const navigate = useNavigate();
  const { hasAdminAccess } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptedOut, setFilterOptedOut] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sendingBulkSMS, setSendingBulkSMS] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    notes: '',
    opted_out: false
  });

  

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (filterOptedOut === 'opted_in') {
        params.can_receive_marketing = 'true';
      } else if (filterOptedOut === 'opted_out') {
        params.can_receive_marketing = 'false';
      }
      
      const data = await customerContactsAPI.list(params);
      setContacts(data);
      setError(null);
    } catch (err) {
      setError('Failed to load customer contacts');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterOptedOut]);

  const fetchMessageTemplates = useCallback(async () => {
    try {
      const data = await marketingMessagesAPI.list({ is_active: 'true' });
      setMessageTemplates(data);
    } catch (err) {
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchMessageTemplates();
  }, [fetchContacts, fetchMessageTemplates]);

  const handleOptOut = async (contactId) => {
    try {
      await customerContactsAPI.optOut(contactId);
      showSuccess('Customer opted out successfully');
      fetchContacts();
    } catch {
      showError('Failed to opt out customer');
    }
  };

  const handleOptIn = async (contactId) => {
    try {
      await customerContactsAPI.optIn(contactId);
      showSuccess('Customer opted in successfully');
      fetchContacts();
    } catch {
      showError('Failed to opt in customer');
    }
  };

  const handleSelectContact = (contactId) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const handleSelectAll = () => {
    const eligibleContacts = contacts.filter(c => !c.opted_out);
    if (selectedContacts.length === eligibleContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(eligibleContacts.map(c => c.id));
    }
  };

  const handleTemplateSelect = (e) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = messageTemplates.find(t => t.id === parseInt(templateId));
      if (template) {
        setSmsMessage(template.full_message);
      }
    }
  };

  const handleSendBulkSMS = async () => {
    if (!smsMessage.trim()) {
      showError('Please enter a message');
      return;
    }

    if (selectedContacts.length === 0) {
      showError('Please select at least one customer');
      return;
    }

    try {
      setSendingBulkSMS(true);
      await customerContactsAPI.sendBulkSMS({
        contact_ids: selectedContacts,
        message: smsMessage
      });
      
      // Mark template as used if one was selected
      if (selectedTemplate) {
        await marketingMessagesAPI.useTemplate(selectedTemplate);
      }
      
      showSuccess(`SMS sent to ${selectedContacts.length} customer(s)`);
      setShowSMSModal(false);
      setSmsMessage('');
      setSelectedTemplate('');
      setSelectedContacts([]);
    } catch (err) {
      showError('Failed to send SMS. Please try again.');
    } finally {
      setSendingBulkSMS(false);
    }
  };

  const showSuccess = (message) => {
    alert('✅ ' + message);
  };

  const showError = (message) => {
    alert('❌ ' + message);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    if (!newCustomer.name.trim()) {
      showError('Customer name is required');
      return;
    }
    
    if (!newCustomer.phone.trim()) {
      showError('Phone number is required');
      return;
    }

    try {
      await customerContactsAPI.create(newCustomer);
      showSuccess('Customer added successfully');
      setShowAddModal(false);
      setNewCustomer({
        name: '',
        phone: '',
        notes: '',
        opted_out: false
      });
      fetchContacts();
    } catch (err) {
      showError('Failed to add customer. Please check the details and try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const eligibleCount = contacts.filter(c => !c.opted_out).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Contacts</h1>
            <p className="text-gray-600 mt-1">
              Manage customer database for marketing and promotions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-3 gap-3 w-full">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
            >
              ➕ Add Customer
            </button>
            <button
              onClick={() => navigate('/marketing-messages')}
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 justify-center"
            >
              📝 Manage Templates
            </button>
            {selectedContacts.length > 0 && (
              <button
                onClick={() => setShowSMSModal(true)}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 justify-center"
              >
                📱 Send SMS ({selectedContacts.length})
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 min-w-0">
            <div className="text-sm text-blue-600 font-medium">Total Customers</div>
            <div className="text-2xl font-bold text-blue-900">{contacts.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 min-w-0">
            <div className="text-sm text-green-600 font-medium">Marketing Eligible</div>
            <div className="text-2xl font-bold text-green-900">{eligibleCount}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 min-w-0">
            <div className="text-sm text-purple-600 font-medium">Selected</div>
            <div className="text-2xl font-bold text-purple-900">{selectedContacts.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={filterOptedOut}
            onChange={(e) => setFilterOptedOut(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Customers</option>
            <option value="opted_in">Opted In Only</option>
            <option value="opted_out">Opted Out Only</option>
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedContacts.length === eligibleCount && eligibleCount > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Works
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Spent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Work
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                  No customer contacts found
                </td>
              </tr>
            ) : (
              contacts.map(contact => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => handleSelectContact(contact.id)}
                      disabled={contact.opted_out}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contact.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contact.total_works}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      GH₵{parseFloat(contact.total_spent).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(contact.last_work_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {contact.opted_out ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Opted Out
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {contact.opted_out ? (
                      <button
                        onClick={() => handleOptIn(contact.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Opt In
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOptOut(contact.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Opt Out
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Add New Customer
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Add customer information manually without creating a work order
              </p>
              
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="+1234567890"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                    placeholder="Any additional information..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="opted_out"
                    checked={newCustomer.opted_out}
                    onChange={(e) => setNewCustomer({ ...newCustomer, opted_out: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="opted_out" className="ml-2 text-sm text-gray-700">
                    Customer has opted out of marketing messages
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewCustomer({
                        name: '',
                        phone: '',
                        notes: '',
                        opted_out: false
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SMS Modal */}
      {showSMSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Send Promotional SMS
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Sending to {selectedContacts.length} customer(s)
              </p>
              
              {/* Template Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Use a Message Template (Optional)
                </label>
                <select
                  value={selectedTemplate}
                  onChange={handleTemplateSelect}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select a template or type manually --</option>
                  {messageTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.title} {template.link_url && '🔗'}
                    </option>
                  ))}
                </select>
                {messageTemplates.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No templates available. Create one in{' '}
                    <button
                      onClick={() => navigate('/marketing-messages')}
                      className="text-blue-600 hover:underline"
                    >
                      Marketing Messages
                    </button>
                  </p>
                )}
              </div>
              
              <textarea
                value={smsMessage}
                onChange={(e) => {
                  setSmsMessage(e.target.value);
                  setSelectedTemplate(''); // Clear template selection if manually editing
                }}
                placeholder="Enter your promotional message or select a template above..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-40 resize-none"
                maxLength={500}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {smsMessage.length}/500 characters
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSMSModal(false);
                    setSmsMessage('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={sendingBulkSMS}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBulkSMS}
                  disabled={sendingBulkSMS || !smsMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {sendingBulkSMS ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </span>
                  ) : (
                    'Send SMS'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
