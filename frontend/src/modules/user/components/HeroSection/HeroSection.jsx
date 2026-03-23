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

                                    <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-5 z-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[9px] font-bold text-white tracking-widest uppercase opacity-70">The Edit</span>
                                            <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                                                {banner.title.includes("SS24") ? "SS24 Edit" : banner.title}
                                            </h2>
                                            <div className="flex items-center gap-3 mt-1">
                                                <button
                                                    onClick={() => navigate(banner.link)}
                                                    className="bg-white text-black py-2.5 px-5 rounded-xl font-black text-[10px] uppercase hover:bg-black hover:text-white transition-all shadow-lg active:scale-95"
                                                >
                                                    Shop Now
                                                </button>
                                            </div>
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

                        <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-3 z-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                            <h3 className="text-white text-xl md:text-2xl font-black uppercase tracking-tight leading-none">
                                {sideBanner.title}
                            </h3>
                            <div className="flex items-center flex-wrap gap-2">
                                <p className="text-black font-black text-[9px] uppercase tracking-widest bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                                    {sideBanner.subtitle}
                                </p>
                                <button className="bg-white text-black py-2 px-4 rounded-xl font-black text-[9px] uppercase shadow-xl border border-black/5 hover:bg-black hover:text-white transition-all active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                    Discover
                                </button>
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

                        <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-3 z-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                            <h3 className="text-white text-xl md:text-2xl font-black uppercase tracking-tight leading-none">
                                New Arrivals
                            </h3>
                            <div className="flex items-center flex-wrap gap-2">
                                <p className="text-black font-black text-[9px] uppercase tracking-widest bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                                     Fresh Drops
                                 </p>
                                <button className="bg-white text-black py-2 px-4 rounded-xl font-black text-[9px] uppercase shadow-xl border border-black/5 hover:bg-black hover:text-white transition-all active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                    Shop All
                                </button>
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

                        <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-3 z-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                            <h3 className="text-white text-xl md:text-2xl font-black uppercase tracking-tight leading-none">
                                Trending Now
                            </h3>
                            <div className="flex items-center flex-wrap gap-2">
                                <p className="text-black font-black text-[9px] uppercase tracking-widest bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                                    High Demand
                                </p>
                                <button className="bg-white text-black py-2 px-4 rounded-xl font-black text-[9px] uppercase shadow-xl border border-black/5 hover:bg-black hover:text-white transition-all active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                    Explore
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}} />
            </div>
        </section>
    );
};

export default HeroSection;
