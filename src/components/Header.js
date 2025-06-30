'use client';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import { ArrowUpTrayIcon, BuildingLibraryIcon, ChartBarIcon, FolderMinusIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { data: session } = useSession();
  return (
    <header className="absolute flex w-full items-center justify-between bg-gray-600/55 to-0% p-4 text-center drop-shadow-2xl backdrop-blur-sm">
      <li className="list-none">
        <Link href="/" className="flex items-center text-white hover:text-gray-300">
          <Image src="/Logo_COVEMS.svg" alt="Logo" width={150} height={100} className="mx-auto h-auto w-36" priority="false" />
        </Link>
      </li>
      <ul className="flex items-center justify-center gap-4">
        <li className="text-white">
          <Link href="/applications" className="flex items-center text-white hover:text-gray-300">
            <FolderMinusIcon className="mr-2 inline-block h-5 w-5" />
            Agregar Solicitud
          </Link>
        </li>
        <li className="text-white">
          <Link href="/upload_policy" className="flex items-center text-white hover:text-gray-300">
            <ArrowUpTrayIcon className="mr-2 inline-block h-5 w-5" />
            Cargar Polizas
          </Link>
        </li>
        <li className="text-white">
          <Link href="/upload_statement" className="flex items-center text-white hover:text-gray-300">
            <BuildingLibraryIcon className="mr-2 inline-block h-5 w-5" />
            Cargar estado de cuenta
          </Link>
        </li>
        <li className="text-white">
          <Link href="/statements" className="flex items-center text-white hover:text-gray-300">
            <ChartBarIcon className="mr-2 inline-block h-5 w-5" />
            Estados de cuenta
          </Link>
        </li>
        <li className="text-white">
          <Link href="/users" className="flex items-center text-white hover:text-gray-300">
            <UserGroupIcon className="mr-2 inline-block h-5 w-5" />
            Gestion de usuarios
          </Link>
        </li>
        {session && (
          <li>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="ml-4 rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700">
              Cerrar sesión
            </button>
          </li>
        )}
      </ul>
    </header>
  );
};

export default Header;
