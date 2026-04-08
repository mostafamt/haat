import { useEffect, useRef, useState } from 'react';
import content from '../../data/content.json';
import { subscribeMenuItems, subscribeExtras, saveMenuItem, deleteMenuItem, saveExtra, deleteExtra } from '../../services/menuService';
import { uploadImage } from '../../services/uploadService';

const { admin } = content;
const menuContent = admin.menu;
const extrasContent = menuContent.extras;

export default function MenuTab() {
  const [subTab, setSubTab] = useState('items');

  // ── Menu Items ─────────────────────────────────────────────
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuForm, setMenuForm] = useState({ name: '', price: '', description: '', prepTime: '', prepMinutes: '', includes: '', image: '' });
  const [menuFormErrors, setMenuFormErrors] = useState({});
  const [menuSaving, setMenuSaving] = useState(false);
  const [menuImageFile, setMenuImageFile] = useState(null);
  const [menuImagePreview, setMenuImagePreview] = useState('');
  const [menuDeleteConfirm, setMenuDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMenuLoading(true);
    const unsub = subscribeMenuItems(items => { setMenuItems(items); setMenuLoading(false); });
    return unsub;
  }, []);

  const resetMenuForm = () => {
    setShowMenuForm(false);
    setEditingMenuId(null);
    setMenuForm({ name: '', price: '', description: '', prepTime: '', prepMinutes: '', includes: '', image: '' });
    setMenuFormErrors({});
    setMenuImageFile(null);
    setMenuImagePreview('');
    setMenuDeleteConfirm(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEditMenuItem = (item) => {
    setEditingMenuId(item.id);
    setMenuForm({
      name: item.name || '',
      price: item.price?.toString() || '',
      description: item.description || '',
      prepTime: item.prepTime || '',
      prepMinutes: item.prepMinutes?.toString() || '',
      includes: (item.includes || []).join('، '),
      image: item.image || '',
    });
    setMenuImagePreview(item.image || '');
    setMenuImageFile(null);
    setMenuFormErrors({});
    setShowMenuForm(true);
    setMenuDeleteConfirm(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMenuSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!menuForm.name.trim()) errs.name = menuContent.errors.nameRequired;
    const priceNum = Number(menuForm.price);
    if (!menuForm.price || isNaN(priceNum) || priceNum <= 0) errs.price = menuContent.errors.priceInvalid;
    if (Object.keys(errs).length) { setMenuFormErrors(errs); return; }

    setMenuSaving(true);
    setMenuFormErrors({});
    try {
      let imageUrl = menuForm.image || '';
      if (menuImageFile) imageUrl = await uploadImage(menuImageFile, 'haat/menu');

      const includesArray = menuForm.includes
        ? menuForm.includes.split(/[,،]/).map(s => s.trim()).filter(Boolean)
        : [];

      const data = {
        name: menuForm.name.trim(),
        price: priceNum,
        description: menuForm.description.trim(),
        prepTime: menuForm.prepTime.trim(),
        prepMinutes: menuForm.prepMinutes ? Number(menuForm.prepMinutes) : 0,
        includes: includesArray,
        image: imageUrl,
        order: editingMenuId
          ? (menuItems.find(m => m.id === editingMenuId)?.order ?? menuItems.length)
          : menuItems.length,
      };
      await saveMenuItem(data, editingMenuId);
      resetMenuForm();
    } catch (err) {
      console.error(err);
      setMenuFormErrors({ name: menuContent.errors.saveFailed });
    } finally {
      setMenuSaving(false);
    }
  };

  const handleMenuDelete = async (id) => {
    try { await deleteMenuItem(id); setMenuDeleteConfirm(null); } catch (err) { console.error(err); }
  };

  // ── Extras ─────────────────────────────────────────────────
  const [extrasItems, setExtrasItems] = useState([]);
  const [extrasLoading, setExtrasLoading] = useState(true);
  const [showExtrasForm, setShowExtrasForm] = useState(false);
  const [editingExtraId, setEditingExtraId] = useState(null);
  const [extrasForm, setExtrasForm] = useState({ name: '', price: '', image: '' });
  const [extrasFormErrors, setExtrasFormErrors] = useState({});
  const [extrasSaving, setExtrasSaving] = useState(false);
  const [extrasDeleteConfirm, setExtrasDeleteConfirm] = useState(null);
  const [extrasImageFile, setExtrasImageFile] = useState(null);
  const [extrasImagePreview, setExtrasImagePreview] = useState('');
  const extrasFileInputRef = useRef(null);

  useEffect(() => {
    setExtrasLoading(true);
    const unsub = subscribeExtras(items => { setExtrasItems(items); setExtrasLoading(false); });
    return unsub;
  }, []);

  const resetExtrasForm = () => {
    setShowExtrasForm(false);
    setEditingExtraId(null);
    setExtrasForm({ name: '', price: '', image: '' });
    setExtrasFormErrors({});
    setExtrasDeleteConfirm(null);
    setExtrasImageFile(null);
    setExtrasImagePreview('');
    if (extrasFileInputRef.current) extrasFileInputRef.current.value = '';
  };

  const startEditExtra = (item) => {
    setEditingExtraId(item.id);
    setExtrasForm({ name: item.name || '', price: item.price?.toString() || '', image: item.image || '' });
    setExtrasImagePreview(item.image || '');
    setExtrasImageFile(null);
    setExtrasFormErrors({});
    setShowExtrasForm(true);
    setExtrasDeleteConfirm(null);
    if (extrasFileInputRef.current) extrasFileInputRef.current.value = '';
  };

  const handleExtrasSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!extrasForm.name.trim()) errs.name = extrasContent.errors.nameRequired;
    const priceNum = Number(extrasForm.price);
    if (!extrasForm.price || isNaN(priceNum) || priceNum <= 0) errs.price = extrasContent.errors.priceInvalid;
    if (Object.keys(errs).length) { setExtrasFormErrors(errs); return; }

    setExtrasSaving(true);
    setExtrasFormErrors({});
    try {
      let imageUrl = extrasForm.image || '';
      if (extrasImageFile) imageUrl = await uploadImage(extrasImageFile, 'haat/extras');

      const data = {
        name: extrasForm.name.trim(),
        price: priceNum,
        image: imageUrl,
        order: editingExtraId
          ? (extrasItems.find(e => e.id === editingExtraId)?.order ?? extrasItems.length)
          : extrasItems.length,
      };
      await saveExtra(data, editingExtraId);
      resetExtrasForm();
    } catch (err) {
      console.error(err);
      setExtrasFormErrors({ name: extrasContent.errors.saveFailed });
    } finally {
      setExtrasSaving(false);
    }
  };

  const handleExtrasDelete = async (id) => {
    try { await deleteExtra(id); setExtrasDeleteConfirm(null); } catch (err) { console.error(err); }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-tab switcher */}
      <div className="flex bg-white rounded-2xl p-1 shadow-sm gap-1">
        <button
          onClick={() => { setSubTab('items'); resetMenuForm(); }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${subTab === 'items' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {menuContent.itemsSubTab}
        </button>
        <button
          onClick={() => { setSubTab('extras'); resetExtrasForm(); }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${subTab === 'extras' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {menuContent.extrasSubTab}
        </button>
      </div>

      {/* ── Items sub-tab ── */}
      {subTab === 'items' && (
        <>
          {!showMenuForm && (
            <button
              onClick={() => { resetMenuForm(); setShowMenuForm(true); }}
              className="w-full bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl leading-none">+</span>
              {menuContent.addButton}
            </button>
          )}

          {showMenuForm && (
            <div className="bg-white rounded-2xl p-4 shadow-md">
              <h2 className="font-black text-gray-800 mb-4 text-lg">
                {editingMenuId ? menuContent.editTitle : menuContent.addTitle}
              </h2>
              <form onSubmit={handleMenuSave} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{menuContent.imageLabel}</label>
                  <div className="flex items-center gap-3">
                    {menuImagePreview && (
                      <img src={menuImagePreview} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-gray-200 shrink-0" />
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-center text-sm text-gray-400 hover:border-red-400 hover:text-red-400 transition-colors">
                        {menuImagePreview ? menuContent.imageChange : menuContent.imageChoose}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files[0];
                          if (!file) return;
                          setMenuImageFile(file);
                          setMenuImagePreview(URL.createObjectURL(file));
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={menuForm.name}
                    onChange={e => setMenuForm({ ...menuForm, name: e.target.value })}
                    placeholder={menuContent.namePlaceholder}
                    className={`w-full border ${menuFormErrors.name ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
                  />
                  {menuFormErrors.name && <p className="text-red-500 text-xs mt-1">{menuFormErrors.name}</p>}
                </div>

                <div>
                  <input
                    type="number"
                    min="1"
                    value={menuForm.price}
                    onChange={e => setMenuForm({ ...menuForm, price: e.target.value })}
                    placeholder={menuContent.pricePlaceholder}
                    className={`w-full border ${menuFormErrors.price ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
                  />
                  {menuFormErrors.price && <p className="text-red-500 text-xs mt-1">{menuFormErrors.price}</p>}
                </div>

                <textarea
                  rows={2}
                  value={menuForm.description}
                  onChange={e => setMenuForm({ ...menuForm, description: e.target.value })}
                  placeholder={menuContent.descriptionPlaceholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={menuForm.prepTime}
                    onChange={e => setMenuForm({ ...menuForm, prepTime: e.target.value })}
                    placeholder={menuContent.prepTimePlaceholder}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                  />
                  <input
                    type="number"
                    min="1"
                    value={menuForm.prepMinutes}
                    onChange={e => setMenuForm({ ...menuForm, prepMinutes: e.target.value })}
                    placeholder={menuContent.prepMinutesPlaceholder}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                  />
                </div>

                <input
                  type="text"
                  value={menuForm.includes}
                  onChange={e => setMenuForm({ ...menuForm, includes: e.target.value })}
                  placeholder={menuContent.includesPlaceholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400"
                />

                <div className="flex gap-2 mt-1">
                  <button
                    type="submit"
                    disabled={menuSaving}
                    className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
                  >
                    {menuSaving ? menuContent.savingButton : menuContent.saveButton}
                  </button>
                  <button
                    type="button"
                    onClick={resetMenuForm}
                    className="px-4 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    {menuContent.cancelButton}
                  </button>
                </div>
              </form>
            </div>
          )}

          {menuLoading && <p className="text-center text-gray-500 py-10">{admin.loading}</p>}
          {!menuLoading && menuItems.length === 0 && !showMenuForm && (
            <p className="text-center text-gray-400 py-10">{menuContent.emptyItems}</p>
          )}

          {menuItems.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-md flex gap-4 items-start">
              {item.image && (
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800">{item.name}</p>
                <p className="text-red-600 font-bold text-sm">{item.price} {admin.currency}</p>
                {item.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.description}</p>}
                {item.prepTime && <p className="text-gray-400 text-xs mt-1">⏱ {item.prepTime}</p>}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => startEditMenuItem(item)}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                  >
                    {menuContent.editButton}
                  </button>
                  {menuDeleteConfirm === item.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMenuDelete(item.id)}
                        className="bg-red-500 text-white font-bold px-3 py-2 rounded-xl hover:bg-red-600 transition-colors text-sm"
                      >
                        {menuContent.confirmDeleteButton}
                      </button>
                      <button
                        onClick={() => setMenuDeleteConfirm(null)}
                        className="bg-gray-100 text-gray-600 font-bold px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                      >
                        {menuContent.cancelButton}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setMenuDeleteConfirm(item.id)}
                      className="bg-red-50 text-red-500 font-bold py-2 px-3 rounded-xl hover:bg-red-100 transition-colors text-sm"
                    >
                      {menuContent.deleteButton}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── Extras sub-tab ── */}
      {subTab === 'extras' && (
        <>
          {!showExtrasForm && (
            <button
              onClick={() => { resetExtrasForm(); setShowExtrasForm(true); }}
              className="w-full bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl leading-none">+</span>
              {extrasContent.addButton}
            </button>
          )}

          {showExtrasForm && (
            <div className="bg-white rounded-2xl p-4 shadow-md">
              <h2 className="font-black text-gray-800 mb-4 text-lg">
                {editingExtraId ? extrasContent.editTitle : extrasContent.addTitle}
              </h2>
              <form onSubmit={handleExtrasSave} className="flex flex-col gap-3">
                {/* Image upload */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{menuContent.imageLabel}</label>
                  <div className="flex items-center gap-3">
                    {extrasImagePreview && (
                      <img src={extrasImagePreview} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-gray-200 shrink-0" />
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-center text-sm text-gray-400 hover:border-red-400 hover:text-red-400 transition-colors">
                        {extrasImagePreview ? menuContent.imageChange : menuContent.imageChoose}
                      </div>
                      <input
                        ref={extrasFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files[0];
                          if (!file) return;
                          setExtrasImageFile(file);
                          setExtrasImagePreview(URL.createObjectURL(file));
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={extrasForm.name}
                    onChange={e => setExtrasForm({ ...extrasForm, name: e.target.value })}
                    placeholder={extrasContent.namePlaceholder}
                    className={`w-full border ${extrasFormErrors.name ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
                  />
                  {extrasFormErrors.name && <p className="text-red-500 text-xs mt-1">{extrasFormErrors.name}</p>}
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    value={extrasForm.price}
                    onChange={e => setExtrasForm({ ...extrasForm, price: e.target.value })}
                    placeholder={extrasContent.pricePlaceholder}
                    className={`w-full border ${extrasFormErrors.price ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
                  />
                  {extrasFormErrors.price && <p className="text-red-500 text-xs mt-1">{extrasFormErrors.price}</p>}
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    type="submit"
                    disabled={extrasSaving}
                    className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
                  >
                    {extrasSaving ? extrasContent.savingButton : extrasContent.saveButton}
                  </button>
                  <button
                    type="button"
                    onClick={resetExtrasForm}
                    className="px-4 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    {extrasContent.cancelButton}
                  </button>
                </div>
              </form>
            </div>
          )}

          {extrasLoading && <p className="text-center text-gray-500 py-10">{admin.loading}</p>}
          {!extrasLoading && extrasItems.length === 0 && !showExtrasForm && (
            <p className="text-center text-gray-400 py-10">{extrasContent.emptyItems}</p>
          )}

          {extrasItems.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-md flex items-center gap-4">
              {item.image
                ? <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl shrink-0" />
                : <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-3xl shrink-0">✨</div>
              }
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800">{item.name}</p>
                <p className="text-red-600 font-bold text-sm">{item.price} {admin.currency}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEditExtra(item)}
                  className="bg-gray-100 text-gray-700 font-bold py-2 px-3 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                >
                  {extrasContent.editButton}
                </button>
                {extrasDeleteConfirm === item.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleExtrasDelete(item.id)}
                      className="bg-red-500 text-white font-bold px-3 py-2 rounded-xl hover:bg-red-600 transition-colors text-sm"
                    >
                      {extrasContent.confirmDeleteButton}
                    </button>
                    <button
                      onClick={() => setExtrasDeleteConfirm(null)}
                      className="bg-gray-100 text-gray-600 font-bold px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                    >
                      {extrasContent.cancelButton}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setExtrasDeleteConfirm(item.id)}
                    className="bg-red-50 text-red-500 font-bold py-2 px-3 rounded-xl hover:bg-red-100 transition-colors text-sm"
                  >
                    {extrasContent.deleteButton}
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
