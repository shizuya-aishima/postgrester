import Link from "next/link";

export default function AboutPage() {
  return (
    <div>
      <h1>About</h1>
      <p>This is the about page</p>
      <p>
        <Link href="/">Go home</Link>
      </p>
    </div>
  );
} 