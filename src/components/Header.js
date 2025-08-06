"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowUpTrayIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  FolderMinusIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const Header = () => {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="absolute flex w-full items-center justify-between bg-gray-600/55 to-0% p-4 text-center drop-shadow-2xl backdrop-blur-sm">
      <li className="list-none">
        <Link
          href="/"
          className="flex items-center text-white hover:text-gray-300"
        >
          <Image
            src="/Logo_COVEMS.svg"
            alt="Logo"
            width={150}
            height={100}
            className="mx-auto h-auto w-36"
            priority="false"
          />
        </Link>
      </li>
      <ul className="flex items-center justify-center gap-4">
        <li className="text-white">
          <Link
            href="/request"
            className="flex items-center text-white hover:text-gray-300"
          >
            <FolderMinusIcon className="mr-2 inline-block h-5 w-5" />
            Agregar Solicitud
          </Link>
        </li>
        <li className="text-white">
          <Link
            href="/upload_policy"
            className="flex items-center text-white hover:text-gray-300"
          >
            <ArrowUpTrayIcon className="mr-2 inline-block h-5 w-5" />
            Cargar Polizas
          </Link>
        </li>
        <li className="text-white">
          <Link
            href="/upload_statement"
            className="flex items-center text-white hover:text-gray-300"
          >
            <BuildingLibraryIcon className="mr-2 inline-block h-5 w-5" />
            Cargar estado de cuenta
          </Link>
        </li>
        <li className="text-white relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center text-white hover:text-gray-300"
          >
            <ChartBarIcon className="mr-2 inline-block h-5 w-5" />
            Ver Estados de Cuenta
            <ChevronDownIcon className="ml-1 inline-block h-4 w-4" />
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-gray-700 rounded-md shadow-lg z-50">
              <div className="py-1">
                <Link
                  href="/view_statement/weekly"
                  className="block px-4 py-2 text-sm text-white hover:bg-gray-600"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Estado Semanal
                </Link>
                <Link
                  href="/view_statement/monthly"
                  className="block px-4 py-2 text-sm text-white hover:bg-gray-600"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Estado Mensual
                </Link>
                <Link
                  href="/view_statement?periodo=completo"
                  className="block px-4 py-2 text-sm text-white hover:bg-gray-600"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Estado Completo
                </Link>
              </div>
            </div>
          )}
        </li>
        {session && (
          <li>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="ml-4 rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              Cerrar sesión
            </button>
          </li>
        )}
      </ul>
    </header>
  );
};

export default Header;
