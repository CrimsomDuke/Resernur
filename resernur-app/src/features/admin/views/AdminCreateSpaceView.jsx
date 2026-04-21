import React, { useEffect, useMemo, useState } from 'react';
import { addLocalNotification } from '../../../utils/notificationCenter';

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
  userInChargeId: '',
  hasProjector: false,
  hasWifi: true,
  hasAirConditioning: false
};

export default function AdminCreateSpaceView({ editingSpace = null, onEditSaved, onCancelEdit }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [createdSpaces, setCreatedSpaces] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [photoHint, setPhotoHint] = useState('');
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [encargados, setEncargados] = useState([]);
  const [isLoadingEncargados, setIsLoadingEncargados] = useState(true);
  const [encargadosError, setEncargadosError] = useState('');

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
      return;
    }

    setForm((prev) => ({
      ...prev,
      name: editingSpace?.name || '',
      description: editingSpace?.description || '',
      capacity: editingSpace?.capacity ? String(editingSpace.capacity) : '',
      userInChargeId: editingSpace?.userInChargeId ? String(editingSpace.userInChargeId) : '',
      location: editingSpace?.location || ''
    }));

    setSelectedImageFiles([]);
    setSuccessMsg('');
    setErrorMsg('');
    setPhotoHint('');
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

  const onCheckChange = (field) => (event) => {
    const value = event.target.checked;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSelectPhoto = (event) => {
    const files = Array.from(event.target.files || []);
    setSelectedImageFiles(files);

    if (files.length > 0) {
      const previewNames = files.slice(0, 3).map((file) => file.name).join(', ');
      const extraLabel = files.length > 3 ? ` y ${files.length - 3} mas` : '';
      setPhotoHint(`${files.length} imagen(es) seleccionada(s): ${previewNames}${extraLabel}.`);
    } else {
      setPhotoHint('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setPhotoHint('');

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

      let uploadedImageUrls = [];
      if (selectedImageFiles.length > 0) {
        const formData = new FormData();
        selectedImageFiles.forEach((file) => {
          formData.append('images', file);
        });

        const imageUploadResponse = await fetch(`http://localhost:5000/api/places/${result.id}/images`, {
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
      equipment: [
        form.hasProjector ? 'Proyector' : null,
        form.hasWifi ? 'Wi-Fi' : null,
        form.hasAirConditioning ? 'Aire acondicionado' : null
      ].filter(Boolean)
    };

      setCreatedSpaces((prev) => {
        if (isEditMode) {
          return [previewItem, ...prev.filter((item) => item.id !== previewItem.id)];
        }
        return [previewItem, ...prev];
      });
      localStorage.removeItem(LOCAL_SPACES_STORAGE_KEY);

      setSuccessMsg(isEditMode ? 'Espacio actualizado con exito.' : 'Espacio creado con exito.');

      if (isEditMode) {
        if (typeof onEditSaved === 'function') {
          onEditSaved(result);
        }
      } else {
        addLocalNotification({
          type: 'SPACE_CREATED',
          message: `Se creo el espacio "${result.name}".`
        });
        setForm(INITIAL_FORM);
        setSelectedImageFiles([]);
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
            ? 'Actualiza los datos del espacio seleccionado y guarda los cambios.'
            : 'Formulario conectado al backend con seleccion obligatoria de encargado.'}
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
                  className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Encargado *</span>
                <select
                  value={form.userInChargeId}
                  onChange={onInputChange('userInChargeId')}
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
                placeholder="Describe el uso academico, recursos, restricciones y notas del espacio..."
                className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </label>

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

            {photoHint && (
              <div className="rounded-lg bg-primary-fixed/50 border border-primary-fixed-dim px-4 py-3 text-sm text-on-surface">
                {photoHint}
              </div>
            )}

            <fieldset>
              <legend className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-3">Equipamiento base</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2 border border-surface-container-high">
                  <input type="checkbox" checked={form.hasProjector} onChange={onCheckChange('hasProjector')} />
                  <span className="text-sm">Proyector</span>
                </label>
                <label className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2 border border-surface-container-high">
                  <input type="checkbox" checked={form.hasWifi} onChange={onCheckChange('hasWifi')} />
                  <span className="text-sm">Wi-Fi</span>
                </label>
                <label className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2 border border-surface-container-high">
                  <input type="checkbox" checked={form.hasAirConditioning} onChange={onCheckChange('hasAirConditioning')} />
                  <span className="text-sm">Aire acondicionado</span>
                </label>
              </div>
            </fieldset>

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
                {space.equipment.length > 0 && (
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
