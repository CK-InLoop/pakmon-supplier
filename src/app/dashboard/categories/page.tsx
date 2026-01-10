'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, X, ChevronDown, ChevronRight, Edit2, GripVertical, ArrowLeft, ArrowUp, ArrowDown, FolderClosed } from 'lucide-react';
import Link from 'next/link';
import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    toggleSubCategoryActive,
} from '@/app/actions/categories';

interface SubCategory {
    id: string;
    name: string;
    order: number;
    isHeading: boolean;
    isActive: boolean;
}

interface Category {
    id: string;
    name: string;
    icon: string;
    order: number;
    isActive: boolean;
    subCategories: SubCategory[];
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Add category modal
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);

    // Add subcategory modal
    const [isAddingSubCategory, setIsAddingSubCategory] = useState<string | null>(null);
    const [newSubCategoryName, setNewSubCategoryName] = useState('');
    const [newSubCategoryIsHeading, setNewSubCategoryIsHeading] = useState(false);
    const [savingSubCategory, setSavingSubCategory] = useState(false);

    // Edit states
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [editingSubCategory, setEditingSubCategory] = useState<string | null>(null);
    const [editingSubCategoryName, setEditingSubCategoryName] = useState('');

    const [error, setError] = useState('');

    const fetchCategories = async () => {
        try {
            const result = await getAllCategories();
            if (result.success && result.categories) {
                setCategories(result.categories as Category[]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Category CRUD handlers
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setSavingCategory(true);
        setError('');
        try {
            const result = await createCategory({ name: newCategoryName.trim() });
            if (result.success) {
                setNewCategoryName('');
                setIsAddingCategory(false);
                fetchCategories();
            } else {
                setError(result.error || 'Failed to create category');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setSavingCategory(false);
        }
    };

    const handleUpdateCategory = async (id: string) => {
        if (!editingCategoryName.trim()) return;
        try {
            const result = await updateCategory(id, { name: editingCategoryName.trim() });
            if (result.success) {
                setEditingCategory(null);
                fetchCategories();
            }
        } catch (err) {
            console.error('Error updating category:', err);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Are you sure? This will delete all subcategories too.')) return;
        try {
            const result = await deleteCategory(id);
            if (result.success) {
                fetchCategories();
            }
        } catch (err) {
            console.error('Error deleting category:', err);
        }
    };

    const handleToggleCategory = async (id: string, isActive: boolean) => {
        try {
            await toggleCategoryActive(id, !isActive);
            fetchCategories();
        } catch (err) {
            console.error('Error toggling category:', err);
        }
    };

    // SubCategory CRUD handlers
    const handleAddSubCategory = async (categoryId: string) => {
        if (!newSubCategoryName.trim()) return;
        setSavingSubCategory(true);
        try {
            const result = await createSubCategory({
                categoryId,
                name: newSubCategoryName.trim(),
                isHeading: newSubCategoryIsHeading,
            });
            if (result.success) {
                setNewSubCategoryName('');
                setNewSubCategoryIsHeading(false);
                setIsAddingSubCategory(null);
                fetchCategories();
            }
        } catch (err) {
            console.error('Error creating subcategory:', err);
        } finally {
            setSavingSubCategory(false);
        }
    };

    const handleUpdateSubCategory = async (id: string) => {
        if (!editingSubCategoryName.trim()) return;
        try {
            const result = await updateSubCategory(id, { name: editingSubCategoryName.trim() });
            if (result.success) {
                setEditingSubCategory(null);
                fetchCategories();
            }
        } catch (err) {
            console.error('Error updating subcategory:', err);
        }
    };

    const handleDeleteSubCategory = async (id: string) => {
        if (!confirm('Are you sure you want to delete this subcategory?')) return;
        try {
            const result = await deleteSubCategory(id);
            if (result.success) {
                fetchCategories();
            }
        } catch (err) {
            console.error('Error deleting subcategory:', err);
        }
    };

    const handleToggleSubCategory = async (id: string, isActive: boolean) => {
        try {
            await toggleSubCategoryActive(id, !isActive);
            fetchCategories();
        } catch (err) {
            console.error('Error toggling subcategory:', err);
        }
    };

    // Move category order
    const handleMoveCategory = async (id: string, direction: 'up' | 'down') => {
        const currentIndex = categories.findIndex(c => c.id === id);
        if (currentIndex === -1) return;
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= categories.length) return;

        try {
            await updateCategory(id, { order: categories[newIndex].order });
            await updateCategory(categories[newIndex].id, { order: categories[currentIndex].order });
            fetchCategories();
        } catch (err) {
            console.error('Error moving category:', err);
        }
    };

    // Move subcategory order
    const handleMoveSubCategory = async (categoryId: string, subId: string, direction: 'up' | 'down') => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        const currentIndex = category.subCategories.findIndex(s => s.id === subId);
        if (currentIndex === -1) return;
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= category.subCategories.length) return;

        try {
            await updateSubCategory(subId, { order: category.subCategories[newIndex].order });
            await updateSubCategory(category.subCategories[newIndex].id, { order: category.subCategories[currentIndex].order });
            fetchCategories();
        } catch (err) {
            console.error('Error moving subcategory:', err);
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
                        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                        <p className="text-gray-600 mt-1">Manage categories and subcategories</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddingCategory(true)}
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    Add Category
                </button>
            </div>

            {/* Add Category Modal */}
            {isAddingCategory && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={() => setIsAddingCategory(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Add Category</h2>
                                <button
                                    onClick={() => setIsAddingCategory(false)}
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

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="e.g. Oil & Gas"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsAddingCategory(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddCategory}
                                        disabled={!newCategoryName.trim() || savingCategory}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                    >
                                        {savingCategory && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {savingCategory ? 'Adding...' : 'Add Category'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Categories List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : categories.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <FolderClosed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No categories yet</h2>
                    <p className="text-gray-600 mb-6">Add categories to organize your suppliers</p>
                    <button
                        onClick={() => setIsAddingCategory(true)}
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        Add First Category
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {categories.map((category, catIndex) => (
                        <div
                            key={category.id}
                            className={`bg-white rounded-xl shadow-sm border-2 transition ${category.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'
                                }`}
                        >
                            {/* Category Header */}
                            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => handleMoveCategory(category.id, 'up')}
                                        disabled={catIndex === 0}
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleMoveCategory(category.id, 'down')}
                                        disabled={catIndex === categories.length - 1}
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        <ArrowDown className="w-4 h-4" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                >
                                    {expandedCategory === category.id ? (
                                        <ChevronDown className="w-5 h-5" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5" />
                                    )}
                                </button>

                                {editingCategory === category.id ? (
                                    <div className="flex-1 flex gap-2">
                                        <input
                                            type="text"
                                            value={editingCategoryName}
                                            onChange={(e) => setEditingCategoryName(e.target.value)}
                                            className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdateCategory(category.id);
                                                if (e.key === 'Escape') setEditingCategory(null);
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleUpdateCategory(category.id)}
                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingCategory(null)}
                                            className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center gap-3">
                                        <span className="font-semibold text-gray-900">{category.name}</span>
                                        <span className="text-sm text-gray-500">
                                            ({category.subCategories.length} items)
                                        </span>
                                        {!category.isActive && (
                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingCategory(category.id);
                                            setEditingCategoryName(category.name);
                                        }}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleCategory(category.id, category.isActive)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${category.isActive
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {category.isActive ? 'Active' : 'Show'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Subcategories */}
                            {expandedCategory === category.id && (
                                <div className="p-4 bg-gray-50">
                                    {category.subCategories.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                            No subcategories yet
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {category.subCategories.map((sub, subIndex) => (
                                                <div
                                                    key={sub.id}
                                                    className={`flex items-center gap-3 p-3 bg-white rounded-lg border ${sub.isActive ? 'border-gray-200' : 'border-gray-200 opacity-50'
                                                        } ${sub.isHeading ? 'bg-gray-100 font-semibold' : ''}`}
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <button
                                                            onClick={() => handleMoveSubCategory(category.id, sub.id, 'up')}
                                                            disabled={subIndex === 0}
                                                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                        >
                                                            <ArrowUp className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleMoveSubCategory(category.id, sub.id, 'down')}
                                                            disabled={subIndex === category.subCategories.length - 1}
                                                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                        >
                                                            <ArrowDown className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    {editingSubCategory === sub.id ? (
                                                        <div className="flex-1 flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={editingSubCategoryName}
                                                                onChange={(e) => setEditingSubCategoryName(e.target.value)}
                                                                className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleUpdateSubCategory(sub.id);
                                                                    if (e.key === 'Escape') setEditingSubCategory(null);
                                                                }}
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => handleUpdateSubCategory(sub.id)}
                                                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingSubCategory(null)}
                                                                className="px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 flex items-center gap-2">
                                                            <span className={`text-sm ${sub.isHeading ? 'text-gray-700 uppercase text-xs tracking-wider' : 'text-gray-800'}`}>
                                                                {sub.isHeading ? `── ${sub.name} ──` : sub.name}
                                                            </span>
                                                            {sub.isHeading && (
                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                                    Heading
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setEditingSubCategory(sub.id);
                                                                setEditingSubCategoryName(sub.name);
                                                            }}
                                                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleSubCategory(sub.id, sub.isActive)}
                                                            className={`px-2 py-0.5 rounded text-xs font-medium transition ${sub.isActive
                                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            {sub.isActive ? 'Active' : 'Show'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSubCategory(sub.id)}
                                                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add Subcategory */}
                                    {isAddingSubCategory === category.id ? (
                                        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={newSubCategoryName}
                                                    onChange={(e) => setNewSubCategoryName(e.target.value)}
                                                    placeholder="Subcategory name"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubCategory(category.id)}
                                                    autoFocus
                                                />
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={newSubCategoryIsHeading}
                                                        onChange={(e) => setNewSubCategoryIsHeading(e.target.checked)}
                                                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                    />
                                                    <span className="text-gray-700">This is a heading (non-selectable)</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setIsAddingSubCategory(null)}
                                                        className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleAddSubCategory(category.id)}
                                                        disabled={!newSubCategoryName.trim() || savingSubCategory}
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        {savingSubCategory && <Loader2 className="w-3 h-3 animate-spin" />}
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsAddingSubCategory(category.id);
                                                setNewSubCategoryName('');
                                                setNewSubCategoryIsHeading(false);
                                            }}
                                            className="mt-4 flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Subcategory
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
