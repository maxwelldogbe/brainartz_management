import React, { useState, useEffect, useCallback } from 'react';
import { marketingMessagesAPI } from '../utils/services';

export default function MarketingMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    link_url: '',
    link_text: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await marketingMessagesAPI.list();
      setMessages(data);
    } catch (err) {
      showError('Failed to load marketing messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleOpenModal = (message = null) => {
    if (message) {
      setEditingMessage(message);
      setFormData({
        title: message.title,
        message: message.message,
        link_url: message.link_url || '',
        link_text: message.link_text || '',
        is_active: message.is_active
      });
    } else {
      setEditingMessage(null);
      setFormData({
        title: '',
        message: '',
        link_url: '',
        link_text: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMessage(null);
    setFormData({
      title: '',
      message: '',
      link_url: '',
      link_text: '',
      is_active: true
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showError('Title is required');
      return;
    }
    
    if (!formData.message.trim()) {
      showError('Message is required');
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        link_url: formData.link_url.trim() || null,
        link_text: formData.link_text.trim() || null,
        is_active: formData.is_active
      };

      if (editingMessage) {
        await marketingMessagesAPI.update(editingMessage.id, payload);
        showSuccess('Message template updated successfully');
      } else {
        await marketingMessagesAPI.create(payload);
        showSuccess('Message template created successfully');
      }
      
      handleCloseModal();
      fetchMessages();
    } catch (err) {
      showError('Failed to save message template');
      console.error('Error saving message:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message template?')) {
      return;
    }

    try {
      await marketingMessagesAPI.delete(id);
      showSuccess('Message template deleted successfully');
      fetchMessages();
    } catch (err) {
      showError('Failed to delete message template');
      console.error('Error deleting message:', err);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await marketingMessagesAPI.toggleActive(id);
      showSuccess('Message status updated');
      fetchMessages();
    } catch (err) {
      showError('Failed to update message status');
      console.error('Error toggling active:', err);
    }
  };

  const getFullMessagePreview = (msg) => {
    let preview = msg.message;
    if (msg.link_url) {
      const linkDisplay = msg.link_text || msg.link_url;
      preview += `\n\n${linkDisplay}: ${msg.link_url}`;
    }
    return preview;
  };

  const showSuccess = (message) => {
    alert('✅ ' + message);
  };

  const showError = (message) => {
    alert('❌ ' + message);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing Messages</h1>
            <p className="text-gray-600 mt-1">
              Create and manage promotional message templates
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            ➕ New Message
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Total Templates</div>
            <div className="text-2xl font-bold text-blue-900">{messages.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Active Templates</div>
            <div className="text-2xl font-bold text-green-900">
              {messages.filter(m => m.is_active).length}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium">Total Uses</div>
            <div className="text-2xl font-bold text-purple-900">
              {messages.reduce((sum, m) => sum + m.times_used, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {messages.length === 0 ? (
          <div className="col-span-2 bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Message Templates Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first promotional message template to get started
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Template
            </button>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow ${
                !message.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{message.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          message.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {message.link_url && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          🔗 Has Link
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {getFullMessagePreview(message)}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    📊 Used: <span className="font-semibold">{message.times_used} times</span>
                  </div>
                  {message.last_used && (
                    <div>
                      Last: <span className="font-semibold">
                        {new Date(message.last_used).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(message)}
                    className="flex-1 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(message.id)}
                    className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${
                      message.is_active
                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {message.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(message.id)}
                    className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingMessage ? 'Edit Message Template' : 'Create Message Template'}
              </h2>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Summer Sale Promotion"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Internal name for this template (not sent to customers)
                </p>
              </div>

              {/* Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Enter your promotional message..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
                  maxLength={500}
                  required
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>The message that will be sent to customers</span>
                  <span>{formData.message.length}/500 characters</span>
                </div>
              </div>

              {/* Link URL */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link URL (Optional)
                </label>
                <input
                  type="url"
                  name="link_url"
                  value={formData.link_url}
                  onChange={handleChange}
                  placeholder="https://example.com/promotion"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add a link to direct customers to a specific page
                </p>
              </div>

              {/* Link Text */}
              {formData.link_url && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Text (Optional)
                  </label>
                  <input
                    type="text"
                    name="link_text"
                    value={formData.link_text}
                    onChange={handleChange}
                    placeholder="e.g., Click here, Visit our website"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Text to display for the link. If empty, the full URL will be shown.
                  </p>
                </div>
              )}

              {/* Active Status */}
              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active (available for use)
                  </span>
                </label>
              </div>

              {/* Preview */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Message Preview:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {formData.message}
                  {formData.link_url && (
                    <>
                      {'\n\n'}
                      {formData.link_text || formData.link_url}: {formData.link_url}
                    </>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {editingMessage ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    editingMessage ? 'Update Template' : 'Create Template'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
