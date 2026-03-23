import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Heart, ShieldCheck, ChevronRight, MapPin, ChevronDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import LocationModal from '../../components/Header/LocationModal';
import { useUserLocation } from '../../context/LocationContext';

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
    const { addToWishlist } = useWishlist();
    const { activeAddress } = useUserLocation();
    const navigate = useNavigate();
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    const totalMRP = cart.reduce((acc, item) => {
        const itemSellingPrice = item.discountedPrice !== undefined ? item.discountedPrice : (item.price || item.originalPrice || 0);
        const itemMRP = Math.max(item.originalPrice || 0, item.price || 0, itemSellingPrice);
        return acc + (itemMRP * item.quantity);
    }, 0);
    const totalDiscount = totalMRP - getCartTotal();

    if (cart.length === 0) {
        return (
            <div className="bg-white min-h-[80vh] flex flex-col items-center justify-center px-4 animate-fadeIn">
                <div className="w-32 h-32 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(212,175,55,0.05)]">
                    <ShoppingBag size={48} className="text-black/50" />
                </div>
                <h2 className="text-2xl font-bold uppercase  text-gray-900 mb-2">Your cart is Empty</h2>
                <p className="text-gray-400 font-semibold text-[13px] uppercase  mb-10 text-center max-w-xs leading-relaxed">
                    Looks like you haven't added anything to your cart yet.
                </p>
                <button
                    onClick={() => navigate('/products')}
                    className="px-10 py-4 bg-black text-white text-[12px] font-bold uppercase  rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                >
                    Continue Shopping
                </button>
            </div>
        );
    }

    const handleMoveToWishlist = (item) => {
        addToWishlist(item);
        removeFromCart(item.id);
    };

    return (
        <div className="bg-white text-gray-900 min-h-screen pb-32 md:pb-12">
            {/* Mobile Header Nav */}
            <div className="md:hidden sticky top-0 bg-white/90 backdrop-blur-xl z-40 border-b border-gray-100 px-4 py-4 flex items-center gap-4 shadow-sm">
                <button onClick={() => {
                    if (window.history.length > 2) {
                        navigate(-1);
                    } else {
                        navigate('/products');
                    }
                }} className="p-3 -ml-2 rounded-full hover:bg-gray-50 transition-colors"><ArrowLeft size={20} className="text-gray-900" /></button>
                <div className="flex-1">
                    <h1 className="text-base font-bold uppercase  text-gray-900">Shopping cart</h1>
                    <p className="text-[10px] font-bold text-black uppercase ">{cart.length} Items</p>
                </div>
            </div>

            {/* Address Bar - New Row */}
            <div
                onClick={() => setIsLocationModalOpen(true)}
                className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 cursor-pointer active:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <MapPin size={16} className="text-black shrink-0" />
                    <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-bold leading-tight flex items-center gap-2 text-gray-900">
                            {activeAddress ? activeAddress.name : 'Select Location'} <span className="text-[9px] font-normal uppercase  text-gray-400">{activeAddress?.type}</span>
                        </span>
                        <span className="text-[10px] font-medium truncate max-w-[200px] text-gray-500">
                            {activeAddress ? `${activeAddress.address}, ${activeAddress.city}` : 'Add an address to see delivery info'}
                        </span>
                    </div>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
            </div>

            <LocationModal
                isOpen={isLocationModalOpen}
                onClose={() => setIsLocationModalOpen(false)}
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="hidden md:block mb-10">
                    <h1 className="text-3xl font-bold uppercase  text-gray-900">Your cart</h1>
                    <p className="text-[14px] font-bold text-black mt-1 uppercase ">{cart.length} Items</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Cart Items List */}
                    <div className="flex-[1.5] space-y-4">
                        {cart.map((item) => (
                            <div key={`${item.id}-${item.selectedSize}`} className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm flex flex-col sm:flex-row p-4 sm:p-5 relative group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-black/5">
                                <Link to={`/product/${item.id}`} className="w-full sm:w-32 aspect-[3/4] sm:h-auto rounded-2xl overflow-hidden shrink-0 bg-[#F8F8F8] border border-gray-100">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                </Link>

                                <div className="flex-1 flex flex-col pt-4 sm:pt-0 sm:pl-6">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <h3 className="text-[11px] font-bold text-black uppercase  mb-1">{item.brand}</h3>
                                            <h4 className="text-[15px] font-bold text-gray-900 leading-tight mb-3 uppercase ">{item.name}</h4>
                                        </div>
                                        <button
                                            className="p-2 -mr-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded-full transition-all"
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-4 mb-5">
                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase ">Size</span>
                                            <span className="text-[12px] font-bold text-gray-900 uppercase">{item.selectedSize || 'M'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase ">Qty</span>
                                            <div className="flex items-center gap-2.5 ml-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="hover:text-black text-gray-600 disabled:opacity-30"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus size={14} strokeWidth={3} />
                                                </button>
                                                <span className="text-[12px] font-bold min-w-[12px] text-center text-gray-900">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="hover:text-black text-gray-600"
                                                >
                                                    <Plus size={14} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-end justify-between">
                                        <button
                                            onClick={() => handleMoveToWishlist(item)}
                                            className="text-[11px] font-bold uppercase  text-gray-900 flex items-center gap-2 border-b-2 border-transparent hover:text-black hover:border-black pb-1 transition-all"
                                        >
                                            <Heart size={14} /> Move to Wishlist
                                        </button>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end mb-0.5">
                                                <span className="text-lg font-bold text-gray-900">
                                                    ₹{((item.discountedPrice !== undefined ? item.discountedPrice : (item.price || item.originalPrice || 0)) * item.quantity).toFixed(0)}
                                                </span>
                                                {(item.discount || (item.originalPrice > (item.discountedPrice || item.price))) && (
                                                    <span className="text-[11px] font-bold text-white bg-black px-2 py-0.5 rounded-full shadow-sm">
                                                        {item.discount || `${Math.round(((item.originalPrice - (item.discountedPrice || item.price)) / item.originalPrice) * 100)}% OFF`}
                                                    </span>
                                                )}
                                            </div>
                                            {(item.originalPrice > (item.discountedPrice || item.price)) && (
                                                <span className="text-[12px] font-bold text-gray-400 line-through">₹{item.originalPrice * item.quantity}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex items-center gap-4 mt-6">
                            <ShieldCheck className="text-black" size={24} />
                            <div>
                                <p className="text-[12px] font-bold uppercase  text-gray-900">Safe and Secure Payments</p>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase ">100% Authentic products guaranteed</p>
                            </div>
                        </div>
                    </div>

                    {/* Price Details Sidebar */}
                    <div className="flex-1 lg:max-w-md">
                        <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-xl lg:sticky lg:top-28">
                            <div className="p-8">
                                <h3 className="text-[14px] font-bold uppercase  text-gray-900 mb-8 flex items-center justify-between">
                                    Cart Summary
                                    <ShoppingBag size={18} className="text-black" />
                                </h3>

                                <div className="space-y-6">
                                    <div className="flex justify-between text-[13px] font-bold">
                                        <span className="text-gray-400 uppercase ">Total MRP</span>
                                        <span className="text-gray-900 font-bold ">₹{totalMRP}</span>
                                    </div>
                                    <div className="flex justify-between text-[13px] font-bold">
                                        <span className="text-gray-400 uppercase ">Cart Discount</span>
                                        <span className="text-black font-bold ">-₹{totalDiscount}</span>
                                    </div>
                                    <div className="flex justify-between text-[13px] font-bold">
                                        <span className="text-gray-400 uppercase ">Convenience Fee</span>
                                        <span className="text-black font-bold ">FREE</span>
                                    </div>

                                    <div className="h-px bg-gray-100 my-2"></div>

                                    <div className="flex justify-between items-end py-2">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase  mb-1">Total Amount</p>
                                            <p className="text-2xl font-bold text-gray-900 ">₹{getCartTotal()}</p>
                                        </div>
                                         <div className="text-right">
                                             <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">You saved ₹{totalDiscount}</p>
                                         </div>
                                    </div>

                                    {/* HIDDEN ON MOBILE: Avoids duplicate button with bottom action bar */}
                                    <button
                                        onClick={() => navigate('/checkout')}
                                        className="hidden lg:flex w-full py-5 bg-black text-white text-[13px] font-bold uppercase  rounded-2xl shadow-[0_4px_20px_rgba(212,175,55,0.2)] active:scale-95 transition-all items-center justify-center gap-3 hover:bg-gray-100 hover:text-black hover:shadow-xl"
                                    >
                                        Place Order <ChevronRight size={18} />
                                    </button>

                                    <p className="text-center text-[10px] font-semibold text-gray-400 uppercase  mt-4">
                                        30 Days Easy Returns & Exchanges
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Action Bar */}
             {/* Mobile Bottom Action Bar - Shifted up to avoid overlap with BottomNav */}
             <div className="lg:hidden fixed bottom-16 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 py-4 z-50 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase ">Total to Pay</p>
                    <p className="text-xl font-bold text-gray-900 ">₹{getCartTotal()}</p>
                </div>
                 <button
                    onClick={() => navigate('/checkout')}
                    className="px-10 py-4 bg-black text-white text-[12px] font-bold uppercase  rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center justify-center min-w-[160px]"
                >
                    Checkout <ChevronRight className="inline-block ml-2 w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default CartPage;
