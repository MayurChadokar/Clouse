import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  FiCamera,
  FiRefreshCw,
  FiShield,
  FiMap,
  FiTarget,
  FiXCircle
} from 'react-icons/fi';
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
  }, [id]);

  const getStatusColor = (status) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case 'pending':
      case 'approved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned':
      case 'processing':
      case 'accepted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'picked-up':
      case 'picked_up':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'out-for-delivery':
      case 'out_for_delivery':
      case 'in-transit':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered':
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
    } catch {}
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
    } catch {}
  };

  const handleCompleteReturn = async () => {
    if (!deliveryPhoto) {
      toast.error('Please capture/upload return proof photo');
      return;
    }
    await handleUpdateStatus('completed', 'Return delivered to vendor!', { deliveryPhoto });
  };

  const handleCompleteOrder = async () => {
    if (!order || !/^\d{6}$/.test(deliveryOtp.trim())) {
      toast.error('Please enter valid 6-digit OTP');
      return;
    }
    if (!deliveryPhoto) {
      toast.error('Delivery photo is required for proof');
      return;
    }

    try {
      const updated = await completeOrder(order.id, deliveryOtp.trim(), deliveryPhoto);
      setOrder(updated);
      setDeliveryOtp('');
      setDeliveryPhoto(null);
      toast.success('Done! Earning credited to your wallet.');
    } catch(err) {}
  };

  const handleResendOtp = async () => {
    if (isResendingOtp) return;
    try {
      setIsResendingOtp(true);
      await resendDeliveryOtp(order.id);
      toast.success('New OTP sent to customer');
    } catch(err) {} finally {
      setIsResendingOtp(false);
    }
  };

  const openInGoogleMaps = (lat, lng) => {
    const latitude = lat || order.latitude;
    const longitude = lng || order.longitude;
    if (!latitude || !longitude) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
  };

  if (isLoadingOrder) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-10">
           <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Syncing Job Details...</p>
        </div>
      </PageTransition>
    );
  }

  if (!order) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <FiXCircle size={64} className="text-slate-200 mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">Task Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">Either this task was taken or you don't have access.</p>
          <button onClick={() => navigate('/delivery/orders')} className="bg-[#0F172A] text-white px-8 py-3 rounded-2xl font-black text-sm uppercase">Back to Board</button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] pb-20">
        {/* Premium Header */}
        <div className="bg-[#0F172A] pt-28 pb-24 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center gap-4">
             <button onClick={() => navigate('/delivery/orders')} className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-white hover:bg-slate-800 transition-colors">
                <FiArrowLeft size={20} />
             </button>
             <div className="flex-1">
                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest block mb-1">Details & Route</span>
                <h1 className="text-xl font-black text-white tracking-tight">{isReturn ? 'Return' : 'Order'} #{order.id.slice(-8)}</h1>
             </div>
             <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusColor(order.status)} pb-1`}>
                {order.status.replace(/-/g, ' ')}
             </div>
          </div>
        </div>

        {/* Floating Content Body */}
        <div className="px-6 -mt-12 relative z-20 space-y-4">
          
          {/* Action Hub (Sticky Status Controls) */}
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-100">
             {/* Pending Status */}
             {(order.status === 'pending' || order.status === 'approved') && (
                <button 
                  onClick={handleAcceptTask} 
                  disabled={isUpdatingOrderStatus} 
                  className={`w-full ${isReturn ? 'bg-orange-600' : 'bg-[#0F172A]'} text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-slate-200`}
                >
                   {isUpdatingOrderStatus ? 'Accepting...' : isReturn ? 'Accept Return Pickup' : 'Start Acceptance'}
                </button>
             )}

             {/* Pickup Mode (Assigned/Accepted) */}
             {(order.status === 'assigned' || order.status === 'accepted' || (isReturn && order.status === 'processing')) && (
                <div className="space-y-4">
                   <div className={`flex items-center gap-2 mb-2 p-3 ${isReturn ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-amber-50 border-amber-100 text-amber-700'} rounded-2xl border`}>
                      <FiPackage className={isReturn ? 'text-orange-500' : 'text-amber-500'} />
                      <p className="text-[11px] font-black uppercase tracking-tighter">Current Task: Confirm Item Pickup</p>
                   </div>
                   <div className="relative group">
                      <input 
                         type="file" accept="image/*" capture="environment" 
                         onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => handleUpdateStatus('picked_up', 'Items Verified!', { pickupPhoto: reader.result });
                            reader.readAsDataURL(file);
                         }} 
                         className="hidden" id="pickup-photo" 
                      />
                      <label htmlFor="pickup-photo" className={`w-full flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed ${isReturn ? 'border-orange-200 hover:border-orange-500 bg-orange-50/50' : 'border-slate-200 hover:border-indigo-500 bg-slate-50'} rounded-3xl cursor-pointer transition-all`}>
                         <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400">
                            <FiCamera size={24} />
                         </div>
                         <div className="text-center">
                            <p className="text-sm font-black text-slate-900">Take Pickup Photo</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Proof of Items Verification</p>
                         </div>
                      </label>
                   </div>
                </div>
             )}

             {/* Return Completion Mode (No OTP for returns, just photo) */}
             {isReturn && order.status === 'picked_up' && (
                <div className="space-y-5">
                   <div className="bg-emerald-50 rounded-3xl p-5 border-2 border-emerald-200 text-center">
                      <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Return to Vendor</p>
                      <h2 className="text-lg font-black text-emerald-900">Deliver to Store</h2>
                      <div className="flex items-center justify-center gap-2 mt-2 text-[10px] font-bold text-emerald-700">
                         <FiShield /> FINAL RETURN PROOF REQUIRED
                      </div>
                   </div>

                   <div className="relative group">
                      <input 
                         type="file" accept="image/*" capture="environment" 
                         onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => setDeliveryPhoto(reader.result);
                            reader.readAsDataURL(file);
                         }} 
                         className="hidden" id="return-proof" 
                      />
                      <label htmlFor="return-proof" className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${deliveryPhoto ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200 hover:border-indigo-500'}`}>
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${deliveryPhoto ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                            {deliveryPhoto ? <FiCheckCircle size={24} /> : <FiCamera size={24} />}
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-black text-slate-900">{deliveryPhoto ? 'Proof Captured' : 'Take Vendor Photo'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{deliveryPhoto ? 'Proof Attached Successfully' : 'Proof of Return Handover'}</p>
                         </div>
                      </label>
                   </div>

                   <button 
                     onClick={handleCompleteReturn} 
                     disabled={isUpdatingOrderStatus || !deliveryPhoto} 
                     className="w-full h-14 bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 disabled:opacity-50"
                   >
                     {isUpdatingOrderStatus ? 'Finishing...' : 'Complete Return'}
                   </button>
                </div>
             )}

             {/* Standard Order Delivery Flow */}
             {!isReturn && order.status === 'picked-up' && (
                <button onClick={() => handleUpdateStatus('out_for_delivery', 'Live Tracking Active!')} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 animate-pulse">
                   <FiNavigation /> Set Out For Delivery
                </button>
             )}

             {!isReturn && (order.status === 'out-for-delivery' || order.status === 'picked-up') && (
                <div className="space-y-5">
                   {(order.paymentMethod === 'cod' || order.paymentMethod === 'cash') && (
                      <div className="bg-amber-50 rounded-3xl p-5 border-2 border-amber-200 text-center">
                         <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Cash Collection</p>
                         <h2 className="text-3xl font-black text-amber-900">{formatPrice(order.total)}</h2>
                         <div className="flex items-center justify-center gap-2 mt-2 text-[10px] font-bold text-amber-700">
                            <FiShield /> SECURE CASH ON DELIVERY
                         </div>
                      </div>
                   )}

                   <div className="relative">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Enter Customer OTP</p>
                      <input 
                         type="numeric" maxLength={6} value={deliveryOtp}
                         onChange={(e) => setDeliveryOtp(e.target.value.replace(/\D/g, ''))}
                         placeholder="••••••"
                         className="w-full h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-3xl font-black tracking-[0.5em] text-indigo-600 focus:border-indigo-500 focus:outline-none placeholder:text-slate-200"
                      />
                   </div>

                   <div className="relative group">
                      <input 
                         type="file" accept="image/*" capture="environment" 
                         onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => setDeliveryPhoto(reader.result);
                            reader.readAsDataURL(file);
                         }} 
                         className="hidden" id="delivery-proof" 
                      />
                      <label htmlFor="delivery-proof" className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${deliveryPhoto ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200 hover:border-indigo-500'}`}>
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${deliveryPhoto ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                            {deliveryPhoto ? <FiCheckCircle size={24} /> : <FiCamera size={24} />}
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-black text-slate-900">{deliveryPhoto ? 'Proof Captured' : 'Take Delivery Photo'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{deliveryPhoto ? 'Proof Attached Successfully' : 'Proof of Handover'}</p>
                         </div>
                      </label>
                   </div>

                   <div className="grid grid-cols-2 gap-3 pt-2">
                       <button onClick={handleResendOtp} disabled={isResendingOtp} className="h-14 bg-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-200 tracking-widest">Resend OTP</button>
                       <button onClick={handleCompleteOrder} disabled={deliveryOtp.length !== 6 || !deliveryPhoto} className="h-14 bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 disabled:opacity-50">Finish Job</button>
                   </div>
                </div>
             )}
          </motion.div>

          {/* Contact & Map Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             {/* Main Contact Card (Customer for orders, Customer for return pickup) */}
             <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                      <FiUser size={28} />
                   </div>
                   <div className="flex-1">
                      <h3 className="font-black text-slate-900 text-lg">{order.customer || 'Client'}</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Customer</p>
                   </div>
                   {order.phone && (
                      <button onClick={() => window.open(`tel:${order.phone}`, '_self')} className="w-12 h-12 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200 flex items-center justify-center text-white">
                         <FiPhone size={20} />
                      </button>
                   )}
                </div>
                
                <div className="space-y-4">
                   <div className="flex items-start gap-3">
                      <div className="mt-1 text-indigo-500"><FiMapPin size={18} /></div>
                      <div className="flex-1">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination Address</p>
                         <p className="text-sm text-slate-800 font-bold leading-relaxed">{order.address || 'Address unavailable'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2">
                         <FiNavigation className="text-emerald-500" />
                         <span className="text-sm font-black text-slate-900">{order.distance || '2.4 km'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <FiClock className="text-amber-500" />
                         <span className="text-sm font-black text-slate-900">{order.estimatedTime || '15 min'}</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Live Track / Map Card */}
             <div className="bg-white rounded-[32px] p-4 shadow-sm border border-slate-100 h-[300px] overflow-hidden relative">
                <MapContainer
                  center={[order.latitude || 20.5937, order.longitude || 78.9629]}
                  zoom={14}
                  style={{ height: '100%', width: '100%', borderRadius: '24px' }}
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {/* Rider Location */}
                  {order.deliveryBoyId?.currentLocation?.coordinates && (
                    <Marker
                      position={[order.deliveryBoyId.currentLocation.coordinates[1], order.deliveryBoyId.currentLocation.coordinates[0]]}
                      icon={riderIcon}
                    />
                  )}
                  {/* Customer/Target Location */}
                  {order.latitude && order.longitude && (
                     <Marker position={[order.latitude, order.longitude]} icon={customerIcon} />
                  )}
                  <ChangeView center={order.deliveryBoyId?.currentLocation?.coordinates ? [order.deliveryBoyId.currentLocation.coordinates[1], order.deliveryBoyId.currentLocation.coordinates[0]] : [order.latitude, order.longitude]} />
                </MapContainer>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[80%] z-[1000]">
                   <button onClick={() => openInGoogleMaps()} className="w-full bg-[#0F172A] text-white py-3 rounded-2xl shadow-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                      <FiMap size={14} /> Navigate Now
                   </button>
                </div>
             </div>
          </div>

          {/* Try & Buy / Check & Buy Mode Instructions */}
          {order.orderType && order.orderType !== 'standard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0F172A] rounded-[32px] p-6 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg">
                  <FiPackage size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight">{order.orderType.replace(/_/g, ' ')} MODE</h3>
                  <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Special Handling Required</p>
                </div>
              </div>
              <div className="relative z-10 bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                {order.orderType === 'try_and_buy' ? (
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    Please allow the customer to <span className="text-indigo-300 font-black">TRY</span> the products. Wait for 5-10 mins for their final decision before confirming delivery.
                  </p>
                ) : (
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    Please allow the customer to <span className="text-indigo-300 font-black">INSPECT</span> items. Confirm physical quality satisfaction before completion.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Item List / Manifest Card */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-900 font-black text-lg flex items-center gap-2">
                   <FiPackage className="text-indigo-500" /> Manifest
                </h3>
                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   {order.items?.length || 0} Products
                </span>
             </div>
             
             <div className="space-y-4">
                {(order.items || []).map((item, i) => (
                   <div key={i} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div>
                         <p className="font-black text-slate-800 text-sm">{item.name || 'Fashion Pack'}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Qty: {item.quantity || 1}</p>
                      </div>
                      <p className="font-black text-slate-900 text-sm">{formatPrice(item.price || 0)}</p>
                   </div>
                ))}
             </div>

             <div className="mt-8 space-y-3 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                   <span>Fee & Tax</span>
                   <span>{formatPrice((order.deliveryFee || 0) + (order.tax || 0))}</span>
                </div>
                {order.discount > 0 && (
                   <div className="flex justify-between items-center text-red-500 font-bold text-[10px] uppercase tracking-widest">
                      <span>Discount</span>
                      <span>-{formatPrice(order.discount)}</span>
                   </div>
                )}
                <div className="flex justify-between items-center text-slate-900 font-black text-xl">
                   <span>Final Checkout</span>
                   <span className="text-indigo-600 underline underline-offset-4 decoration-2">{formatPrice(order.total)}</span>
                </div>
             </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};

export default DeliveryOrderDetail;
