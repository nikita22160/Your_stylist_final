// Компонент модального окна с ценами стилиста
export default function PriceModal({ closeModal, stylist }) {
    return (
        <div className="register-cont">
            <div className="register-header">ЦЕНЫ</div>
            <div className="profile-info">
                {stylist.price?.perHour && (
                    <>
                        <p className="user-profile-block-head">За час</p>
                        <div className="user-profile-block">{stylist.price.perHour} ₽</div>
                    </>
                )}
                {stylist.price?.perDay && (
                    <>
                        <p className="user-profile-block-head">За день</p>
                        <div className="user-profile-block">{stylist.price.perDay} ₽</div>
                    </>
                )}
                {stylist.price?.eventLook && (
                    <>
                        <p className="user-profile-block-head">Образ для мероприятия</p>
                        <div className="user-profile-block">{stylist.price.eventLook} ₽</div>
                    </>
                )}
                {stylist.price?.styleConsultation && (
                    <>
                        <p className="user-profile-block-head">Консультация по стилю</p>
                        <div className="user-profile-block">{stylist.price.styleConsultation} ₽</div>
                    </>
                )}
                {stylist.price?.wardrobeAnalysis && (
                    <>
                        <p className="user-profile-block-head">Разбор гардероба</p>
                        <div className="user-profile-block">{stylist.price.wardrobeAnalysis} ₽</div>
                    </>
                )}
                {stylist.price?.shoppingSupport && (
                    <>
                        <p className="user-profile-block-head">Шопинг-сопровождение</p>
                        <div className="user-profile-block">{stylist.price.shoppingSupport} ₽</div>
                    </>
                )}
                {!stylist.price && (
                    <p className="user-profile-block-head">Цены не указаны</p>
                )}
            </div>
        </div>
    );
}