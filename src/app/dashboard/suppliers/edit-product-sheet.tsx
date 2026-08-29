'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Loader2, Upload, Image as ImageIcon, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { updateProduct } from '@/app/actions/products';
import { getCategories } from '@/app/actions/categories';

interface EditProductSheetProps {
    isOpen: boolean;
    product: DirectProduct | null;
    onClose: () => void;
    onSuccess: () => void;
}

interface DirectProduct {
    id: string;
    title?: string;
    name?: string;
    shortDescription?: string;
    fullDescription?: string;
    specifications?: string;
    category?: string;
    subCategory?: string;
    images: string[];
    pdfFiles?: string[];
    priceRange?: string;
    capacity?: string;
    tags?: string[];
    youtubeUrl?: string;
    createdAt: Date;
}

interface UploadedFile {
    file: File;
    url: string | null;
    preview?: string;
    progress: number;
    status: 'pending' | 'uploading' | 'complete' | 'error';
    error?: string;
}

interface SubCategory {
    id: string;
    name: string;
    isHeading: boolean;
}

interface Category {
    id: string;
    name: string;
    subCategories: SubCategory[];
}

export function EditProductSheet({
    isOpen,
    product,
    onClose,
    onSuccess,
}: EditProductSheetProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [newImages, setNewImages] = useState<UploadedFile[]>([]);
    const [newFiles, setNewFiles] = useState<UploadedFile[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [existingFiles, setExistingFiles] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        shortDescription: '',
        fullDescription: '',
        specifications: '',
        category: '',
        subCategory: '',
        priceRange: '',
        capacity: '',
        tags: '',
        youtubeUrl: '',
    });

    // Fetch categories from database
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const result = await getCategories();
                if (result.success && result.categories) {
                    setCategories(result.categories as Category[]);
                }
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    // Load product data when sheet opens
    useEffect(() => {
        if (!isOpen || !product) {
            setFormData({
                title: '',
                shortDescription: '',
                fullDescription: '',
                specifications: '',
                category: '',
                subCategory: '',
                priceRange: '',
                capacity: '',
                tags: '',
                youtubeUrl: '',
            });
            setExistingImages([]);
            setExistingFiles([]);
            setNewImages([]);
            setNewFiles([]);
            setError('');
            return;
        }

        setFormData({
            title: product.title || product.name || '',
            shortDescription: product.shortDescription || '',
            fullDescription: product.fullDescription || '',
            specifications: product.specifications || '',
            category: product.category || '',
            subCategory: product.subCategory || '',
            priceRange: product.priceRange || '',
            capacity: product.capacity || '',
            tags: (product.tags || []).join(', '),
            youtubeUrl: product.youtubeUrl || '',
        });
        setExistingImages(product.images || []);
        setExistingFiles(product.pdfFiles || []);
    }, [isOpen, product]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'category') {
            setFormData({ ...formData, category: value, subCategory: '' });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Get subcategories for selected category
    const getSubCategories = () => {
        const selectedCategory = categories.find(c => c.name === formData.category);
        return selectedCategory?.subCategories || [];
    };

    // Upload file to Azure
    const uploadFile = useCallback(async (
        file: File,
        type: 'image' | 'pdf',
        index: number,
        setterFn: React.Dispatch<React.SetStateAction<UploadedFile[]>>
    ) => {
        setterFn(prev => prev.map((item, i) =>
            i === index ? { ...item, status: 'uploading' as const, progress: 10 } : item
        ));

        let progressInterval: NodeJS.Timeout | null = null;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);

            progressInterval = setInterval(() => {
                setterFn(prev => prev.map((item, i) =>
                    i === index && item.status === 'uploading' && item.progress < 85
                        ? { ...item, progress: Math.min(item.progress + 10, 85) }
                        : item
                ));
            }, 300);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setterFn(prev => prev.map((item, i) =>
                i === index ? {
                    ...item,
                    status: 'complete' as const,
                    progress: 100,
                    url: data.url
                } : item
            ));

        } catch (err: any) {
            if (progressInterval) clearInterval(progressInterval);
            setterFn(prev => prev.map((item, i) =>
                i === index ? {
                    ...item,
                    status: 'error' as const,
                    error: err.message || 'Upload failed'
                } : item
            ));
        }
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        const newImageFiles: UploadedFile[] = selectedFiles.map(file => {
            const preview = URL.createObjectURL(file);
            
            return {
                file,
                url: null,
                preview,
                progress: 0,
                status: 'pending' as const,
            };
        });

        setNewImages(prev => [...prev, ...newImageFiles]);

        // Start uploading
        newImageFiles.forEach((_, idx) => {
            const actualIndex = newImages.length + idx;
            uploadFile(selectedFiles[idx], 'image', actualIndex, setNewImages);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        const newPdfFiles: UploadedFile[] = selectedFiles.map(file => ({
            file,
            url: null,
            progress: 0,
            status: 'pending' as const,
        }));

        setNewFiles(prev => [...prev, ...newPdfFiles]);

        // Start uploading
        newPdfFiles.forEach((_, idx) => {
            const actualIndex = newFiles.length + idx;
            uploadFile(selectedFiles[idx], 'pdf', actualIndex, setNewFiles);
        });
    };

    const removeExistingImage = (url: string) => {
        setExistingImages(prev => prev.filter(u => u !== url));
    };

    const removeExistingFile = (url: string) => {
        setExistingFiles(prev => prev.filter(u => u !== url));
    };

    const removeNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    };

    const retryUpload = (index: number, type: 'image' | 'pdf') => {
        if (type === 'image') {
            const item = newImages[index];
            if (item) {
                setNewImages(prev => prev.map((img, i) =>
                    i === index ? { ...img, status: 'pending' as const, progress: 0, error: undefined } : img
                ));
                uploadFile(item.file, 'image', index, setNewImages);
            }
        } else {
            const item = newFiles[index];
            if (item) {
                setNewFiles(prev => prev.map((f, i) =>
                    i === index ? { ...f, status: 'pending' as const, progress: 0, error: undefined } : f
                ));
                uploadFile(item.file, 'pdf', index, setNewFiles);
            }
        }
    };

    const allUploadsComplete = () => {
        const imagesDone = newImages.every(img => img.status === 'complete');
        const filesDone = newFiles.every(f => f.status === 'complete');
        return imagesDone && filesDone;
    };

    const hasUploadErrors = () => {
        return newImages.some(img => img.status === 'error') || newFiles.some(f => f.status === 'error');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        setError('');

        // Validation
        if (!formData.title || !formData.shortDescription || !formData.fullDescription) {
            setError('Title, short description, and full description are required');
            return;
        }

        if (!formData.category || !formData.subCategory) {
            setError('Please select both category and subcategory');
            return;
        }

        // Check if uploads are still in progress
        if (!allUploadsComplete()) {
            if (hasUploadErrors()) {
                setError('Some files failed to upload. Please retry or remove them before submitting.');
            } else {
                setError('Please wait for all files to finish uploading.');
            }
            return;
        }

        setLoading(true);

        try {
            const newImageUrls = newImages.filter(img => img.url).map(img => img.url!);
            const newFileUrls = newFiles.filter(f => f.url).map(f => f.url!);
            const allImages = [...existingImages, ...newImageUrls];
            const allFiles = [...existingFiles, ...newFileUrls];
            const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];

            const result = await updateProduct(product.id, {
                title: formData.title,
                shortDescription: formData.shortDescription,
                fullDescription: formData.fullDescription,
                specifications: formData.specifications || undefined,
                category: formData.category,
                subCategory: formData.subCategory,
                priceRange: formData.priceRange || undefined,
                capacity: formData.capacity || undefined,
                tags,
                images: allImages,
                pdfFiles: allFiles,
                youtubeUrl: formData.youtubeUrl || undefined,
            });

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.error || 'Failed to update product');
            }
        } catch (err) {
            console.error('Exception during update:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!product) return null;

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Slide-over Panel */}
            <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[550px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* SubCategory */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        SubCategory <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="subCategory"
                                        value={formData.subCategory}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.category}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
                                    >
                                        <option value="">Select SubCategory</option>
                                        {getSubCategories().filter(sub => !sub.isHeading).map(sub => (
                                            <option key={sub.id} value={sub.name}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                        placeholder="e.g., RO Water Purifier"
                                    />
                                </div>

                                {/* Short Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Short Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="shortDescription"
                                        value={formData.shortDescription}
                                        onChange={handleChange}
                                        required
                                        rows={2}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
                                        placeholder="Brief description (1-2 sentences)"
                                    />
                                </div>

                                {/* Full Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="fullDescription"
                                        value={formData.fullDescription}
                                        onChange={handleChange}
                                        required
                                        rows={4}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
                                        placeholder="Detailed product description"
                                    />
                                </div>

                                {/* Specifications */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Specifications <span className="text-gray-400 font-normal">(Optional)</span>
                                    </label>
                                    <textarea
                                        name="specifications"
                                        value={formData.specifications}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
                                        placeholder="Technical specifications"
                                    />
                                </div>

                                {/* Price Range */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Price Range <span className="text-gray-400 font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="priceRange"
                                        value={formData.priceRange}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                        placeholder="e.g., ₹50,000 - ₹1,00,000"
                                    />
                                </div>

                                {/* Capacity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Capacity <span className="text-gray-400 font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="capacity"
                                        value={formData.capacity}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                        placeholder="e.g., 2000 L/day"
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tags <span className="text-gray-400 font-normal">(Optional, comma-separated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="tags"
                                        value={formData.tags}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                        placeholder="e.g., water treatment, industrial, eco-friendly"
                                    />
                                </div>

                                {/* YouTube URL */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        YouTube Video URL <span className="text-gray-400 font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="url"
                                        name="youtubeUrl"
                                        value={formData.youtubeUrl}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                        placeholder="https://youtube.com/watch?v=..."
                                    />
                                </div>

                                {/* Existing Images */}
                                {existingImages.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Images
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {existingImages.map((url, idx) => (
                                                <div key={idx} className="relative group">
                                                    <img src={url} alt={`Product ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingImage(url)}
                                                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Add More Images <span className="text-gray-400 font-normal">(Optional)</span>
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            multiple
                                            onChange={handleImageChange}
                                            className="hidden"
                                            id="edit-product-images-upload"
                                        />
                                        <label
                                            htmlFor="edit-product-images-upload"
                                            className="cursor-pointer flex flex-col items-center"
                                        >
                                            <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600">Click to upload images</span>
                                            <span className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 10MB each</span>
                                        </label>
                                    </div>

                                    {/* New Image Previews */}
                                    {newImages.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {newImages.map((img, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    {img.preview && (
                                                        <img src={img.preview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-700 truncate">{img.file.name}</p>
                                                        {img.status === 'uploading' && (
                                                            <div className="mt-1">
                                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                    <div className="bg-green-600 h-1.5 rounded-full transition-all" style={{ width: `${img.progress}%` }} />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {img.status === 'complete' && (
                                                            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                                                <CheckCircle className="w-3 h-3" /> Uploaded
                                                            </p>
                                                        )}
                                                        {img.status === 'error' && (
                                                            <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                                                <AlertCircle className="w-3 h-3" /> {img.error}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {img.status === 'error' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => retryUpload(idx, 'image')}
                                                                className="text-xs text-green-600 hover:text-green-700 font-medium"
                                                            >
                                                                Retry
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeNewImage(idx)}
                                                            className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Existing PDF Files */}
                                {existingFiles.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current PDF Files
                                        </label>
                                        <div className="space-y-2">
                                            {existingFiles.map((url, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <FileText className="w-8 h-8 text-red-500" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-700 truncate">
                                                            {url.split('/').pop() || `Document ${idx + 1}`}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingFile(url)}
                                                        className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* PDF Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Add More PDF Documents <span className="text-gray-400 font-normal">(Optional)</span>
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors">
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            multiple
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="edit-product-files-upload"
                                        />
                                        <label
                                            htmlFor="edit-product-files-upload"
                                            className="cursor-pointer flex flex-col items-center"
                                        >
                                            <FileText className="w-10 h-10 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600">Click to upload PDFs</span>
                                            <span className="text-xs text-gray-500 mt-1">PDF up to 10MB each</span>
                                        </label>
                                    </div>

                                    {/* New File Previews */}
                                    {newFiles.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {newFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <FileText className="w-8 h-8 text-red-500" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-700 truncate">{file.file.name}</p>
                                                        {file.status === 'uploading' && (
                                                            <div className="mt-1">
                                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                    <div className="bg-green-600 h-1.5 rounded-full transition-all" style={{ width: `${file.progress}%` }} />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {file.status === 'complete' && (
                                                            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                                                <CheckCircle className="w-3 h-3" /> Uploaded
                                                            </p>
                                                        )}
                                                        {file.status === 'error' && (
                                                            <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                                                <AlertCircle className="w-3 h-3" /> {file.error}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {file.status === 'error' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => retryUpload(idx, 'pdf')}
                                                                className="text-xs text-green-600 hover:text-green-700 font-medium"
                                                            >
                                                                Retry
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeNewFile(idx)}
                                                            className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="border-t p-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="edit-product-form"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Product'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
