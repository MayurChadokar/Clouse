import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiClock,
  FiPackage,
  FiNavigation,
  FiCheckCircle,
  FiUser,
  FiTrendingUp,
} from 'react-icons/fi';
import PageTransition from '../../../shared/components/PageTransition';
import { formatPrice } from '../../../shared/utils/helpers';
import toast from 'react-hot-toast';
import { useDeliveryAuthStore } from '../store/deliveryStore';

const DeliveryOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    fetchOrderById,
    acceptOrder,
    completeOrder,
    resendDeliveryOtp,
    isLoadingOrder,
    isUpdatingOrderStatus,
    updateOrderStatus,
  } = useDeliveryAuthStore();
  const [order, setOrder] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  const loadOrder = async () => {
    try {
      setLoadFailed(false);
      const response = await fetchOrderById(id);
      setOrder(response);
    } catch {
      setLoadFailed(true);
      setOrder(null);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id, fetchOrderById]);

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

  const handleAcceptOrder = async () => {
    if (!order || order.status !== 'pending') return;
    try {
      const updated = await acceptOrder(order.id);
      setOrder(updated);
      toast.success('Order assigned to you');
    } catch {
      // Error toast handled by API interceptor.
    }
  };

  const handleUpdateStatus = async (newBackendStatus, successMessage) => {
    try {
      const updated = await updateOrderStatus(order.id, newBackendStatus);
      setOrder(updated);
      toast.success(successMessage);
    } catch {
      // Error toast handled by API interceptor.
    }
  };

  const handleCompleteOrder = async () => {
    if (!order || order.status !== 'out-for-delivery') return;
    const normalizedOtp = String(deliveryOtp || '').trim();
    if (!/^\d{6}$/.test(normalizedOtp)) {
      toast.error('Please enter valid 6-digit OTP');
      return;
    }

    try {
      const updated = await completeOrder(order.id, normalizedOtp);
      setOrder(updated);
      setDeliveryOtp('');
      toast.success('Order marked as delivered');
    } catch {
      // Error toast handled by API interceptor.
    }
  };

  const handleResendOtp = async () => {
    if (!order || order.status !== 'out-for-delivery' || isResendingOtp) return;
    try {
      setIsResendingOtp(true);
      await resendDeliveryOtp(order.id);
      toast.success('Delivery OTP resent to customer');
    } catch {
      // Error toast handled by API interceptor.
    } finally {
      setIsResendingOtp(false);
    }
  };

  const openInGoogleMaps = (lat, lng) => {
    const latitude = lat || order.latitude;
    const longitude = lng || order.longitude;
    if (!latitude || !longitude) return;

    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroid = /android/i.test(userAgent);

    if (isAndroid) {
      // Android: Use intent URL (opens Google Maps app if installed, otherwise web)
      const intentUrl = `intent://maps.google.com/maps?daddr=${latitude},${longitude}&directionsmode=driving#Intent;scheme=https;package=com.google.android.apps.maps;end`;
      window.location.href = intentUrl;
    } else if (isIOS) {
      // iOS: Try Google Maps app URL scheme first
      const appUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
      // Universal link as fallback (opens app if installed, otherwise web)
      const universalUrl = `https://maps.google.com/maps?daddr=${latitude},${longitude}&directionsmode=driving`;

      // Try app URL
      const link = document.createElement('a');
      link.href = appUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Fallback to universal link after brief delay
      setTimeout(() => {
        window.location.href = universalUrl;
      }, 400);
    } else {
      // Desktop: Use web version
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(webUrl, '_blank');
    }
  };

  if (isLoadingOrder) {
    return (
      <PageTransition>
        <div className="px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!order) {
    return (
      <PageTransition>
        <div className="px-4 py-6 text-center space-y-3">
          <p className="text-gray-600">{loadFailed ? 'Unable to load order details' : 'Order not found'}</p>
          {loadFailed && (
            <button
              onClick={loadOrder}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold"
            >
              Retry
            </button>
          )}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/delivery/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="text-xl text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{order.id}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
              {order.status.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FiUser />
            Customer Information
          </h2>
          <div className="space-y-2">
            <p className="text-gray-800 font-semibold">{order.customer}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiPhone />
              <a
                href={order.phone ? `tel:${order.phone}` : '#'}
                className={`hover:text-primary-600 ${!order.phone ? 'pointer-events-none opacity-60' : ''}`}
              >
                {order.phone || 'Phone unavailable'}
              </a>
            </div>
            <p className="text-sm text-gray-600">{order.email || '-'}</p>
          </div>
        </motion.div>

        {/* Pickup Location (Vendor) */}
        {order.pickupLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-orange-500"
          >
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FiPackage className="text-orange-500" />
              Pickup From (Vendor)
            </h2>
            <p className="text-gray-800 font-bold mb-1">{order.vendorName || 'Vendor'}</p>
            <p className="text-gray-700 text-sm">{order.vendorAddress || 'Vendor address details'}</p>
            <button
              onClick={() => openInGoogleMaps(order.pickupLocation.coordinates[1], order.pickupLocation.coordinates[0])}
              className="mt-3 text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline"
            >
              <FiNavigation /> Get Directions to Vendor
            </button>
          </motion.div>
        )}

        {/* Delivery Address (Customer) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-primary-500"
        >
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <FiUser className="text-primary-500" />
            Deliver To (Customer)
          </h2>
          <p className="text-gray-800 font-bold mb-1">{order.customer}</p>
          <p className="text-gray-700 text-sm mb-3">{order.address || 'Address unavailable'}</p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <FiNavigation />
              <span>{order.distance}</span>
            </div>
            <div className="flex items-center gap-1">
              <FiClock />
              <span>{order.estimatedTime}</span>
            </div>
          </div>
          {order.latitude && order.longitude && (
            <button
              onClick={() => openInGoogleMaps(order.latitude, order.longitude)}
              className="mt-3 text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline"
            >
              <FiNavigation /> Get Directions to Customer
            </button>
          )}
        </motion.div>

        {/* Map - Show when order is accepted */}
        {(order.status === 'in-transit' || order.status === 'completed') && order.latitude && order.longitude && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FiMapPin className="text-primary-600" />
              Delivery Location
            </h2>
            <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: '300px' }}>
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${order.longitude - 0.01},${order.latitude - 0.01},${order.longitude + 0.01},${order.latitude + 0.01}&layer=mapnik&marker=${order.latitude},${order.longitude}`}
                title="Delivery Location Map"
              />
            </div>
            <div className="mt-3">
              <button
                onClick={openInGoogleMaps}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
              >
                <FiNavigation />
                Open in Google Maps
              </button>
            </div>
          </motion.div>
        )}

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FiPackage />
            Order Items
          </h2>
          <div className="space-y-3">
            {order.items.length === 0 && (
              <p className="text-sm text-gray-500">No items available for this order.</p>
            )}
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-semibold text-gray-800">{item.name || 'Item'}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity || 0}</p>
                </div>
                <p className="font-semibold text-gray-800">{formatPrice(item.price || 0)}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-4 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FiTrendingUp />
            Order Summary
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-gray-700">
              <span>Subtotal</span>
              <span>{formatPrice(order.amount)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-700">
              <span>Delivery Fee</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-primary-600 text-lg">{formatPrice(order.total)}</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 pt-4"
        >
          {order.status === 'pending' && (
            <button
              onClick={handleAcceptOrder}
              disabled={isUpdatingOrderStatus}
              className="w-full gradient-green text-white py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-green-200 disabled:opacity-60"
            >
              <FiCheckCircle />
              {isUpdatingOrderStatus ? 'Accepting...' : 'Accept Order'}
            </button>
          )}

          {order.status === 'assigned' && (
            <button
              onClick={() => handleUpdateStatus('shipped', 'Order marked as Picked Up')}
              disabled={isUpdatingOrderStatus}
              className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-60"
            >
              <FiPackage />
              {isUpdatingOrderStatus ? 'Updating...' : 'Mark as Picked Up'}
            </button>
          )}

          {/* Once picked up (backend: shipped → UI: picked-up), show OTP verify to complete delivery */}
          {order.status === 'picked-up' && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <p className="text-sm font-bold text-gray-700 mb-1">Verify Delivery OTP</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={deliveryOtp}
                onChange={(e) => setDeliveryOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none text-center text-xl tracking-[0.5em] font-bold"
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleResendOtp}
                  disabled={isResendingOtp || isUpdatingOrderStatus}
                  className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  {isResendingOtp ? 'Resending...' : 'Resend OTP'}
                </button>
                <button
                  onClick={handleCompleteOrder}
                  disabled={isUpdatingOrderStatus}
                  className="w-full gradient-green text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-green-100"
                >
                  <FiCheckCircle />
                  {isUpdatingOrderStatus ? 'Wait...' : 'Complete'}
                </button>
              </div>
            </div>
          )}

          {order.phone && (
            <button
              onClick={() => window.open(`tel:${order.phone}`, '_self')}
              className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 hover:bg-gray-50 shadow-sm"
            >
              <FiPhone className="text-primary-600" />
              Call Customer
            </button>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default DeliveryOrderDetail;



