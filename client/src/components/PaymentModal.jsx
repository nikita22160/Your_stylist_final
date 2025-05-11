import React from 'react';

const PaymentModal = ({ closeModal, paymentUrl }) => {
    const handleRedirect = () => {
        if (paymentUrl) {
            window.location.href = paymentUrl; // Перенаправляем пользователя на страницу оплаты
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Оплата</h2>
                <p>Вы будете перенаправлены на страницу оплаты. После завершения оплаты вернитесь на эту страницу.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button className="confirm-appointment" onClick={handleRedirect}>
                        Перейти к оплате
                    </button>
                    <button className="remove-appointment" onClick={closeModal}>
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;