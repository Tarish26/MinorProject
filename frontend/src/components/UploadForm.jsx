import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : 'https://btcapi-1mqg.onrender.com/api',
});

const CLASS_DESCRIPTIONS = {
  'Glioma': 'Glioma tumors arise from glial cells in the brain.',
  'Meningioma': 'Meningiomas grow from the meninges, the protective layers of the brain.',
  'Pituitary': 'Pituitary tumors affect the pituitary gland at the base of the brain.',
  'No Tumor': 'No signs of tumor detected in the scan.'
};

export default function UploadForm({ onResultReceived }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Generate preview when file is selected
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Free memory when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset state
    setError(null);
    setResult(null);
    
    // Validate file
    if (!file) {
      setError('Please select an image file');
      return;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG/PNG images are supported');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setLoading(true);
      const response = await api.post('/api/predict/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const resultData = {
        ...response.data,
        description: CLASS_DESCRIPTIONS[response.data.tumor] || '',
        fileName: file.name,
        image: previewUrl
      };
      
      setResult(resultData);
      
      // Pass the result up to the parent component
      if (onResultReceived) {
        onResultReceived(resultData);
      }
      
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.detail || 
                         errorData?.error || 
                         'Failed to process image';
      setError(errorMessage);
      
      // Clear the result in parent component
      if (onResultReceived) {
        onResultReceived(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-blue-800">Upload Brain MRI Scan</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div 
          className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-50 transition-colors"
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById('file-upload').click()}
        >
          {previewUrl ? (
            <div className="flex flex-col items-center">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-h-64 mb-4 rounded-lg shadow-sm" 
              />
              <p className="text-sm text-gray-600">{file?.name}</p>
              <button 
                type="button" 
                className="mt-2 text-sm text-red-500 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-1 text-sm text-gray-600">
                Drag and drop an image here, or click to select
              </p>
              <p className="mt-1 text-xs text-gray-500">
                JPG or PNG (Max 10MB)
              </p>
            </>
          )}
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="sr-only"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(loading || !file) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : 'Analyze Image'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 p-6 bg-white border border-blue-100 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              result.tumor === 'No Tumor' ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <h3 className="text-lg font-medium text-gray-900">
              {result.tumor === 'No Tumor' ? 'No Tumor Detected' : `${result.tumor} Detected`}
            </h3>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {result.confidence}% confidence
            </span>
          </div>
          
          {result.description && (
            <p className="mt-1 text-sm text-gray-600">{result.description}</p>
          )}

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700">Probability Breakdown:</h4>
            <div className="mt-2 space-y-3">
              {Object.entries(result.probabilities).map(([cls, prob]) => (
                <div key={cls} className="flex items-center">
                  <div className="w-24 text-sm font-medium text-gray-600">{cls}</div>
                  <div className="flex-1">
                    <div className="relative pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold inline-block text-gray-600">
                          {prob}%
                        </span>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                        <div
                          style={{ width: `${prob}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}