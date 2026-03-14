import React from 'react';
import AccountLayout from '../../components/Profile/AccountLayout';

const AccountPage = () => {
    return (
        <AccountLayout isMenuPage={true}>
            <div className="hidden md:flex flex-col items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 uppercase  mb-2">My Account</h2>
                    <p className="text-black font-bold uppercase text-[10px] ">Select an option from the sidebar to manage your account</p>
                </div>
            </div>
        </AccountLayout>
    );
};

export default AccountPage;
