import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCategoryStore } from '../../../../shared/store/categoryStore';
import { useCategory } from '../../context/CategoryContext';

const CategoryBar = () => {
    const { categories, initialize } = useCategoryStore();
    const { activeCategory, setActiveCategory, getCategoryGradient } = useCategory();
    const location = useLocation();
    const navigate = useNavigate();
    const scrollRef = useRef(null);

    useEffect(() => {
        initialize();
    }, [initialize]);

    const rootCategories = categories.filter(cat => !cat.parentId && cat.isActive !== false);

    const handleCategoryClick = (cat) => {
        setActiveCategory(cat.name);
        
        // If on Home page, scroll to product grid
        if (location.pathname === '/' || location.pathname === '/home') {
            setTimeout(() => {
                const grid = document.getElementById('product-grid');
                if (grid) {
                    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 50);
        } else if (location.pathname !== '/categories') {
            // If not on categories page or home, redirect to categories or shop
            // The user wants home page functionality to show products.
            // But if they are on another page, we might want to go to shop/categories.
            navigate('/categories');
        }
    };

    const currentGradient = getCategoryGradient(activeCategory);

    return (
        <motion.div
            initial={false}
            animate={{ background: currentGradient }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="w-full pb-3 pt-2 border-b border-gray-100"
        >
            <div 
                ref={scrollRef}
                className="flex overflow-x-auto scrollbar-hide gap-6 md:gap-10 px-4 md:px-8 py-3 items-center"
            >
                {rootCategories.map((cat) => {
                    const isSelected = activeCategory === cat.name;
                    return (
                        <button
                            key={cat._id || cat.id}
                            onClick={() => handleCategoryClick(cat)}
                            className="flex flex-col items-center flex-shrink-0 group transition-all"
                        >
                            <div className={`w-16 h-16 md:w-16 md:h-16 rounded-full p-[3px] transition-all duration-300 ${isSelected ? 'bg-red-500' : 'bg-transparent'}`}>
                                <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center p-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                    <img
                                        src={cat.image || "https://via.placeholder.com/150"}
                                        alt={cat.name}
                                        className={`w-full h-full object-cover rounded-full transition-transform duration-500 ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=' + cat.name }}
                                    />
                                </div>
                            </div>
                            <span className={`text-[11px] md:text-[12px] mt-2 font-semibold transition-all ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                                {cat.name}
                            </span>
                        </button>
                    );
                })}
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </motion.div>
    );
};

export default CategoryBar;
