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
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, []);

  // Helper function to validate URLs
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return false;
    }
    // Check if it's a valid URL format (http/https or relative path)
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        new URL(url);
        return true;
      }
      // Allow relative paths or R2 keys
      return url.length > 0;
    } catch {
      return false;
    }
  };

  // Helper function to filter valid URLs from array
  const filterValidUrls = (urls: string[] | null | undefined): string[] => {
    if (!Array.isArray(urls)) {
      return [];
    }
    return urls.filter(isValidUrl);
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/list');
      
      // Check response status before parsing
      if (!response.ok) {
        // Try to read response as text first to safely parse JSON
        let errorData: any = {};
        try {
          const text = await response.text();
          if (text) {
            errorData = JSON.parse(text);
          }
        } catch {
          // If parsing fails, use default error message
          errorData = { error: `Failed to fetch products: ${response.status} ${response.statusText}` };
        }
        
        // Check if redirect is needed (e.g., onboarding not completed)
        if (errorData.redirect) {
          window.location.href = errorData.redirect;
          return;
        }
        throw new Error(errorData.error || 'Failed to fetch products');
      }

      // Safely parse JSON response
      let data: { products?: Product[] };
      try {
        const text = await response.text();
        if (!text || text.trim() === '') {
          throw new Error('Empty response from server');
        }
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!data.products || !Array.isArray(data.products)) {
        console.warn('Invalid products data received:', data);
        setProducts([]);
        return;
      }

      // Collect all image and PDF URLs from all products
      const allImageUrls: string[] = [];
      const allPdfUrls: string[] = [];
      const productUrlMaps: Array<{ productIndex: number; imageIndices: number[]; pdfIndices: number[] }> = [];

      data.products.forEach((product: Product, productIndex: number) => {
        const validImages = filterValidUrls(product.images);
        const validPdfs = filterValidUrls(product.pdfFiles);

        const imageIndices: number[] = [];
        validImages.forEach((url) => {
          const index = allImageUrls.length;
          allImageUrls.push(url);
          imageIndices.push(index);
        });

        const pdfIndices: number[] = [];
        validPdfs.forEach((url) => {
          const index = allPdfUrls.length;
          allPdfUrls.push(url);
          pdfIndices.push(index);
        });

        productUrlMaps.push({ productIndex, imageIndices, pdfIndices });
      });

      // Batch request signed URLs for all images and PDFs
      let allSignedImageUrls: string[] = [];
      let allSignedPdfUrls: string[] = [];

      try {
        // Request signed URLs for all images in one call
        if (allImageUrls.length > 0) {
          const imageResponse = await fetch('/api/files/signed-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'images',
              urls: allImageUrls,
              expiresIn: 3600
            })
          });

          if (imageResponse.ok) {
            try {
              const imageData = await imageResponse.json();
              allSignedImageUrls = imageData.signedUrls || allImageUrls;
            } catch (error) {
              console.error('Error parsing image signed URLs response:', error);
              allSignedImageUrls = allImageUrls; // Fallback to original URLs
            }
          } else {
            console.warn('Failed to get signed image URLs, using original URLs');
            allSignedImageUrls = allImageUrls;
          }
        }

        // Request signed URLs for all PDFs in one call
        if (allPdfUrls.length > 0) {
          const pdfResponse = await fetch('/api/files/signed-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'pdfs',
              urls: allPdfUrls,
              expiresIn: 3600
            })
          });

          if (pdfResponse.ok) {
            try {
              const pdfData = await pdfResponse.json();
              allSignedPdfUrls = pdfData.signedUrls || allPdfUrls;
            } catch (error) {
              console.error('Error parsing PDF signed URLs response:', error);
              allSignedPdfUrls = allPdfUrls; // Fallback to original URLs
            }
          } else {
            console.warn('Failed to get signed PDF URLs, using original URLs');
            allSignedPdfUrls = allPdfUrls;
          }
        }
      } catch (error) {
        console.error('Error generating signed URLs:', error);
        // Fallback to original URLs if batch request fails
        allSignedImageUrls = allImageUrls;
        allSignedPdfUrls = allPdfUrls;
      }

      // Map signed URLs back to products
      const productsWithSignedUrls = data.products.map((product: Product, productIndex: number) => {
        const urlMap = productUrlMaps[productIndex];
        const signedImageUrls: string[] = urlMap.imageIndices.map(
          (index) => allSignedImageUrls[index] || product.images[index] || ''
        ).filter(Boolean);
        const signedFileUrls: string[] = urlMap.pdfIndices.map(
          (index) => allSignedPdfUrls[index] || product.pdfFiles[index] || ''
        ).filter(Boolean);

        return {
          ...product,
          signedImageUrls: signedImageUrls.length > 0 ? signedImageUrls : product.images || [],
          signedFileUrls: signedFileUrls.length > 0 ? signedFileUrls : product.pdfFiles || []
        };
      });

      setProducts(productsWithSignedUrls);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Failed to load products. Please refresh the page.');
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

      // Safely parse JSON response
      let data: any = {};
      try {
        const text = await response.text();
        if (text && text.trim()) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.error('Error parsing delete response:', parseError);
        // If response is empty but status is OK, consider it success
        if (response.ok) {
          setProducts(products.filter((p) => p.id !== id));
          return;
        }
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        // Check if redirect is needed (e.g., onboarding not completed)
        if (data.redirect) {
          window.location.href = data.redirect;
          return;
        }
        throw new Error(data.error || `Failed to delete product: ${response.status} ${response.statusText}`);
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading products</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => {
              setError('');
              fetchProducts();
            }}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

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
                      const img = e.target as HTMLImageElement;
                      // Try original URL once, then hide if that also fails
                      if (img.src !== product.images[0] && product.images[0]) {
                        img.src = product.images[0];
                      } else {
                        // Hide image and show placeholder instead
                        img.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.className = 'h-48 bg-gray-100 flex items-center justify-center';
                        placeholder.innerHTML = '<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                        img.parentElement?.appendChild(placeholder);
                      }
                    }}
                    loading="lazy"
                  />
                  {/* Image count indicator */}
                  {product.signedImageUrls.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      +{product.signedImageUrls.length - 1} more
                    </div>
                  )}
                </div>
              ) : product.images.length > 0 ? (
                <div className="h-48 bg-gray-200 relative">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide failed image and show placeholder
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      const placeholder = document.createElement('div');
                      placeholder.className = 'h-48 bg-gray-100 flex items-center justify-center absolute inset-0';
                      placeholder.innerHTML = '<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                      img.parentElement?.appendChild(placeholder);
                    }}
                    loading="lazy"
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

