'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Loader2, X, ImageIcon, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getAllCarouselImages, addCarouselImage, deleteCarouselImage, toggleCarouselImageActive } from '@/app/actions/carousel';

interface CarouselImage {
    id: string;
    imageUrl: string;
    title?: string;
    description?: string;
    link: string;
    order: number;
    isActive: boolean;
}

interface UploadingImage {
    file: File;
    preview: string;
    progress: number;
    status: 'uploading' | 'complete' | 'error';
    url?: string;
    error?: string;
}

export default function CarouselPage() {
    const [images, setImages] = useState<CarouselImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingImage, setIsAddingImage] = useState(false);
    const [uploadingImage, setUploadingImage] = useState<UploadingImage | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchImages = async () => {
        try {
            const result = await getAllCarouselImages();
            if (result.success && result.images) {
                setImages(result.images as CarouselImage[]);
            }
        } catch (error) {
            console.error('Error fetching carousel images:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const uploadImage = useCallback(async (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadingImage({
                file,
                preview: reader.result as string,
                progress: 0,
                status: 'uploading',
            });
        };
        reader.readAsDataURL(file);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'image');

            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadingImage(prev => prev && prev.status === 'uploading' && prev.progress < 85
                    ? { ...prev, progress: Math.min(prev.progress + 15, 85) }
                    : prev
                );
            }, 200);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setUploadingImage(prev => prev ? {
                ...prev,
                status: 'complete',
                progress: 100,
                url: data.url
            } : null);

        } catch (err: any) {
            setUploadingImage(prev => prev ? {
                ...prev,
                status: 'error',
                error: err.message || 'Upload failed'
            } : null);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            uploadImage(file);
        }
        e.target.value = '';
    };

    const handleSaveImage = async () => {
        if (!uploadingImage?.url) return;

        setSaving(true);
        setError('');

        try {
            const result = await addCarouselImage({
                imageUrl: uploadingImage.url,
                title: '',
                description: '',
                link: '/products',
            });

            if (result.success) {
                setUploadingImage(null);
                setIsAddingImage(false);
                fetchImages();
            } else {
                setError(result.error || 'Failed to add image');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteImage = async (id: string) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            const result = await deleteCarouselImage(id);
            if (result.success) {
                fetchImages();
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await toggleCarouselImageActive(id, !isActive);
            fetchImages();
        } catch (error) {
            console.error('Error toggling image:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Carousel Images</h1>
                        <p className="text-gray-600 mt-1">Manage homepage slider images</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddingImage(true)}
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    Add Image
                </button>
            </div>

            {/* Add Image Modal */}
            {isAddingImage && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={() => {
                            setIsAddingImage(false);
                            setUploadingImage(null);
                        }}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Add Carousel Image</h2>
                                <button
                                    onClick={() => {
                                        setIsAddingImage(false);
                                        setUploadingImage(null);
                                    }}
                                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                                    {error}
                                </div>
                            )}

                            {!uploadingImage ? (
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="carousel-image-upload"
                                    />
                                    <label
                                        htmlFor="carousel-image-upload"
                                        className="cursor-pointer flex flex-col items-center"
                                    >
                                        <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                                        <p className="text-gray-600 font-medium">
                                            Click to upload image
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            JPEG, PNG or WebP (Recommended: 1920x600)
                                        </p>
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                                        <img
                                            src={uploadingImage.preview}
                                            alt="Preview"
                                            className={`w-full h-full object-cover ${uploadingImage.status === 'uploading' ? 'opacity-70' : ''}`}
                                        />

                                        {uploadingImage.status === 'uploading' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <div className="flex items-center gap-2 text-white">
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                    <span className="font-medium">{uploadingImage.progress}%</span>
                                                </div>
                                            </div>
                                        )}

                                        {uploadingImage.status === 'complete' && (
                                            <div className="absolute top-3 left-3">
                                                <CheckCircle className="w-8 h-8 text-green-500 bg-white rounded-full" />
                                            </div>
                                        )}

                                        {uploadingImage.status === 'error' && (
                                            <div className="absolute top-3 left-3">
                                                <AlertCircle className="w-8 h-8 text-red-500 bg-white rounded-full" />
                                            </div>
                                        )}

                                        {uploadingImage.status === 'uploading' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                                                <div
                                                    className="h-full bg-green-500 transition-all duration-300"
                                                    style={{ width: `${uploadingImage.progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {uploadingImage.status === 'error' && (
                                        <p className="text-red-600 text-sm">{uploadingImage.error}</p>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setUploadingImage(null)}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveImage}
                                            disabled={uploadingImage.status !== 'complete' || saving}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                            {saving ? 'Saving...' : 'Add to Carousel'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Images Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading...</div>
                </div>
            ) : images.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No carousel images yet</h2>
                    <p className="text-gray-600 mb-6">Add images to display on the homepage slider</p>
                    <button
                        onClick={() => setIsAddingImage(true)}
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        Add First Image
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((image, index) => (
                        <div
                            key={image.id}
                            className={`bg-white rounded-xl shadow-sm overflow-hidden border-2 transition ${image.isActive ? 'border-green-200' : 'border-gray-200 opacity-60'
                                }`}
                        >
                            <div className="relative aspect-video">
                                <img
                                    src={image.imageUrl}
                                    alt={image.title || `Slide ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm font-medium">
                                    #{index + 1}
                                </div>
                                {!image.isActive && (
                                    <div className="absolute top-2 right-12 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                                        Hidden
                                    </div>
                                )}
                                <button
                                    onClick={() => handleDeleteImage(image.id)}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-lg hover:bg-red-700 transition"
                                    title="Delete Image"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 truncate">
                                        {image.title || 'Carousel Slide'}
                                    </span>
                                    <button
                                        onClick={() => handleToggleActive(image.id, image.isActive)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${image.isActive
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {image.isActive ? 'Active' : 'Show'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
