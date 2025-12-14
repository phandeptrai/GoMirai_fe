import { Icons } from './constants';
import { MainTab } from './types';

const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: MainTab.HOME, label: 'Trang chủ', icon: Icons.Home },
    { id: MainTab.PAYMENT, label: 'Thanh toán', icon: Icons.QuestionMark },
    { id: MainTab.ACTIVITY, label: 'Hoạt động', icon: Icons.Clock },
    { id: MainTab.NOTIFICATION, label: 'Thông báo', icon: Icons.Bell },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;

