import Link from 'next/link';
import { ReactNode } from 'react';

export function AuthCard(props: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-0px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md card animate-slide-up">
        <div className="mb-6">
          <Link href="/" className="text-primary-700 font-semibold">
            DzidzaAI
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{props.title}</h1>
          {props.subtitle ? <p className="mt-1 text-gray-600">{props.subtitle}</p> : null}
        </div>
        {props.children}
        {props.footer ? <div className="mt-6">{props.footer}</div> : null}
      </div>
    </div>
  );
}
