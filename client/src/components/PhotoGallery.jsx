import { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';

function PhotoGallery({ photos, onPhotoClick }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const galleryRef = useRef(null);

    const photoWidth = 335; // Соответствует ширине в CSS
    const photosPerView = Math.floor(window.innerWidth / photoWidth);
    const maxIndex = Math.max(0, photos.length - photosPerView);

    const handlePrev = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    };

    const handlers = useSwipeable({
        onSwipedLeft: () => handleNext(),
        onSwipedRight: () => handlePrev(),
        trackMouse: true,
    });

    useEffect(() => {
        const gallery = galleryRef.current;
        if (gallery) {
            gallery.style.transform = `translateX(-${currentIndex * photoWidth}px)`;
        }
    }, [currentIndex]);

    return (
        <div className="photo-gallery">
            <div className="gallery-photos" ref={galleryRef} {...handlers}>
                {photos.map((photo, index) => (
                    <img
                        key={index}
                        src={photo}
                        alt={`Фото ${index + 1}`}
                        className="gallery-photo"
                        onClick={() => onPhotoClick(photo)}
                    />
                ))}
            </div>
        </div>
    );
}

export default PhotoGallery;