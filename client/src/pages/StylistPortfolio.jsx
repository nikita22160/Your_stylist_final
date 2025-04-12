import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { showSuccess, showError } from '../components/ToastNotifications';
import PhotoGallery from '../components/PhotoGallery'; // Импортируем новый компонент

// Компонент страницы портфолио стилиста
export default function StylistPortfolio() {
    const { id } = useParams();
    const [stylist, setStylist] = useState(null);
    const [posts, setPosts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [newPost, setNewPost] = useState({ title: '', description: '', hashtags: [], photos: [] });
    const [hashtagInput, setHashtagInput] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [previewPhotos, setPreviewPhotos] = useState([]);
    const [editingPost, setEditingPost] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { user, isAuthenticated, token } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const isStylist = isAuthenticated && user && stylist && stylist.phone === user.phone;

    useEffect(() => {
        const fetchStylist = async () => {
            try {
                const response = await fetch(`/api/stylists/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                setStylist(data);
            } catch (error) {
                showError('Ошибка загрузки стилиста');
            }
        };

        const fetchPosts = async () => {
            try {
                const response = await fetch(`/api/stylists/${id}/portfolio?search=${searchQuery}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                setPosts(data);
            } catch (error) {
                showError('Ошибка загрузки постов');
            }
        };

        fetchStylist();
        fetchPosts();
    }, [id, searchQuery, token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPost({ ...newPost, [name]: value });
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        setNewPost((prev) => ({
            ...prev,
            photos: [...prev.photos, ...files],
        }));
        setPreviewPhotos((prev) => [
            ...prev,
            ...files.map((file) => URL.createObjectURL(file)),
        ]);
    };

    const handleHashtagKeyDown = (e) => {
        if (e.key === 'Enter' && hashtagInput.trim()) {
            e.preventDefault();
            const newHashtag = hashtagInput.trim();
            if (!newPost.hashtags.includes(newHashtag)) {
                setNewPost({ ...newPost, hashtags: [...newPost.hashtags, newHashtag] });
            }
            setHashtagInput('');
        }
    };

    const removeHashtag = (hashtagToRemove) => {
        setNewPost({
            ...newPost,
            hashtags: newPost.hashtags.filter((hashtag) => hashtag !== hashtagToRemove),
        });
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setNewPost({
            title: post.title,
            description: post.description,
            hashtags: post.hashtags,
            photos: [],
        });
        setPreviewPhotos(post.photos);
        setIsFormVisible(true);
    };

    const handleDeletePost = async (postId) => {
        if (!isAuthenticated) {
            showError('Пожалуйста, войдите в систему');
            navigate('/signin');
            return;
        }

        if (!isStylist) {
            showError('Вы не можете удалять посты для этого стилиста');
            return;
        }

        console.log('Token:', token);
        console.log('User:', user);
        console.log('Stylist:', stylist);

        setIsLoading(true);
        try {
            const response = await fetch(`/api/stylists/${id}/portfolio/${postId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }

            setPosts(posts.filter((post) => post._id !== postId));
            showSuccess('Пост успешно удалён!');
        } catch (error) {
            showError(`Ошибка при удалении поста: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitPost = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            showError('Пожалуйста, войдите в систему');
            navigate('/signin');
            return;
        }

        if (!isStylist) {
            showError('Вы не можете добавлять посты для этого стилиста');
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append('title', newPost.title);
        formData.append('description', newPost.description);
        formData.append('hashtags', newPost.hashtags.join(','));

        if (editingPost) {
            formData.append('existingPhotos', JSON.stringify(editingPost.photos));
        }

        newPost.photos.forEach((photo) => formData.append('photos', photo));

        try {
            const url = editingPost
                ? `/api/stylists/${id}/portfolio/${editingPost._id}`
                : `/api/stylists/${id}/portfolio`;
            const method = editingPost ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }

            const updatedPost = await response.json();
            if (editingPost) {
                setPosts(posts.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
            } else {
                setPosts([updatedPost, ...posts]);
            }
            setNewPost({ title: '', description: '', hashtags: [], photos: [] });
            setPreviewPhotos([]);
            setEditingPost(null);
            setIsFormVisible(false);
            showSuccess(editingPost ? 'Пост обновлен!' : 'Пост успешно добавлен!');
        } catch (error) {
            showError(`Ошибка: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhotoClick = (photo) => {
        setSelectedPhoto(photo);
    };

    const closePhotoModal = () => {
        setSelectedPhoto(null);
    };

    if (!stylist) {
        return <div className="main-container">Загрузка...</div>;
    }

    return (
        <div className="main-container">
            <div onClick={() => navigate(`/stylist/${id}`)} className="back-btn">
                <img src="/img/back.svg" alt="Назад" />
            </div>
            <div className="stylist-page-header" onClick={() => navigate('/')}>
                ТВОЙ СТИЛИСТ
            </div>
            <div className="portfolio-cont">
                <h2>Портфолио {stylist.name} {stylist.surname}</h2>

                <div className="search-cont">
                    <input
                        className="name-find"
                        placeholder="Поиск"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {isStylist && !isFormVisible && (
                    <button className="new-post-btn" onClick={() => setIsFormVisible(true)}>
                        Новый пост
                    </button>
                )}

                {isStylist && isFormVisible && (
                    <form className="post-form" onSubmit={handleSubmitPost}>
                        <input
                            type="text"
                            name="title"
                            placeholder="Заголовок"
                            value={newPost.title}
                            onChange={handleInputChange}
                            required
                        />
                        <textarea
                            name="description"
                            placeholder="Описание"
                            value={newPost.description}
                            onChange={handleInputChange}
                            required
                        />
                        <div className="hashtags-input-cont">
                            <div className="hashtag-input-container">
                                <input
                                    type="text"
                                    placeholder="Введите хэштег и нажмите Enter"
                                    value={hashtagInput}
                                    onChange={(e) => setHashtagInput(e.target.value)}
                                    onKeyDown={handleHashtagKeyDown}
                                    className="hashtag-input"
                                />
                            </div>
                            <div className="hashtags-list">
                                {newPost.hashtags.map((hashtag, index) => (
                                    <div key={index} className="hashtag-item">
                                        <span>#{hashtag}</span>
                                        <button
                                            type="button"
                                            className="remove-hashtag-btn"
                                            onClick={() => removeHashtag(hashtag)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="photo-upload-cont">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoChange}
                                required={!editingPost}
                                style={{ display: 'none' }}
                                id="photo-upload"
                            />
                            <button
                                type="button"
                                className="attach-photo-btn"
                                onClick={() => document.getElementById('photo-upload').click()}
                            >
                                <img src="/img/skrepka.svg" alt="Прикрепить фото" className="attach-icon" />
                                Прикрепить фото
                            </button>
                        </div>
                        <div className="photo-previews">
                            {previewPhotos.map((photo, index) => (
                                <div key={index} className="photo-preview-cont">
                                    <img
                                        src={photo}
                                        alt={`Preview ${index + 1}`}
                                        className="photo-preview"
                                    />
                                    <button
                                        type="button"
                                        className="remove-photo-btn"
                                        onClick={() => {
                                            setPreviewPhotos((prev) => prev.filter((_, i) => i !== index));
                                            setNewPost((prev) => ({
                                                ...prev,
                                                photos: prev.photos.filter((_, i) => i !== index),
                                            }));
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="add-post-btn">
                                {editingPost ? 'Обновить пост' : 'Добавить пост'}
                            </button>
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => {
                                    setIsFormVisible(false);
                                    setEditingPost(null);
                                    setNewPost({ title: '', description: '', hashtags: [], photos: [] });
                                    setPreviewPhotos([]);
                                }}
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                )}

                <div className="posts-cont">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <div key={post._id} className="portfolio-post">
                                <div className="post-content">
                                    <div className="post-gallery">
                                        <PhotoGallery photos={post.photos} onPhotoClick={handlePhotoClick} />
                                    </div>
                                    <div className="post-info">
                                        <h3>{post.title}</h3>
                                        <p style={{ whiteSpace: 'pre-wrap' }}>{post.description}</p>
                                        <div className="hashtags">
                                            {post.hashtags.map((tag, index) => (
                                                <span key={index} className="hashtag-item">#{tag}</span>
                                            ))}
                                        </div>
                                        {isStylist && (
                                            <div className="post-actions">
                                                <div className="edit-post-btn" onClick={() => handleEditPost(post)}>
                                                    <img src='../../public/img/edit.svg' alt="Редактировать" />
                                                </div>
                                                <div className="delete-post-btn" onClick={() => handleDeletePost(post._id)}>
                                                    <img src='../../public/img/Trash.svg' alt="Удалить" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        !isStylist && <p>Постов пока что нет</p>
                    )}
                </div>
            </div>

            {selectedPhoto && (
                <div className="modal-overlay" onClick={closePhotoModal}>
                    <div className="modal-content photo-modal" onClick={(e) => e.stopPropagation()}>
                        <img src={selectedPhoto} alt="Увеличенное фото" className="zoomed-photo" />
                    </div>
                </div>
            )}

            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-content">
                        <img src="/img/load.svg" alt="Загрузка..." className="loading-icon" />
                    </div>
                </div>
            )}
        </div>
    );
}