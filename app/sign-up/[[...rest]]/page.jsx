import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">
            <span className="text-green-600">King</span>cart
            <span className="text-green-600 text-4xl">.</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Create your account</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}