import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AccountLayout from '../../components/Profile/AccountLayout';
import { Camera, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
    const { user, updateProfile } = useAuth();
    const fileInputRef = useRef(null);

    // Form State initialized from user context
    const [formData, setFormData] = useState({
        firstName: user?.firstName || user?.name?.split(' ')[0] || '',
        lastName: user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '',
        email: user?.email || '',
        dob: user?.dob || '',
        gender: user?.gender || '',
        ageRange: user?.ageRange || '',
        stylePreference: user?.stylePreference || '',
        preferredFit: user?.preferredFit || '',
        phone: user?.phone || '',
        avatar: user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
    });

    // Update formData when user object changes
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || user.name?.split(' ')[0] || '',
                lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
                email: user.email || '',
                dob: user.dob || '',
                gender: user.gender || '',
                ageRange: user.ageRange || '',
                stylePreference: user.stylePreference || '',
                preferredFit: user.preferredFit || '',
                phone: user.phone || '',
                avatar: user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
            });
        }
    }, [user]);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Actually upload if we had an upload function in useAuth
                // For now, keep the local preview logic but we should call the store
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({ ...prev, avatar: reader.result }));
                };
                reader.readAsDataURL(file);
            } catch (error) {
                toast.error('Failed to update avatar');
            }
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatePayload = {
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                firstName: formData.firstName,
                lastName: formData.lastName,
                dob: formData.dob,
                gender: formData.gender,
                ageRange: formData.ageRange,
                stylePreference: formData.stylePreference,
                preferredFit: formData.preferredFit,
                phone: formData.phone
            };

            await updateProfile(updatePayload);
            setSaveMessage('Profile Updated');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const genderOptions = ['Male', 'Female', 'Other'];
    const ageOptions = ['Below 18', '18-24', 'Above 24'];
    const styleOptions = [
        'Minimalist', 'Streetwear', 'Luxury',
        'Casual', 'Formal', 'Bohemian', 'Vintage', 'Athleisure'
    ];
    const fitOptions = ['Slim', 'Tailored', 'Regular', 'Oversized'];

    if (!user) {
        return (
        <div className="min-h-[80vh] flex items-center justify-center bg-white px-4">
                <div className="bg-white p-10 rounded-[32px] shadow-sm w-full max-w-md text-center border border-gray-100">
                    <h2 className="text-[28px] font-bold text-gray-900 mb-4 ">Account</h2>
                    <p className="text-[13px] text-gray-500 mb-8">Login to view your profile and manage orders</p>
                    <Link to="/login" className="block w-full py-4 bg-black text-white rounded-full text-[13px] font-bold uppercase  hover:bg-gray-100 hover:text-black transition-all no-underline shadow-[0_10px_30px_rgba(212,175,55,0.2)]">
                        Login / Sign Up
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <AccountLayout>
            <div className="max-w-[500px] mx-auto bg-white min-h-screen pb-20">

                {/* Header & Avatar Section */}
                <div className="flex flex-col items-center mb-10 pt-4">
                    <div className="relative group cursor-pointer mb-5" onClick={triggerFileInput}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-[3px] bg-gray-100 shadow-sm group-hover:shadow-md transition-all duration-500">
                            <div className="w-full h-full rounded-full bg-white overflow-hidden relative border-4 border-gray-50">
                                <img
                                    src={formData.avatar}
                                    alt="User Avatar"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                                    <Camera className="text-[#FF5722] w-8 h-8" strokeWidth={1.5} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <h2 className="text-[24px] font-bold text-gray-900 ">{formData.firstName} {formData.lastName}</h2>
                    <div className="flex items-center gap-1.5 mt-1.5 opacity-80">
                        <Check size={12} className="text-[#FF5722]" strokeWidth={3} />
                        <span className="text-[10px] font-bold text-[#FF5722] uppercase">Member Since 2024</span>
                    </div>
                </div>

                {/* Form Fields Section */}
                <div className="space-y-5 px-4 text-gray-900">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                                <label className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-bold text-gray-400 uppercase z-10 transition-colors group-focus-within:text-[#FF5722]">First Name</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-[16px] focus:ring-1 focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition-all font-medium text-[14px] text-gray-900"
                                    placeholder="First Name"
                                />
                            </div>
                            <div className="relative group">
                                <label className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-bold text-gray-400 uppercase z-10 transition-colors group-focus-within:text-[#FF5722]">Last Name</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-[16px] focus:ring-1 focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition-all font-medium text-[14px] text-gray-900"
                                    placeholder="Last Name"
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-bold text-gray-400 uppercase z-10 transition-colors group-focus-within:text-[#FF5722]">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-[16px] focus:ring-1 focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition-all font-medium text-[14px] text-gray-900"
                                placeholder="Email"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                                <label className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-bold text-gray-400 uppercase z-10 transition-colors group-focus-within:text-[#FF5722]">Mobile Number</label>
                                <div className="flex items-center gap-3 w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-[16px] focus-within:ring-1 focus-within:ring-[#FF5722] focus-within:border-[#FF5722] transition-all">
                                    <div className="flex items-center gap-2 pr-3 border-r border-gray-100">
                                        <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 rounded-sm shadow-sm" />
                                        <span className="text-[13px] font-bold text-gray-500">+91</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="flex-1 bg-transparent border-none outline-none font-medium text-[14px] text-gray-900"
                                    />
                                </div>
                            </div>
                            <div className="relative group">
                                <label className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-bold text-gray-400 uppercase z-10 transition-colors group-focus-within:text-[#FF5722]">Date of Birth</label>
                                <input
                                    type="text"
                                    value={formData.dob}
                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-[16px] focus:ring-1 focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition-all font-medium text-[14px] text-gray-900"
                                    placeholder="DD/MM/YYYY"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 my-6"></div>

                    {/* Chips Sections */}
                    <div className="space-y-7">
                        {/* Preferred Fit */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 ml-1">Preferred Fit (Bespoke)</h4>
                            <div className="flex flex-wrap gap-2.5">
                                {fitOptions.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setFormData({ ...formData, preferredFit: opt })}
                                        className={`px-5 py-2 rounded-full text-[12px] font-bold transition-all duration-300 ${formData.preferredFit === opt
                                            ? 'bg-[#FF5722] text-white shadow-md scale-105'
                                            : 'bg-gray-50 text-gray-500 border border-gray-100 hover:border-[#FF5722]/50 hover:text-gray-900 hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Gender */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 ml-1">Gender Identification</h4>
                            <div className="flex flex-wrap gap-2.5">
                                {genderOptions.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setFormData({ ...formData, gender: opt })}
                                        className={`px-5 py-2 rounded-full text-[12px] font-bold transition-all duration-300 ${formData.gender === opt
                                            ? 'bg-[#FF5722] text-white shadow-md scale-105'
                                            : 'bg-gray-50 text-gray-500 border border-gray-100 hover:border-[#FF5722]/50 hover:text-gray-900 hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Age Range */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 ml-1">Age Demographics</h4>
                            <div className="flex flex-wrap gap-2.5">
                                {ageOptions.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setFormData({ ...formData, ageRange: opt })}
                                        className={`px-5 py-2 rounded-full text-[12px] font-bold transition-all duration-300 ${formData.ageRange === opt
                                            ? 'bg-[#FF5722] text-white shadow-md scale-105'
                                            : 'bg-gray-50 text-gray-500 border border-gray-100 hover:border-[#FF5722]/50 hover:text-gray-900 hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Style Preference */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 ml-1">Style Preference</h4>
                            <div className="flex flex-wrap gap-2.5">
                                {styleOptions.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setFormData({ ...formData, stylePreference: opt })}
                                        className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all duration-300 ${formData.stylePreference === opt
                                            ? 'bg-[#FF5722] text-white shadow-md scale-105'
                                            : 'bg-gray-50 text-gray-500 border border-gray-100 hover:border-[#FF5722]/50 hover:text-gray-900 hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Save Action */}
                        <div className="pt-8 pb-4 relative">
                            {saveMessage && (
                                <div className="absolute -top-2 left-0 w-full flex justify-center">
                                    <span className="bg-[#FF5722]/10 text-[#FF5722] border border-[#FF5722]/20 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase animate-fade-in-up">
                                        {saveMessage}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="group relative w-full py-4 bg-black text-white rounded-full overflow-hidden disabled:opacity-70 transition-transform active:scale-95 shadow-xl shadow-gray-200"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                <span className="relative font-bold text-[13px] uppercase">
                                    {isSaving ? 'Updating Profile...' : 'Save Profile Details'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AccountLayout>
    );
};

export default ProfilePage;
