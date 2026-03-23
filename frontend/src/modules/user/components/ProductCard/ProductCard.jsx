import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCategory } from '../../context/CategoryContext';
import LoginModal from '../Modals/LoginModal';
import { useState } from 'react';

const ProductCard = ({ product }) => {
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { activeCategory } = useCategory();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const getCardTheme = (categoryName) => {
        const name = categoryName?.toLowerCase() || '';
        // Returning a custom border/glow class instead of a full background replacement
        // The card itself will stay dark `#1a1a1a`, but we'll inject these classes
        if (name === 'hello' || name === 'women') return 'border-t-[3px] border-t-[#E91E63] shadow-[0_-5px_20px_rgba(233,30,99,0.1)]';
        if (name === 'men\'s fashion' || name === 'mens' || name === 'men') return 'border-t-[3px] border-t-[#0288D1] shadow-[0_-5px_20px_rgba(2,136,209,0.1)]';
        if (name === 'bottom wear') return 'border-t-[3px] border-t-[#689F38] shadow-[0_-5px_20px_rgba(104,159,56,0.1)]';
        if (name === 'beauty') return 'border-t-[3px] border-t-[#D81B60] shadow-[0_-5px_20px_rgba(216,27,96,0.1)]';
        if (name === 'accessories') return 'border-t-[3px] border-t-[#FFB300] shadow-[0_-5px_20px_rgba(255,179,0,0.1)]';
        return 'border-t-[3px] border-t-transparent';
    };

    const cardTheme = getCardTheme(activeCategory);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log("ProductCard: Add to Cart clicked. User:", user);

        if (!user) {
            console.log("ProductCard: User null. Opening LoginModal.");
            setIsLoginModalOpen(true);
            return;
        }

        addToCart({ ...product, selectedSize: product.size ? product.size[0] : 'M' });
    };

    return (
        <>
            <div className="group relative w-full h-full flex flex-col bg-white overflow-hidden transition-all duration-300">
                <Link
                    to={`/product/${product.id}`}
                    className="flex flex-col group no-underline text-inherit h-full"
                >
                    {/* Image Container - Compact ratio */}
                    <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-[#F5F5F5] group-hover:rounded-xl transition-all duration-500">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />

                        {/* Top Right Actions (Wishlist) - Glassmorphism */}
                        <div className="absolute top-2 right-2 z-10 transition-all duration-500">
                            <button
                                className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-75 ${isInWishlist(product.id) ? 'bg-white shadow-md text-red-500' : 'bg-white/70 text-gray-900 border border-gray-100'}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleWishlist(product);
                                }}
                            >
                                <Heart size={11} className={`${isInWishlist(product.id) ? 'fill-red-500' : ''}`} />
                            </button>
                        </div>

                        {/* Quick Add to Cart (Desktop Hover Slider - Image 1 concept in Image 2 style) */}
                        <div className="absolute bottom-0 left-0 right-0 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 md:block hidden">
                            <button
                                className="w-full py-2.5 bg-black/90 backdrop-blur-md text-white font-bold text-[11px] hover:bg-black transition-all flex items-center justify-center gap-2"
                                onClick={handleAddToCart}
                            >
                                QUICK ADD <ShoppingCart size={14} />
                            </button>
                        </div>

                        {/* Mobile Cart Button (Always Visible) */}
                        <div className="absolute bottom-2 right-2 z-10 md:hidden">
                            <button
                                className="w-6 h-6 rounded-full bg-white shadow-lg border border-gray-100 text-black flex items-center justify-center active:scale-95 transition-all"
                                onClick={handleAddToCart}
                            >
                                <ShoppingCart size={10} />
                            </button>
                        </div>

                        {/* Discount Badge on Image? Image 2 shows it below, but we can have it here too if needed. 
                            Actually Image 2 has it next to price. Let's keep it there. */}
                    </div>

                    {/* Content Area - Matching Image 2 Minimalist Style */}
                    <div className="pt-2.5 pb-1.5 flex flex-col flex-1 items-start text-left">
                        <h3 className="text-[12px] md:text-[13px] font-black text-gray-900 uppercase tracking-tight mb-0.5 truncate w-full">
                            {product.brand || 'Premium'}
                        </h3>

                        <p className="text-[11px] md:text-[12px] font-medium text-gray-500 line-clamp-1 mb-1 w-full">
                            {product.name}
                        </p>

                        <div className="mt-auto flex flex-wrap items-center gap-2 w-full">
                            <div className="flex items-center gap-1">
                                <span className="text-[12px] md:text-[13px] font-bold text-gray-900">
                                    ₹{product.discountedPrice || product.price}
                                </span>
                                {product.originalPrice && product.originalPrice > (product.discountedPrice || product.price) && (
                                    <span className="text-[11px] text-gray-400 line-through font-medium">
                                        ₹{product.originalPrice}
                                    </span>
                                )}
                            </div>
                            
                            {product.originalPrice && product.originalPrice > (product.discountedPrice || product.price) && (
                                <div className="bg-[#D8FFBD] text-[#388E3C] text-[11px] font-bold px-1.5 py-0.5 rounded-sm">
                                    {Math.round(((product.originalPrice - (product.discountedPrice || product.price)) / product.originalPrice) * 100)}% OFF
                                </div>
                            )}
                        </div>
                    </div>
                </Link>
            </div>

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
        </>
    );
};

export default ProductCard;
