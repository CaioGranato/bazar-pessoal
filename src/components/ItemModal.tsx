import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Item } from '../types';
import { fixDriveUrl } from '../utils';

interface ItemModalProps {
  item: Item | null;
  onClose: () => void;
  contactUrl?: string;
}

export function ItemModal({ item, onClose, contactUrl }: ItemModalProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!item) return null;

  // Converte todos os URLs para o formato público do Google Drive
  const allPhotos = [item.mainPhoto, ...(item.additionalPhotos || [])].map(fixDriveUrl);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-end/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Seção de Fotos */}
          <div className="w-full md:w-1/2 bg-stone-100 relative flex flex-col">
            <div className="flex-1 relative overflow-hidden group">
              <img
                src={allPhotos[activePhotoIndex]}
                alt={item.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              {item.isSold && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-4 border-red-600 text-red-600 font-black text-4xl px-6 py-3 rotate-[-45deg] uppercase tracking-widest bg-white/80 backdrop-blur-sm rounded-lg shadow-lg">
                    Vendido
                  </div>
                </div>
              )}
              {allPhotos.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setActivePhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
            {allPhotos.length > 1 && (
              <div className="p-4 flex gap-2 overflow-x-auto bg-stone-50 border-t border-stone-200">
                {allPhotos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      activePhotoIndex === idx ? 'border-brand-start scale-105' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Seção de Informações */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 block">
                  {item.category}
                </span>
                <h2 className="text-3xl font-bold text-brand-gradient inline-block leading-tight">
                  {item.title}
                </h2>
                {item.price && (
                  <p className="text-2xl font-medium text-stone-600 mt-2">
                    R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1">
              <h4 className="text-sm font-bold uppercase tracking-widest text-brand-gradient inline-block mb-3">
                Descrição
              </h4>
              <div className="text-stone-600 leading-relaxed whitespace-pre-wrap">
                {item.description}
              </div>
            </div>

            {item.isSold && (
              <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-semibold">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                Este item já foi vendido
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-stone-100">
              {contactUrl ? (
                <a
                  href={contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-brand-gradient text-white px-6 py-3 rounded-full hover:opacity-90 transition-opacity font-medium"
                >
                  <MessageCircle size={20} />
                  Entrar em contato
                </a>
              ) : (
                <p className="text-sm text-stone-400 italic text-center">
                  Interessado? Entre em contato diretamente.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
