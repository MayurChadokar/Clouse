import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSearch, FiGrid, FiHeart, FiHome, FiChevronRight, FiCompass } from "react-icons/fi";
import { categories as fallbackCategories } from "../../../data/categories";
import { useCategoryStore } from "../../../shared/store/categoryStore";
import PageTransition from "../../../shared/components/PageTransition";
import ProductCard from "../../../shared/components/ProductCard";
import api from "../../../shared/utils/api";

// Robust ID normalization
const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === "object") return String(value?._id || value?.id || "").trim();
  return String(value).trim();
};

const MobileCategories = () => {
  const navigate = useNavigate();
  const { categories: allCategoriesInStore, initialize } = useCategoryStore();
  
  // State for 3-level navigation
  const [selectedRootId, setSelectedRootId] = useState(null);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [drillDownId, setDrillDownId] = useState(null); // For showing products of a grand-subcategory
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryProductsFeed, setCategoryProductsFeed] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const gridRef = useRef(null);

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

  // Auto-select first root
  useEffect(() => {
    if (rootCategories.length > 0 && !selectedRootId) {
      setSelectedRootId(rootCategories[0].normId);
    }
  }, [rootCategories, selectedRootId]);

  // 3. Subcategories (Level 1) - Linked to selected Root (Vertical Sidebar)
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

  // 4. Grand-subcategories (Level 2) - Linked to selected Sub (Main Grid)
  const grandSubcategories = useMemo(() => {
    if (!selectedSubId) return [];
    return allCategories.filter(cat => cat.normParentId === selectedSubId && cat.isActive !== false);
  }, [selectedSubId, allCategories]);

  // Handlers
  const handleRootSelect = (id) => {
    setSelectedRootId(id);
    setSelectedSubId(null);
    setDrillDownId(null);
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

  // 5. Product Fetching Logic
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
      <div className="flex flex-col w-full bg-white min-h-screen overflow-hidden">
          
          {/* HEADER: Matching Slikk App EXACTLY */}
          <div className="sticky top-0 z-40 bg-white">
            {/* Removed Gradient Backdrop for Pure White UI */}
            <div className="h-20 w-full absolute top-0 left-0 bg-white -z-10" />
            
            <div className="pt-4 pb-4 px-4">

              {/* Horizontal Root Categories (Level 0) */}
              <div className="flex gap-6 overflow-x-auto scrollbar-hide px-1">
                {rootCategories.map((cat) => {
                  const isActive = cat.normId === selectedRootId;
                  return (
                    <button
                      key={cat.normId}
                      onClick={() => handleRootSelect(cat.normId)}
                      className="flex flex-col items-center flex-shrink-0 group"
                    >
                      <div className={`w-16 h-16 rounded-full p-0.5 transition-all duration-300 ${isActive ? 'bg-[#FF5722]' : 'bg-transparent'}`}>
                        <div className="w-full h-full rounded-full overflow-hidden bg-white border border-gray-100 flex items-center justify-center">
                          <img
                            src={cat.image || "https://via.placeholder.com/150"}
                            alt={cat.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                      </div>
                      <span className={`text-[12px] mt-2 font-bold ${isActive ? 'text-gray-900' : 'text-gray-500 opacity-80'}`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 240px)" }}>
            
            {/* SIDEBAR: Vertical Subcategories (Level 1) */}
            <div className="w-24 md:w-28 bg-white overflow-y-auto scrollbar-hide flex flex-col border-r border-gray-100 pb-32">
              {subcategories.map((sub) => {
                const isActive = sub.normId === selectedSubId;
                return (
                  <button
                    key={sub.normId}
                    onClick={() => handleSubSelect(sub.normId)}
                    className={`w-full py-5 flex flex-col items-center gap-2 transition-all relative ${isActive ? 'bg-white shadow-sm ring-1 ring-gray-100' : 'bg-transparent'}`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#FF5722] rounded-r-full" />
                    )}
                    <div className={`w-14 h-14 rounded-2xl overflow-hidden transition-all duration-300 ${isActive ? 'scale-105 shadow-sm' : 'opacity-80'}`}>
                      <img
                        src={sub.image || "https://via.placeholder.com/150"}
                        alt={sub.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    </div>
                    <span className={`text-[11px] font-bold text-center leading-tight px-2 transition-colors ${isActive ? 'text-[#FF5722]' : 'text-gray-900'}`}>
                      {sub.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* MAIN AREA: Grid of Grand-subcategories (Level 2) or Products */}
            <div 
              ref={gridRef}
              className="flex-1 overflow-y-auto bg-white p-4 pb-48"
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
                      className="flex items-center gap-1 text-[11px] font-bold text-[#FF5722] uppercase mb-4 transition-transform active:scale-95"
                    >
                      <FiArrowLeft className="text-sm" /> All {subcategories.find(s => s.normId === selectedSubId)?.name}
                    </button>
                    
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                      {filteredProducts.map((p) => (
                        <div key={p.id}>
                          <ProductCard product={p} />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  // Category Icons Grid (Exactly like Slikk App)
                  <motion.div
                    key="categories"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {grandSubcategories.length > 0 ? (
                      <div className="grid grid-cols-3 gap-y-6 gap-x-2">
                        {grandSubcategories.map((grand) => (
                          <button
                            key={grand.normId}
                            onClick={() => handleGrandSubSelect(grand.normId)}
                            className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                          >
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-[24px] overflow-hidden p-1.5 flex items-center justify-center border border-gray-100 shadow-sm transition-all group-hover:bg-white hover:text-black">
                              <img
                                src={grand.image || "https://via.placeholder.com/150"}
                                alt={grand.name}
                                className="w-full h-full object-contain mix-blend-multiply"
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 text-center leading-tight max-w-[70px]">
                              {grand.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
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
