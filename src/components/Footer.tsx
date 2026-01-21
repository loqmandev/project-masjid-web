import { Link } from "@tanstack/react-router";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-8 text-center text-[0.9rem]">
      <div className="mx-auto max-w-240 px-4">
        <p>&copy; {currentYear} Jejak Masjid. All rights reserved.</p>
        <p><Link to="/privacy" className="mt-2 block no-underline hover:underline">Privacy Policy</Link></p>
        <p><Link to="/tos" className="mt-2 block no-underline hover:underline">Terms of Service</Link></p>
      </div>
    </footer>
  );
};

export default Footer;
