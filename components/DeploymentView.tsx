
import React from 'react';
import { Globe, Rocket, ShieldCheck, Terminal, Server, ArrowRight } from 'lucide-react';

const DeploymentView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Globe className="text-indigo-400" />
          Publishing Guide
        </h2>
        <p className="text-slate-400 text-sm">Follow these steps to turn your code into a professional standalone web application that nobody can edit.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="w-12 h-12 bg-indigo-600/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
            <Rocket className="text-indigo-400" size={24} />
          </div>
          <h3 className="font-bold text-lg">Step 1: Host it Online</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload your files to a service like <strong>Vercel</strong> or <strong>Netlify</strong>. This will give you a private link (e.g., <code>ecoguard.vercel.app</code>) that you can access from anywhere.
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-2">Recommended Service</p>
            <p className="text-xs font-bold mb-1">Vercel (Free Plan)</p>
            <p className="text-[10px] text-slate-500">Fast, secure, and hides your code from the browser's "Edit" mode.</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="w-12 h-12 bg-emerald-600/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck className="text-emerald-400" size={24} />
          </div>
          <h3 className="font-bold text-lg">Step 2: Hide the Code</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            When you publish via a hosting service, it runs a <strong>"Build Command"</strong>. This "compiles" your <code>.tsx</code> files into unreadable machine code for the browser.
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
             <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
               <Terminal size={10} /> npm run build
             </div>
             <p className="text-[10px] text-slate-500 italic leading-tight">This command creates a "Dist" folder that contains the pure app logic, excluding the source files.</p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">Ready to go live?</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            The best way to "publish as a pure app" is to use the <strong>PWA Install</strong> feature once you have a URL. This hides the browser bar and makes it look identical to a native app on your taskbar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-indigo-400">Security Check</p>
            <p className="text-[10px] text-slate-500">API Key is isolated in environment variables.</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Server className="text-white" size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentView;
