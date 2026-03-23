import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CategoryContext = createContext();

export const categoryColors = {
    'For You': '#e91e63',
    'Women': '#FF1F8E',
    'Men': '#00A3FF',
    'Kids': '#00D1FF',
    'T-Shirts': '#4caf50',
    'Jeans': '#673ab7',
    'Beauty': '#FF2EDC',
    'Accessories': '#FFB000',
    'Footwear': '#FF9800',
    'Home': '#795548',
    'Offers': '#f44336',
    'Shirts': '#009688',
    'Sweaters': '#607d8b',
    'Jackets': '#3f51b5',
    'Hoodies': '#ff5722'
};

export const categoryGradients = {
    'For You': 'linear-gradient(135deg, #FFB3CC 0%, #FFF5F8 100%)',
    'Women': 'linear-gradient(135deg, #FFB3D1 0%, #FFF0F6 100%)',
    'Men': 'linear-gradient(135deg, #B3D7FF 0%, #F0F7FF 100%)',
    'Kids': 'linear-gradient(135deg, #B2EBF2 0%, #E0F7FA 100%)',
    'Beauty': 'linear-gradient(135deg, #E1BEE7 0%, #F3E5F5 100%)',
    'Accessories': 'linear-gradient(135deg, #FFE082 0%, #FFF8E1 100%)',
    'Default': 'linear-gradient(135deg, #E9ECEF 0%, #F8F9FA 100%)'
};

export const CategoryProvider = ({ children }) => {
    const [activeCategory, setActiveCategory] = useState('For You');
    const [activeSubCategory, setActiveSubCategory] = useState('All');

    // Overriding the setter to reset subcategory to All when root category changes
    const setCategoryWithReset = useCallback((newCategory) => {
        setActiveCategory(newCategory);
        setActiveSubCategory('All');
    }, []);

    const getCategoryColor = useCallback((name) => {
        if (!name) return categoryColors['For You'];

        // Case-insensitive lookup
        const entry = Object.entries(categoryColors).find(
            ([key]) => key.toLowerCase() === name.toLowerCase() ||
                name.toLowerCase().includes(key.toLowerCase())
        );

        return entry ? entry[1] : categoryColors['For You'];
    }, []);

    const getCategoryGradient = useCallback((name) => {
        if (!name) return categoryGradients['For You'];
        const entry = Object.entries(categoryGradients).find(
            ([key]) => key.toLowerCase() === name.toLowerCase() ||
                name.toLowerCase().includes(key.toLowerCase())
        );
        return entry ? entry[1] : categoryGradients['Default'];
    }, []);

    const value = useMemo(() => ({
        activeCategory,
        setActiveCategory: setCategoryWithReset,
        activeSubCategory,
        setActiveSubCategory,
        getCategoryColor,
        getCategoryGradient,
        categoryColors,
        categoryGradients
    }), [activeCategory, setCategoryWithReset, activeSubCategory, getCategoryColor, getCategoryGradient]);

    return (
        <CategoryContext.Provider value={value}>
            {children}
        </CategoryContext.Provider>
    );
};

export const useCategory = () => {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategory must be used within a CategoryProvider');
    }
    return context;
};
