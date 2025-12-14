import { Icons } from './constants';

const Header = ({ onSearchClick }) => {
  return (
    <div className="absolute top-0 left-0 right-0 bg-white z-40 px-4 py-3 shadow-sm flex items-center justify-between pt-safe">
      <div className="flex items-center gap-2">
        {/* Green triangle logo */}
        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] border-b-green-600"></div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">GoMirai</span>
      </div>

      <div
        onClick={onSearchClick}
        className="flex-1 mx-4 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
      >
        <Icons.Search className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-500 font-medium truncate">Tìm kiếm địa điểm...</span>
      </div>

      <div className="relative">
        <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-100 shadow-sm cursor-pointer">
          <img src="https://picsum.photos/seed/user/200" alt="User" className="w-full h-full object-cover" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
          <div className="w-3 h-3 bg-green-500 rounded-full border border-white"></div>
        </div>
      </div>
    </div>
  );
};

export default Header;

