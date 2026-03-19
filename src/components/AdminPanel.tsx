import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LogIn, LogOut, Plus, Trash2, Edit2, CheckCircle, XCircle, Upload, Image as ImageIcon, Loader2, Save, ExternalLink, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Item, CATEGORIES, Category, Settings } from '../types';
import { cn } from '../utils';

export function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<Settings>({ siteTitle: 'Bazar Pessoal', siteSubtitle: 'Curadoria de Itens', contactUrl: '' });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Eletrônicos');
  const [price, setPrice] = useState('');
  const [mainPhoto, setMainPhoto] = useState('');
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFilesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Fetch items
    const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
    const unsubscribeItems = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)));
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
  }, [user]);

  const isAdmin = user?.email === 'contato.orlandodicas@gmail.com';

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storageRef = ref(storage, `items/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(url);
      }

      if (isMain) {
        setMainPhoto(uploadedUrls[0]);
        showStatus('Foto principal carregada!');
      } else {
        setAdditionalPhotos(prev => [...prev, ...uploadedUrls]);
        showStatus(`${uploadedUrls.length} foto(s) adicionada(s)!`);
      }
    } catch (error) {
      console.error('Upload failed', error);
      showStatus('Falha no upload da imagem.', 'error');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveSettings = async () => {
    if (!isAdmin) return;
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      showStatus('Configurações salvas!');
    } catch (error) {
      console.error('Save settings failed', error);
      showStatus('Erro ao salvar configurações.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const itemData = {
      title,
      description,
      category,
      price: price ? parseFloat(price) : null,
      mainPhoto,
      additionalPhotos,
      isSold: editingItem ? editingItem.isSold : false,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'items', editingItem.id), itemData);
      } else {
        await addDoc(collection(db, 'items'), {
          ...itemData,
          isSold: false,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
    } catch (error) {
      console.error('Save failed', error);
    }
  };

  const toggleSold = async (item: Item) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'items', item.id), {
        isSold: !item.isSold,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Toggle sold failed', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'items', id));
      showStatus('Item excluído!');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Delete failed', error);
      showStatus('Erro ao excluir item.', 'error');
    }
  };

  const startEdit = (item: Item) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setCategory(item.category as Category);
    setPrice(item.price?.toString() || '');
    setMainPhoto(item.mainPhoto);
    setAdditionalPhotos(item.additionalPhotos || []);
    setIsAdding(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setCategory('Eletrônicos');
    setPrice('');
    setMainPhoto('');
    setAdditionalPhotos([]);
    setIsAdding(false);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-stone-50 rounded-3xl border border-stone-200">
        <h2 className="text-2xl font-bold text-brand-gradient inline-block mb-4">Área Administrativa</h2>
        <p className="text-stone-500 mb-8 text-center max-w-xs">
          Faça login para gerenciar seus anúncios.
        </p>
        <button
          onClick={handleLogin}
          className="flex items-center gap-2 bg-brand-gradient text-white px-6 py-3 rounded-full hover:opacity-90 transition-opacity font-medium"
        >
          <LogIn size={20} />
          Entrar com Google
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-12 text-center bg-red-50 rounded-3xl border border-red-100">
        <h2 className="text-2xl font-bold text-red-900 mb-2">Acesso Negado</h2>
        <p className="text-red-600 mb-6">Você não tem permissão para acessar esta área.</p>
        <button onClick={() => signOut(auth)} className="text-stone-500 underline">Sair</button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Status Toast */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2",
              statusMsg.type === 'success' ? "bg-brand-gradient text-white" : "bg-red-600 text-white"
            )}
          >
            {statusMsg.type === 'error' && <AlertCircle size={18} />}
            {statusMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-end/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-3xl max-w-sm w-full shadow-xl text-center"
            >
              <h3 className="text-xl font-bold mb-2">Excluir Item?</h3>
              <p className="text-stone-500 mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl bg-stone-100 font-bold hover:bg-stone-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Site Settings Section */}
      <section className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-brand-gradient inline-block">Configurações do Site</h3>
          <button
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="flex items-center gap-2 bg-brand-gradient text-white px-5 py-2 rounded-full hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
          >
            {isSavingSettings ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Salvar Configurações
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Título Principal</label>
            <input
              value={settings.siteTitle}
              onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Subtítulo</label>
            <input
              value={settings.siteSubtitle}
              onChange={(e) => setSettings({ ...settings, siteSubtitle: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-stone-500">URL de Contato</label>
          <p className="text-xs text-stone-400">Esta URL será usada no botão "Entrar em contato" de cada item e no link de Contato do rodapé.</p>
          <input
            value={settings.contactUrl}
            onChange={(e) => setSettings({ ...settings, contactUrl: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none transition-all"
            placeholder="https://wa.me/55119... ou mailto:seu@email.com"
          />
        </div>
      </section>

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-brand-gradient inline-block">Gerenciar Itens</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-brand-gradient text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity font-medium"
          >
            {isAdding ? <XCircle size={20} /> : <Plus size={20} />}
            {isAdding ? 'Cancelar' : 'Novo Item'}
          </button>
          <button
            onClick={() => signOut(auth)}
            className="p-2.5 text-stone-400 hover:text-brand-start transition-colors"
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Título</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none transition-all"
                placeholder="Ex: Câmera Canon EOS R5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none transition-all"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Preço (Opcional)</label>
              <div className="flex items-center border border-stone-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-start transition-all overflow-hidden">
                <span className="px-3 py-3 bg-stone-50 text-stone-500 font-bold border-r border-stone-200 select-none">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 px-4 py-3 outline-none bg-white"
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Foto Principal</label>
              <div className="flex gap-2">
                <input
                  required
                  value={mainPhoto}
                  onChange={(e) => setMainPhoto(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none transition-all"
                  placeholder="URL da foto ou faça upload"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-3 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, true)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Descrição</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none transition-all"
              placeholder="Descreva o estado do item, acessórios inclusos, etc."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Fotos Adicionais</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {additionalPhotos.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    onClick={() => setAdditionalPhotos(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => additionalFilesRef.current?.click()}
                disabled={isUploading}
                className="aspect-square border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-stone-400 hover:border-brand-start hover:text-brand-start transition-all"
              >
                {isUploading ? <Loader2 className="animate-spin" size={24} /> : <ImageIcon size={24} />}
                <span className="text-xs font-bold mt-2">Adicionar</span>
              </button>
              <input
                type="file"
                ref={additionalFilesRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e, false)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 rounded-full text-stone-500 hover:bg-stone-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-full bg-brand-gradient text-white hover:opacity-90 transition-opacity font-medium"
            >
              {editingItem ? 'Salvar Alterações' : 'Publicar Anúncio'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-stone-200 shadow-sm group">
            <img src={item.mainPhoto} className="w-16 h-16 rounded-lg object-cover" referrerPolicy="no-referrer" />
            <div className="flex-1">
              <h4 className="font-semibold text-brand-gradient inline-block">{item.title}</h4>
              <p className="text-sm text-stone-500">{item.category} • {item.isSold ? 'Vendido' : 'Disponível'}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => toggleSold(item)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  item.isSold ? "text-green-600 hover:bg-green-50" : "text-stone-400 hover:bg-stone-50"
                )}
                title={item.isSold ? "Marcar como Disponível" : "Marcar como Vendido"}
              >
                <CheckCircle size={20} />
              </button>
              <button
                onClick={() => startEdit(item)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(item.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
