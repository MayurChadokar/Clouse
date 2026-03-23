import { FiHeart, FiShoppingBag, FiStar, FiTrash2, FiPlus, FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore, useUIStore } from "../store/useStore";
import { useWishlistStore } from "../store/wishlistStore";
import { formatPrice, getPlaceholderImage } from "../utils/helpers";
import toast from "react-hot-toast";
import LazyImage from "./LazyImage";
import { useState, useRef } from "react";
import useLongPress from "../../modules/user/hooks/useLongPress";
import LongPressMenu from "../../modules/user/components/Mobile/LongPressMenu";
import FlyingItem from "../../modules/user/components/Mobile/FlyingItem";
import { getVariantSignature } from "../utils/variant";

const ProductCard = ({ product, hideRating = false, isFlashSale = false }) => {
  const navigate = useNavigate();
  const productLink = `/product/${product.id}`;
  const { items, addItem, removeItem } = useCartStore();
  const triggerCartAnimation = useUIStore((state) => state.triggerCartAnimation);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  
  const isFavorite = isInWishlist(product.id);
  const [isAdding, setIsAdding] = useState(false);
  const [showLongPressMenu, setShowLongPressMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showFlyingItem, setShowFlyingItem] = useState(false);
  const [flyingItemPos, setFlyingItemPos] = useState({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } });
  
  const buttonRef = useRef(null);
  const hasNoVariant = (cartItem) => !getVariantSignature(cartItem?.variant || {});
  const isInCart = items.some((item) => item.id === product.id && hasNoVariant(item));

  const handleAddToCart = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    
    // Check for variants
    const hasVariants = 
      (Array.isArray(product?.variants?.attributes) && product.variants.attributes.length > 0) || 
      (Array.isArray(product?.variants?.sizes) && product.variants.sizes.length > 0) || 
      (Array.isArray(product?.variants?.colors) && product.variants.colors.length > 0);

    if (hasVariants) {
      toast.error("Please select options on product page");
      navigate(productLink);
      return;
    }

    setIsAdding(true);
    const buttonRect = buttonRef.current?.getBoundingClientRect();
    const startX = buttonRect ? buttonRect.left + buttonRect.width / 2 : 0;
    const startY = buttonRect ? buttonRect.top + buttonRect.height / 2 : 0;

    setTimeout(() => {
      const cartBar = document.querySelector("[data-cart-bar]");
      let endX = window.innerWidth / 2;
      let endY = window.innerHeight - 100;
      if (cartBar) {
        const cartRect = cartBar.getBoundingClientRect();
        endX = cartRect.left + cartRect.width / 2;
        endY = cartRect.top + cartRect.height / 2;
      }
      setFlyingItemPos({ start: { x: startX, y: startY }, end: { x: endX, y: endY } });
      setShowFlyingItem(true);
    }, 50);

    setTimeout(() => setIsAdding(false), 600);

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      stockQuantity: product.stockQuantity,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
    });
    triggerCartAnimation();
    toast.success("Added to cart!");
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    if (isFavorite) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({ id: product.id, name: product.name, price: product.price, image: product.image });
      toast.success("Added to wishlist");
    }
  };

  const handleLongPress = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setShowLongPressMenu(true);
  };

  const longPressHandlers = useLongPress(handleLongPress, 500);

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="flex flex-col w-full h-full group relative bg-white"
        {...longPressHandlers}
      >
        {/* IMAGE AREA - Taller 3:4 ratio with matching rounded corners */}
        <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-xl bg-[#F8F8F8]">
          <Link to={productLink} className="block w-full h-full">
            <LazyImage
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { e.target.src = getPlaceholderImage(400, 533, "Product"); }}
            />
          </Link>

          {/* Quick Add Overlay (from Image 1 style) - Premium Glassmorphism */}
          <div className="absolute inset-x-0 bottom-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 hidden md:block">
            <button
               ref={buttonRef}
               onClick={handleAddToCart}
               className="w-full bg-black/90 backdrop-blur-md text-white py-2.5 rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
               {isAdding ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><FiShoppingBag className="text-sm" /></motion.div> : "Quick Add"}
               {!isAdding && <FiPlus className="text-sm" />}
            </button>
          </div>

          {/* Mobile Cart Button (Compact) */}
          <button
            ref={buttonRef}
            onClick={handleAddToCart}
            className="md:hidden absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center text-black active:scale-90 transition-all z-10 border border-gray-100"
          >
            {isAdding ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><FiShoppingBag className="text-[10px]" /></motion.div> : <FiPlus className="text-[11px]" />}
          </button>

          {/* Wishlist Icon */}
          <button
            onClick={handleFavorite}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center text-gray-800 shadow-sm transition-all hover:bg-white hover:text-red-500 z-10"
          >
            <FiHeart size={12} className={`${isFavorite ? 'fill-current text-red-500' : ''}`} />
          </button>
        </div>

        {/* INFO AREA - Matching Image 2 Typography */}
        <div className="pt-3 pb-1 flex flex-col">
          <Link to={productLink} className="flex flex-col gap-0.5">
            <span className="text-[#1A1A1A] text-[10px] md:text-[14px] font-black uppercase tracking-tight line-clamp-1">
              {product.brandName || product.vendorName || "Premium"}
            </span>
            <h3 className="text-gray-500 text-[9px] md:text-[13px] font-medium line-clamp-1 leading-tight">
              {product.name}
            </h3>
          </Link>
          
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
             <div className="flex items-center gap-1.5">
                <span className="text-gray-900 text-[11px] md:text-[14px] font-bold">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-gray-400 text-[10px] md:text-[13px] line-through font-medium">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
             </div>
             
             {product.originalPrice && product.originalPrice > product.price && (
                <div className="bg-[#D8FFBD] text-[#388E3C] text-[8px] md:text-[11px] font-bold px-1.5 md:px-2 py-0.5 rounded-sm">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </div>
             )}
          </div>
        </div>
      </motion.div>

      <LongPressMenu
        isOpen={showLongPressMenu}
        onClose={() => setShowLongPressMenu(false)}
        position={menuPosition}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleFavorite}
        onShare={() => {}}
        isInWishlist={isFavorite}
      />

      {showFlyingItem && (
        <FlyingItem
          image={product.image}
          startPosition={flyingItemPos.start}
          endPosition={flyingItemPos.end}
          onComplete={() => setShowFlyingItem(false)}
        />
      )}
    </>
  );
};

export default ProductCard;
