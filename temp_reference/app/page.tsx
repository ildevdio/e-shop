import { LoginBackground } from "@/components/login/login-background";
import { LoginForm } from "@/components/login/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-black px-4">
      <LoginBackground />
      <div className="relative z-10 flex w-full justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
