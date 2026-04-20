import React, { useMemo, useState } from 'react';

const INITIAL_FORM = {
  name: '',
  description: '',
  capacity: '',
  location: '',
  managerName: '',
  hasProjector: false,
  hasWifi: true,
  hasAirConditioning: false
};

export default function AdminCreateSpaceView() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [createdSpaces, setCreatedSpaces] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isValid = useMemo(() => {
    return form.name.trim().length >= 3 && Number(form.capacity) > 0;
  }, [form]);

  const onInputChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onCheckChange = (field) => (event) => {
    const value = event.target.checked;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!isValid) {
      setErrorMsg('Completa al menos nombre y capacidad valida para registrar el espacio.');
      return;
    }

    const previewItem = {
      id: Date.now(),
      name: form.name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      managerName: form.managerName.trim(),
      capacity: Number(form.capacity),
      equipment: [
        form.hasProjector ? 'Proyector' : null,
        form.hasWifi ? 'Wi-Fi' : null,
        form.hasAirConditioning ? 'Aire acondicionado' : null
      ].filter(Boolean)
    };

    setCreatedSpaces((prev) => [previewItem, ...prev]);
    setSuccessMsg('Espacio agregado a la vista previa del panel (modo frontend).');
    setForm(INITIAL_FORM);
  };

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest font-label font-semibold text-on-surface-variant">Recursos Institucionales</p>
        <h2 className="font-headline text-3xl font-bold text-primary mt-1">Crear nuevo espacio</h2>
        <p className="text-on-surface-variant mt-2">
          Esta pantalla esta en modo frontend, sin integracion a backend todavia.
        </p>
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
                <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Responsable</span>
                <input
                  type="text"
                  value={form.managerName}
                  onChange={onInputChange('managerName')}
                  placeholder="Nombre del encargado"
                  className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
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
              <button
                type="submit"
                disabled={!isValid}
                className="px-6 py-3 rounded-md bg-primary text-white font-semibold hover:bg-primary-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Guardar espacio (local)
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
                <p className="font-headline font-bold text-on-surface">{space.name}</p>
                <p className="text-xs text-on-surface-variant mt-1">Capacidad: {space.capacity}</p>
                {space.location && <p className="text-xs text-on-surface-variant">Ubicacion: {space.location}</p>}
                {space.managerName && <p className="text-xs text-on-surface-variant">Responsable: {space.managerName}</p>}
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
