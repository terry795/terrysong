import React from 'react';

interface Props {
  activeView: 'inbox' | 'knowledge';
  onNavigate: (view: 'inbox' | 'knowledge') => void;
  userRole: 'admin' | 'cs';
  onToggleRole: () => void;
}

const Sidebar: React.FC<Props> = ({ activeView, onNavigate, userRole, onToggleRole }) => {
  return (
    <div className="w-16 md:w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 transition-all duration-300 shrink-0">
      <div className="p-4 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
          A
        </div>
        <span className="font-semibold text-white hidden md:block">亚马逊 RAG 助手</span>
      </div>

      <nav className="flex-1 py-6 space-y-2">
        <NavItem 
          active={activeView === 'inbox'} 
          onClick={() => onNavigate('inbox')}
          icon={<InboxIcon />} 
          label="工单管理 (Inbox)" 
        />
        <NavItem 
          active={activeView === 'knowledge'} 
          onClick={() => onNavigate('knowledge')}
          icon={<DatabaseIcon />} 
          label="产品知识库 (ASIN)" 
        />
        <div className="pt-4 border-t border-slate-800 mt-4">
            <NavItem 
            active={false} 
            onClick={() => {}}
            icon={<BarChartIcon />} 
            label="销售分析 (Demo)" 
            />
            <NavItem 
            active={false} 
            onClick={() => {}}
            icon={<SettingsIcon />} 
            label="系统设置" 
            />
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div 
            onClick={onToggleRole}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-2 rounded transition-colors"
            title="点击切换角色 (模拟登录)"
        >
          <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 ${userRole === 'admin' ? 'border-red-500' : 'border-green-500'}`}>
            <img src="https://picsum.photos/100/100" alt="User" />
          </div>
          <div className="hidden md:block overflow-hidden">
            <p className="text-sm font-medium text-white truncate">
                {userRole === 'admin' ? '管理员 Alex' : '客服 Sarah'}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
                {userRole === 'admin' ? (
                    <span className="text-red-400">● Admin</span>
                ) : (
                    <span className="text-green-400">● Agent</span>
                )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors ${active ? 'bg-slate-800 text-indigo-400 border-r-2 border-indigo-400' : ''}`}
  >
    <span className={`shrink-0 ${active ? 'text-indigo-400' : 'text-slate-400'}`}>{icon}</span>
    <span className="hidden md:block text-sm font-medium text-left">{label}</span>
  </button>
);

// Icons
const InboxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
const DatabaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;
const BarChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;

export default Sidebar;