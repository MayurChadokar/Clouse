import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliveryAuthStore } from '../store/deliveryStore';
import { FiPackage, FiCheckCircle, FiClock, FiTrendingUp, FiMapPin, FiTruck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../../shared/components/PageTransition';
import toast from 'react-hot-toast';
import { formatPrice } from '../../../shared/utils/helpers';

const DeliveryDashboard = () => {
  const { deliveryBoy, updateStatus, fetchProfile, fetchDashboardSummary, isUpdatingStatus, isUpdatingOrderStatus } = useDeliveryAuthStore();
  const navigate = useNavigate();
  const statusMenuRef = useRef(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedToday: 0,
    openOrders: 0,
    earnings: 0,
  });

  const statCards = [
    {
      icon: FiPackage,
      label: 'Total Orders',
      value: stats.totalOrders,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      icon: FiCheckCircle,
      label: 'Completed Today',
      value: stats.completedToday,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      icon: FiClock,
      label: 'Open Orders',
      value: stats.openOrders,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
    },
    {
      icon: FiTrendingUp,
      label: 'Earnings',
      value: formatPrice(stats.earnings),
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  const loadDashboardData = async () => {
    try {
      setLoadFailed(false);
      setIsDashboardLoading(true);
      await fetchProfile();
      const summary = await fetchDashboardSummary();
      setRecentOrders(summary.recentOrders || []);
      setStats({
        totalOrders: Number(summary.totalOrders || 0),
        completedToday: Number(summary.completedToday || 0),
        openOrders: Number(summary.openOrders || 0),
        earnings: Number(summary.earnings || 0),
      });

      // Fetch available orders
      const available = await useDeliveryAuthStore.getState().fetchAvailableOrders({ limit: 5 });
      setAvailableOrders(available || []);
    } catch {
      setLoadFailed(true);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const { acceptOrder } = useDeliveryAuthStore.getState();
      await acceptOrder(orderId);
      toast.success('Order accepted successfully!');
      loadDashboardData();
    } catch {
      // Error toast handled by API interceptor.
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [fetchDashboardSummary, fetchProfile]);

  useEffect(() => {
    if (!statusMenuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [statusMenuOpen]);

  const handleStatusChange = async (newStatus) => {
    if (isUpdatingStatus) return;
    try {
      await updateStatus(newStatus);
      toast.success(`Status updated to ${newStatus}`);
      setStatusMenuOpen(false);
    } catch {
      // Error toast already handled by API interceptor.
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'picked-up':
        return 'bg-blue-100 text-blue-800';
      case 'out-for-delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusButtonColor = (status) => {
    switch (status) {
      case 'available':
        return '#10b981';
      case 'busy':
        return '#f59e0b';
      case 'offline':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const displayOrders = recentOrders.length > 0 ? recentOrders : [];

  return (
    <PageTransition>
      <div className="px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">Welcome back, {deliveryBoy?.name || 'Delivery Boy'}!</h1>
              <p className="text-primary-100 text-sm">
                {deliveryBoy?.status === 'available'
                  ? 'You are available for new orders'
                  : deliveryBoy?.status === 'busy'
                    ? 'You are currently busy'
                    : 'You are offline'}
              </p>
            </div>
            <div className="relative" ref={statusMenuRef}>
              <button
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-semibold"
                style={{ backgroundColor: getStatusButtonColor(deliveryBoy?.status) }}
              >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                {deliveryBoy?.status || 'offline'}
              </button>

              <AnimatePresence>
                {statusMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
                  >
                    <button
                      onClick={() => handleStatusChange('available')}
                      disabled={isUpdatingStatus}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-green-700"
                    >
                      Available
                    </button>
                    <button
                      onClick={() => handleStatusChange('busy')}
                      disabled={isUpdatingStatus}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-yellow-50 text-yellow-700"
                    >
                      Busy
                    </button>
                    <button
                      onClick={() => handleStatusChange('offline')}
                      disabled={isUpdatingStatus}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                    >
                      Offline
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiTruck className="text-lg" />
              <span className="text-sm">{deliveryBoy?.vehicleType || 'Bike'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">{deliveryBoy?.vehicleNumber || 'N/A'}</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`${stat.bgColor} rounded-xl p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`${stat.textColor} text-xl`} />
                  <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="text-white text-lg" />
                  </div>
                </div>
                <p className={`${stat.textColor} text-xs font-medium mb-1`}>{stat.label}</p>
                <p className={`${stat.textColor} text-xl font-bold`}>
                  {isDashboardLoading ? <span className="inline-block h-6 w-16 rounded bg-white/60 animate-pulse" /> : stat.value}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Available Orders Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-green-50 rounded-2xl p-5 border border-green-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                <FiPackage className="text-white text-lg" />
              </div>
              <h2 className="text-lg font-bold text-green-800">New Available Orders</h2>
            </div>
            <button
              onClick={() => navigate('/delivery/orders')}
              className="text-green-700 text-sm font-bold hover:underline bg-white px-3 py-1 rounded-full shadow-sm"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {isDashboardLoading ? (
              <div className="h-20 w-full bg-white/50 rounded-xl animate-pulse" />
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-4 text-green-700/60 text-sm italic bg-white/30 rounded-xl border border-dashed border-green-300">
                No new orders available near you right now.
              </div>
            ) : (
              availableOrders.slice(0, 2).map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-gray-800 text-sm">{order.id}</p>
                    <span className="text-green-600 font-bold text-sm">{formatPrice(order.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                    <FiMapPin className="text-green-500" />
                    <span className="line-clamp-1">{order.address || 'Address unavailable'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptOrder(order.id);
                    }}
                    disabled={isUpdatingOrderStatus}
                    className="w-full gradient-green text-white py-2 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isUpdatingOrderStatus ? 'Accepting...' : 'Accept Order Now'}
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Orders (Assigned) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">My Active Orders</h2>
            <button
              onClick={() => navigate('/delivery/orders')}
              className="text-primary-600 text-sm font-semibold"
            >
              View My List
            </button>
          </div>

          <div className="space-y-3">
            {isDashboardLoading && (
              <div className="space-y-3">
                {[1, 2].map((item) => (
                  <div key={item} className="border border-gray-200 rounded-xl p-4 h-24 animate-pulse" />
                ))}
              </div>
            )}
            {!isDashboardLoading && displayOrders.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                You haven't accepted any orders yet.
                <br />
                Accept an order from the section above!
              </div>
            )}
            {!isDashboardLoading && displayOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onClick={() => navigate(`/delivery/orders/${order.id}`)}
                className="border border-gray-100 bg-gray-50/50 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiMapPin className="text-primary-600" />
                  <span className="line-clamp-1">{order.address || 'Address unavailable'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>


      </div>
    </PageTransition>
  );
};

export default DeliveryDashboard;

