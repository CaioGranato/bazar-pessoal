import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { LogOut, Plus, Trash2, Edit2, CheckCircle, XCircle, Save, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Item, CATEGORIES, Category, Settings } from '../types';
import { cn, fixDriveUrl } from '../utils';

export function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    siteTitle: 'Bazar Pessoal',
    siteSubtitle: 'Curadoria de Itens',
    contactUrl: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Eletrônicos');
  const [price, setPrice] = useState('');
  const [mainPhoto, setMainPhoto] = useState('');
  const [additionalPhotoUrl, setAdditionalPhotoUrl] = useState('');
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);

  // Usa o utilitário centralizado para converter URLs do Google Drive
  const convertDriveUrl = fixDriveUrl;

  const addAdditionalPhoto = () => {
    if (!additionalPhotoUrl.trim()) return;
    setAdditionalPhotos(prev => [...prev, convertDriveUrl(additionalPhotoUrl.trim())]);
    setAdditionalPhotoUrl('');
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Item)));
    });
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) setSettings(snap.data() as Settings);
    };
    fetchSettings();
    return () => unsub();
  }, [isLoggedIn]);

  const handleLogin = () => {
    if (loginUser === 'caiogranatoodmax' && loginPass === 'odmax2026') {
      setIsLoggedIn(true);
      setLoginError('');
      signInAnonymously(auth).catch(console.error);
    } else {
      setLoginError('Login ou senha incorretos.');
    }
  };

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      showStatus('Configurações salvas!');
    } catch (e) {
      showStatus('Erro ao salvar configurações.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemData = {
      title,
      description,
      category,
      price: price ? parseFloat(price) : null,
      mainPhoto: convertDriveUrl(mainPhoto),
      additionalPhotos,
      updatedAt: serverTimestamp(),
    };
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'items', editingItem.id), itemData);
        showStatus('Item atualizado!');
      } else {
        await addDoc(collection(db, 'items'), {
          ...itemData,
          isSold: false,
          createdAt: serverTimestamp(),
        });
        showStatus('Item publicado!');
      }
      resetForm();
    } catch (e) {
      showStatus('Erro ao salvar item.', 'error');
    }
  };

  const toggleSold = async (item: Item) => {
    try {
      await updateDoc(doc(db, 'items', item.id), {
        isSold: !item.isSold,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      showStatus('Erro ao alterar status.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'items', id));
      showStatus('Item excluído!');
      setShowDeleteConfirm(null);
    } catch (e) {
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
    setAdditionalPhotoUrl('');
    setIsAdding(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-10 w-full max-w-sm text-center space-y-6">
          <h2 className="text-2xl font-bold text-brand-start">Área Administrativa</h2>
          <p className="text-stone-400 text-sm">Entre com suas credenciais para continuar.</p>
          <div className="space-y-3 text-left">
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Login</label>
              <input
                type="text"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                className="mt-1 w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none text-sm"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Senha</label>
              <input
                type="password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                className="mt-1 w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none text-sm"
                autoComplete="current-password"
              />
            </div>
            {loginError && <p className="text-red-500 text-xs text-center">{loginError}</p>}
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl bg-brand-start text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Entrar
          </button>
        </div>
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

      {/* Modal de confirmação de exclusão */}
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

      {/* Configurações do Site */}
      <section className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-brand-gradient inline-block">Configurações do Site</h3>
          <button
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="flex items-center gap-2 bg-brand-gradient text-white px-5 py-2 rounded-full hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
          >
            {isSavingSettings ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Salvar
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Título</label>
            <input
              value={settings.siteTitle}
              onChange={e => setSettings({ ...settings, siteTitle: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Subtítulo</label>
            <input
              value={settings.siteSubtitle}
              onChange={e => setSettings({ ...settings, siteSubtitle: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-stone-500">URL de Contato</label>
          <p className="text-xs text-stone-400">WhatsApp (https://wa.me/55119...) ou e-mail (mailto:seu@email.com)</p>
          <input
            value={settings.contactUrl}
            onChange={e => setSettings({ ...settings, contactUrl: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none"
            placeholder="https://wa.me/5511999999999"
          />
        </div>
      </section>

      {/* Cabeçalho de itens */}
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
            onClick={() => { signOut(auth).catch(console.error); setIsLoggedIn(false); }}
            className="p-2.5 text-stone-400 hover:text-brand-start transition-colors"
            title="Sair"
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {/* Formulário */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Título</label>
              <input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none"
                placeholder="Ex: Câmera Canon EOS R5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Categoria</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Preço (opcional)</label>
              <div className="flex items-center border border-stone-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-start overflow-hidden">
                <span className="px-3 py-3 bg-stone-50 text-stone-500 font-bold border-r border-stone-200">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="flex-1 px-4 py-3 outline-none bg-white"
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Foto Principal (URL)</label>
              <input
                required
                value={mainPhoto}
                onChange={e => setMainPhoto(e.target.value)}
                onBlur={e => setMainPhoto(convertDriveUrl(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none"
                placeholder="Cole o link público do Google Drive"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Descrição</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none"
              placeholder="Descreva o estado do item, acessórios inclusos, etc."
            />
          </div>

          {/* Fotos adicionais via URL */}
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-stone-500">Fotos Adicionais (URLs)</label>
            {additionalPhotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {additionalPhotos.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                    <button
                      type="button"
                      onClick={() => setAdditionalPhotos(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={additionalPhotoUrl}
                onChange={e => setAdditionalPhotoUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAdditionalPhoto(); } }}
                placeholder="Cole o link público do Google Drive e pressione Enter..."
                className="flex-1 px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-brand-start outline-none text-sm"
              />
              <button
                type="button"
                onClick={addAdditionalPhoto}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm font-medium transition-colors whitespace-nowrap"
              >
                + Adicionar
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={resetForm} className="px-6 py-3 rounded-full text-stone-500 hover:bg-stone-50 transition-colors font-medium">
              Cancelar
            </button>
            <button type="submit" className="px-8 py-3 rounded-full bg-brand-gradient text-white hover:opacity-90 transition-opacity font-medium">
              {editingItem ? 'Salvar Alterações' : 'Publicar Anúncio'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de itens */}
      <div className="grid grid-cols-1 gap-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-stone-200 shadow-sm group">
            <img src={fixDriveUrl(item.mainPhoto)} className="w-16 h-16 rounded-lg object-cover" referrerPolicy="no-referrer" alt={item.title} />
            <div className="flex-1">
              <h4 className="font-semibold text-brand-gradient inline-block">{item.title}</h4>
              <p className="text-sm text-stone-500">{item.category} • {item.isSold ? 'Vendido' : 'Disponível'}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => toggleSold(item)}
                className={cn("p-2 rounded-lg transition-colors", item.isSold ? "text-green-600 hover:bg-green-50" : "text-stone-400 hover:bg-stone-50")}
                title={item.isSold ? 'Marcar como Disponível' : 'Marcar como Vendido'}
              >
                <CheckCircle size={20} />
              </button>
              <button onClick={() => startEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                <Edit2 size={20} />
              </button>
              <button onClick={() => setShowDeleteConfirm(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
