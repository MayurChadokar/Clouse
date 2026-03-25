import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Package, Truck, MapPin, Clock, Shield } from 'lucide-react';
import { useOrderStore } from '../../../../shared/store/orderStore';
import socketService from '../../../../shared/utils/socket';
import TrackingMap from '../../../../shared/components/TrackingMap';

const TrackOrderPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { fetchOrderById, fetchPublicTrackingOrder } = useOrderStore();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [riderLiveLocation, setRiderLiveLocation] = useState(null);
    const [riderArrived, setRiderArrived] = useState(false);

    const loadOrder = async () => {
        if (!orderId) return;
        try {
            let foundOrder = await fetchOrderById(orderId).catch(() => null);
            if (!foundOrder) {
                foundOrder = await fetchPublicTrackingOrder(orderId).catch(() => null);
            }

            if (foundOrder) {
                setOrder(foundOrder);
            }
        } catch (error) {
            console.error("Failed to load order for tracking:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOrder();

        // Socket.io for real-time tracking
        socketService.connect();
        if (orderId) {
            socketService.joinRoom(`order_${orderId}`);
        }

        const handleLocationUpdate = (data) => {
            console.log('📍 Live Rider Update:', data);
            setRiderLiveLocation({ lat: data.lat, lng: data.lng });
        };

        const handleStatusUpdate = (data) => {
            console.log('📦 Order Status updated:', data);
            loadOrder();
        };

        const handleRiderArrived = () => {
            setRiderArrived(true);
            loadOrder();
        };

        socketService.on('location_updated', handleLocationUpdate);
        socketService.on('order_status_updated', handleStatusUpdate);
        socketService.on('rider_arrived', handleRiderArrived);

        // Fallback polling (every 30 seconds)
        const interval = setInterval(loadOrder, 30000);

        return () => {
            clearInterval(interval);
            socketService.off('location_updated', handleLocationUpdate);
            socketService.off('order_status_updated', handleStatusUpdate);
            socketService.off('rider_arrived', handleRiderArrived);
        };
    }, [orderId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Locating Order...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center">
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-2">Order Not Found</h2>
                  <p className="text-sm text-gray-500 mb-6">We couldn't find the order details for tracking.</p>
                  <button onClick={() => navigate('/home')} className="bg-black text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest">Go Home</button>
                </div>
            </div>
        );
    }

    const status = order?.status?.toLowerCase() || 'pending';
    const trackingNumber = order.trackingNumber || `TRK${String(order.orderId || orderId).slice(-8).toUpperCase()}`;
    const address = order.shippingAddress;

    // Determine current step
    let currentStep = 1;
    if (['processing', 'ready_for_pickup', 'accepted'].includes(status)) currentStep = 2;
    if (['shipped', 'out_for_delivery', 'picked_up', 'assigned'].includes(status)) currentStep = 3;
    if (status === 'delivered') currentStep = 4;
    if (status === 'cancelled') currentStep = 0;

    const steps = [
        { label: 'Order Placed', date: order.createdAt, icon: CheckCircle },
        { label: 'Processing', date: currentStep >= 2 ? 'Completed' : 'Pending', icon: Package },
        { label: 'Out for Delivery', date: currentStep >= 3 ? 'In Transit' : 'Pending', icon: Truck },
        { label: 'Delivered', date: status === 'delivered' ? order.deliveredAt : 'Pending', icon: MapPin },
    ];

    const getStatusColor = () => {
        if (status === 'delivered') return 'bg-emerald-100 text-emerald-800';
        if (status === 'cancelled') return 'bg-red-100 text-red-800';
        if (['shipped', 'out_for_delivery', 'picked_up', 'assigned'].includes(status)) return 'bg-blue-100 text-blue-800';
        return 'bg-amber-100 text-amber-800';
    };

    // Locations for map
    const initialRiderLoc = order?.deliveryBoyId?.currentLocation?.coordinates;
    const deliveryLocation = riderLiveLocation || (Array.isArray(initialRiderLoc) && initialRiderLoc.length === 2 ? { lat: initialRiderLoc[1], lng: initialRiderLoc[0] } : null);
    
    // Convert GeoJSON [lng, lat] to {lat, lng}
    const dropLoc = order?.dropoffLocation?.coordinates;
    const customerLocation = Array.isArray(dropLoc) && dropLoc.length === 2 && dropLoc[0] !== 0 ? { lat: dropLoc[1], lng: dropLoc[0] } : null;

    const vLoc = order?.pickupLocation?.coordinates;
    const vendorLocation = Array.isArray(vLoc) && vLoc.length === 2 && vLoc[0] !== 0 ? { lat: vLoc[1], lng: vLoc[0] } : null;

    const formatDate = (date) => {
        if (!date) return 'Pending';
        if (date === 'Completed' || date === 'In Transit') return date;
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-screen w-full bg-[#F8FAFC] flex flex-col relative overflow-hidden font-sans">
            
            {/* BACKDROP: Immersive Live Map */}
            <div className="absolute inset-0 z-0">
                <TrackingMap 
                    deliveryLocation={deliveryLocation}
                    customerLocation={customerLocation}
                    vendorLocation={vendorLocation}
                    followMode={true}
                />
                
                {/* Vignette Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30 pointer-events-none" />
            </div>

            {/* TOP BAR: Floating Status & Navigation */}
            <div className="absolute top-0 inset-x-0 p-6 z-50 flex items-center justify-between pointer-events-none">
                <button 
                  onClick={() => navigate(-1)} 
                  className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur shadow-2xl flex items-center justify-center text-slate-800 pointer-events-auto active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} />
                </button>
                
                <div className="flex flex-col items-end gap-2 pointer-events-auto">
                    <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur bg-white/90 border-b-2 border-slate-100 ${getStatusColor()}`}>
                        {status.replace(/_/g, ' ')}
                    </div>
                </div>
            </div>

            {/* FLOATING ACTION CARDS */}
            <div className="absolute inset-x-0 bottom-0 p-6 z-10 flex flex-col gap-4 max-h-[70%] overflow-y-auto scrollbar-hide">
                
                {/* 1. SECURE DELIVERY CODE (OTP) - Highlighted if Out for Delivery */}
                {(riderArrived || status === 'out_for_delivery' || status === 'picked_up') && order.deliveryOtpDebug && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-indigo-600 rounded-[32px] p-6 text-white shadow-2xl shadow-indigo-200/50 border border-white/20 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Shield size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-sm uppercase tracking-tight">Handover OTP</h3>
                                <p className="text-[9px] text-indigo-100 font-bold uppercase tracking-widest">Share this with the rider</p>
                            </div>
                            <div className="bg-white rounded-xl px-4 py-2 shadow-lg">
                                <span className="text-2xl font-black tracking-widest text-indigo-600">{order.deliveryOtpDebug}</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 2. MAIN TRACKING / RIDER CARD */}
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[40px] p-6 shadow-2xl shadow-slate-900/10 border border-slate-100"
                >
                    {/* Rider Presence Info */}
                    {(order.deliveryBoyId || order.assignedDeliveryBoy) ? (
                        <div className="flex items-center gap-4 mb-8">
                            <div className="relative">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 overflow-hidden">
                                     {order.deliveryBoyId?.avatar ? (
                                        <img src={order.deliveryBoyId.avatar} className="w-full h-full object-cover" alt="Rider" />
                                     ) : <Truck size={28} />}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Your Delivery Partner</p>
                                <h3 className="text-lg font-black text-slate-900 leading-tight">{order.deliveryBoyId?.name || order.assignedDeliveryBoy?.name}</h3>
                                {riderArrived && <span className="text-[10px] font-black text-emerald-500 uppercase">Reached your spot!</span>}
                            </div>
                            <button 
                                onClick={() => window.open(`tel:${order.deliveryBoyId?.phone || order.assignedDeliveryBoy?.phone}`, '_self')}
                                className="w-12 h-12 rounded-full bg-emerald-500 shadow-xl shadow-emerald-200 flex items-center justify-center text-white active:scale-90 transition-transform"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.81 12.81 0 0 0 .62 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.62A2 2 0 0 1 22 16.92z"></path></svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-4 text-center">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-2">
                                <Clock size={24} className="animate-spin" />
                            </div>
                            <h3 className="font-black text-sm text-slate-900">Assigning Rider...</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Our team is finding the nearest partner</p>
                        </div>
                    )}

                    {/* Horizontal Progress Timeline */}
                    <div className="pt-6 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-8 overflow-x-auto scrollbar-hide gap-4">
                            {steps.map((step, index) => {
                                const isCompleted = index < currentStep;
                                const isCurrent = index === currentStep;
                                const Icon = step.icon;
                                return (
                                    <div key={index} className="flex flex-col items-center shrink-0 min-w-[70px]">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-4 border-white shadow-sm transition-all duration-700 ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-300'}`}>
                                            <Icon size={16} />
                                        </div>
                                        <p className={`text-[9px] font-black uppercase mt-3 tracking-tighter ${isCompleted ? 'text-emerald-500' : isCurrent ? 'text-indigo-600' : 'text-slate-300'}`}>{step.label}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Details Quick View */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                                <p className="text-xs font-bold text-slate-800 line-clamp-1 truncate max-w-full">{address?.city || 'Your City'}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items</p>
                                    <p className="text-xs font-bold text-slate-800">{order.items?.length || 0} Products</p>
                                </div>
                                <Package size={20} className="text-indigo-300" />
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(`/orders/${order.orderId || orderId}`)}
                            className="w-full mt-6 py-4 bg-[#0F172A] text-white rounded-[20px] font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                        >
                            Complete Order Summary
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TrackOrderPage;
