import Logo from "./Logo";

export default function SiteHeader() {
  return (
    <header className="flex items-center px-6 py-5 sm:px-10">
      <Logo height={28} />
    </header>
  );
}
