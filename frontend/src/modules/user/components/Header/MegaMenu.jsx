import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../../data';
import { ChevronRight, ChevronDown } from 'lucide-react';

const MegaMenu = ({ isOpen, onClose }) => {
    const [activeDivision, setActiveDivision] = useState('men');

    if (!isOpen) return null;

    const divisionData = categories.find(cat => cat.id === activeDivision);

    return (
        <div
            className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-2xl text-gray-900 shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-50 animate-fadeInUp border-t border-gray-200"
            onMouseLeave={onClose}
        >
            <div className="container mx-auto px-4 py-10 max-w-7xl">
                {/* Division Selector - Luxury Tabs */}
                <div className="flex gap-8 mb-12 overflow-x-auto scrollbar-hide border-b border-gray-200">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveDivision(cat.id)}
                            onMouseEnter={() => setActiveDivision(cat.id)}
                            className={`px-2 py-4 text-[13px] font-bold uppercase transition-all relative group ${activeDivision === cat.id
                                ? 'text-black'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {cat.name}
                            {/* Active/Hover Underline Indicator */}
                            <div className={`absolute bottom-0 left-0 h-[2px] transition-all duration-300 ease-out ${activeDivision === cat.id
                                ? 'w-full bg-black shadow-[0_0_10px_rgba(212,175,55,0.5)]'
                                : 'w-0 bg-white/30 group-hover:w-full'
                                }`} />
                        </button>
                    ))}
                </div>

                {/* Sub-Category Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-12 gap-y-12">
                    {divisionData?.sections?.map((section, idx) => (
                        <div key={idx} className="flex flex-col gap-5 group">
                            {/* Section Header */}
                            <h3 className="text-gray-900 text-[15px] font-bold uppercase mb-2 flex items-center gap-3">
                                {section.title}
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                            </h3>
                            {/* Section Links */}
                            <div className="flex flex-col gap-3.5">
                                {section.items.map((item, itemIdx) => (
                                    <Link
                                        key={itemIdx}
                                        to={`/products?division=${activeDivision.toUpperCase()}&category=${encodeURIComponent(section.title)}&subcategory=${encodeURIComponent(item.name || item)}`}
                                        onClick={onClose}
                                        className="text-[13px] font-bold text-gray-600 hover:text-black transition-all flex items-center justify-between group/link"
                                    >
                                        {item.name || item}
                                        <ChevronRight size={14} className="opacity-0 -translate-x-3 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-black" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar Hints - Premium Edition */}
                <div className="mt-16 pt-8 border-t border-gray-200 flex flex-wrap items-center justify-between gap-6 text-[11px] font-bold uppercase text-gray-400">
                    <div className="flex flex-wrap gap-8">
                        <span className="flex items-center gap-2 group cursor-default">
                            <div className="w-[3px] h-[3px] bg-black rounded-full group-hover:scale-150 group-hover:shadow-sm transition-all" />
                            <span className="group-hover:text-white/80 transition-colors">Free Delivery Above ₹500</span>
                        </span>
                        <span className="flex items-center gap-2 group cursor-default">
                            <div className="w-[3px] h-[3px] bg-black rounded-full group-hover:scale-150 group-hover:shadow-sm transition-all" />
                            <span className="group-hover:text-white/80 transition-colors">14 Days Easy Returns</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MegaMenu;
