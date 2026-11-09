'use client';

import React, { useState } from 'react';
import { X, Check, AlertCircle, Building2, User, Phone, MapPin, IndianRupee, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees?: Array<{ id: string; name: string }>;
}

export default function AddLeadModal({ isOpen, onClose, onSuccess, employees = [] }: AddLeadModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SALES_MANAGER';

  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    contactPerson: '',
    mobileNumber: '',
    whatsappNumber: '',
    address: '',
    city: 'Indore',
    industryCategory: 'Manufacturing & Industrial',
    servicesRequired: 'Website Development, SEO',
    leadSource: 'Market Visit',
    firstMeetingDate: new Date().toISOString().split('T')[0],
    meetingTime: '11:00 AM',
    status: 'NEW_LEAD',
    interestLevel: 'MEDIUM',
    clientBudget: 75000,
    nextFollowUpDate: '',
    nextFollowUpTime: '11:00 AM',
    followUpType: 'PHONE_CALL',
    expectedClosingDate: '',
    remarks: '',
    assignedToId: user?.id || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add lead');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add New Client / Lead</h2>
              <p className="text-xs text-slate-300">Record full client contact, meeting details & follow-up schedule</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Client & Contact Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              1. Client & Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Industries"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Owner / Director Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Agrawal"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number (Duplicate Check) *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98930 00000"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="+91 98930 00000"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / Industrial Area</label>
                <input
                  type="text"
                  placeholder="Plot 12, Sanwer Road Industrial Area"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Requirement & Budget */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              2. Requirements & Commercials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Services Required</label>
                <input
                  type="text"
                  value={formData.servicesRequired}
                  onChange={(e) => setFormData({ ...formData, servicesRequired: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Budget (INR)</label>
                <input
                  type="number"
                  value={formData.clientBudget}
                  onChange={(e) => setFormData({ ...formData, clientBudget: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lead Source</label>
                <select
                  value={formData.leadSource}
                  onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Market Visit">Market Visit</option>
                  <option value="Direct Call">Direct Call</option>
                  <option value="Referral">Referral</option>
                  <option value="Website Inquiry">Website Inquiry</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Exhibition">Exhibition</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Interest Level</label>
                <select
                  value={formData.interestLevel}
                  onChange={(e) => setFormData({ ...formData, interestLevel: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH (Interested)</option>
                  <option value="HOT">HOT (Ready to Close)</option>
                </select>
              </div>

              {isAdmin && employees.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Assign To Sales Executive</label>
                  <select
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Next Follow-up Automation */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              3. Next Follow-up Schedule (Monitored by Overdue Alert Engine)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={formData.nextFollowUpDate}
                  onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Follow-up Time</label>
                <input
                  type="text"
                  placeholder="11:00 AM"
                  value={formData.nextFollowUpTime}
                  onChange={(e) => setFormData({ ...formData, nextFollowUpTime: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Follow-up Type</label>
                <select
                  value={formData.followUpType}
                  onChange={(e) => setFormData({ ...formData, followUpType: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="PHONE_CALL">Phone Call</option>
                  <option value="CLIENT_VISIT">Client Visit</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="FINAL_DISCUSSION">Final Discussion</option>
                </select>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Meeting & Client Remarks</label>
            <textarea
              rows={2}
              placeholder="Enter meeting notes, points discussed, client comments..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Saving Lead...' : 'Save Lead to CRM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
