import { Fieldset, Label, Input, Switch } from "@headlessui/react";
import React from "react";

const UserEditFieldset = ({ user, onChange, onSave, supervisores = [] }) => {
  // Nueva función para guardar en backend
  const handleSave = async () => {
    try {
      const isNew = !user.id;
      const res = await fetch("/api/users", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      if (!res.ok)
        throw new Error(
          isNew ? "Error al crear usuario" : "Error al actualizar usuario"
        );
      const savedUser = await res.json();
      if (onSave) onSave(savedUser);
    } catch (err) {
      alert(
        "No se pudo " + (!user.id ? "crear" : "actualizar") + " el usuario"
      );
    }
  };
  return (
    <div className="z-10">
      <h1 className="text-center text-teal-400 text-xl mb-4 font-black">
        Editar Usuario
      </h1>
      <Fieldset className="space-y-5 bg-gradient-to-br from-gray-800/80 to-cyan-950/60 p-6 rounded-xl border border-cyan-800 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mostrar clave como texto destacado si existe */}
          {user.clave !== undefined && (
            <div className="md:col-span-2 flex items-center mb-2">
              <span className="text-cyan-300 font-bold text-lg mr-2">
                Clave:
              </span>
              <span className="text-cyan-100 font-mono text-lg">
                {user.clave}
              </span>
            </div>
          )}
          <div>
            <Label
              htmlFor="nombre"
              className="block text-cyan-100 font-semibold mb-1"
            >
              Nombre
            </Label>
            <Input
              id="nombre"
              name="nombre"
              className="w-full p-2 rounded bg-gray-900 text-cyan-200 border border-cyan-700 focus:ring-2 focus:ring-cyan-500"
              value={user.nombre || ""}
              onChange={(e) => onChange({ ...user, nombre: e.target.value })}
            />
          </div>
          <div>
            <Label
              htmlFor="fecha_nacimiento"
              className="block text-cyan-100 font-semibold mb-1"
            >
              Fecha nacimiento
            </Label>
            <Input
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              type="date"
              className="w-full p-2 rounded bg-gray-900 text-cyan-200 border border-cyan-700 focus:ring-2 focus:ring-cyan-500"
              value={
                user.fecha_nacimiento ? user.fecha_nacimiento.slice(0, 10) : ""
              }
              onChange={(e) =>
                onChange({ ...user, fecha_nacimiento: e.target.value })
              }
            />
          </div>
          <div>
            <Label
              htmlFor="rfc"
              className="block text-cyan-100 font-semibold mb-1"
            >
              RFC
            </Label>
            <Input
              id="rfc"
              name="rfc"
              className="w-full p-2 rounded bg-gray-900 text-cyan-200 border border-cyan-700 focus:ring-2 focus:ring-cyan-500"
              value={user.rfc || ""}
              onChange={(e) => onChange({ ...user, rfc: e.target.value })}
            />
          </div>
          <div>
            <Label
              htmlFor="curp"
              className="block text-cyan-100 font-semibold mb-1"
            >
              CURP
            </Label>
            <Input
              id="curp"
              name="curp"
              className="w-full p-2 rounded bg-gray-900 text-cyan-200 border border-cyan-700 focus:ring-2 focus:ring-cyan-500"
              value={user.curp || ""}
              onChange={(e) => onChange({ ...user, curp: e.target.value })}
            />
          </div>
          <div>
            <Label
              htmlFor="celular"
              className="block text-cyan-100 font-semibold mb-1"
            >
              Celular
            </Label>
            <Input
              id="celular"
              name="celular"
              className="w-full p-2 rounded bg-gray-900 text-cyan-200 border border-cyan-700 focus:ring-2 focus:ring-cyan-500"
              value={user.celular || ""}
              onChange={(e) => onChange({ ...user, celular: e.target.value })}
            />
          </div>
          <div>
            <Label
              htmlFor="banco"
              className="block text-cyan-100 font-semibold mb-1"
            >
              Banco
            </Label>
            <Input
              id="banco"
              name="banco"
              className="w-full p-2 rounded bg-gray-900 text-cyan-200 border border-cyan-700 focus:ring-2 focus:ring-cyan-500"
              value={user.banco || ""}
              onChange={(e) => onChange({ ...user, banco: e.target.value })}
            />
          </div>
          <div>
            <Label
              htmlFor="cuenta_clabe"
              className="block text-cyan-100 font-semibold mb-1"
            >
              Cuenta CLABE
            </Label>
            <Input
              id="cuenta_clabe"
              name="cuenta_clabe"
              className="w-full p-2 rounded bg-gray-900 text-cyan-200 border border-cyan-700 focus:ring-2 focus:ring-cyan-500"
              value={user.cuenta_clabe || ""}
              onChange={(e) =>
                onChange({ ...user, cuenta_clabe: e.target.value })
              }
            />
          </div>
          {/* Mostrar select solo si el usuario NO es supervisor */}
          {user.tipo_usuario !== 3 && (
            <div>
              <Label
                htmlFor="supervisor_clave"
                className="block text-cyan-100 font-semibold mb-1"
              >
                Supervisor Clave
              </Label>
              <select
                id="supervisor_clave"
                name="supervisor_clave"
                className="w-full p-2 rounded bg-gray-900 text-cyan-200 border border-cyan-700 focus:ring-2 focus:ring-cyan-500"
                value={user.supervisor_clave || ""}
                onChange={(e) =>
                  onChange({
                    ...user,
                    supervisor_clave: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              >
                <option value="">Sin supervisor</option>
                {supervisores.map((sup) => (
                  <option key={sup.clave} value={sup.clave}>
                    {sup.clave} - {sup.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label
              htmlFor="estado"
              className="block text-cyan-100 font-semibold mb-1"
            >
              Estado
            </Label>
            <Switch
              checked={user.estado?.toLowerCase() === "activo"}
              onChange={(checked) =>
                onChange({ ...user, estado: checked ? "activo" : "cancelado" })
              }
              className={`${
                user.estado?.toLowerCase() === "activo"
                  ? "bg-green-500"
                  : "bg-red-500"
              } relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            >
              <span className="sr-only">Estado</span>
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  user.estado?.toLowerCase() === "activo"
                    ? "translate-x-7"
                    : "translate-x-1"
                }`}
              />
            </Switch>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            Guardar
          </button>
        </div>
      </Fieldset>
    </div>
  );
};

export default UserEditFieldset;
