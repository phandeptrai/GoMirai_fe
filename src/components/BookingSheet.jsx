import { useState } from 'react';
import { AppState } from './types';
import { VEHICLES, MOCK_DRIVER, Icons } from './constants';
import { suggestDestination } from './services/geminiService';

const BookingSheet = ({
  appState,
  setAppState,
  pickup,
  setPickup,
  dropoff,
  setDropoff,
  selectedVehicle,
  setSelectedVehicle,
  priceMultiplier,
}) => {
  const [aiQuery, setAiQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);
    setAiSuggestion(null);
    try {
      const result = await suggestDestination(aiQuery);
      if (result) {
        setAiSuggestion(result.reason);
        setDropoff({
          name: result.placeName,
          address: result.address,
          lat: 21.0285,
          lng: 105.8542,
        });
        setAppState(AppState.CHOOSING_VEHICLE);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleBook = () => {
    setAppState(AppState.SEARCHING_DRIVER);
    setTimeout(() => {
      setAppState(AppState.DRIVER_FOUND);
      setTimeout(() => {
        setAppState(AppState.ON_TRIP);
      }, 5000);
    }, 3000);
  };

  const calculatePrice = (vehicle) => {
    const distance = 5;
    const price = vehicle.basePrice + vehicle.pricePerKm * distance;
    return (price * (priceMultiplier || 1)).toLocaleString('vi-VN');
  };

  if (appState === AppState.IDLE || appState === AppState.CHOOSING_LOCATION) {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] p-5 z-30 animate-slide-up">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Đặt xe</h2>
          <button onClick={() => setAppState(AppState.HOME)} className="text-sm text-gray-500 hover:text-gray-800 font-medium">
            Đóng
          </button>
        </div>

        <div className="space-y-3 relative">
          <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gray-200 z-0"></div>

          <div className="flex items-center bg-gray-100 p-3 rounded-xl z-10 relative">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-3 border-2 border-white shadow-sm"></div>
            <input
              type="text"
              value={pickup?.name || 'Vị trí hiện tại'}
              readOnly
              className="bg-transparent w-full text-gray-700 font-medium focus:outline-none"
              placeholder="Điểm đón"
            />
          </div>

          <div className="flex items-center bg-gray-100 p-3 rounded-xl z-10 relative">
            <div className="w-4 h-4 bg-red-500 rounded-sm mr-3 border-2 border-white shadow-sm"></div>
            <input
              type="text"
              className="bg-transparent w-full text-gray-800 font-semibold focus:outline-none placeholder-gray-400"
              placeholder="Nhập điểm đến..."
              autoFocus={appState === AppState.CHOOSING_LOCATION}
              value={dropoff?.name || ''}
              onChange={(e) => {
                setDropoff({ name: e.target.value, address: '', lat: 0, lng: 0 });
                if (appState === AppState.IDLE) setAppState(AppState.CHOOSING_LOCATION);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setAppState(AppState.CHOOSING_VEHICLE);
              }}
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="flex items-center text-sm font-semibold text-purple-600 mb-2">
            <Icons.Sparkles className="w-4 h-4 mr-1" />
            Trợ lý AI gợi ý địa điểm
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ví dụ: Quán cafe yên tĩnh làm việc..."
              className="flex-1 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
            />
            <button
              onClick={handleAiSearch}
              disabled={isAiLoading}
              className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isAiLoading ? '...' : <Icons.Search className="w-5 h-5" />}
            </button>
          </div>
          {aiSuggestion && (
            <div className="mt-2 text-xs text-gray-600 bg-purple-50 p-2 rounded border border-purple-100 italic">" {aiSuggestion} "</div>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button className="flex-shrink-0 flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Icons.Star className="w-4 h-4 text-yellow-500" />
              Nhà riêng
            </button>
            <button className="flex-shrink-0 flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
              <span className="w-4 h-4 flex items-center justify-center bg-gray-200 rounded-full text-[10px]">🏢</span> Công ty
            </button>
            <button
              onClick={() => setAppState(AppState.CHOOSING_VEHICLE)}
              className="flex-shrink-0 flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full shadow-sm text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              Chọn trên bản đồ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appState === AppState.CHOOSING_VEHICLE) {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-30 flex flex-col max-h-[60vh] animate-slide-up">
        <div className="p-4 border-b border-gray-100 flex relative justify-center">
          <button onClick={() => setAppState(AppState.IDLE)} className="absolute left-4 text-gray-500 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h3 className="font-bold text-gray-800">Chọn phương tiện</h3>
        </div>

        <div className="overflow-y-auto p-4 space-y-3 pb-24">
          {VEHICLES.map((vehicle) => (
            <div
              key={vehicle.id}
              onClick={() => setSelectedVehicle(vehicle)}
              className={`flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                selectedVehicle?.id === vehicle.id ? 'border-green-500 bg-green-50' : 'border-transparent bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm mr-4">{vehicle.icon}</div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800">{vehicle.name}</h4>
                <p className="text-xs text-gray-500">
                  {vehicle.description} • {vehicle.eta} phút
                </p>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{calculatePrice(vehicle)}đ</div>
                {selectedVehicle?.id === vehicle.id && <div className="text-[10px] text-green-600 font-bold">Đã chọn</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 safe-area-bottom">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-500">
              Thanh toán: <span className="font-bold text-gray-800">Tiền mặt</span>
            </span>
            <span className="text-sm text-blue-600 font-semibold cursor-pointer">Khuyến mãi</span>
          </div>
          <button
            onClick={handleBook}
            disabled={!selectedVehicle}
            className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Đặt xe {selectedVehicle ? `• ${calculatePrice(selectedVehicle)}đ` : ''}
          </button>
        </div>
      </div>
    );
  }

  if (appState === AppState.SEARCHING_DRIVER) {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 z-30 text-center pb-12 animate-slide-up">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 pulse-ring"></div>
          <div className="absolute inset-2 bg-green-500 rounded-full opacity-20 pulse-ring" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icons.Search className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Đang tìm tài xế gần bạn...</h3>
        <p className="text-gray-500 text-sm">Vui lòng đợi trong giây lát</p>
        <button onClick={() => setAppState(AppState.CHOOSING_VEHICLE)} className="mt-6 text-gray-400 font-medium hover:text-red-500 transition-colors text-sm">
          Hủy chuyến
        </button>
      </div>
    );
  }

  if (appState === AppState.DRIVER_FOUND || appState === AppState.ON_TRIP) {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-30 animate-slide-up">
        <div className="bg-green-600 p-4 rounded-t-3xl text-white flex justify-between items-center">
          <div>
            <div className="text-xs opacity-80 mb-1">{appState === AppState.DRIVER_FOUND ? 'Tài xế đang đến' : 'Đang trong chuyến đi'}</div>
            <div className="font-bold text-lg">2 phút nữa</div>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-mono font-bold">{MOCK_DRIVER.vehiclePlate}</div>
        </div>

        <div className="p-5">
          <div className="flex items-center mb-6">
            <img src={MOCK_DRIVER.avatarUrl} alt="Driver" className="w-14 h-14 rounded-full border-2 border-white shadow-md mr-4" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-lg">{MOCK_DRIVER.name}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Icons.Star className="w-4 h-4 text-yellow-400 mr-1" />
                <span>{MOCK_DRIVER.rating}</span>
                <span className="mx-2">•</span>
                <span>{MOCK_DRIVER.vehicleModel}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 hover:bg-green-100">
                <Icons.Phone className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100">
                <div className="w-5 h-5 flex items-center justify-center font-bold text-lg leading-none mb-1">...</div>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex flex-col items-center mr-3 pt-1">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                <div className="w-0.5 h-full bg-gray-200 min-h-[30px]"></div>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">Đón tại</div>
                <div className="text-sm font-semibold text-gray-800">{pickup?.name || 'Vị trí của bạn'}</div>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex flex-col items-center mr-3 pt-1">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">Đến</div>
                <div className="text-sm font-semibold text-gray-800">{dropoff?.name || 'Điểm đến'}</div>
              </div>
            </div>
          </div>

          {appState === AppState.ON_TRIP && (
            <button
              onClick={() => setAppState(AppState.COMPLETED)}
              className="mt-6 w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-200"
            >
              (Debug) Kết thúc chuyến
            </button>
          )}
        </div>
      </div>
    );
  }

  if (appState === AppState.COMPLETED) {
    return (
      <div className="absolute inset-0 bg-white z-40 flex flex-col items-center justify-center p-8 animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Icons.Star className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đến nơi an toàn!</h2>
        <p className="text-gray-500 text-center mb-8">
          Cảm ơn bạn đã sử dụng GoMirai. Tổng cước phí là <span className="font-bold text-gray-800">{selectedVehicle ? calculatePrice(selectedVehicle) : '0'}đ</span>
        </p>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <Icons.Star key={star} className="w-8 h-8 text-yellow-400 cursor-pointer hover:scale-110 transition-transform" />
          ))}
        </div>

        <button
          onClick={() => {
            setAppState(AppState.HOME);
            setDropoff(null);
            setSelectedVehicle(null);
            setAiQuery('');
          }}
          className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all w-full"
        >
          Trang chủ
        </button>
      </div>
    );
  }

  return null;
};

export default BookingSheet;
