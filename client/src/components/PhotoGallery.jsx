import { Swiper, SwiperSlide } from 'swiper/react';

// Импортируем стили Swiper
import 'swiper/css';

function PhotoGallery({ photos, onPhotoClick }) {
    return (
        <div className="photo-gallery">
            <Swiper
                spaceBetween={10} // Расстояние между слайдами
                slidesPerView={1} // Показываем 1 слайд за раз
                style={{ width: '100%', height: '100%' }}
            >
                {photos.map((photo, index) => (
                    <SwiperSlide key={index}>
                        <img
                            src={photo}
                            alt={`Фото ${index + 1}`}
                            className="gallery-photo"
                            onClick={() => onPhotoClick(photo)}
                        />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}

export default PhotoGallery;