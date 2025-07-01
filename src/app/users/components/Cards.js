import React from "react";
import { UserIcon, PlusIcon } from "@heroicons/react/24/solid";

const Cards = ({ users, tipoUsuario, onUserClick, onAddUser }) => {
  return (
    <div className="">
      <h1 className="text-2xl font-bold text-cyan-200 mb-6 text-center">
        {users.length > 0 ? tipoUsuario : ""}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
        {users.map((user) => {
          let borderColor = "border-gray-400/40";
          if (user.estado?.toLowerCase() === "activo")
            borderColor = "border-green-300/60";
          else if (user.estado?.toLowerCase() === "cancelado")
            borderColor = "border-red-300/60";
          return (
            <div
              key={user.id}
              className={`backdrop-blur-md bg-gradient-to-br from-gray-800/90 via-gray-700/80 to-cyan-900/60 rounded-xl p-6 border ${borderColor} hover:shadow-2xl transition-shadow duration-300 cursor-pointer relative`}
              onClick={() => onUserClick && onUserClick(user)}
            >
              <div className="flex flex-col gap-1 mb-4">
                <div className="flex flex-row items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-800/80 shadow-lg flex items-center justify-center border-4 border-gray-900">
                    <UserIcon className="w-7 h-7 text-cyan-300" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-xl font-extrabold text-cyan-200 drop-shadow">
                      {user.clave}
                    </span>
                    <h2 className="text-base font-bold text-cyan-100 drop-shadow-sm">
                      {user.nombre}
                    </h2>
                    <span className="font-semibold w-fit text-cyan-300 rounded ">
                      Supervisor: {user.supervisor_clave || "-"}
                    </span>
                  </div>
                </div>
              </div>
              <hr className="my-3 border-cyan-400/30" />
              <div className="text-cyan-100 text-sm space-y-1">
                <p>
                  <span className="font-semibold">Fecha nacimiento:</span>{" "}
                  {user.fecha_nacimiento
                    ? new Date(user.fecha_nacimiento).toLocaleDateString()
                    : "-"}
                </p>
                <p>
                  <span className="font-semibold">RFC:</span> {user.rfc || "-"}
                </p>
                <p>
                  <span className="font-semibold">CURP:</span>{" "}
                  {user.curp || "-"}
                </p>
                <p>
                  <span className="font-semibold">Celular:</span>{" "}
                  {user.celular || "-"}
                </p>
                <p>
                  <span className="font-semibold">Banco:</span>{" "}
                  {user.banco || "-"}
                </p>
                <p>
                  <span className="font-semibold">Cuenta CLABE:</span>{" "}
                  {user.cuenta_clabe || "-"}
                </p>
                <p>
                  <span className="font-semibold">Estado:</span> {user.estado}
                </p>
                <p>
                  <span className="font-semibold">Tipo usuario:</span>{" "}
                  {user.tipo_usuario}
                </p>
              </div>
            </div>
          );
        })}
        {/* Card para agregar nuevo usuario */}
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed border-cyan-400 rounded-xl p-6 bg-gray-800/60 cursor-pointer hover:bg-cyan-900/30 transition"
          onClick={onAddUser}
        >
          <PlusIcon className="w-10 h-10 text-cyan-400 mb-2" />
          <span className="text-cyan-200 font-bold">Agregar nuevo</span>
        </div>
      </div>
    </div>
  );
};

export default Cards;
