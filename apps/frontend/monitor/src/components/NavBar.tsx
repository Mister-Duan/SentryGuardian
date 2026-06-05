import { Link } from 'react-router-dom';
import { Button } from './ui.js';
import { useAuth } from '../lib/auth.js';

export function NavBar() {
  const { logout } = useAuth();
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-3 border-b border-zinc-800 pb-4 text-sm">
      <Link to="/issues" className="text-sky-400 hover:underline">
        Issues
      </Link>
      <Link to="/projects" className="text-sky-400 hover:underline">
        项目
      </Link>
      <Link to="/releases" className="text-sky-400 hover:underline">
        Releases
      </Link>
      <Link to="/performance" className="text-sky-400 hover:underline">
        性能
      </Link>
      <Link to="/alerts" className="text-sky-400 hover:underline">
        告警
      </Link>
      <Button type="button" onClick={logout} className="ml-auto bg-zinc-800 text-zinc-100">
        退出
      </Button>
    </nav>
  );
}
