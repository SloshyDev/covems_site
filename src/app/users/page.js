"use client";
import { useEffect, useState } from "react";
import Cards from "./components/Cards";
import SearchBar from "./components/SearchBar";
import Modal from "./components/Modal";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener usuarios");
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    console.log(user);
  };

  if (loading) return <div>Cargando usuarios...</div>;
  if (error) return <div>Error: {error}</div>;

  const userCategories = [
    {
      label: "Agentes con condiciones especiales",
      filter: (user) => user.clave < 999,
    },
    {
      label: "Agentes",
      filter: (user) => user.clave > 1000 && user.clave < 1800,
    },
    {
      label: "Supervisores",
      filter: (user) => user.clave >= 1800,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="flex gap-2 items-center mb-4">
        <SearchBar users={users} onResults={setFilteredUsers} />
      </div>
      {userCategories.map(({ label, filter }) => {
        const groupUsers = (
          filteredUsers.length > 0 ? filteredUsers : users
        ).filter(filter);
        // Calcular la siguiente clave según el tipo de usuario
        let nextClave = 1;
        if (groupUsers.length > 0) {
          nextClave = Math.max(...groupUsers.map((u) => u.clave || 0)) + 1;
        } else {
          // Valores iniciales sugeridos por tipo
          if (label === "Agentes con condiciones especiales") nextClave = 1;
          if (label === "Agentes") nextClave = 1001;
          if (label === "Supervisores") nextClave = 1800;
        }
        let tipo_usuario = 1;
        if (label === "Agentes") tipo_usuario = 2;
        if (label === "Supervisores") tipo_usuario = 3;
        return (
          <Cards
            key={label}
            users={groupUsers}
            tipoUsuario={label}
            onUserClick={handleUserClick}
            onAddUser={() =>
              setSelectedUser({ tipo_usuario, clave: nextClave })
            }
          />
        );
      })}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
        onUserChange={setSelectedUser}
        onSave={(updatedUser) => {
          setUsers((prev) => {
            const exists = prev.some((u) => u.clave === updatedUser.clave);
            if (exists) {
              return prev.map((u) =>
                u.clave === updatedUser.clave ? updatedUser : u
              );
            } else {
              return [...prev, updatedUser];
            }
          });
          setSelectedUser(null);
        }}
        supervisores={users.filter((u) => u.tipo_usuario === 3)}
      />
    </div>
  );
}
