'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadedFile {
  file: File;
  url: string | null;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supplierId = searchParams.get('supplierId');

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    specifications: '',
    tags: '',
    priceRange: '',
    capacity: '',
    youtubeUrl: '',
  });
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Upload a single file to R2
  const uploadFile = useCallback(async (
    file: File,
    type: 'image' | 'pdf',
    index: number,
    setterFn: React.Dispatch<React.SetStateAction<UploadedFile[]>>
  ) => {
    // Update status to uploading
    setterFn(prev => prev.map((item, i) =>
      i === index ? { ...item, status: 'uploading' as const, progress: 10 } : item
    ));

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      // Simulate progress updates (since fetch doesn't support progress)
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

      // Clear interval immediately after response
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      // Set progress to 95% while processing response
      setterFn(prev => prev.map((item, i) =>
        i === index ? { ...item, progress: 95 } : item
      ));

      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse upload response:', parseError);
        throw new Error('Server returned invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      if (!data.url) {
        throw new Error('Upload succeeded but no URL returned');
      }

      // Update status to complete with URL
      setterFn(prev => prev.map((item, i) =>
        i === index ? { ...item, status: 'complete' as const, progress: 100, url: data.url } : item
      ));
    } catch (err: any) {
      // Always clear interval on error
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      console.error('Upload error for file:', file.name, err);

      setterFn(prev => prev.map((item, i) =>
        i === index ? { ...item, status: 'error' as const, error: err.message || 'Upload failed' } : item
      ));
    }
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validImages = selectedFiles.filter((file) =>
      file.type.startsWith('image/')
    );

    // Create new upload items
    const newImages: UploadedFile[] = validImages.map(file => ({
      file,
      url: null,
      progress: 0,
      status: 'pending' as const,
    }));

    const startIndex = images.length;
    setImages(prev => [...prev, ...newImages]);

    // Create previews
    validImages.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Start uploading immediately
    validImages.forEach((file, i) => {
      uploadFile(file, 'image', startIndex + i, setImages);
    });

    // Reset input
    e.target.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.type === 'application/pdf'
    );

    // Create new upload items
    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      url: null,
      progress: 0,
      status: 'pending' as const,
    }));

    const startIndex = files.length;
    setFiles(prev => [...prev, ...newFiles]);

    // Start uploading immediately
    validFiles.forEach((file, i) => {
      uploadFile(file, 'pdf', startIndex + i, setFiles);
    });

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const retryUpload = (index: number, type: 'image' | 'pdf') => {
    if (type === 'image') {
      const item = images[index];
      if (item) {
        setImages(prev => prev.map((img, i) =>
          i === index ? { ...img, status: 'pending' as const, progress: 0, error: undefined } : img
        ));
        uploadFile(item.file, 'image', index, setImages);
      }
    } else {
      const item = files[index];
      if (item) {
        setFiles(prev => prev.map((f, i) =>
          i === index ? { ...f, status: 'pending' as const, progress: 0, error: undefined } : f
        ));
        uploadFile(item.file, 'pdf', index, setFiles);
      }
    }
  };

  // Check if all uploads are complete
  const allUploadsComplete = () => {
    const imagesDone = images.every(img => img.status === 'complete');
    const filesDone = files.every(f => f.status === 'complete');
    return imagesDone && filesDone;
  };

  const hasUploadErrors = () => {
    return images.some(img => img.status === 'error') || files.some(f => f.status === 'error');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('shortDescription', formData.shortDescription);
      formDataToSend.append('fullDescription', formData.fullDescription);
      formDataToSend.append('specifications', formData.specifications);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('priceRange', formData.priceRange);
      formDataToSend.append('capacity', formData.capacity);
      formDataToSend.append('youtubeUrl', formData.youtubeUrl);

      if (supplierId) {
        formDataToSend.append('supplierId', supplierId);
      }

      // Send already-uploaded URLs
      const imageUrls = images.filter(img => img.url).map(img => img.url!);
      const fileUrls = files.filter(f => f.url).map(f => f.url!);

      formDataToSend.append('imageUrls', JSON.stringify(imageUrls));
      formDataToSend.append('fileUrls', JSON.stringify(fileUrls));

      const response = await fetch('/api/products/add', {
        method: 'POST',
        body: formDataToSend,
      });

      let data: any = {};
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        if (!response.ok) {
          throw new Error(`Server error (${response.status}): ${response.statusText}`);
        }
        data = { message: 'Product created successfully' };
      }

      if (!response.ok) {
        if (data.redirect) {
          router.push(data.redirect);
          return;
        }
        throw new Error(data.error || `Server error (${response.status})`);
      }

      router.push(supplierId ? `/dashboard/products?supplierId=${supplierId}` : '/dashboard/products');
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the product');
    } finally {
      setLoading(false);
    }
  };

  // Progress bar component
  const ProgressBar = ({ progress, status }: { progress: number; status: string }) => (
    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${status === 'complete' ? 'bg-green-500' :
          status === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );

  // Status icon component
  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'complete') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (status === 'uploading') return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Product</h1>
        <p className="text-gray-600 mt-2">
          Upload your product details and files
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload - First for convenience */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Product Images</h2>
          <p className="text-sm text-gray-500">Upload images first while you prepare product details</p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
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
              <p className="text-gray-600 font-medium">
                Click to upload images
              </p>
              <p className="text-sm text-gray-500 mt-1">
                JPEG or PNG (Max 10MB each) - Uploads instantly
              </p>
            </label>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imagePreviews[index]}
                    alt={`Preview ${index + 1}`}
                    className={`w-full h-32 object-cover rounded-lg ${image.status === 'uploading' ? 'opacity-70' : ''
                      }`}
                  />

                  {/* Progress overlay */}
                  {image.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                      <div className="text-white text-sm font-medium">
                        {image.progress}%
                      </div>
                    </div>
                  )}

                  {/* Status indicator */}
                  <div className="absolute top-2 left-2">
                    <StatusIcon status={image.status} />
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Retry button for errors */}
                  {image.status === 'error' && (
                    <button
                      type="button"
                      onClick={() => retryUpload(index, 'image')}
                      className="absolute bottom-2 left-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs py-1 rounded transition"
                    >
                      Retry Upload
                    </button>
                  )}

                  {/* Progress bar */}
                  {image.status !== 'complete' && (
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <ProgressBar progress={image.progress} status={image.status} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Upload - Second for convenience */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">
            Documents (PDFs)
          </h2>
          <p className="text-sm text-gray-500">Upload catalogs and manuals while filling the form</p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
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
              <p className="text-gray-600 font-medium">
                Click to upload PDFs
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Product catalogs, manuals, etc. - Uploads instantly
              </p>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <StatusIcon status={file.status} />
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-gray-700 block truncate">{file.file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.file.size / 1024 / 1024).toFixed(2)} MB)
                        {file.status === 'uploading' && ` - ${file.progress}%`}
                        {file.status === 'error' && (
                          <span className="text-red-500 ml-2">{file.error}</span>
                        )}
                      </span>
                      {file.status !== 'complete' && (
                        <div className="mt-1">
                          <ProgressBar progress={file.progress} status={file.status} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {file.status === 'error' && (
                      <button
                        type="button"
                        onClick={() => retryUpload(index, 'pdf')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Retry
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Status Summary */}
        {(images.length > 0 || files.length > 0) && (
          <div className={`p-4 rounded-lg ${allUploadsComplete()
            ? 'bg-green-50 border border-green-200'
            : hasUploadErrors()
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
            }`}>
            <div className="flex items-center gap-2">
              {allUploadsComplete() ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">All files uploaded successfully!</span>
                </>
              ) : hasUploadErrors() ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700 font-medium">Some uploads failed. Please retry or remove failed files.</span>
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-blue-700 font-medium">Uploading files... You can continue filling the form below.</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Product Information - After uploads */}
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
              placeholder="e.g., Premium Dairy Cream"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description *
            </label>
            <textarea
              required
              value={formData.shortDescription}
              onChange={(e) =>
                setFormData({ ...formData, shortDescription: e.target.value })
              }
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
              placeholder="Brief description of your product..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Description *
            </label>
            <textarea
              required
              value={formData.fullDescription}
              onChange={(e) =>
                setFormData({ ...formData, fullDescription: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
              placeholder="Detailed description of your product..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specifications
            </label>
            <textarea
              value={formData.specifications}
              onChange={(e) =>
                setFormData({ ...formData, specifications: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
              placeholder="Technical specifications, ingredients, etc."
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
              placeholder="e.g., dairy, cream, organic"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range
              </label>
              <input
                type="text"
                value={formData.priceRange}
                onChange={(e) =>
                  setFormData({ ...formData, priceRange: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                placeholder="e.g., ₹50,000 - ₹1,00,000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity
              </label>
              <input
                type="text"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                placeholder="e.g., 2000 L/day"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              YouTube Video URL
            </label>
            <input
              type="url"
              value={formData.youtubeUrl}
              onChange={(e) =>
                setFormData({ ...formData, youtubeUrl: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
              placeholder="e.g., https://www.youtube.com/watch?v=xxxxx"
            />
            <p className="text-sm text-gray-500 mt-1">
              Add a YouTube video showcasing your product (optional)
            </p>
          </div>
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
            disabled={loading || !allUploadsComplete()}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Product...
              </span>
            ) : !allUploadsComplete() ? (
              'Waiting for uploads...'
            ) : (
              'Create Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
