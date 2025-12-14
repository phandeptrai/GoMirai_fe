import { useEffect, useState } from 'react';
import { AppState, MainTab } from './types';
import MapArea from './MapArea';
import BookingSheet from './BookingSheet';
import HomeScreen from './HomeScreen';
import ActivityScreen from './ActivityScreen';
import PaymentScreen from './PaymentScreen';
import NotificationScreen from './NotificationScreen';
import Header from './Header';
import BottomNav from './BottomNav';

const TemplateApp = () => {
  const [appState, setAppState] = useState(AppState.HOME);
  const [activeTab, setActiveTab] = useState(MainTab.PAYMENT);
  const [pickup, setPickup] = useState({
    name: 'Tòa nhà Bitexco',
    address: '2 Hải Triều, Bến Nghé, Q.1',
    lat: 10.7716,
    lng: 106.7044,
  });
  const [dropoff, setDropoff] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Got location', position.coords);
        },
        () => console.warn('Location permission denied'),
      );
    }
  }, []);

  const handleBackToHome = () => {
    setAppState(AppState.HOME);
    setDropoff(null);
    setSelectedVehicle(null);
  };

  const startBooking = () => {
    setAppState(AppState.IDLE);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case MainTab.HOME:
        return <HomeScreen onStartBooking={startBooking} userAddress={pickup.address} />;
      case MainTab.ACTIVITY:
        return <ActivityScreen />;
      case MainTab.PAYMENT:
        return <PaymentScreen />;
      case MainTab.NOTIFICATION:
        return <NotificationScreen />;
      default:
        return null;
    }
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden flex flex-col font-sans ${
      activeTab === MainTab.PAYMENT && appState === AppState.HOME ? 'bg-white' : 'bg-gray-100'
    }`}>
      {appState === AppState.HOME && <Header onSearchClick={startBooking} />}

      {appState !== AppState.HOME && appState !== AppState.COMPLETED && (
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto pt-safe">
            <button onClick={handleBackToHome} className="bg-white p-2.5 rounded-full shadow-md text-gray-700 hover:bg-gray-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className={`flex-1 relative z-0 ${activeTab !== MainTab.HOME && appState === AppState.HOME ? 'hidden' : 'block'}`}>
        <MapArea appState={appState} pickup={pickup} dropoff={dropoff} />
      </div>

      {appState === AppState.HOME && renderTabContent()}

      {appState !== AppState.HOME && (
        <BookingSheet
          appState={appState}
          setAppState={setAppState}
          pickup={pickup}
          setPickup={setPickup}
          dropoff={dropoff}
          setDropoff={setDropoff}
          selectedVehicle={selectedVehicle}
          setSelectedVehicle={setSelectedVehicle}
          priceMultiplier={1}
        />
      )}

      {appState === AppState.HOME && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
    </div>
  );
};

export default TemplateApp;

