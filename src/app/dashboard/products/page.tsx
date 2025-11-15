'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, CheckCircle, Clock, Eye } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  specifications?: string;
  images: string[];
  pdfFiles: string[];
  signedImageUrls?: string[];
  signedFileUrls?: string[];
  category: string;
  tags: string[];
  priceRange?: string;
  capacity?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  viewCount: number;
  matchCount: number;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/list');
      const data = await response.json();
      
      if (!response.ok) {
        // Check if redirect is needed (e.g., onboarding not completed)
        if (data.redirect) {
          window.location.href = data.redirect;
          return;
        }
        throw new Error(data.error || 'Failed to fetch products');
      }
      
      // Generate signed URLs for images and PDFs
      const productsWithSignedUrls = await Promise.all(
        data.products.map(async (product: Product) => {
          try {
            // Generate signed URLs for images
            const imageResponse = await fetch('/api/files/signed-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'images',
                urls: product.images,
                expiresIn: 3600 // 1 hour
              })
            });
            const imageData = await imageResponse.json();
            
            // Generate signed URLs for PDFs
            const pdfResponse = await fetch('/api/files/signed-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'pdfs',
                urls: product.pdfFiles,
                expiresIn: 3600 // 1 hour
              })
            });
            const pdfData = await pdfResponse.json();
            
            return {
              ...product,
              signedImageUrls: imageData.signedUrls || product.images,
              signedFileUrls: pdfData.signedUrls || product.pdfFiles
            };
          } catch (error) {
            console.error('Error generating signed URLs for product:', product.id, error);
            return {
              ...product,
              signedImageUrls: product.images,
              signedFileUrls: product.pdfFiles
            };
          }
        })
      );
      
      setProducts(productsWithSignedUrls);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setDeleteLoading(id);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if redirect is needed (e.g., onboarding not completed)
        if (data.redirect) {
          window.location.href = data.redirect;
          return;
        }
        throw new Error(data.error || 'Failed to delete product');
      }

      // Successfully deleted - remove from list
      setProducts(products.filter((p) => p.id !== id));
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert(error.message || 'Failed to delete product. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-2">Manage your product catalog</p>
        </div>
        <Link
          href="/dashboard/products/add"
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No products yet
          </h2>
          <p className="text-gray-600 mb-6">
            Add your first product to start appearing in AI-powered searches
          </p>
          <Link
            href="/dashboard/products/add"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
            >
              {/* Product Image */}
              {product.signedImageUrls && product.signedImageUrls.length > 0 ? (
                <div className="h-48 bg-gray-200 relative group">
                  <img
                    src={product.signedImageUrls[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to original URL if signed URL fails
                      (e.target as HTMLImageElement).src = product.images[0];
                    }}
                  />
                  {/* Image count indicator */}
                  {product.signedImageUrls.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      +{product.signedImageUrls.length - 1} more
                    </div>
                  )}
                </div>
              ) : product.images.length > 0 ? (
                <div className="h-48 bg-gray-200">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
              )}

              <div className="p-6">
                {/* Status Badge */}
                <div className="mb-3">
                  {product.status === 'APPROVED' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Approved
                    </span>
                  ) : product.status === 'REJECTED' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full font-medium">
                      <Clock className="w-4 h-4" />
                      Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">
                      <Clock className="w-4 h-4" />
                      Pending
                    </span>
                  )}
                </div>

                {/* Product Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                  {product.title}
                </h3>

                {/* Product Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {product.shortDescription}
                </p>

                {/* Tags */}
                {product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {product.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{product.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Files Indicator */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  {product.signedFileUrls && product.signedFileUrls.length > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      {product.signedFileUrls.length} PDF{product.signedFileUrls.length > 1 ? 's' : ''}
                    </div>
                  )}
                  {product.signedImageUrls && product.signedImageUrls.length > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      {product.signedImageUrls.length} Image{product.signedImageUrls.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {product.matchCount} matches
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/products/${product.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deleteLoading === product.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
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

function Package({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

