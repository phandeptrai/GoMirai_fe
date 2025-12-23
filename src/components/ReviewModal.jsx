import { useState } from 'react';
import { reviewAPI } from '../api/review.api';
import './ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, booking, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !booking) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            alert('Vui lòng chọn số sao đánh giá!');
            return;
        }

        setSubmitting(true);

        try {
            await reviewAPI.createReview({
                bookingId: booking.bookingId,
                revieweeId: booking.driverId,
                rating: rating,
                comment: comment.trim() || null,
            });

            alert('Cảm ơn bạn đã đánh giá! ⭐');
            if (onSuccess) onSuccess();
            onClose();

            setRating(0);
            setComment('');
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Không thể gửi đánh giá. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="review-modal-overlay" onClick={onClose}>
            <div className="review-modal" onClick={(e) => e.stopPropagation()}>
                <div className="review-modal-header">
                    <h2 className="review-modal-title">Đánh giá chuyến đi</h2>
                    <button onClick={onClose} className="review-modal-close">×</button>
                </div>

                <form onSubmit={handleSubmit} className="review-modal-content">
                    <div className="review-driver-info">
                        <div className="review-driver-avatar">👤</div>
                        <div>
                            <div className="review-driver-name">Tài xế của bạn</div>
                            <div className="review-driver-meta">
                                Chuyến đi #{booking.bookingId?.substring(0, 8)}
                            </div>
                        </div>
                    </div>

                    <div className="review-rating-section">
                        <label className="review-label">Đánh giá của bạn</label>
                        <div className="review-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`review-star ${star <= (hover || rating) ? 'active' : ''}`}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>
                        <div className="review-rating-text">
                            {rating === 0 ? 'Chọn số sao' :
                                rating === 1 ? 'Rất tệ' :
                                    rating === 2 ? 'Tệ' :
                                        rating === 3 ? 'Bình thường' :
                                            rating === 4 ? 'Tốt' : 'Xuất sắc!'}
                        </div>
                    </div>

                    <div className="review-comment-section">
                        <label className="review-label">Nhận xét (tùy chọn)</label>
                        <textarea
                            className="review-textarea"
                            placeholder="Chia sẻ trải nghiệm của bạn..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={500}
                            rows={4}
                        />
                        <div className="review-char-count">{comment.length}/500</div>
                    </div>

                    <div className="review-actions">
                        <button type="button" onClick={onClose} className="review-btn review-btn-cancel" disabled={submitting}>
                            Hủy
                        </button>
                        <button type="submit" className="review-btn review-btn-submit" disabled={submitting || rating === 0}>
                            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
