import { Link } from "@tanstack/react-router";

const Header = () => {
  return (
    <header className="py-6">
      <div className="mx-auto max-w-240 px-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-semibold">Jejak Masjid</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
