import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBannerStore } from '../../../../shared/store/bannerStore';
import { useCategory } from '../../context/CategoryContext';

const HeroSection = () => {
    const navigate = useNavigate();
    const { banners, initialize } = useBannerStore();
    const { activeCategory, activeSubCategory, isSubcategoryMode } = useCategory();
    const [currentSlide, setCurrentSlide] = useState(0);
    const scrollRef = useRef(null);
    const [mobileSlide, setMobileSlide] = useState(0);
    const totalMobileSlides = 4; // SS24 + Luxe + New Arrivals + Trending

    useEffect(() => {
        initialize();
    }, [initialize]);

    // Filter active hero/home_slider banners
    const dbBanners = banners.filter(b =>
        (b.isActive !== false) &&
        (['hero', 'home_slider', 'banner'].includes(b.type))
    );

    // Fallback Banners if DB is empty
    const fallbackBanners = [
        {
            id: 'fallback-1',
            title: "The SS24 Collection",
            subtitle: "Discover the new season's most coveted pieces, crafted with uncompromising attention to luxury and detail.",
            image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2070",
            cta: "Shop Now",
            link: "/shop"
        }
    ];

    const activeBanners = dbBanners.length > 0 ? dbBanners : fallbackBanners;

    // Side Banner Logic
    const dbSideBanners = banners.filter(b =>
        (b.isActive !== false) &&
        (b.type === 'side_banner')
    ).sort((a, b) => (a.order || 0) - (b.order || 0));

    const fallbackSideBanner = {
        title: "Luxe Essentials",
        subtitle: "Wardrobe Staples",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000",
        link: "/shop"
    };

    const sideBanner = dbSideBanners[0] || fallbackSideBanner;

    useEffect(() => {
        if (activeBanners.length > 1) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [activeBanners.length]);

    // Mobile auto-scroll
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        
        const timer = setInterval(() => {
            setMobileSlide(prev => {
                const next = (prev + 1) % totalMobileSlides;
                const scrollWidth = container.scrollWidth / totalMobileSlides;
                container.scrollTo({ left: scrollWidth * next, behavior: 'smooth' });
                return next;
            });
        }, 4000);
        return () => clearInterval(timer);
    }, [totalMobileSlides]);

    const getHeroTheme = (categoryName) => {
        const name = categoryName?.toLowerCase() || '';
        if (name === 'hello' || name === 'women') return 'from-[#FF4081]/20 to-[#FAFAFA]';
        if (name === 'men\'s fashion' || name === 'mens' || name === 'men') return 'from-[#4FC3F7]/20 to-[#FAFAFA]';
        return 'from-gray-100 to-[#FAFAFA]';
    };

    const currentHeroBg = isSubcategoryMode ? getHeroTheme(activeSubCategory) : getHeroTheme(activeCategory);

    return (
        <section className={`w-full bg-gradient-to-b ${currentHeroBg} md:px-4 lg:px-8 py-0 md:py-4 font-sans transition-colors duration-500`}>
            <div className="max-w-[1400px] mx-auto">
                <div ref={scrollRef} className="flex md:grid overflow-x-auto snap-x snap-mandatory no-scrollbar md:grid-cols-2 lg:grid-cols-4 gap-0 md:gap-5 -mx-4 md:mx-0">
                    {/* Main Slider (1/4) - Mobile Snap Card */}
                    <div className="flex-shrink-0 w-full snap-center relative h-[300px] lg:h-[350px] overflow-hidden rounded-none md:rounded-2xl shadow-none md:shadow-xl">
                        <div className="w-full h-full relative">
                            {activeBanners.map((banner, index) => (
                                <div
                                    key={banner.id}
                                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                >
                                    <div
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${banner.image})` }}
                                    />
                                    <div className="absolute inset-0 bg-black/40" />

                                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-5">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-white tracking-widest uppercase opacity-70">The Edit</span>
                                            <h2 className="text-2xl md:text-2xl font-black text-white leading-tight">
                                                {banner.title.includes("SS24") ? "SS24 Edit" : banner.title}
                                            </h2>
                                            <button 
                                                onClick={() => navigate(banner.link)}
                                                className="bg-white text-black py-3 px-6 rounded-lg font-black text-[11px] uppercase hover:bg-black hover:text-white transition-all shadow-lg w-full md:w-auto"
                                            >
                                                Shop Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Side Banner 1 - Mobile Snap Card */}
                    <div
                        className="flex-shrink-0 w-full snap-center flex flex-col h-[300px] lg:h-[350px] rounded-none md:rounded-2xl overflow-hidden relative group cursor-pointer shadow-none md:shadow-xl"
                        onClick={() => navigate(sideBanner.link)}
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110"
                            style={{ backgroundImage: `url(${sideBanner.image})` }}
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
                            <h3 className="text-white text-3xl md:text-2xl font-black uppercase tracking-tight leading-none mb-3 shadow-sm">
                                {sideBanner.title}
                            </h3>
                            <p className="text-black font-black text-[10px] uppercase tracking-widest bg-white/90 px-4 py-1.5 rounded-full">
                                {sideBanner.subtitle}
                            </p>
                        </div>
                        <div className="absolute inset-x-0 bottom-6 px-6 translate-y-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-500 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                            <div className="bg-white text-black py-3 rounded-xl font-black text-center text-[10px] shadow-xl md:hidden">
                                Discover More
                            </div>
                        </div>
                    </div>

                    {/* Side Banner 2 (Seed) - Mobile Snap Card */}
                    <div
                        className="flex-shrink-0 w-full snap-center flex flex-col h-[300px] lg:h-[350px] rounded-none md:rounded-2xl overflow-hidden relative group cursor-pointer shadow-none md:shadow-xl"
                        onClick={() => navigate('/shop')}
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110"
                            style={{ backgroundImage: `url(https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1000)` }}
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
                            <h3 className="text-white text-3xl md:text-2xl font-black uppercase tracking-tight leading-none mb-3">
                                New<br/>Arrivals
                            </h3>
                            <p className="text-black font-black text-[10px] uppercase tracking-widest bg-white/90 px-4 py-1.5 rounded-full">
                                Fresh Drops
                            </p>
                        </div>
                        <div className="absolute inset-x-0 bottom-6 px-6 md:hidden">
                            <div className="bg-white text-black py-3 rounded-xl font-black text-center text-[10px] shadow-xl">
                                Shop All
                            </div>
                        </div>
                    </div>

                    {/* Side Banner 3 (Seed) - Mobile Snap Card */}
                    <div
                        className="flex-shrink-0 w-full snap-center flex flex-col h-[300px] lg:h-[350px] rounded-none md:rounded-2xl overflow-hidden relative group cursor-pointer shadow-none md:shadow-xl"
                        onClick={() => navigate('/shop')}
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110"
                            style={{ backgroundImage: `url(https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=1000)` }}
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
                            <h3 className="text-white text-3xl md:text-2xl font-black uppercase tracking-tight leading-none mb-3">
                                Trending<br/>Now
                            </h3>
                            <p className="text-black font-black text-[10px] uppercase tracking-widest bg-white/90 px-4 py-1.5 rounded-full">
                                High Demand
                            </p>
                        </div>
                        <div className="absolute inset-x-0 bottom-6 px-6 md:hidden">
                            <div className="bg-white text-black py-3 rounded-xl font-black text-center text-[10px] shadow-xl">
                                Explore
                            </div>
                        </div>
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}} />
            </div>
        </section>
    );
};

export default HeroSection;
