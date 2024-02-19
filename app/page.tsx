'use client';

import Image from 'next/image';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const Home = () => {
  const [filePreview, setFilePreview] = useState("");
  const [base64Image, setBase64Image] = useState("");
  const [similarImages, setSimilarImages] = useState([] as any[]);
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    const previewUrl = URL.createObjectURL(file)
    setFilePreview(previewUrl)
    const arrayBuffer = await file.arrayBuffer();
    setBase64Image(Buffer.from(arrayBuffer).toString('base64'))
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <main className='bg-gray-950 min-h-screen flex flex-col items-center justify-center'>
      <div className='max-w-screen-xl m-8 xl:m-auto flex flex-col items-center justify-center'>
        <h2 className='text-lg sm:text-xl md:text-2xl xl:text-4xl font-semibold text-white text-center mt-8'><span className='bg-gradient-to-br from-green-600 to-green-300 bg-clip-text text-transparent p-1'>Search</span> for similar images 🚀</h2>
        <p className='text-gray-300 text-xs md:text-sm max-w-[300px] text-center mt-0 xl:mt-2 2xl:mt-3'>Upload an image of Lilly, Lotus, Orchid, Sunflower, or Tulip and find images similar to it.</p>

        <div className='text-white border border-white/30 rounded-lg cursor-pointer mt-8' {...getRootProps()}>
          <input {...getInputProps()} />
          {
            isDragActive ?
              <p className='my-10 mx-5 text-center'>Drop the file here ...</p> :
              filePreview ?
                <div>
                  <Image width={512} height={512} src={filePreview} alt="Preview" className='h-[200px] w-[200px] md:h-[300px] md:w-auto m-1 md:m-2 xl:m-4 rounded-lg' />
                </div> :
                <p className='my-10 mx-5 text-center text-xs lg:text-lg'>Drag &apos;n&apos; drop a file here, or click to select a file</p>
          }
        </div>
        <button
          onClick={async () => {
            setLoading(true)
            const res = await fetch('/api/predict', {
              method: "POST",
              body: JSON.stringify({
                base64Image: base64Image
              })
            })

            const data = await res.json()
            setSimilarImages(data.result)
            setLoading(false)
          }}
          disabled={loading}
          className='bg-gradient-to-br disabled:opacity-70 from-green-600 to-green-300 border border-green-600 rounded-lg w-full md:w-2/4 xl:w-4/12 my-4 text-white font-semibold text-sm xl:text-lg py-2 hover:opacity-90 transition duration-200'
        >Search
        </button>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8'>
          {similarImages.map((image, index) => (
            <div key={index} className='flex flex-col items-center border border-white/30 rounded-lg pb-2'>
              <Image width={512} height={512} src={image.image} alt={image.name} className='h-[200px] w-[200px] md:h-[250px] md:w-auto m-1 md:m-2 xl:m-4 rounded-lg' />
              <p className='text-white font-semibold text-lg xl:-mt-2'>{image.type}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Home;
