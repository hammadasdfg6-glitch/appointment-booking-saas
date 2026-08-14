import Link from 'next/link';

export default function TopAppBar() {
  return (
    <header className="topappbar">
      <div className="topappbar-logo">VestAuth</div>
      <div className="topappbar-actions">
        <Link href="/login" className="avatar-placeholder animate-tap"></Link>
      </div>
    </header>
  );
}
