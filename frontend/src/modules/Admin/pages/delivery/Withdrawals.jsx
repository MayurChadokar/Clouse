import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiCheckCircle, FiXCircle, FiTrendingUp, FiCreditCard, FiClock, FiPlus, FiArrowUpRight, FiFilter, FiExternalLink } from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import Badge from '../../../../shared/components/Badge';
import { useWithdrawStore } from '../../../../shared/store/withdrawStore';
import { formatPrice, formatDate } from '../../../../shared/utils/helpers';
import AnimatedSelect from '../../components/AnimatedSelect';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';

const Withdrawals = () => {
  const { requests, fetchRequests, updateRequestStatus, isLoading } = useWithdrawStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests({
      status: statusFilter === 'all' ? undefined : statusFilter,
      type: typeFilter === 'all' ? undefined : typeFilter
    });
  }, [statusFilter, typeFilter, fetchRequests]);

  const handleAction = async (id, status) => {
    let adminNotes = '';
    if (status === 'rejected') {
      adminNotes = window.prompt('Rejection Reason (required):') || '';
      if (!adminNotes.trim()) return;
    }

    setProcessingId(id);
    const success = await updateRequestStatus(id, status, { adminNotes });
    if (success) {
      // Refresh to get updated data if needed
      fetchRequests();
    }
    setProcessingId(null);
  };

  const columns = [
    {
      key: 'requesterId',
      label: 'Requester',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold uppercase overflow-hidden">
            {val?.avatar ? <img src={val.avatar} alt="" className="w-full h-full object-cover" /> : (val?.name || val?.storeName || '?').charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{val?.name || val?.storeName || 'Unknown'}</p>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{row.requesterType}</p>
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (val) => <span className="font-bold text-gray-900">{formatPrice(val)}</span>
    },
    {
      key: 'bankDetails',
      label: 'Payout Info',
      render: (val) => (
        <div className="text-xs space-y-0.5 max-w-[180px]">
          {val?.upiId && (
            <p className="flex items-center gap-1">
              <span className="text-gray-400 font-medium">UPI:</span> 
              <span className="text-primary-600 font-bold truncate" title={val.upiId}>{val.upiId}</span>
            </p>
          )}
          {val?.accountNumber && (
            <>
              <p><span className="text-gray-400">Acc:</span> {val.accountNumber}</p>
              <p><span className="text-gray-400">IFSC:</span> {val.ifscCode}</p>
            </>
          )}
          {!val?.upiId && !val?.accountNumber && <span className="text-gray-400 font-italic italic">N/A</span>}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        let variant = 'warning';
        if (val === 'completed' || val === 'approved') variant = 'success';
        if (val === 'rejected') variant = 'error';
        return <Badge variant={variant} className="capitalize">{val || 'pending'}</Badge>;
      }
    },
    {
      key: 'createdAt',
      label: 'Requested On',
      render: (val) => <span className="text-xs text-gray-600 font-medium">{formatDate(val)}</span>
    },
    {
      key: 'transactionId',
      label: 'Transaction',
      render: (val) => (
        <div className="max-w-[120px]">
          {val ? (
            <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded block truncate text-gray-500" title={val}>
                {val}
            </span>
          ) : '-'}
        </div>
      )
    },
    {
       key: 'actions',
       label: 'Actions',
       render: (_, row) => (
         <div className="flex gap-2">
            {row.status === 'pending' ? (
              <>
                <button
                  disabled={processingId === row._id}
                  onClick={() => handleAction(row._id, 'approved')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-bold text-xs transition-colors border border-green-100 disabled:opacity-50"
                >
                  {processingId === row._id ? 'Processing...' : (
                    <>
                      <FiCheckCircle className="text-sm" />
                       Approve {row.bankDetails?.upiId ? '& Pay' : ''}
                    </>
                  )}
                </button>
                <button
                  disabled={processingId === row._id}
                  onClick={() => handleAction(row._id, 'rejected')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-bold text-xs transition-colors border border-red-100 disabled:opacity-50"
                >
                  <FiXCircle className="text-sm" /> Reject
                </button>
              </>
            ) : (
                <span className="text-[10px] text-gray-400 font-bold uppercase italic py-1.5">Processed</span>
            )}
         </div>
       )
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700">Withdrawal Requests</h1>
          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest flex items-center gap-2">
             <FiCreditCard className="text-primary-500" />
             Payout & Payout Automation
          </p>
        </div>
        
        <div className="flex gap-2">
            <div className="bg-primary-50 px-3 py-2 rounded-xl flex items-center gap-3 border border-primary-100">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white">
                    <FiTrendingUp className="text-lg" />
                </div>
                <div>
                    <p className="text-[10px] text-primary-600 font-bold uppercase">Pending Total</p>
                    <p className="text-sm font-bold text-gray-800">
                        {formatPrice(requests.reduce((acc, r) => r.status === 'pending' ? acc + r.amount : acc, 0))}
                    </p>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between transition-all hover:shadow-2xl hover:shadow-primary-100/20">
        <div className="flex items-center gap-2 text-gray-700 font-bold mb-2 md:mb-0">
            <FiFilter className="text-primary-500" />
            <span className="text-sm">Filter Dashboard</span>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <AnimatedSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved/Completed' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            className="min-w-[160px] flex-1 md:flex-none"
          />
          <AnimatedSelect
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Users' },
              { value: 'DeliveryBoy', label: 'Delivery Boys' },
              { value: 'Vendor', label: 'Vendors' },
            ]}
            className="min-w-[160px] flex-1 md:flex-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100/80 backdrop-blur-sm">
        <div className="p-1">
          <DataTable
            data={requests}
            columns={columns}
            pagination={false}
            loading={isLoading}
            emptyMessage="No withdrawal requests found."
          />
        </div>
      </div>
      
      {requests.length > 0 && (
         <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
            <p className="text-gray-500 font-medium italic">
                Note: Approving a request with a UPI ID will automatically initiate a Razorpay Payout.
            </p>
            <p className="text-gray-400 font-bold">Total Requests: {requests.length}</p>
         </div>
      )}
    </motion.div>
  );
};

export default Withdrawals;
