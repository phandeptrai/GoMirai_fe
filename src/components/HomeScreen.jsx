import { Icons } from './constants';

const HomeScreen = ({ onStartBooking, userAddress }) => {
  const services = [
    { name: 'Đặt xe', icon: <Icons.Car className="w-8 h-8 text-white" />, color: 'bg-green-600', action: onStartBooking },
    { name: 'Xe máy', icon: <Icons.Bike className="w-8 h-8 text-white" />, color: 'bg-green-500', action: onStartBooking },
    { name: 'Giao hàng', icon: <Icons.Navigation className="w-8 h-8 text-white" />, color: 'bg-blue-500', action: () => alert('Tính năng đang phát triển') },
    { name: 'Đồ ăn', icon: <Icons.Sparkles className="w-8 h-8 text-white" />, color: 'bg-orange-500', action: () => alert('Tính năng đang phát triển') },
  ];

  const recentPlaces = [
    { name: 'Công ty', address: 'Tòa nhà Keangnam, Hà Nội', icon: '🏢' },
    { name: 'Aeon Mall', address: 'Long Biên, Hà Nội', icon: '🛍️' },
  ];

  return (
    <div className="absolute inset-0 z-30 pointer-events-none pt-[60px] pb-[60px] flex flex-col justify-end">
      <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pointer-events-auto animate-slide-up">
        <div className="mb-4">
          <div className="flex items-center text-gray-500 text-sm">
            <Icons.MapPin className="w-3 h-3 mr-1" />
            <span>Vị trí hiện tại:</span>
          </div>
          <div className="font-bold text-gray-800 truncate">{userAddress || 'Đang xác định...'}</div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {services.map((service, index) => (
            <button key={index} onClick={service.action} className="flex flex-col items-center gap-2 group">
              <div className={`${service.color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                {service.icon}
              </div>
              <span className="text-xs font-medium text-gray-700">{service.name}</span>
            </button>
          ))}
        </div>

        <div
          className="mb-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-3 text-white shadow-md flex justify-between items-center cursor-pointer"
          onClick={() => alert('Đã áp dụng mã!')}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Icons.Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm">Ưu đãi 50%</div>
              <div className="text-[10px] opacity-90">Hết hạn trong 2h</div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 text-sm">Điểm đến gần đây</h3>
          </div>
          <div className="space-y-2">
            {recentPlaces.map((place, index) => (
              <div key={index} onClick={onStartBooking} className="flex items-center p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm shadow-sm mr-3">{place.icon}</div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">{place.name}</div>
                  <div className="text-[10px] text-gray-500">{place.address}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
