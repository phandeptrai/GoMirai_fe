# Hướng dẫn sử dụng Admin Panel - GoMirai

## Tổng quan

Hệ thống admin của GoMirai được thiết kế để quản lý toàn bộ hệ thống ride-hailing, bao gồm:
- Quản lý tài xế (phê duyệt, từ chối, khóa/mở khóa)
- Quản lý giá cước theo loại xe
- Quản lý người dùng
- Xem thống kê tổng quan

## Đăng nhập

1. Truy cập trang login: `http://localhost:5173/login`
2. Nhập số điện thoại và mật khẩu của tài khoản ADMIN
3. Sau khi đăng nhập thành công, hệ thống sẽ tự động chuyển đến Admin Dashboard

**Lưu ý**: Chỉ tài khoản có role `ADMIN` mới được truy cập Admin Panel.

## Tính năng

### 1. Admin Dashboard (`/admin/dashboard`)

Dashboard hiển thị thống kê tổng quan:
- **Số lượng người dùng**: Tổng số người dùng đã đăng ký
- **Số lượng tài xế**: Tổng số tài xế (bao gồm tất cả trạng thái)
  - Badge màu đỏ hiển thị số tài xế đang chờ duyệt
- **Số quy tắc giá**: Tổng số pricing rules đã tạo

**Quick Navigation**:
- Quản lý tài xế: Phê duyệt và quản lý tài xế
- Quản lý giá cước: Thiết lập bảng giá theo loại xe
- Quản lý người dùng: Xem danh sách người dùng

### 2. Quản lý Tài xế (`/admin/drivers`)

#### Chức năng chính:

**Lọc tài xế theo trạng thái**:
- Tất cả
- Chờ duyệt (PENDING_VERIFICATION)
- Hoạt động (ACTIVE)
- Đã khóa (BANNED)
- Từ chối (REJECTED)

**Thông tin hiển thị cho mỗi tài xế**:
- Số giấy phép lái xe
- Driver ID và User ID
- Trạng thái tài khoản
- Thông tin phương tiện (nếu có):
  - Hãng xe và model
  - Biển số xe
  - Loại xe
  - Màu sắc
- Đánh giá và số chuyến đã hoàn thành

**Hành động**:

1. **Với tài xế chờ duyệt (PENDING_VERIFICATION)**:
   - ✅ **Duyệt**: Chấp nhận đơn đăng ký, chuyển trạng thái sang ACTIVE
   - ❌ **Từ chối**: Từ chối đơn đăng ký, chuyển trạng thái sang REJECTED

2. **Với tài xế đang hoạt động (ACTIVE)**:
   - 🚫 **Khóa**: Tạm ngưng hoạt động của tài xế, chuyển sang BANNED

3. **Với tài xế bị khóa (BANNED)**:
   - 🔓 **Mở khóa**: Khôi phục hoạt động, chuyển về ACTIVE

#### Backend API được sử dụng:
```
GET /api/drivers?status={status}          - Lấy danh sách tài xế
PATCH /api/drivers/{driverId}/approve     - Phê duyệt tài xế
PATCH /api/drivers/{driverId}/reject      - Từ chối tài xế
PATCH /api/drivers/{driverId}/suspend     - Khóa tài xế
PATCH /api/drivers/{driverId}/unsuspend   - Mở khóa tài xế
```

### 3. Quản lý Giá cước (`/admin/pricing`)

#### Chức năng:

**Xem danh sách pricing rules**:
- Hiển thị dạng card grid (responsive)
- Mỗi card hiển thị:
  - Icon và tên loại xe
  - Khu vực áp dụng
  - Giá mở cửa (baseFare)
  - Giá/km (perKmRate)
  - Giá/phút (perMinuteRate)
  - Hệ số cao điểm (surgeMultiplier)
  - Trạng thái ACTIVE/INACTIVE

**Tạo pricing rule mới**:
1. Click nút **"+ Tạo mới"** ở góc trên bên phải
2. Điền thông tin:
   - **Loại xe**: MOTORBIKE (🏍️ Xe máy), CAR_4 (🚗 Xe 4 chỗ), CAR_7 (🚙 Xe 7 chỗ)
   - **Giá mở cửa**: Giá khởi điểm (VD: 12000đ)
   - **Giá/km**: Giá tính theo km (VD: 5000đ)
   - **Giá/phút**: Giá tính theo phút (VD: 500đ)
   - **Cao điểm**: Hệ số nhân giờ cao điểm (VD: 1.5)
   - **Khu vực**: HCM, HN, DN
   - **Kích hoạt**: Checkbox để active/inactive rule
3. Click **"Tạo mới"**

**Chỉnh sửa pricing rule**:
1. Click nút **"✏️ Chỉnh sửa"** trên card của rule
2. Cập nhật thông tin cần thiết
3. Click **"Cập nhật"**

#### Backend API được sử dụng:
```
GET /api/pricing/rules           - Lấy danh sách pricing rules
POST /api/pricing/rules          - Tạo pricing rule mới
PUT /api/pricing/rules/{id}      - Cập nhật pricing rule
```

### 4. Quản lý Người dùng (`/admin/users`)

Hiển thị danh sách tất cả người dùng trong hệ thống.

#### Backend API:
```
GET /api/users                   - Lấy danh sách tất cả users
```

## Responsive Design

Admin panel được thiết kế responsive cho cả desktop và mobile:

### Desktop (≥768px):
- Grid layout 3 cột cho stats cards
- Grid 2-3 cột cho pricing cards
- Sidebar navigation (có thể mở rộng trong tương lai)

### Mobile (<768px):
- Grid layout 1 cột
- Touch-friendly buttons (minimum 44px)
- Horizontal scroll cho filters
- Bottom sheet/modal cho forms

## Styling và UX

### Color Scheme:
- **Primary**: `#009b77` (Teal green) - Brand color
- **Success**: Green gradient - For approve actions
- **Danger**: Red gradient - For reject/ban actions  
- **Warning**: Yellow - For pending status
- **Background**: Light gradient (`#f5f7f8` to `#e8f4f0`)

### Animations:
- Fade-in animations cho cards
- Hover effects với scale transform
- Loading spinners cho async operations
- Smooth transitions

### Components:
- **Gradient buttons**: Với shadow và hover effects
- **Status badges**: Color-coded theo trạng thái
- **Modal forms**: Centered với backdrop blur
- **Sticky headers**: Fixed positioning khi scroll

## Bảo mật

- Tất cả routes admin được bảo vệ bởi `PrivateRoute` với `allowedRoles={['ADMIN']}`
- JWT token được gửi trong header cho mọi API request
- Auto-logout nếu token expired (401)

## Lưu ý khi sử dụng

1. **Phê duyệt tài xế**: 
   - Kiểm tra kỹ thông tin xe và giấy phép trước khi duyệt
   - **Lưu ý**: Hệ thống hiện tại chưa có tính năng quản lý giấy tờ/chứng minh (vì backend chưa có)

2. **Quản lý giá cước**:
   - Mỗi loại xe nên có ít nhất 1 pricing rule ACTIVE
   - Surge multiplier ≥ 1.0
   - Giá mở cửa nên hợp lý với khu vực

3. **Performance**:
   - Dashboard load tất cả stats song song để giảm thời gian chờ
   - List pagination có thể thêm trong tương lai nếu dữ liệu lớn

## Troubleshooting

### Không thể truy cập Admin Panel
- Kiểm tra role trong localStorage: `localStorage.getItem('role')` phải là `'ADMIN'`
- Kiểm tra token: `localStorage.getItem('accessToken')`
- Thử logout và login lại

### API errors
- Check console để xem chi tiết lỗi
- Kiểm tra backend services đang chạy
- Kiểm tra CORS configuration

### Không hiển thị dữ liệu
- Kiểm tra backend logs
- Kiểm tra database có dữ liệu không
- Thử refresh lại trang

## Future Enhancements

Các tính năng có thể thêm trong tương lai:
- 📊 **Analytics Dashboard**: Biểu đồ thống kê chi tiết
- 📄 **Document Management**: Quản lý giấy tờ tài xế (khi backend hỗ trợ)
- 💬 **Support Tickets**: Hệ thống hỗ trợ khách hàng
- 📧 **Notifications**: Gửi thông báo cho tài xế/user
- 📱 **Push Notifications**: FCM integration
- 🔍 **Advanced Filters**: Search và filter nâng cao
- 📊 **Reports**: Export báo cáo Excel/PDF
- 👥 **Admin Roles**: Phân quyền admin chi tiết hơn

## API Reference

### Driver Management
- `GET /api/drivers?status={status}` - List drivers by status
- `PATCH /api/drivers/{id}/approve` - Approve driver
- `PATCH /api/drivers/{id}/reject` - Reject driver  
- `PATCH /api/drivers/{id}/suspend` - Ban driver
- `PATCH /api/drivers/{id}/unsuspend` - Unban driver

### Pricing Management
- `GET /api/pricing/rules` - List all pricing rules
- `POST /api/pricing/rules` - Create new rule
- `PUT /api/pricing/rules/{id}` - Update rule

### User Management
- `GET /api/users` - List all users

Tất cả APIs yêu cầu:
- Header: `Authorization: Bearer {token}`
- Content-Type: `application/json`
