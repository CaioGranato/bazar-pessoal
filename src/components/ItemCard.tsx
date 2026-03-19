import { motion } from 'motion/react';
import { Item } from '../types';
import { cn } from '../utils';

interface ItemCardProps {
  item: Item;
  onClick: () => void;
  key?: string;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-brand-start/10"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden bg-stone-100">
        <img
          src={item.mainPhoto}
          alt={item.title}
          className={cn(
            "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
            item.isSold && "grayscale-[0.5] opacity-80"
          )}
          referrerPolicy="no-referrer"
        />
        
        {item.isSold && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-4 border-red-600 text-red-600 font-black text-3xl px-4 py-2 rotate-[-45deg] uppercase tracking-widest bg-white/80 backdrop-blur-sm rounded-lg shadow-lg">
              Vendido
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-brand-gradient inline-block line-clamp-1 group-hover:opacity-80 transition-opacity">
          {item.title}
        </h3>
        {item.price && (
          <p className="text-stone-500 font-medium mt-1">
            R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        )}
        <button className="mt-3 text-xs font-bold uppercase tracking-wider text-stone-400 group-hover:text-brand-start transition-colors flex items-center gap-1">
          Clique para ver mais
          <span className="text-lg">→</span>
        </button>
      </div>
    </motion.div>
  );
}
