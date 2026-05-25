import React, { useEffect, useMemo, useState } from 'react';

const LOCAL_SPACES_STORAGE_KEY = 'resernur_local_spaces';
const DEFAULT_SPACE_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCnw1bJEiqqg6hJ0WgN5OEE3d9xXzaa5CnvKVVKfWDu2waWCJ1Zw2ImMb4KikxZGOb9hWmXi9gwxVubXM2XKhMMm5kGTp8OxpMo_MjQdX8l11HmcJZg7r7WoMeRJk-I-4zR7J-mxIhOg6k4eRBQ_bVayhZMtERQirMCmUpSXNIAsm4tWZULclwjIcVIP8BWdXM4aOrFI9Wh4cOYiCrFUrYyKAgwW61K6seaVLCpmHjX_dISaLj7oCTsFaNspKyLCcsRVg_NGsO498w',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBn0WnBxGNPHdZnJS6k4vmL84ldZMzye8t7nNvm3Olh9IU1hwx_NUzfPEFT8WlP25wQl1_y908B4s3M_U6KIo154EEBjIXYfyVFQZ23sKHdI3xXT-fP_WTHsfkguVF8g_W6kgYr86IpQ7LlTCyb8baPXvoCZFLk0wBvDFXxoUQJZ_Oh0gGkW5IuVlTJHIAU_A6nNZ_Gm6rL2vmI3Cf9Duhwaxli8_EqBw-2j3nSYOW_ui1N1LAZb5g3NGDDprRrB8q0vh9NNCRiuuk',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDgKAsDu_IhY694CGDVZxFRq6Cikso0ucRJNOfjUD34P4TbIAjX6hF568LYY9W6wUFo-S-v47lS17RcXhlTBHU_WCJLLxM6gyxTknCGRrnjVNtYpRSvhhjhlICuiIJHBvqhJxWfYkyfS6bUedlxC3Veu2mlPt9sDojz3kafo5C5iETh1129j-XzwzWPEJdfbWe7kRq_rPYUjFNR3XDf39MQVeJG2D3ZJndAYpg4NLfb3SArxAetuWmWx6hLtwmgC3gyl3UdlNf_6WI'
];

const INITIAL_FORM = {
  name: '',
  description: '',
  capacity: '',
  location: '',
  userInChargeId: ''
};

export default function AdminCreateSpaceView({ editingSpace = null, onEditSaved, onCancelEdit }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [createdSpaces, setCreatedSpaces] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [encargados, setEncargados] = useState([]);
  const [isLoadingEncargados, setIsLoadingEncargados] = useState(true);
  const [encargadosError, setEncargadosError] = useState('');

  // Estados para equipamiento dinámico
  const [equipmentList, setEquipmentList] = useState([]);
  const [deletedEquipmentIds, setDeletedEquipmentIds] = useState([]);
  const [newEqName, setNewEqName] = useState("");
  const [newEqQty, setNewEqQty] = useState(1);

  const isEditMode = Number(editingSpace?.id) > 0;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SPACES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setCreatedSpaces(parsed);
      }
    } catch {
      setCreatedSpaces([]);
    }
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      setForm(INITIAL_FORM);
      setEquipmentList([]);
      setDeletedEquipmentIds([]);
      return;
    }

    setForm({
      name: editingSpace?.name || '',
      description: editingSpace?.description || '',
      capacity: editingSpace?.capacity ? String(editingSpace.capacity) : '',
      userInChargeId: editingSpace?.userInChargeId ? String(editingSpace.userInChargeId) : '',
      location: editingSpace?.location || ''
    });

    setSelectedImageFiles([]);
    setExistingImages([]);
    setSuccessMsg('');
    setErrorMsg('');

    // Fetch existing equipment for this space
    const fetchEq = async () => {
      try {
        const token = localStorage.getItem('resernur_token');
        const res = await fetch(`http://localhost:5000/api/places/${editingSpace.id}/equipment?pageSize=50`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setEquipmentList(data.content || []);
        }

        const resImages = await fetch(`http://localhost:5000/api/places/${editingSpace.id}/images?pageSize=50`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (resImages.ok) {
          const imgData = await resImages.json();
          setExistingImages(imgData.content || []);
        }
      } catch (e) {
        console.error("Error cargando informacion adicional", e);
      }
    };
    fetchEq();
    setDeletedEquipmentIds([]);
  }, [editingSpace, isEditMode]);

  useEffect(() => {
    const loadEncargados = async () => {
      setIsLoadingEncargados(true);
      setEncargadosError('');
      try {
        const token = localStorage.getItem('resernur_token');
        if (!token) {
          setEncargados([]);
          setEncargadosError('No hay sesion activa para cargar encargados.');
          return;
        }

        const response = await fetch('http://localhost:5000/api/users?page=0&pageSize=200', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('resernur_token');
          setEncargados([]);
          setEncargadosError('No autorizado para cargar encargados. Inicia sesion nuevamente.');
          return;
        }

        if (!response.ok) {
          setEncargados([]);
          setEncargadosError('No se pudo cargar la lista de encargados.');
          return;
        }

        const data = await response.json().catch(() => ({}));
        const users = Array.isArray(data?.content) ? data.content : [];
        const onlyEncargados = users
          .filter((user) => user?.role === 'ENCARGADO' && typeof user?.id === 'number' && user.id > 0)
          .map((user) => ({ id: user.id, fullName: user.fullName || 'Sin nombre', email: user.email || '' }))
          .sort((a, b) => a.fullName.localeCompare(b.fullName));

        setEncargados(onlyEncargados);

        if (onlyEncargados.length === 0) {
          setEncargadosError('No hay usuarios con rol ENCARGADO para seleccionar.');
        }
      } catch {
        setEncargados([]);
        setEncargadosError('Error de red al cargar encargados.');
      } finally {
        setIsLoadingEncargados(false);
      }
    };

    loadEncargados();
  }, []);

  const isValid = useMemo(() => {
    return form.name.trim().length >= 3 && Number(form.capacity) > 0 && Number(form.userInChargeId) > 0;
  }, [form]);

  const encargadosById = useMemo(() => {
    return encargados.reduce((acc, encargado) => {
      acc[encargado.id] = encargado.fullName;
      return acc;
    }, {});
  }, [encargados]);

  const onInputChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSelectPhoto = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedImageFiles((prev) => [...prev, ...files]);
    }
    // Para permitir subir la misma imagen despues de borrarla
    event.target.value = null;
  };

  const handleRemoveNewImage = (idxToRemove) => {
    setSelectedImageFiles((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleRemoveExistingImage = async (imageId) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta imagen permanentemente?")) return;
    try {
      const token = localStorage.getItem('resernur_token');
      const res = await fetch(`http://localhost:5000/api/places/images/${imageId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      } else {
        alert("No se pudo eliminar la imagen del servidor.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de red al eliminar la imagen.");
    }
  };

  const handleAddEquipment = (e) => {
    e.preventDefault();
    if (!newEqName.trim() || newEqQty < 1) return;
    setEquipmentList(prev => [...prev, { id: `temp-${Date.now()}`, equipmentName: newEqName.trim(), quantity: newEqQty, status: 'AVAILABLE', isNew: true }]);
    setNewEqName("");
    setNewEqQty(1);
  };

  const handleRemoveEquipment = (idToRemove) => {
    setEquipmentList(prev => {
      const item = prev.find(i => i.id === idToRemove);
      if (item && !item.isNew) {
        setDeletedEquipmentIds(d => [...d, item.id]);
      }
      return prev.filter(i => i.id !== idToRemove);
    });
  };

  const handleUpdateQty = (idToUpdate, delta) => {
    setEquipmentList(prev => prev.map(item => {
      if (item.id === idToUpdate) {
        const newQ = item.quantity + delta;
        if (newQ > 0) return { ...item, quantity: newQ, isModified: !item.isNew };
      }
      return item;
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!isValid) {
      setErrorMsg('Completa nombre, capacidad valida y selecciona un encargado para registrar el espacio.');
      return;
    }

    const finalImage = DEFAULT_SPACE_IMAGES[Math.floor(Math.random() * DEFAULT_SPACE_IMAGES.length)];

    const token = localStorage.getItem('resernur_token');
    if (!token) {
      setErrorMsg('No hay sesion activa. Inicia sesion nuevamente.');
      return;
    }

    const resolvedUserInChargeId = Number(form.userInChargeId);

    if (!resolvedUserInChargeId || Number.isNaN(resolvedUserInChargeId) || resolvedUserInChargeId <= 0) {
      setErrorMsg('Debes seleccionar un encargado valido de la lista.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      capacity: Number(form.capacity),
      userInChargeId: resolvedUserInChargeId
    };

    setIsSubmitting(true);

    try {
      const endpoint = isEditMode
        ? `http://localhost:5000/api/places/${editingSpace.id}`
        : 'http://localhost:5000/api/places';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('resernur_token');
        throw new Error(
          isEditMode
            ? 'No autorizado para editar espacios. Inicia sesion nuevamente con un usuario administrador.'
            : 'No autorizado para crear espacios. Inicia sesion nuevamente con un usuario administrador.'
        );
      }

      const data = await response.json().catch(() => ({}));
      const result = data?.data || null;

      if (!response.ok || data?.success === false || !result) {
        const backendMessage = data?.errorMessage || data?.error || (isEditMode
          ? 'No se pudo editar el espacio en la API.'
          : 'No se pudo crear el espacio en la API.');
        throw new Error(backendMessage);
      }

      const spaceId = result.id;

      // Sincronizar Equipamiento
      try {
        // 1. Borrar eliminados
        for (const dId of deletedEquipmentIds) {
          await fetch(`http://localhost:5000/api/equipment/${dId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        // 2. Añadir nuevos
        const newItems = equipmentList.filter(eq => eq.isNew);
        for (const nEq of newItems) {
          await fetch(`http://localhost:5000/api/places/${spaceId}/equipment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ equipmentName: nEq.equipmentName, quantity: nEq.quantity, status: 'AVAILABLE' })
          });
        }
        // 3. Actualizar modificados
        const modItems = equipmentList.filter(eq => eq.isModified);
        for (const mEq of modItems) {
           await fetch(`http://localhost:5000/api/equipment/${mEq.id}/quantity`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: mEq.quantity })
          });
        }
      } catch (err) {
        console.error("Error sincronizando equipamiento:", err);
      }

      // Sincronizar Fotos
      let uploadedImageUrls = [];
      if (selectedImageFiles.length > 0) {
        const formData = new FormData();
        selectedImageFiles.forEach((file) => {
          formData.append('images', file);
        });

        const imageUploadResponse = await fetch(`http://localhost:5000/api/places/${spaceId}/images`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        if (!imageUploadResponse.ok) {
          throw new Error('El espacio se creo, pero no se pudieron subir las imagenes.');
        }

        const imageUploadData = await imageUploadResponse.json().catch(() => ({}));
        const imageContent = imageUploadData?.content || imageUploadData?.data?.content || [];
        uploadedImageUrls = Array.isArray(imageContent)
          ? imageContent.map((item) => item?.url).filter(Boolean)
          : [];
      }

      const previewItem = {
      id: result.id,
      name: result.name,
      description: result.description,
      location: form.location.trim(),
      userInChargeId: result.userInChargeId,
      userInChargeName: encargadosById[result.userInChargeId] || 'Encargado asignado',
      capacity: result.capacity,
      image: uploadedImageUrls[0] || finalImage,
      images: uploadedImageUrls.length > 0 ? uploadedImageUrls : [finalImage],
      equipment: equipmentList.map(eq => `${eq.equipmentName} (x${eq.quantity})`)
    };

      setCreatedSpaces((prev) => {
        if (isEditMode) {
          return [previewItem, ...prev.filter((item) => item.id !== previewItem.id)];
        }
        return [previewItem, ...prev];
      });
      localStorage.removeItem(LOCAL_SPACES_STORAGE_KEY);

      setSuccessMsg(isEditMode ? 'Espacio y equipamiento actualizados con exito.' : 'Espacio creado con exito.');

      if (isEditMode) {
        if (typeof onEditSaved === 'function') {
          onEditSaved(result);
        }
      } else {
        setForm(INITIAL_FORM);
        setSelectedImageFiles([]);
        setEquipmentList([]);
        setDeletedEquipmentIds([]);
      }
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar el espacio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest font-label font-semibold text-on-surface-variant">Recursos Institucionales</p>
        <h2 className="font-headline text-3xl font-bold text-primary mt-1">
          {isEditMode ? 'Editar espacio' : 'Crear nuevo espacio'}
        </h2>
        <p className="text-on-surface-variant mt-2">
          {isEditMode
            ? 'Actualiza los datos del espacio y su equipamiento, luego guarda los cambios.'
            : 'Añade la información general y construye el inventario de equipamiento de este nuevo espacio.'}
        </p>
        {isEditMode && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-secondary-container px-3 py-2 text-sm text-primary font-semibold">
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Editando: {editingSpace?.name || `Espacio #${editingSpace?.id}`}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article className="xl:col-span-2 bg-surface-container-lowest border border-surface-container-high rounded-xl p-6">
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-error-container text-on-error-container px-4 py-3 text-sm font-semibold border border-red-200">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-lg bg-secondary-container text-on-secondary-container px-4 py-3 text-sm font-semibold border border-primary-fixed">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Nombre del espacio *</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={onInputChange('name')}
                  placeholder="Ej: Laboratorio C-302"
                  data-testid='create-space-name'
                  className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Capacidad *</span>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={onInputChange('capacity')}
                  placeholder="40"
                  data-testid='create-space-capacity'
                  className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Ubicacion</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={onInputChange('location')}
                  placeholder="Bloque A - Piso 2"
                  data-testid='create-space-location'
                  className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Encargado *</span>
                <select
                  value={form.userInChargeId}
                  onChange={onInputChange('userInChargeId')}
                  data-testid='create-space-userInCharge'
                  className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                  disabled={isLoadingEncargados || encargados.length === 0}
                >
                  <option value="" disabled>
                    {isLoadingEncargados ? 'Cargando encargados...' : 'Selecciona un encargado'}
                  </option>
                  {encargados.map((encargado) => (
                    <option key={encargado.id} value={encargado.id}>
                      {encargado.fullName}
                    </option>
                  ))}
                </select>
                {encargadosError && <p className="text-xs text-error mt-1">{encargadosError}</p>}
                {!encargadosError && (
                  <p className="text-xs text-on-surface-variant mt-1">
                    Desplaza la lista y selecciona un usuario con rol ENCARGADO.
                  </p>
                )}
              </label>
            </div>

            <label className="block">
              <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Descripcion</span>
              <textarea
                rows="4"
                value={form.description}
                onChange={onInputChange('description')}
                data-testid='create-space-description'
                placeholder="Describe el uso academico, recursos, restricciones y notas del espacio..."
                className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </label>

            <fieldset>
              <legend className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-3">Inventario del Espacio</legend>
              <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-4">
                
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    value={newEqName}
                    onChange={e => setNewEqName(e.target.value)}
                    placeholder="Nombre del equipo (Ej. Proyector)"
                    className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                  <input 
                    type="number" 
                    min="1"
                    value={newEqQty}
                    onChange={e => setNewEqQty(parseInt(e.target.value) || 1)}
                    className="w-16 rounded-lg border border-outline-variant px-2 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-center"
                  />
                  <button 
                    type="button"
                    onClick={handleAddEquipment}
                    disabled={!newEqName.trim()}
                    className="bg-secondary-container text-primary font-bold px-4 py-2 rounded-lg text-sm hover:bg-secondary-container/80 disabled:opacity-50"
                  >
                    Añadir
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                  {equipmentList.length === 0 ? (
                    <p className="text-xs text-on-surface-variant text-center py-2 italic">Sin equipamiento asignado.</p>
                  ) : (
                    equipmentList.map(eq => (
                      <div key={eq.id} className="flex items-center justify-between bg-white border border-outline-variant rounded-lg p-2">
                        <span className="text-sm font-medium text-on-surface flex-1">{eq.equipmentName}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-surface-container-lowest rounded-md border border-outline-variant">
                            <button type="button" onClick={() => handleUpdateQty(eq.id, -1)} className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low rounded-l-md">-</button>
                            <span className="text-xs font-bold w-6 text-center">{eq.quantity}</span>
                            <button type="button" onClick={() => handleUpdateQty(eq.id, 1)} className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low rounded-r-md">+</button>
                          </div>
                          <button type="button" onClick={() => handleRemoveEquipment(eq.id)} className="text-error hover:text-error/80">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </fieldset>

            <label className="block">
              <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Fotos del espacio</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onSelectPhoto}
                className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2 bg-white"
              />
              <p className="text-xs text-on-surface-variant mt-1">
                Puedes elegir una o varias imagenes. Se subiran al backend cuando guardes el espacio.
              </p>
            </label>

            {(existingImages.length > 0 || selectedImageFiles.length > 0) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative aspect-video bg-surface-container-low rounded-lg border border-outline-variant overflow-hidden group">
                    <img src={img.url} alt="Space" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleRemoveExistingImage(img.id)} className="absolute top-1 right-1 bg-white/80 hover:bg-error hover:text-white rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
                {selectedImageFiles.map((file, idx) => (
                  <div key={idx} className="relative aspect-video bg-surface-container-low rounded-lg border border-outline-variant overflow-hidden group flex items-center justify-center p-2 text-center text-ellipsis">
                    <span className="text-[10px] font-semibold text-on-surface-variant break-all line-clamp-3">{file.name}</span>
                    <button type="button" onClick={() => handleRemoveNewImage(idx)} className="absolute top-1 right-1 bg-white/80 hover:bg-error hover:text-white rounded-md p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                    <div className="absolute top-0 left-0 bg-secondary-container text-secondary text-[9px] font-bold px-1.5 py-0.5 rounded-br-lg uppercase tracking-wider">Nuevo</div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-surface-container-high flex justify-end">
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof onCancelEdit === 'function') onCancelEdit();
                  }}
                  className="px-6 py-3 rounded-md border border-outline-variant text-on-surface font-semibold hover:bg-surface-container transition-colors mr-3"
                >
                  Cancelar edicion
                </button>
              )}
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                data-testid='create-space-submit-button'
                className="px-6 py-3 rounded-md bg-primary text-white font-semibold hover:bg-primary-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar espacio' : 'Guardar espacio')}
              </button>
            </div>
          </form>
        </article>

        <aside className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5">
          <h3 className="font-headline text-lg font-bold text-primary">Vista previa de espacios</h3>
          <p className="text-sm text-on-surface-variant mt-1">Se guarda temporalmente en esta pantalla.</p>

          <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {createdSpaces.length === 0 && (
              <div className="rounded-lg border border-dashed border-outline-variant p-4 text-sm text-on-surface-variant">
                Aun no creaste espacios en esta sesion.
              </div>
            )}

            {createdSpaces.map((space) => (
              <article key={space.id} className="rounded-lg border border-surface-container-high bg-surface-container-low p-4">
                <img
                  src={space.image}
                  alt={space.name}
                  className="w-full h-28 object-cover rounded-md mb-3"
                />
                <p className="font-headline font-bold text-on-surface">{space.name}</p>
                <p className="text-xs text-on-surface-variant mt-1">Capacidad: {space.capacity}</p>
                {space.location && <p className="text-xs text-on-surface-variant">Ubicacion: {space.location}</p>}
                {space.userInChargeId > 0 && (
                  <p className="text-xs text-on-surface-variant">
                    Encargado: {space.userInChargeName || encargadosById[space.userInChargeId] || `ID ${space.userInChargeId}`}
                  </p>
                )}
                {space.equipment && space.equipment.length > 0 && (
                  <p className="text-xs text-on-surface-variant mt-2">Equipamiento: {space.equipment.join(', ')}</p>
                )}
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
