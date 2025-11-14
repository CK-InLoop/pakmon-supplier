'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { X, FileText, Image as ImageIcon } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  specifications?: string;
  tags: string[];
  images: string[];
  pdfFiles: string[];
  signedImageUrls?: string[];
  signedFileUrls?: string[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    specs: '',
    tags: '',
  });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();
      
      if (!response.ok) {
        if (data.redirect) {
          router.push(data.redirect);
          return;
        }
        throw new Error(data.error || 'Failed to load product');
      }

      // Generate signed URLs for existing images and PDFs
      let signedImageUrls: string[] = [];
      let signedFileUrls: string[] = [];

      try {
        // Generate signed URLs for images
        if (data.product.images && data.product.images.length > 0) {
          const imageResponse = await fetch('/api/files/signed-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'images',
              urls: data.product.images,
              expiresIn: 3600
            })
          });
          const imageData = await imageResponse.json();
          signedImageUrls = imageData.signedUrls || data.product.images;
        }

        // Generate signed URLs for PDFs
        if (data.product.pdfFiles && data.product.pdfFiles.length > 0) {
          const pdfResponse = await fetch('/api/files/signed-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'pdfs',
              urls: data.product.pdfFiles,
              expiresIn: 3600
            })
          });
          const pdfData = await pdfResponse.json();
          signedFileUrls = pdfData.signedUrls || data.product.pdfFiles;
        }
      } catch (error) {
        console.error('Error generating signed URLs:', error);
        // Use original URLs as fallback
        signedImageUrls = data.product.images || [];
        signedFileUrls = data.product.pdfFiles || [];
      }

      const productWithSignedUrls = {
        ...data.product,
        signedImageUrls,
        signedFileUrls
      };

      setProduct(productWithSignedUrls);
      setFormData({
        title: data.product.title,
        description: data.product.fullDescription || data.product.shortDescription,
        specs: data.product.specifications || '',
        tags: data.product.tags?.join(', ') || '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validImages = selectedFiles.filter((file) =>
      file.type.startsWith('image/')
    );

    setNewImages([...newImages, ...validImages]);

    validImages.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.type === 'application/pdf'
    );

    setNewFiles([...newFiles, ...validFiles]);
  };

  const removeExistingImage = (url: string) => {
    setDeletedImages([...deletedImages, url]);
  };

  const removeExistingFile = (url: string) => {
    setDeletedFiles([...deletedFiles, url]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('specs', formData.specs);
      formDataToSend.append('tags', formData.tags);

      newImages.forEach((image) => {
        formDataToSend.append('newImages', image);
      });

      newFiles.forEach((file) => {
        formDataToSend.append('newFiles', file);
      });

      if (deletedImages.length > 0) {
        formDataToSend.append('deletedImages', deletedImages.join(','));
      }

      if (deletedFiles.length > 0) {
        formDataToSend.append('deletedFiles', deletedFiles.join(','));
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      router.push('/dashboard/products');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Product not found</div>
      </div>
    );
  }

  const existingImages = (product.images || []).filter(
    (url) => !deletedImages.includes(url)
  );
  const existingFiles = (product.pdfFiles || []).filter(
    (url) => !deletedFiles.includes(url)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 mt-2">Update your product details</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">
            Product Information
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specifications
            </label>
            <textarea
              value={formData.specs}
              onChange={(e) =>
                setFormData({ ...formData, specs: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        {/* Existing and New Images */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Product Images</h2>

          {existingImages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Current Images
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {existingImages.map((url, index) => {
                  const displayUrl = product.signedImageUrls?.[index] || url;
                  return (
                  <div key={index} className="relative group">
                    <img
                      src={displayUrl}
                      alt={`Image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = url;
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(url)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-600 font-medium">Add more images</p>
            </label>
          </div>

          {newImagePreviews.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                New Images
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {newImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`New Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Existing and New Files */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Documents (PDFs)</h2>

          {existingFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Current Files
              </h3>
              <div className="space-y-2">
                {existingFiles.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {url.split('/').pop()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingFile(url)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <FileText className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-600 font-medium">Add more PDFs</p>
            </label>
          </div>

          {newFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                New Files
              </h3>
              <div className="space-y-2">
                {newFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating Product...' : 'Update Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

