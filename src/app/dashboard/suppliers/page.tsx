'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Building2, MapPin, Phone, Mail, Package, ArrowRight, Search, Pencil, Box, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { getSuppliers } from '@/app/actions/suppliers';
import { AddSupplierSheet } from './add-supplier-sheet';
import { EditSupplierSheet } from './edit-supplier-sheet';
import { AddProductSheet } from './add-product-sheet';
import { EditProductSheet } from './edit-product-sheet';

interface Supplier {
    id: string;
    name?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    address?: string;
    category?: string;
    subCategory?: string;
    profileImage?: string;
    status: string;
    _count: {
        products: number;
    };
}

interface DirectProduct {
    id: string;
    title?: string;
    name?: string;
    shortDescription?: string;
    category?: string;
    subCategory?: string;
    images: string[];
    createdAt: Date;
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [directProducts, setDirectProducts] = useState<DirectProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [isEditProductSheetOpen, setIsEditProductSheetOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<DirectProduct | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
    const searchParams = useSearchParams();
    const selectedCategory = searchParams.get('category') || undefined;
    const selectedSubCategory = searchParams.get('subCategory') || undefined;

    useEffect(() => {
        if (searchParams.get('add') === 'true') {
            setIsSheetOpen(true);
        }
    }, [searchParams]);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const result = await getSuppliers({
                category: selectedCategory,
                subCategory: selectedSubCategory,
            });
            if (result.success && result.suppliers) {
                setSuppliers(result.suppliers as any);
            }

            // Also fetch direct products for this category/subcategory
            if (selectedCategory && selectedSubCategory) {
                const { getProducts } = await import('@/app/actions/products');
                const productsResult = await getProducts({
                    category: selectedCategory,
                    subCategory: selectedSubCategory,
                });
                if (productsResult.success && productsResult.products) {
                    // Filter only products without suppliers (direct products)
                    const direct = productsResult.products.filter((p: any) => !p.supplierId);
                    setDirectProducts(direct as any);
                }
            } else {
                setDirectProducts([]);
            }
        } catch (error) {
            console.error('Failed to fetch suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [searchParams]);

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsEditSheetOpen(true);
    };

    const handleEditProduct = (product: DirectProduct) => {
        setSelectedProduct(product);
        setIsEditProductSheetOpen(true);
    };

    const handleDeleteProduct = (id: string, name: string) => {
        setDeleteConfirm({ id, name });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            const { deleteProduct } = await import('@/app/actions/products');
            const result = await deleteProduct(deleteConfirm.id);

            if (result.success) {
                setDeleteConfirm(null);
                await fetchSuppliers(); // Refresh the list
            } else {
                alert(result.error || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Failed to delete product:', error);
            alert('Failed to delete product');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {searchParams.get('category') ? (
                            <div className="flex items-center gap-2">
                                <span>{searchParams.get('category')}</span>
                                <span className="text-gray-400 text-2xl">/</span>
                                <span className="text-green-600 font-semibold">{searchParams.get('subCategory') || 'All'}</span>
                            </div>
                        ) : 'All Suppliers'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {searchParams.get('subCategory')
                            ? `Suppliers in ${searchParams.get('category')} > ${searchParams.get('subCategory')}`
                            : 'Manage your supplier network'}
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={() => setIsProductSheetOpen(true)}
                        className="flex-shrink-0 whitespace-nowrap flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
                    >
                        <Box className="w-5 h-5" />
                        Add Product
                    </button>
                    <button
                        onClick={() => setIsSheetOpen(true)}
                        className="flex-shrink-0 whitespace-nowrap flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
                    >
                        <Plus className="w-5 h-5" />
                        Add Supplier
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by company, name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading suppliers...</div>
                </div>
            ) : filteredSuppliers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {searchTerm ? 'No matches found' : 'No suppliers yet'}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {searchTerm ? 'Try adjusting your search terms' : 'Add your first supplier to get started'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => setIsSheetOpen(true)}
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold hover:shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Add Supplier
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuppliers.map((supplier) => (
                        <div
                            key={supplier.id}
                            className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden relative group"
                        >
                            <Link
                                href={`/dashboard/products?supplierId=${supplier.id}`}
                                className="absolute inset-0 z-10"
                                aria-label={`View products for ${supplier.name}`}
                            />
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleEditSupplier(supplier);
                                        }}
                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition relative z-20"
                                        title="Edit Supplier"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                                    {supplier.companyName || supplier.name}
                                </h3>
                                {(supplier.category || supplier.subCategory) && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {supplier.category && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {supplier.category}
                                            </span>
                                        )}
                                        {supplier.subCategory && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                {supplier.subCategory}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <p className="text-sm text-gray-500 mb-4">{supplier.name}</p>

                                <div className="space-y-2 text-sm text-gray-600 mb-6">
                                    {supplier.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span className="truncate">{supplier.email}</span>
                                        </div>
                                    )}
                                    {supplier.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span>{supplier.phone}</span>
                                        </div>
                                    )}
                                    {supplier.address && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <span className="line-clamp-2">{supplier.address}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                                        <Package className="w-4 h-4 text-gray-400" />
                                        {supplier._count.products} Product{supplier._count.products !== 1 ? 's' : ''}
                                    </div>

                                    <div
                                        className="flex items-center gap-1 text-sm font-semibold text-green-600 group-hover:text-green-700 transition"
                                    >
                                        View Products
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Direct Products Section */}
            {selectedCategory && selectedSubCategory && directProducts.length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Direct Products in this Subcategory</h2>
                        <span className="text-sm text-gray-600">{directProducts.length} product{directProducts.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {directProducts.map((product) => {
                            const mainImage = Array.isArray(product.images) && product.images.length > 0
                                ? product.images[0]
                                : null;

                            return (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-blue-100 overflow-hidden"
                                >
                                    {/* Product Image */}
                                    <div className="relative h-48 bg-gray-50">
                                        {mainImage ? (
                                            <img
                                                src={mainImage}
                                                alt={product.title || product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Box className="w-16 h-16 text-gray-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                                                    {product.title || product.name || 'Untitled Product'}
                                                </h3>
                                                <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                                    Direct Product
                                                </span>
                                            </div>
                                        </div>

                                        {product.shortDescription && (
                                            <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                                                {product.shortDescription}
                                            </p>
                                        )}

                                        <div className="text-xs text-gray-500 mb-4">
                                            Added {new Date(product.createdAt).toLocaleDateString()}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditProduct(product)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition"
                                            >
                                                <Pencil className="w-3 h-3" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id, product.title || product.name || 'this product')}
                                                className="flex items-center justify-center px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <AddSupplierSheet
                isOpen={isSheetOpen}
                initialCategory={selectedCategory}
                initialSubCategory={selectedSubCategory}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={() => {
                    fetchSuppliers();
                }}
            />

            <AddProductSheet
                isOpen={isProductSheetOpen}
                initialCategory={selectedCategory}
                initialSubCategory={selectedSubCategory}
                onClose={() => setIsProductSheetOpen(false)}
                onSuccess={() => {
                    fetchSuppliers();
                }}
            />

            <EditSupplierSheet
                isOpen={isEditSheetOpen}
                supplier={selectedSupplier}
                onClose={() => {
                    setIsEditSheetOpen(false);
                    setSelectedSupplier(null);
                }}
                onSuccess={() => {
                    fetchSuppliers();
                }}
            />

            <EditProductSheet
                isOpen={isEditProductSheetOpen}
                product={selectedProduct}
                onClose={() => {
                    setIsEditProductSheetOpen(false);
                    setSelectedProduct(null);
                }}
                onSuccess={() => {
                    fetchSuppliers();
                }}
            />

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Delete Product</h3>
                        </div>
                        
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteConfirm.name}</span>? 
                            This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

