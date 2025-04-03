'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('这张图片有什么');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  });

  const generateDescription = async () => {
    if (!image) {
      setError('请先上传图片');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          prompt
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成描述失败');
      }

      setDescription(data.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成描述时发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">图片描述生成器</h1>
        </div>

        <div className="bg-white shadow sm:rounded-lg p-6 mb-8">
          <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
            <input {...getInputProps()} />
            {image ? (
              <div className="relative h-64 w-full">
                <Image
                  src={image}
                  alt="Uploaded image"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="text-gray-600">
                <p>拖放图片到此处，或点击选择图片</p>
                <p className="text-sm mt-2">支持 JPG, PNG, GIF, WEBP 格式</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              描述要求
            </label>
            <input
              type="text"
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="请输入描述要求..."
            />
          </div>

          <div className="mt-6">
            <button
              onClick={generateDescription}
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? '生成中...' : '生成描述'}
            </button>
          </div>

          {error && (
            <div className="mt-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          {description && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">生成的描述：</h3>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                {description}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
