import React from 'react';
import AccountLayout from '../../components/Profile/AccountLayout';

const AccountPage = () => {
    return (
        <AccountLayout isMenuPage={true}>
            <div className="hidden md:flex flex-col items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-2xl font-black text-[#FAFAFA] uppercase tracking-tight mb-2">My Account</h2>
                    <p className="text-[#D4AF37] font-bold uppercase text-[10px] tracking-widest">Select an option from the sidebar to manage your account</p>
                </div>
            </div>
        </AccountLayout>
    );
};

export default AccountPage;
