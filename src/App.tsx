import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, LayoutGrid } from 'lucide-react';
import { db } from './firebase';
import { Item, CATEGORIES, Category, Settings } from './types';
import { ItemCard } from './components/ItemCard';
import { ItemModal } from './components/ItemModal';
import { AdminPanel } from './components/AdminPanel';
import { cn } from './utils';

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({ siteTitle: 'Bazar Pessoal', siteSubtitle: 'Curadoria de Itens', contactUrl: '' });

  // Path-based routing (compatible with GitHub Pages subdir)
  const isAdminPath = () => window.location.pathname.endsWith('/admin') || window.location.pathname.endsWith('/admin/');
  const [view, setView] = useState<'public' | 'admin'>(
    isAdminPath() ? 'admin' : 'public'
  );

  useEffect(() => {
    // Handle browser back/forward
    const handlePopState = () => {
      setView(isAdminPath() ? 'admin' : 'public');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    // Fetch items
    const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
    const unsubscribeItems = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)));
      setIsLoading(false);
    });

    // Fetch settings
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data() as Settings);
      }
    };
    fetchSettings();

    return () => unsubscribeItems();
  }, []);

  const itemsByCategory = useMemo(() => {
    const grouped: Record<Category, Item[]> = {
      'Eletrônicos': [],
      'Informática': [],
      'Câmeras': [],
      'Outros': []
    };
    items.forEach(item => {
      const cat = item.category as Category;
      if (grouped[cat]) {
        grouped[cat].push(item);
      } else {
        grouped['Outros'].push(item);
      }
    });
    return grouped;
  }, [items]);

  const navigateTo = (newView: 'public' | 'admin') => {
    const base = import.meta.env.BASE_URL || '/';
    const path = newView === 'admin' ? `${base}admin` : base;
    window.history.pushState({}, '', path);
    setView(newView);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-brand-end font-sans selection:bg-stone-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('public')}>
            <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-stone-200">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-brand-gradient inline-block">{settings.siteTitle}</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{settings.siteSubtitle}</p>
            </div>
          </div>

          {view === 'admin' && (
            <nav className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('public')}
                className="p-2.5 rounded-xl transition-all bg-stone-100 text-brand-start"
                title="Ver Itens"
              >
                <LayoutGrid size={22} />
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {view === 'public' ? (
            <motion.div
              key="public"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-16"
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-8 h-8 border-4 border-stone-200 border-t-brand-start rounded-full animate-spin" />
                  <p className="text-stone-400 font-medium">Carregando itens...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-20 bg-stone-50 rounded-[40px] border border-stone-100">
                  <h3 className="text-2xl font-bold text-stone-400">Nenhum item anunciado ainda</h3>
                  <p className="text-stone-400 mt-2">Volte mais tarde para conferir as novidades.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 items-start">
                  {CATEGORIES.map((category) => (
                    <div key={category} className="space-y-8">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                        <h2 className="text-sm font-black uppercase tracking-[0.25em] text-brand-gradient inline-block">
                          {category}
                        </h2>
                        <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded-md">
                          {itemsByCategory[category].length}
                        </span>
                      </div>
                      
                      <div className="space-y-6">
                        {itemsByCategory[category].length > 0 ? (
                          itemsByCategory[category].map((item) => (
                            <ItemCard
                              key={item.id}
                              item={item}
                              onClick={() => setSelectedItem(item)}
                            />
                          ))
                        ) : (
                          <p className="text-stone-300 text-sm italic font-medium py-4">
                            Nenhum item nesta categoria
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl mx-auto"
            >
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-stone-100 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-stone-400 text-sm font-medium">
            © 2026 {settings.siteTitle}. Todos os itens são de uso pessoal e vendidos no estado.
          </p>
          <div className="flex gap-8">
            <a href={settings.contactUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-brand-start text-sm font-bold uppercase tracking-widest transition-colors">Contato</a>
          </div>
        </div>
      </footer>

      <ItemModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        contactUrl={settings.contactUrl}
      />
    </div>
  );
}
