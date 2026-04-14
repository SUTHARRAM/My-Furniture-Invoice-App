import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useUIStore } from '../../store/uiStore';
import { invoiceApi } from '../../api/invoiceApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function ShareModal() {
  const { shareModalOpen, shareModalInvoiceId, closeShareModal, addToast } = useUIStore();
  const [tab, setTab] = useState<'email' | 'whatsapp'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmail = async () => {
    if (!shareModalInvoiceId || !email) return;
    setLoading(true);
    try {
      await invoiceApi.shareEmail(shareModalInvoiceId, { to: email });
      addToast('Email sent successfully!');
      closeShareModal();
    } catch {
      addToast('Failed to send email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!shareModalInvoiceId || !phone) return;
    setLoading(true);
    try {
      await invoiceApi.shareWhatsApp(shareModalInvoiceId, phone);
      addToast('WhatsApp message sent!');
      closeShareModal();
    } catch {
      addToast('Failed to send WhatsApp message', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={shareModalOpen} onClose={closeShareModal} title="Share Invoice">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('email')}
          className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${tab === 'email' ? 'bg-peach-200 text-gray-800' : 'bg-gray-100 text-gray-600'}`}
        >
          📧 Email
        </button>
        <button
          onClick={() => setTab('whatsapp')}
          className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${tab === 'whatsapp' ? 'bg-peach-200 text-gray-800' : 'bg-gray-100 text-gray-600'}`}
        >
          💬 WhatsApp
        </button>
      </div>

      {tab === 'email' ? (
        <div className="space-y-3">
          <Input label="Recipient Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@email.com" />
          <Button loading={loading} onClick={handleEmail} className="w-full justify-center">Send Email</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Input label="WhatsApp Number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91XXXXXXXXXX" />
          <Button loading={loading} onClick={handleWhatsApp} className="w-full justify-center">Send WhatsApp</Button>
        </div>
      )}
    </Modal>
  );
}
