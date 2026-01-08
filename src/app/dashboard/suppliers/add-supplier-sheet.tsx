'use client';

import { useState, useCallback } from 'react';
import { X, Loader2, Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { createSupplier } from '@/app/actions/suppliers';

interface AddSupplierSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface UploadedImage {
    file: File;
    url: string | null;
    preview: string;
    progress: number;
    status: 'pending' | 'uploading' | 'complete' | 'error';
    error?: string;
}

export function AddSupplierSheet({ isOpen, onClose, onSuccess }: AddSupplierSheetProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [image, setImage] = useState<UploadedImage | null>(null);

    const categories = {
        'OIL & GAS Piping Systems': [
            'NG Factory Pipelines and SKIDS Installation',
            'LNG STORAGE TANKS AND SYSTEM INSTALLATION',
            'NITROGEN & OXYGEN GENERATORS'
        ],
        'Dairy & Food': [
            'Dairy plants',
            'Water treatment plants',
            'CIP Plants',
            'Pilot plant/Mini plant',
            'Factory relocation',
            'SS storage tanks & mixers',
            'Cleaning stations',
            'IBC Dosing Stations',
            'Platforms',
            'SS pipings'
        ],
        'Industrial': [
            'Home and persona care plants',
            'Sulphonation plant',
            'Lab plant',
            'Tank farms',
            'Utility & pipings'
        ],
        'Consulting & Services': [
            'AMC Contracts',
            'Fan Balance and Monitoring',
            'Thermal Inspections',
            'Vibration Checks',
            'Central Lubrication System',
            'Tightening Checks',
            '6S Trainings',
            'TPM (Total Productive Maintenance)',
            'Focused Improvements',
            'Autonomous Maintenance',
            'Planned Maintenance',
            'Energy Savings Risk Assessment',
            'Cost Reductions',
            'Early Equipment Management',
            'HSE Risk Assessments and Predictions',
            'Efficiency Monitoring – FOL',
            'Low Cost Automations',
            'Supply Chain – Raw Materials'
        ]
    };

    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        address: '',
        category: '',
        subCategory: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'category') {
            setFormData({ ...formData, category: value, subCategory: '' });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Upload image to Azure
    const uploadImage = useCallback(async (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage({
                file,
                url: null,
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
                setImage(prev => prev && prev.status === 'uploading' && prev.progress < 85
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

            setImage(prev => prev ? {
                ...prev,
                status: 'complete',
                progress: 100,
                url: data.url
            } : null);

        } catch (err: any) {
            setImage(prev => prev ? {
                ...prev,
                status: 'error',
                error: err.message || 'Upload failed'
            } : null);
        }
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            uploadImage(file);
        }
        e.target.value = '';
    };

    const removeImage = () => {
        setImage(null);
    };

    const retryUpload = () => {
        if (image) {
            uploadImage(image.file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Check if image upload is in progress
        if (image && image.status === 'uploading') {
            setError('Please wait for the image to finish uploading.');
            return;
        }

        if (image && image.status === 'error') {
            setError('Image upload failed. Please retry or remove the image.');
            return;
        }

        setLoading(true);

        try {
            const result = await createSupplier({
                ...formData,
                profileImage: image?.url || undefined,
            });
            if (result.success) {
                setFormData({ name: '', companyName: '', email: '', phone: '', address: '', category: '', subCategory: '' });
                setImage(null);
                onSuccess();
                onClose();
            } else {
                setError(result.error || 'Failed to create supplier');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

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
            <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[450px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-xl font-bold text-gray-900">Add New Supplier</h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <form id="add-supplier-form" onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Logo / Image <span className="text-gray-400 font-normal">(Optional)</span>
                                    </label>

                                    {!image ? (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={handleImageChange}
                                                className="hidden"
                                                id="supplier-image-upload"
                                            />
                                            <label
                                                htmlFor="supplier-image-upload"
                                                className="cursor-pointer flex flex-col items-center"
                                            >
                                                <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                                                <p className="text-gray-600 font-medium text-sm">
                                                    Click to upload image
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    JPEG, PNG or WebP (Max 5MB)
                                                </p>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <img
                                                src={image.preview}
                                                alt="Preview"
                                                className={`w-full h-40 object-cover rounded-lg ${image.status === 'uploading' ? 'opacity-70' : ''}`}
                                            />

                                            {/* Progress overlay */}
                                            {image.status === 'uploading' && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                                                    <div className="flex items-center gap-2 text-white">
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        <span className="text-sm font-medium">{image.progress}%</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Status indicator */}
                                            <div className="absolute top-2 left-2">
                                                {image.status === 'complete' && (
                                                    <CheckCircle className="w-6 h-6 text-green-500 bg-white rounded-full" />
                                                )}
                                                {image.status === 'error' && (
                                                    <AlertCircle className="w-6 h-6 text-red-500 bg-white rounded-full" />
                                                )}
                                            </div>

                                            {/* Remove button */}
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>

                                            {/* Error message and retry */}
                                            {image.status === 'error' && (
                                                <div className="absolute bottom-2 left-2 right-2">
                                                    <button
                                                        type="button"
                                                        onClick={retryUpload}
                                                        className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg transition"
                                                    >
                                                        Retry Upload
                                                    </button>
                                                </div>
                                            )}

                                            {/* Progress bar */}
                                            {image.status === 'uploading' && (
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500 transition-all duration-300"
                                                        style={{ width: `${image.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Personal Info */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Person Name <span className="text-gray-400 font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                        placeholder="+91 9876543210"
                                    />
                                </div>

                                {/* Company Info */}
                                <div className="pt-4 border-t border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Company Details</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Company Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="companyName"
                                                required
                                                value={formData.companyName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                placeholder="e.g. Pakmon Foods Pvt Ltd"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Category <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="category"
                                                    required
                                                    value={formData.category}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition bg-white"
                                                >
                                                    <option value="">Select Category</option>
                                                    {Object.keys(categories).map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Sub-category <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="subCategory"
                                                    required
                                                    value={formData.subCategory}
                                                    onChange={handleChange}
                                                    disabled={!formData.category}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition bg-white disabled:bg-gray-50"
                                                >
                                                    <option value="">Select Sub-category</option>
                                                    {formData.category && categories[formData.category as keyof typeof categories].map(sub => (
                                                        <option key={sub} value={sub}>{sub}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Address <span className="text-gray-400 font-normal">(Optional)</span>
                                            </label>
                                            <textarea
                                                name="address"
                                                rows={3}
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
                                                placeholder="Street address, City, etc."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="add-supplier-form"
                            disabled={loading || (image?.status === 'uploading')}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Adding...' : image?.status === 'uploading' ? 'Uploading...' : 'Add Supplier'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
