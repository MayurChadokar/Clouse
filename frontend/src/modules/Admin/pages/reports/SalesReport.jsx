import { useState, useEffect, useCallback } from 'react';
import { FiDownload, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { motion } from 'framer-motion';
import DataTable from '../../components/DataTable';
import ExportButton from '../../components/ExportButton';
import { formatPrice } from '../../../../shared/utils/helpers';
import * as adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const SalesReport = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: 'delivered', // Only counting delivered sales usually, or 'all' if preferred
        startDate: dateRange.start,
        endDate: dateRange.end
      };
      const response = await adminService.getAllOrders(params);
      setOrders(response.data.orders);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        pages: response.data.pages
      }));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch sales report');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, dateRange]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleApplyFilter = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOrders();
  };

  const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const columns = [
    {
      key: 'orderId',
      label: 'Order ID',
      sortable: true,
      render: (value, row) => <span className="font-semibold text-gray-800">{row.orderId || row._id.substring(0, 8)}</span>,
    },
    {
      key: 'userId',
      label: 'Customer',
      sortable: true,
      render: (value) => value?.name || 'Guest',
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      key: 'total',
      label: 'Amount',
      sortable: true,
      render: (value) => (
        <span className="font-bold text-gray-800">{formatPrice(value)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${value === 'delivered' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Sales Report</h1>
        <p className="text-sm sm:text-base text-gray-600">View detailed sales analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Sales (Page)</p>
            <FiTrendingUp className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatPrice(totalSales)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Orders (Page)</p>
            <FiCalendar className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Average Order Value</p>
            <FiTrendingUp className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatPrice(averageOrderValue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilter}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Apply Filter
            </button>
            <ExportButton
              data={orders}
              headers={[
                { label: 'Order ID', accessor: (row) => row.orderId || row._id },
                { label: 'Customer', accessor: (row) => row.userId?.name || 'Guest' },
                { label: 'Date', accessor: (row) => new Date(row.createdAt).toLocaleString() },
                { label: 'Amount', accessor: (row) => formatPrice(row.total) },
                { label: 'Status', accessor: (row) => row.status },
              ]}
              filename="sales-report"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <DataTable
            data={orders}
            columns={columns}
            pagination={true}
            itemsPerPage={pagination.limit}
            totalItems={pagination.total}
            currentPage={pagination.page}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
        )}
      </div>
    </motion.div>
  );
};

export default SalesReport;

