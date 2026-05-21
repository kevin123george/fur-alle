import { useEffect, useState } from 'react';

const THEMES = [
  'light','dark','cupcake','bumblebee','emerald','corporate','synthwave','retro',
  'cyberpunk','valentine','halloween','garden','forest','aqua','lofi','pastel',
  'fantasy','wireframe','black','luxury','dracula','cmyk','autumn','business',
  'acid','lemonade','night','coffee','winter','dim','nord','sunset',
  'caramellatte','abyss','silk',
];

function getStored(): string {
  return localStorage.getItem('daisyTheme') || 'light';
}

export function ThemePicker() {
  const [current, setCurrent] = useState<string>(getStored);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', current);
    localStorage.setItem('daisyTheme', current);
  }, [current]);

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-1.5 px-2">
        <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <span className="hidden sm:inline text-xs uppercase">{current}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="hidden sm:inline opacity-50">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </div>
      <ul tabIndex={0} className="dropdown-content z-[200] menu menu-sm bg-base-200 rounded-box shadow-2xl p-2 w-44 max-h-72 overflow-y-auto flex-nowrap mt-1">
        {THEMES.map(t => (
          <li key={t}>
            <button
              className={`text-xs capitalize ${t === current ? 'active font-bold' : ''}`}
              onClick={() => setCurrent(t)}
            >
              {t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
