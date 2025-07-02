import React from "react";

export default function FormInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <div>
      {label && (
        <label className="block text-cyan-100 font-semibold mb-1">
          {label} {required && "*"}
        </label>
      )}
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        required={required}
        disabled={disabled}
        className={`w-full p-2 rounded-lg bg-gray-800 text-cyan-200 border-2 border-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition ${className}`}
        {...props}
      />
    </div>
  );
}
