import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSearch, FiChevronRight } from "react-icons/fi";
import { categories as fallbackCategories } from "../../../data/categories";
import { useCategoryStore } from "../../../shared/store/categoryStore";
import PageTransition from "../../../shared/components/PageTransition";
import ProductCard from "../../../shared/components/ProductCard";
import api from "../../../shared/utils/api";
import { useCategory } from "../../user/context/CategoryContext";

// Robust ID normalization
const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === "object") return String(value?._id || value?.id || "").trim();
  return String(value).trim();
};

const MobileCategories = () => {
  const navigate = useNavigate();
  const { categoryId: paramCategoryId } = useParams();
  const { categories: allCategoriesInStore, initialize } = useCategoryStore();
  const { activeCategory, setActiveCategory } = useCategory();
  
  // State for 3-level navigation
  const [selectedRootId, setSelectedRootId] = useState(null);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [drillDownId, setDrillDownId] = useState(null); // For showing products of a grand-subcategory
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryProductsFeed, setCategoryProductsFeed] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const gridRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 1. Process all categories to ensure normalized structure
  const allCategories = useMemo(() => {
    return allCategoriesInStore.map(cat => ({
      ...cat,
      normId: normalizeId(cat.id || cat._id),
      normParentId: normalizeId(cat.parentId)
    }));
  }, [allCategoriesInStore]);

  // 2. Filter Root Categories (Level 0)
  const rootCategories = useMemo(() => {
    const roots = allCategories.filter(cat => !cat.normParentId && cat.isActive !== false);
    if (roots.length === 0) return fallbackCategories.map(c => ({ ...c, normId: String(c.id) }));
    return roots;
  }, [allCategories]);

  // 3. Handle Initial Selection (from params or context)
  useEffect(() => {
    if (rootCategories.length > 0) {
      if (paramCategoryId) {
        setSelectedRootId(normalizeId(paramCategoryId));
      } else if (activeCategory && activeCategory !== 'For You') {
        const matched = rootCategories.find(c => c.name.toLowerCase() === activeCategory.toLowerCase());
        if (matched) setSelectedRootId(matched.normId);
      } else if (!selectedRootId) {
        setSelectedRootId(rootCategories[0].normId);
      }
    }
  }, [rootCategories, paramCategoryId, activeCategory]);

  // 4. Subcategories (Level 1) - Linked to selected Root
  const subcategories = useMemo(() => {
    if (!selectedRootId) return [];
    return allCategories.filter(cat => cat.normParentId === selectedRootId && cat.isActive !== false);
  }, [selectedRootId, allCategories]);

  // Auto-select first subcategory when root changes
  useEffect(() => {
    if (subcategories.length > 0 && !selectedSubId) {
      setSelectedSubId(subcategories[0].normId);
    }
  }, [subcategories, selectedSubId]);

  // 5. Grand-subcategories (Level 2) - Linked to selected Sub
  const grandSubcategories = useMemo(() => {
    if (!selectedSubId) return [];
    return allCategories.filter(cat => cat.normParentId === selectedSubId && cat.isActive !== false);
  }, [selectedSubId, allCategories]);

  // Handlers
  const handleRootSelect = (cat) => {
    const id = cat.normId;
    setSelectedRootId(id);
    setSelectedSubId(null);
    setDrillDownId(null);
    setActiveCategory(cat.name);
  };

  const handleSubSelect = (id) => {
    setSelectedSubId(id);
    setDrillDownId(null);
    if (gridRef.current) gridRef.current.scrollTop = 0;
  };

  const handleGrandSubSelect = (id) => {
    setDrillDownId(id);
    if (gridRef.current) gridRef.current.scrollTop = 0;
  };

  // 6. Product Fetching Logic
  useEffect(() => {
    const fetchProducts = async () => {
      const targetId = drillDownId || (grandSubcategories.length === 0 ? selectedSubId : null);
      if (!targetId) return;

      setIsLoadingProducts(true);
      try {
        const response = await api.get("/products", {
          params: { category: targetId, limit: 100 }
        });
        const products = Array.isArray(response?.data?.products) ? response.data.products : [];
        const normalized = products.map(raw => ({
          ...raw,
          id: raw.id || raw._id,
          price: Number(raw.price) || 0,
          image: raw.image || raw.images?.[0] || "",
          brandName: raw.brand?.name || raw.vendor?.storeName || "Premium"
        }));
        setCategoryProductsFeed(normalized);
      } catch (error) {
        console.error("Error fetching products:", error);
        setCategoryProductsFeed([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [drillDownId, selectedSubId, grandSubcategories.length]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return categoryProductsFeed;
    return categoryProductsFeed.filter(p => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categoryProductsFeed, searchQuery]);

  return (
    <PageTransition>
      <div className="flex flex-col w-full bg-white h-screen overflow-hidden">
        
        <div className="flex flex-1 overflow-hidden">
          
          {/* SIDEBAR: Vertical Subcategories (Level 1) */}
          <div className="w-22 bg-[#F8F9FA] overflow-y-auto scrollbar-hide flex flex-col border-r border-gray-100 pb-32 pt-1">
            {subcategories.map((sub) => {
              const isActive = sub.normId === selectedSubId;
              return (
                <button
                  key={sub.normId}
                  onClick={() => handleSubSelect(sub.normId)}
                  className={`w-full py-4 flex flex-col items-center gap-2 transition-all relative ${isActive ? 'bg-white' : 'bg-transparent'}`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-[#FF5722] rounded-r-full" />
                  )}
                  <div className={`w-12 h-12 rounded-2xl overflow-hidden transition-all duration-300 ${isActive ? 'scale-105' : 'opacity-80'}`}>
                    <img
                      src={sub.image || "https://via.placeholder.com/150"}
                      alt={sub.name}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                  <span className={`text-[9.5px] font-bold text-center leading-tight px-2 transition-colors ${isActive ? 'text-[#FF5722]' : 'text-gray-600'}`}>
                    {sub.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* MAIN AREA: Grid of Grand-subcategories (Level 2) or Products */}
          <div 
            ref={gridRef}
            className="flex-1 overflow-y-auto bg-white p-3 pb-40"
          >
            <AnimatePresence mode="wait">
              {drillDownId ? (
                // Product Grid View
                <motion.div
                  key="products"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <button 
                    onClick={() => setDrillDownId(null)}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#FF5722] uppercase mb-4 active:scale-95"
                  >
                    <FiArrowLeft className="text-sm" /> All Items
                  </button>
                  
                   <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                    {filteredProducts.map((p) => (
                      <div key={p.id}>
                        <ProductCard product={p} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                // Category Icons Grid (3 Columns logic)
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="mb-4">
                    <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-wider">
                      Shop for {subcategories.find(s => s.normId === selectedSubId)?.name}
                    </h2>
                  </div>

                  {grandSubcategories.length > 0 ? (
                    <div className="grid grid-cols-3 gap-y-6 gap-x-2">
                      {grandSubcategories.map((grand) => (
                        <button
                          key={grand.normId}
                          onClick={() => handleGrandSubSelect(grand.normId)}
                          className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                        >
                          <div className="w-16 h-16 bg-white rounded-[20px] overflow-hidden p-1 flex items-center justify-center border border-gray-100 shadow-sm transition-all group-hover:border-[#FF5722]">
                            <img
                              src={grand.image || "https://via.placeholder.com/150"}
                              alt={grand.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-[9.5px] font-bold text-gray-700 text-center leading-tight max-w-[75px]">
                            {grand.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                     <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                      {filteredProducts.map((p) => (
                        <div key={p.id}>
                          <ProductCard product={p} />
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default MobileCategories;
