import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDriversPage = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadDrivers();
  }, [filter]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      // Note: This endpoint might not exist, using mock for now
      setDrivers([]);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800 border-green-300',
      PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300',
      BANNED: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-[#f5f7f8] pb-20">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg active:bg-gray-200 touch-target"
          >
            <span className="text-xl text-[#1a1a1a]">←</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">Quản lý tài xế</h1>
            <p className="text-sm text-gray-600">{drivers.length} tài xế</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 border-b sticky top-[73px] z-10 shadow-sm">
        <div className="flex gap-2 overflow-x-auto max-w-5xl mx-auto">
          {['ALL', 'PENDING_VERIFICATION', 'ACTIVE', 'BANNED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap touch-target ${
                filter === f
                  ? 'bg-[#009b77] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              {f === 'ALL'
                ? 'Tất cả'
                : f.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Drivers List */}
      <div className="p-4 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-[#009b77] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-500 font-medium">Đang tải...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">🚗</span>
            </div>
            <p className="text-gray-500 text-lg font-medium">Chưa có tài xế nào</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {drivers.map((driver, index) => (
              <div
                key={driver.driverId}
                className="ui-card border-l-4 border-[#009b77]"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-11 h-11 bg-[#009b77]/10 rounded-lg flex items-center justify-center text-xl text-[#009b77]">
                        🚗
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          Tài xế ID: {driver.driverId?.substring(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500">Trạng thái: {driver.accountStatus}</p>
                      </div>
                    </div>
                    {driver.rating && (
                      <div className="ml-12">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <span>⭐</span> Đánh giá: {driver.rating.toFixed(1)} / 5.0
                        </p>
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-4 py-2 rounded-xl text-xs font-bold border ${getStatusColor(
                      driver.accountStatus
                    )}`}
                  >
                    {driver.accountStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDriversPage;




