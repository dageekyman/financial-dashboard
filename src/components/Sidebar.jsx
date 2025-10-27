// src/components/Sidebar.jsx
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';

const navItems = [
    { id: 'Snapshot', label: 'Overview Snapshot' },
    { id: 'Personal', label: '1. Personal Info and Assumptions' },
    { id: 'Budget', label: '2. Monthly Budget' },
    { id: 'AssetsLiabilities', label: '3. Assets and Liabilities' },
    { id: 'Investments', label: '4. Investment Portfolio' },
    { id: 'SocialRealEstate', label: '5. Retirement Income Sources' },
    { id: 'Results', label: '6. Detailed Results' },
];

const Sidebar = () => {
    const { activeView, setActiveView } = useAppContext();

    const handleClick = (id) => {
        setActiveView(id);
        // Optional: Scroll to top of the content area on navigation change
        const content = document.querySelector('.flex-1.min-w-0');
        if (content) {
            content.scrollTop = 0;
        }
    };

    return (
        <nav className="w-full lg:w-64 p-4 bg-white shadow-lg rounded-xl h-full lg:sticky lg:top-4 lg:self-start border border-indigo-100">
            <h3 className="text-lg font-bold mb-4 text-indigo-700">Dashboard Sections</h3>
            <ul className="space-y-2">
                {navItems.map((item) => (
                    <li key={item.id}>
                        <button
                            onClick={() => handleClick(item.id)}
                            className={`w-full text-left py-2 px-3 rounded-lg transition-colors duration-150 text-sm font-medium ${
                                activeView === item.id
                                    ? 'bg-indigo-600 text-white font-semibold shadow-md'
                                    : 'bg-gray-50 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                            }`}
                        >
                            {item.label}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Sidebar;