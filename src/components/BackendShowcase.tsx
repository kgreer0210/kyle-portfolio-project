"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

interface Screenshot {
  id: string;
  title: string;
  description: string;
  image: string;
  features: string[];
}

interface BackendShowcaseProps {
  projectTitle: string;
  screenshots: Screenshot[];
}

export default function BackendShowcase({
  projectTitle,
  screenshots,
}: BackendShowcaseProps) {
  const [selectedScreenshot, setSelectedScreenshot] =
    useState<Screenshot | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");

  const openImageModal = (imageSrc: string) => {
    setSelectedImage(imageSrc);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage("");
  };

  return (
    <motion.div
      className="min-h-screen py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <motion.h1
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-headings mb-6 md:mb-8 text-center px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {projectTitle} - Backend Architecture
        </motion.h1>

        <motion.p
          className="text-base sm:text-lg text-text-secondary mb-8 md:mb-12 text-center max-w-3xl mx-auto px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Explore the backend systems and administrative interfaces that power
          this application. These are the tools and dashboards that enable
          efficient business operations.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {screenshots.map((screenshot, index) => (
            <motion.div
              key={screenshot.id}
              className="card bg-oxford-blue/90 backdrop-blur-sm border border-penn-blue rounded-2xl overflow-hidden shadow-xl cursor-pointer"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
              onClick={() => setSelectedScreenshot(screenshot)}
            >
              <div className="h-40 sm:h-48 bg-penn-blue/50 relative overflow-hidden">
                <Image
                  src={screenshot.image}
                  alt={screenshot.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-text-headings mb-2">
                  {screenshot.title}
                </h3>
                <p className="text-text-secondary text-sm sm:text-base mb-3 sm:mb-4 line-clamp-3">
                  {screenshot.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {screenshot.features
                    .slice(0, 3)
                    .map((feature, featureIndex) => (
                      <span
                        key={featureIndex}
                        className="px-2 py-1 bg-penn-blue/70 text-xs rounded-full text-text-primary"
                      >
                        {feature}
                      </span>
                    ))}
                  {screenshot.features.length > 3 && (
                    <span className="px-2 py-1 bg-penn-blue/70 text-xs rounded-full text-text-primary">
                      +{screenshot.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal for detailed view */}
        {selectedScreenshot && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedScreenshot(null)}
          >
            <motion.div
              className="bg-oxford-blue/95 backdrop-blur-sm border border-penn-blue rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-text-headings">
                    {selectedScreenshot.title}
                  </h2>
                  <button
                    onClick={() => setSelectedScreenshot(null)}
                    className="text-text-secondary hover:text-white text-2xl sm:text-3xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <div
                      className="relative cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageModal(selectedScreenshot.image)}
                    >
                      <Image
                        src={selectedScreenshot.image}
                        alt={selectedScreenshot.title}
                        width={600}
                        height={400}
                        className="rounded-lg w-full h-auto"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                        <span className="text-white bg-black/50 px-3 py-1 rounded text-xs sm:text-sm">
                          Click to enlarge
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm sm:text-base mb-4 sm:mb-6">
                      {selectedScreenshot.description}
                    </p>

                    <div className="mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-semibold text-text-headings mb-2 sm:mb-3">
                        Key Features
                      </h3>
                      <ul className="space-y-2">
                        {selectedScreenshot.features.map(
                          (feature, featureIndex) => (
                            <li
                              key={featureIndex}
                              className="flex items-center text-text-secondary text-sm sm:text-base"
                            >
                              <span className="text-blue-ncs mr-2">✓</span>
                              {feature}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Large Image Modal */}
        {imageModalOpen && selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={closeImageModal}
          >
            <motion.div
              className="relative max-w-7xl max-h-[95vh] sm:max-h-[90vh] w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeImageModal}
                className="absolute top-2 sm:top-4 right-2 sm:right-4 text-white bg-black/50 hover:bg-black/70 text-xl sm:text-2xl w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center z-10 transition-colors min-w-[44px] min-h-[44px]"
                aria-label="Close image modal"
              >
                ×
              </button>
              <Image
                src={selectedImage}
                alt="Large view"
                width={1200}
                height={800}
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                quality={100}
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
