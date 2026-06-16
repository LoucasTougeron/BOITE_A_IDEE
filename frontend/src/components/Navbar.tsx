import { ChevronDown, Lightbulb, LogOut, Plus, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
    setDropdownOpen(false);
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-6">
      <div className="flex items-center gap-8 flex-1">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-indigo-700 shrink-0">
          <Lightbulb size={20} className="text-indigo-500" />
          BAD
        </Link>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Link to="/" className="px-3 py-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors">
            Explorer
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <button
            onClick={() => navigate('/projects/new')}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={15} /> Déposer un projet
          </button>
        )}

        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs">
                {user.email?.[0].toUpperCase()}
              </div>
              <span className="max-w-[140px] truncate">{user.email}</span>
              {isAdmin && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Admin</span>
              )}
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={14} /> Mon Profil
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut size={14} /> Se déconnecter
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <User size={15} /> Connexion
          </Link>
        )}
      </div>
    </nav>
  );
}