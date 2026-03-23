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
  FiCreditCard,
  FiDollarSign,
} from 'react-icons/fi';
import { IndianRupee } from 'lucide-react';
import PageTransition from '../../../shared/components/PageTransition';
import { formatPrice } from '../../../shared/utils/helpers';
import toast from 'react-hot-toast';
import { useDeliveryAuthStore } from '../store/deliveryStore';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import socketService from '../../../shared/utils/socket';

// Fix for default marker icon issues in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const riderIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1275/1275210.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && center[0] !== null && center[1] !== null) {
      try {
        map.setView(center);
      } catch (err) {
        console.warn("Map view update failed:", err);
      }
    }
  }, [center, map]);
  return null;
};

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
    acceptReturn,
    updateReturnStatus,
  } = useDeliveryAuthStore();
  const [order, setOrder] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  const isReturn = order?.type === 'return';

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

    // Socket listeners for real-time updates
    socketService.connect();
    socketService.joinRoom('delivery_partners');

    const handleUpdate = (data) => {
      if (String(data.orderId || data.id) === String(id)) {
        loadOrder();
      }
    };

    socketService.on('order_status_updated', handleUpdate);
    socketService.on('return_status_updated', handleUpdate);
    socketService.on('order_taken', (data) => {
      if (String(data.orderId || data.id) === String(id)) {
        toast.error('This task has been taken by another partner');
        navigate('/delivery/orders');
      }
    });

    return () => {
      socketService.off('order_status_updated');
      socketService.off('return_status_updated');
      socketService.off('order_taken');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getStatusColor = (status) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case 'pending':
      case 'approved':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'picked-up':
      case 'picked_up':
        return 'bg-blue-100 text-blue-800';
      case 'out-for-delivery':
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAcceptTask = async () => {
    if (!order) return;
    try {
      if (isReturn) {
        const updated = await acceptReturn(order.id);
        setOrder(updated);
        toast.success('Return assignment accepted');
      } else {
        const updated = await acceptOrder(order.id);
        setOrder(updated);
        toast.success('Order assigned to you');
      }
    } catch { }
  };

  const handleUpdateStatus = async (newBackendStatus, successMessage, options = {}) => {
    try {
      let updated;
      if (isReturn) {
        updated = await updateReturnStatus(order.id, newBackendStatus, options);
      } else {
        updated = await updateOrderStatus(order.id, newBackendStatus, options);
      }
      setOrder(updated);
      toast.success(successMessage);
    } catch { }
  };

  const handleCompleteReturn = async () => {
    if (!deliveryPhoto) {
      toast.error('Please upload delivery photo as proof');
      return;
    }
    await handleUpdateStatus('completed', 'Return delivered to vendor!', { deliveryPhoto });
  };

  const handleCompleteOrder = async () => {
    if (!order || (order.status !== 'out-for-delivery' && order.status !== 'picked-up')) return;
    const normalizedOtp = String(deliveryOtp || '').trim();
    if (!/^\d{6}$/.test(normalizedOtp)) {
      toast.error('Please enter valid 6-digit OTP');
      return;
    }

    try {
      if (!deliveryPhoto) {
        toast.error('Please upload delivery photo');
        return;
      }
      const updated = await completeOrder(order.id, normalizedOtp, deliveryPhoto);
      setOrder(updated);
      setDeliveryOtp('');
      setDeliveryPhoto(null);
      toast.success('Order marked as delivered');
    } catch {
      // Error toast handled by API interceptor.
    }
  };

  const handleResendOtp = async () => {
    if (!order || (order.status !== 'out-for-delivery' && order.status !== 'picked-up') || isResendingOtp) return;
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-bold text-gray-800">#{order.id}</span>
              {order.orderType && order.orderType !== 'standard' && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full border border-primary-200 uppercase ">
                  {String(order.orderType || 'standard').replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
              {String(order.status || 'pending').replace(/-/g, ' ')}
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
          <div className="space-y-3">
            <div>
              <p className="text-gray-800 font-bold mb-1">{order.customer}</p>
              <div className="flex flex-col gap-1 text-sm">
                {order.phone && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary-100 text-primary-600 rounded-lg shrink-0">
                      <FiPhone size={14} />
                    </div>
                    <a href={`tel:${order.phone}`} className="font-bold text-primary-700 hover:underline  text-base">
                      {order.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase  flex items-center gap-1">
                  <FiCreditCard /> Payment Mode:
                </span>

                {order.paymentMethod === 'cod' ? (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full border border-purple-200 uppercase  animate-pulse inline-flex items-center gap-1">
                    Cash on Delivery (COD)
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase  rounded-full border border-emerald-100">
                    Prepaid ({order.paymentMethod})
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pickup Location (Vendor) */}
        {order.pickupLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-orange-500"
          >
            <h2 className="text-sm font-bold text-gray-500 uppercase  mb-2 flex items-center gap-2">
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
          <h2 className="text-sm font-bold text-gray-500 uppercase  mb-2 flex items-center gap-2">
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

        {/* Special Delivery Type Instructions - Only show for accepted orders */}
        {order.status !== 'pending' && order.orderType && order.orderType !== 'standard' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary-50 rounded-2xl p-5 border-2 border-primary-200 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <FiPackage size={80} className="text-primary-900" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
                <FiCheckCircle className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-primary-900 font-bold text-lg leading-tight uppercase ">
                  {String(order.orderType || 'standard').replace(/_/g, ' ')} Mode
                </h2>
                <p className="text-primary-600 text-[10px] font-bold uppercase  italic">Special Handling Required</p>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-primary-100 shadow-inner">
                {order.orderType === 'try_and_buy' ? (
                  <div className="space-y-2">
                    <p className="text-gray-900 text-sm font-bold leading-relaxed">
                      This is a <span className="text-primary-700 italic">Try & Buy</span> order.
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc font-medium">
                      <li>Let the customer try the products before payment.</li>
                      <li>Wait for 5-10 minutes for their decision.</li>
                      <li>Items that don't fit can be returned to you.</li>
                    </ul>
                  </div>
                ) : order.orderType === 'check_and_buy' ? (
                  <div className="space-y-2">
                    <p className="text-gray-900 text-sm font-bold leading-relaxed">
                      This is a <span className="text-primary-700 italic">Check & Buy</span> order.
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc font-medium">
                      <li>Allow the customer to inspect product quality.</li>
                      <li>Ensure they are satisfied with the items.</li>
                      <li>Proceed to delivery completion once they approve.</li>
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-700 text-sm">Please follow customer instructions for this special delivery.</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-primary-800 text-[11px] font-bold bg-primary-100/50 p-2 rounded-lg border border-primary-200/50">
                <FiClock className="animate-pulse" />
                <span>PLEASE DO NOT COMPLETE DELIVERY UNTIL CUSTOMER CONFIRMS</span>
              </div>
            </div>
          </motion.div>
        )}


        {/* Map - Show when order is accepted */}
        {(order.status === 'in-transit' || order.status === 'picked-up' || order.status === 'out-for-delivery') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiMapPin className="text-primary-600" />
                Live Tracking
              </h2>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase  rounded-full animate-pulse border border-emerald-100 italic">
                Rider Signal: Active
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-200 relative z-10" style={{ height: '350px' }}>
              <MapContainer
                center={[order.latitude || 20.5937, order.longitude || 78.9629]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />

                {/* Rider's Own Marker (from order.deliveryBoyId pointing to user data) */}
                {order.deliveryBoyId?.currentLocation?.coordinates && (
                  <Marker
                    position={[order.deliveryBoyId.currentLocation.coordinates[1], order.deliveryBoyId.currentLocation.coordinates[0]]}
                    icon={riderIcon}
                  >
                    <Popup>
                      <div className="text-[10px] font-bold uppercase text-center">My Current Location</div>
                    </Popup>
                  </Marker>
                )}

                {/* Customer (Delivery) Marker */}
                {order.latitude && order.longitude && (
                  <Marker position={[order.latitude, order.longitude]} icon={customerIcon}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-bold text-gray-900">{order.customer}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Customer Destination</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                <ChangeView center={order.deliveryBoyId?.currentLocation?.coordinates ? [order.deliveryBoyId.currentLocation.coordinates[1], order.deliveryBoyId.currentLocation.coordinates[0]] : [order.latitude, order.longitude]} />
              </MapContainer>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => openInGoogleMaps(order.latitude, order.longitude)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors shadow-md shadow-primary-100"
              >
                <FiNavigation />
                Directions
              </button>
              <button
                onClick={loadOrder}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                <FiClock />
                Sync Status
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
            <div className="flex items-center justify-between text-gray-700">
              <span>Tax (18%)</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex items-center justify-between text-red-600">
                <span>Discount</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
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
          {/* Accept Mode */}
          {(order.status === 'pending' || order.status === 'approved') && (
            <button
              onClick={handleAcceptTask}
              disabled={isUpdatingOrderStatus}
              className={`w-full ${isReturn ? 'bg-orange-600' : 'gradient-green'} text-white py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-60`}
            >
              <FiCheckCircle />
              {isUpdatingOrderStatus ? 'Accepting...' : isReturn ? 'Accept Return Pickup' : 'Accept Order'}
            </button>
          )}

          {/* Pickup Mode */}
          {(order.status === 'assigned' || (isReturn && order.status === 'processing')) && (
            <div className={`space-y-4 ${isReturn ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'} p-5 rounded-2xl border-2`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 ${isReturn ? 'bg-orange-500' : 'bg-green-600'} text-white rounded-lg`}>
                  <FiPackage />
                </div>
                <h3 className={`font-bold ${isReturn ? 'text-orange-900' : 'text-green-900'} uppercase italic`}>Confirm Pick-Up</h3>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase">Capture Pickup Photo (Mandatory)</label>
                <div className={`flex items-center justify-center border-2 border-dashed ${isReturn ? 'border-orange-300' : 'border-green-300'} rounded-xl p-4 bg-white/50 cursor-pointer`}>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        try {
                          await handleUpdateStatus('picked_up', 'Items Picked Up!', { pickupPhoto: reader.result });
                        } catch (err) {
                          toast.error("Failed to upload photo");
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                    id="pickup-photo"
                  />
                  <label htmlFor="pickup-photo" className={`text-sm font-bold ${isReturn ? 'text-orange-600' : 'text-green-600'} flex flex-col items-center gap-2 cursor-pointer`}>
                    <span className={`px-4 py-2 ${isReturn ? 'bg-orange-500' : 'bg-green-500'} text-white rounded-lg shadow-sm`}>Take Photo</span>
                    <span className="text-[10px] opacity-60">Click to open camera</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Return Completion Mode (No OTP for returns, just photo) */}
          {isReturn && order.status === 'picked_up' && (
            <div className="space-y-4 bg-emerald-50 p-5 rounded-2xl border-2 border-emerald-200">
               <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <FiCheckCircle />
                </div>
                <h3 className="font-bold text-emerald-900 uppercase italic">Return to Vendor</h3>
              </div>
              
              <p className="text-sm text-emerald-800 font-medium">Deliver the package back to the vendor shop to complete the return.</p>

              <div className="space-y-2 mt-2">
                <label className="block text-xs font-bold text-emerald-700 uppercase">Proof of Delivery to Vendor</label>
                <div className="flex items-center justify-center border-2 border-dashed border-emerald-300 rounded-xl p-4 bg-white/50 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setDeliveryPhoto(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                    id="return-photo"
                  />
                   <label htmlFor="return-photo" className="text-sm font-bold text-emerald-600 flex flex-col items-center gap-2 cursor-pointer">
                    {deliveryPhoto ? (
                      <div className="relative">
                        <img src={deliveryPhoto} alt="Return Proof" className="w-24 h-24 object-cover rounded-lg" />
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5"><FiCheckCircle size={12} /></span>
                      </div>
                    ) : (
                      <>
                        <span className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-sm">Take Photo</span>
                        <span className="text-[10px] text-emerald-400">Final proof of delivery</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <button
                onClick={handleCompleteReturn}
                disabled={isUpdatingOrderStatus || !deliveryPhoto}
                className="w-full gradient-green text-white py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-60 uppercase"
              >
                {isUpdatingOrderStatus ? 'Finishing...' : 'Complete Return'}
              </button>
            </div>
          )}

          {/* Standard Order Out for Delivery / Completion */}
          {!isReturn && order.status === 'picked-up' && (
            <button
              onClick={() => handleUpdateStatus('out_for_delivery', 'Order is now Out for Delivery!')}
              disabled={isUpdatingOrderStatus}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 uppercase"
            >
              <FiNavigation className="animate-bounce" />
              {isUpdatingOrderStatus ? 'Starting Delivery...' : 'Start Out for Delivery'}
            </button>
          )}

          {!isReturn && (order.status === 'out-for-delivery' || order.status === 'picked-up') && (
            <div className="space-y-4 bg-emerald-50 p-5 rounded-2xl border-2 border-emerald-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <FiCheckCircle />
                </div>
                <h3 className="font-bold text-emerald-900 uppercase italic">Complete Delivery</h3>
              </div>

              {(order.paymentMethod === 'cod' || order.paymentMethod === 'cash') && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="bg-amber-100 border-2 border-amber-300 rounded-2xl p-5 mb-4 flex flex-col items-center gap-2 animate-pulse shadow-md shadow-amber-200"
                >
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold uppercase text-sm tracking-tighter">
                    <FiDollarSign className="text-xl" />
                    Cash Collection Required
                  </div>
                  <p className="text-3xl font-black text-amber-900 leading-none">{formatPrice(order.total)}</p>
                  <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest text-center mt-1">
                    Collect physical cash from customer before entering OTP
                  </p>
                </motion.div>
              )}

              <p className="text-xs font-bold text-emerald-700 uppercase mb-1 text-center">Enter 6-Digit Delivery OTP</p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={deliveryOtp}
                onChange={(e) => setDeliveryOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="0 0 0 0 0 0"
                className="w-full px-4 py-4 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:outline-none text-center text-3xl tracking-[0.4em] font-bold bg-white shadow-inner uppercase"
              />

              <div className="space-y-2 mt-4">
                <label className="block text-xs font-bold text-emerald-700 uppercase ">Capture Delivery Photo (Mandatory)</label>
                <div className="flex items-center justify-center border-2 border-dashed border-emerald-300 rounded-xl p-4 bg-white/50 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setDeliveryPhoto(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                    id="delivery-photo"
                  />
                  <label htmlFor="delivery-photo" className="text-sm font-bold text-emerald-600 flex flex-col items-center gap-2 cursor-pointer">
                    {deliveryPhoto ? (
                      <div className="relative">
                        <img src={deliveryPhoto} alt="Delivery Proof" className="w-24 h-24 object-cover rounded-lg" />
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5"><FiCheckCircle size={12} /></span>
                      </div>
                    ) : (
                      <>
                        <span className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-sm">Take Photo</span>
                        <span className="text-[10px] text-emerald-400">Click to open camera</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mt-4">
                <button
                  onClick={handleResendOtp}
                  disabled={isResendingOtp || isUpdatingOrderStatus}
                  className="col-span-2 bg-white border border-emerald-200 text-emerald-700 py-4 rounded-xl font-bold text-xs hover:bg-emerald-50 disabled:opacity-60 transition-all uppercase "
                >
                  {isResendingOtp ? '...' : 'Resend OTP'}
                </button>
                <button
                  onClick={handleCompleteOrder}
                  disabled={isUpdatingOrderStatus || deliveryOtp.length !== 6}
                  className="col-span-3 gradient-green text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-emerald-100 uppercase "
                >
                  {isUpdatingOrderStatus ? 'Hold on...' : 'Verify & Finish'}
                </button>
              </div>
            </div>
          )}

          {order.phone && (
            <button
              onClick={() => window.open(`tel:${order.phone}`, '_self')}
              className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 hover:bg-white hover:text-black shadow-sm"
            >
              <FiPhone className="text-primary-600" />
              Call {isReturn ? 'Customer' : 'Contact'}
            </button>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default DeliveryOrderDetail;



