import React, { useState } from "react";

const SearchBar = ({ users, onResults }) => {
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim() === "") {
      onResults(users);
      return;
    }
    const filtered = users.filter(
      (user) =>
        user.nombre.toLowerCase().includes(value.toLowerCase()) ||
        String(user.clave).toLowerCase().includes(value.toLowerCase())
    );
    onResults(filtered);
  };

  return (
    <div className="w-full mx-auto">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar..."
          value={query}
          onChange={handleChange}
          className="w-full p-3 pl-10 bg-gray-800 text-cyan-200 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2.5-4.5A7.5 7.5 0 1110.5 3a7.5 7.5 0 017.5 7.5z"
          />
        </svg>
      </div>
    </div>
  );
};

export default SearchBar;
