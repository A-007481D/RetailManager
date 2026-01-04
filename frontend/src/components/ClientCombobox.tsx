import React, { useState, useEffect, useRef } from 'react';
import { client } from '../../wailsjs/go/models';
import { UserIcon, CheckCircleIcon } from './Icons';

interface ClientComboboxProps {
    clients: client.Client[];
    onSelect: (client: client.Client) => void;
}

export const ClientCombobox: React.FC<ClientComboboxProps> = ({ clients, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState<client.Client[]>(clients);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setFilteredClients(
            clients.filter(c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.ice.includes(searchTerm)
            )
        );
    }, [searchTerm, clients]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="label">Sélectionner un Client Existant</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="input pl-10 w-full cursor-pointer"
                    placeholder="Rechercher un client (Nom ou ICE)..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onClick={() => setIsOpen(true)}
                />
            </div>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {filteredClients.length === 0 ? (
                        <div className="cursor-default select-none relative py-2 px-4 text-gray-700">
                            Aucun client trouvé.
                        </div>
                    ) : (
                        filteredClients.map((client) => (
                            <div
                                key={client.ID}
                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary-50 text-gray-900"
                                onClick={() => {
                                    onSelect(client);
                                    setSearchTerm(client.name);
                                    setIsOpen(false);
                                }}
                            >
                                <div className="flex items-center">
                                    <span className="font-medium block truncate">
                                        {client.name}
                                    </span>
                                    <span className="text-gray-500 ml-2 truncate text-xs">
                                        ICE: {client.ice}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
                Tapez pour rechercher ou sélectionnez dans la liste.
            </p>
        </div>
    );
};
