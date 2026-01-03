'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Building2, MapPin, Phone, Mail, Package, ArrowRight, Search } from 'lucide-react';
import { getSuppliers } from '@/app/actions/suppliers';
import { AddSupplierSheet } from './add-supplier-sheet';

interface Supplier {
    id: string;
    name?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    address?: string;
    status: string;
    _count: {
        products: number;
    };
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSuppliers = async () => {
        try {
            const result = await getSuppliers();
            if (result.success && result.suppliers) {
                setSuppliers(result.suppliers as any);
            }
        } catch (error) {
            console.error('Failed to fetch suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
                    <p className="text-gray-600 mt-2">Manage your supplier network</p>
                </div>
                <button
                    onClick={() => setIsSheetOpen(true)}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
                >
                    <Plus className="w-5 h-5" />
                    Add Supplier
                </button>
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
                            className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${supplier.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {supplier.status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                                    {supplier.companyName || supplier.name}
                                </h3>
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

                                    <Link
                                        href={`/dashboard/products?supplierId=${supplier.id}`}
                                        className="flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700 transition"
                                    >
                                        View Products
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddSupplierSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={() => {
                    fetchSuppliers();
                }}
            />
        </div>
    );
}
