import { useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import BottomNav from '../../components/Navigation/BottomNav';


const UserLayout = ({ children, variant = 'default' }) => {
    const location = useLocation();
    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Header variant={variant} />
            <main className="flex-1">{children}</main>
            {['product', 'account', 'cart', 'checkout', 'products', 'payment'].includes(variant) ? <div className="hidden md:block"><Footer /></div> : variant !== 'shop' && <Footer />}
            <BottomNav />

        </div>
    );
};

export default UserLayout;
