import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout({ user, onLogout }) {
  return (
    <>
      <Navbar user={user} onLogout={onLogout} />
      <main className="layout-main">
        <Outlet context={{ user }} />
      </main>
    </>
  );
}
