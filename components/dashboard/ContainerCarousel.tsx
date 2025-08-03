'use client';

import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import Image from 'next/image';

type ContainerData = {
  id: number;
  name: string;
  image: string;
  start: string;
  finish: string;
};

const dummyContainers: ContainerData[] = Array.from({ length: 77 }, (_, i) => ({
  id: i,
  name: `Container ${i + 1}`,
  image: '/images/container.png', // Ganti dengan gambar berbeda jika perlu
  start: '01/01/25 - 09:00',
  finish: '03/05/25 - 09:00',
}));

export default function ContainerCarousel() {
  const [current, setCurrent] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % dummyContainers.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const currentData = dummyContainers[current];

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 bg-white shadow-lg rounded-2xl w-full max-w-5xl mx-auto">
      {/* Gambar */}
      <motion.div
        key={currentData.id}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full md:w-1/2 h-64 relative"
      >
        <Image
          src={currentData.image}
          alt={currentData.name}
          fill
          className="rounded-xl object-cover"
        />
      </motion.div>

      {/* Detail */}
      <motion.div
        key={`${currentData.id}-text`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full md:w-1/2 text-blue-900"
      >
        <h2 className="text-xl font-semibold mb-2">Detail Casis</h2>
        <p className="text-lg font-bold mb-1">{currentData.name}</p>
        <div className="text-sm mb-1">
          <span className="font-medium">Start:</span> {currentData.start}
        </div>
        <div className="text-sm mb-1">
          <span className="font-medium">Finish:</span> {currentData.finish}
        </div>
      </motion.div>
    </div>
  );
}
