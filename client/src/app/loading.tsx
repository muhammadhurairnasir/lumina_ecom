import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsating ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
        
        {/* Inner spinning loader */}
        <div className="bg-surface rounded-full p-4 shadow-xl relative z-10">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
      <p className="mt-6 text-sm font-medium text-text-secondary animate-pulse tracking-widest uppercase">
        Lumina is loading
      </p>
    </div>
  );
}
