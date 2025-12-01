
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RAGVisualizer from './components/RAGVisualizer';
import KnowledgeBase from './components/KnowledgeBase';
import LoginScreen from './components/LoginScreen'; 
import { MOCK_PRODUCTS, MOCK_TICKETS } from './constants';
import { Product, Ticket, RetrievalResult, AIAnalysis, GeneratedDraft, User } from './types';
import { analyzeIntent, generateDraftResponse, simulateRetrieval, getAmazonDomain, translateDraft } from './services/geminiService';

function App() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setUserRole(user.role); // Sync role state
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserRole('cs'); // Reset to default safer role
  };

  // --- APP LOGIC ---
  const [currentView, setCurrentView] = useState<'inbox' | 'knowledge'>('inbox');
  
  // User Role State: 'admin' (Manager) or 'cs' (Customer Service)
  const [userRole, setUserRole] = useState<'admin' | 'cs'>('admin');

  // --- DATA STATE WITH PERSISTENCE ---
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('rag_app_products_v2');
      return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
    } catch (e) {
      console.error("Failed to load products from local storage", e);
      return MOCK_PRODUCTS;
    }
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem('rag_app_tickets_v2');
      return saved ? JSON.parse(saved) : MOCK_TICKETS;
    } catch (e) {
      console.error("Failed to load tickets from local storage", e);
      return MOCK_TICKETS;
    }
  });
  
  useEffect(() => {
    localStorage.setItem('rag_app_products_v2', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('rag_app_tickets_v2', JSON.stringify(tickets));
  }, [tickets]);

  const [activeTicket, setActiveTicket] = useState<Ticket>(tickets[0]);
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  
  // RAG State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [retrievedDocs, setRetrievedDocs] = useState<RetrievalResult[]>([]);
  const [generatedDraft, setGeneratedDraft] = useState<GeneratedDraft | null>(null);
  
  // UI State
  const [selectedTone, setSelectedTone] = useState('Solution');
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    const term = productSearchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.asin.toLowerCase().includes(term) ||
      (p.modelNumber && p.modelNumber.toLowerCase().includes(term))
    );
  }, [products, productSearchTerm]);

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    setSelectedProduct(newProduct);
    setCurrentView('inbox');
  };

  const handleDeleteProduct = (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    
    if (selectedProduct.id === id) {
        setSelectedProduct(updatedProducts.length > 0 ? updatedProducts[0] : products[0]);
    }
  };

  const handleTicketChange = (val: string) => {
    setGeneratedDraft(null);
    setAnalysis(null);
    setRetrievedDocs([]);

    if (val === 'new_entry') {
        setActiveTicket({
            id: 'new_entry',
            customerName: 'New Customer',
            emailBody: '',
            timestamp: new Date().toISOString(),
            status: 'pending'
        });
    } else {
        const t = tickets.find(tk => tk.id === val);
        if (t) setActiveTicket(t);
    }
  };

  const handleClearInput = () => {
    setActiveTicket({
        ...activeTicket,
        id: 'new_entry',
        emailBody: '',
        customerName: 'New Customer'
    });
    setGeneratedDraft(null);
  };

  const handleGenerate = async () => {
    if (!activeTicket.emailBody.trim()) {
        alert("请输入客户邮件内容");
        return;
    }

    setIsProcessing(true);
    setGeneratedDraft(null);
    setAnalysis(null);
    setRetrievedDocs([]);

    const analysisResult = await analyzeIntent(activeTicket.emailBody);
    setAnalysis(analysisResult);

    const docs = simulateRetrieval(activeTicket.emailBody, selectedProduct);
    setRetrievedDocs(docs);

    const draft = await generateDraftResponse(
      activeTicket.customerName,
      activeTicket.emailBody,
      selectedProduct,
      docs,
      analysisResult,
      selectedTone
    );
    
    setGeneratedDraft(draft);
    setIsProcessing(false);
  };

  const handleCopyDraft = () => {
    if (!generatedDraft) return;
    const fullText = `Subject: ${generatedDraft.subject}\n\n${generatedDraft.targetBody}`;
    navigator.clipboard.writeText(fullText).then(() => {
        alert("✅ 已复制目标语言邮件 (Subject + Body)！\n可以直接发送给客户。");
    });
  };

  // NEW: Sync Translation
  const handleSyncTranslation = async () => {
    if (!generatedDraft?.chineseBody) return;
    setIsTranslating(true);
    try {
        const newTargetBody = await translateDraft(
            generatedDraft.chineseBody, 
            selectedProduct.marketplace, 
            selectedTone
        );
        setGeneratedDraft(prev => prev ? { ...prev, targetBody: newTargetBody } : null);
    } catch (e) {
        alert("翻译服务繁忙，请重试");
    } finally {
        setIsTranslating(false);
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        activeView={currentView} 
        onNavigate={setCurrentView} 
        userRole={userRole}
        onToggleRole={() => setUserRole(prev => prev === 'admin' ? 'cs' : 'admin')}
      />
      
      {currentView === 'knowledge' ? (
        <KnowledgeBase 
          products={products} 
          onAddProduct={handleAddProduct} 
          onDeleteProduct={handleDeleteProduct}
          userRole={userRole}
        />
      ) : (
        <main className="flex-1 flex flex-col md:flex-row bg-slate-50 overflow-hidden">
          
          {/* Left Column: Input & Context */}
          <div className="w-full md:w-[400px] flex flex-col border-r border-slate-200 h-full overflow-y-auto bg-white z-10 shadow-lg">
            <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center">
              <div>
                <h1 className="text-lg font-bold text-slate-800">工单处理中心</h1>
              </div>
              <button 
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-red-500 underline"
              >
                退出
              </button>
            </div>

            <div className="p-4 space-y-5">
              <div className="bg-white rounded-lg">
                <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">1. 客户邮件 (Input)</label>
                    <button onClick={handleClearInput} className="text-xs text-indigo-600">清空</button>
                </div>
                <select 
                        className="w-full p-2 border border-slate-300 rounded text-sm mb-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                        value={activeTicket.id === 'new_entry' ? 'new_entry' : activeTicket.id}
                        onChange={(e) => handleTicketChange(e.target.value)}
                    >
                        <option value="new_entry">+ 手动输入新邮件</option>
                        <optgroup label="待处理工单">
                            {tickets.map(t => (
                            <option key={t.id} value={t.id}>{t.customerName} - {t.emailBody.substring(0, 20)}...</option>
                            ))}
                        </optgroup>
                    </select>
                <textarea 
                  className="w-full h-32 p-3 bg-slate-50 border border-slate-300 rounded text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                  value={activeTicket.emailBody}
                  onChange={(e) => setActiveTicket({...activeTicket, emailBody: e.target.value})}
                  placeholder="在此粘贴客户邮件..."
                />
              </div>

              <div className="bg-white rounded-lg">
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">2. 选择知识库 (Product)</label>
                
                <div className="relative mb-2">
                   <input 
                     type="text" 
                     className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                     placeholder="搜索 ASIN..."
                     value={productSearchTerm}
                     onChange={(e) => setProductSearchTerm(e.target.value)}
                   />
                </div>

                <select 
                  className="w-full p-2 border border-slate-300 rounded text-sm bg-slate-50"
                  value={selectedProduct.id}
                  onChange={(e) => {
                    const p = products.find(prod => prod.id === e.target.value);
                    if (p) setSelectedProduct(p);
                  }}
                >
                  {filteredProducts.map(p => (
                      <option key={p.id} value={p.id}>[{p.marketplace}] {p.asin} - {p.name.substring(0, 20)}...</option>
                  ))}
                </select>

                <div className="mt-2 flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-100">
                   {selectedProduct.image && <img src={selectedProduct.image} className="w-8 h-8 object-contain bg-white border" onError={(e) => (e.target as HTMLImageElement).style.display='none'} />}
                   <div className="overflow-hidden">
                     <div className="text-xs font-bold truncate">{selectedProduct.modelNumber || 'N/A'}</div>
                     <div className="text-[10px] text-slate-500 truncate">{selectedProduct.name}</div>
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-lg">
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">3. 回复策略 (Strategy)</label>
                <select 
                      className="w-full p-2 border border-slate-300 rounded text-sm bg-indigo-50"
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value)}
                   >
                     <option value="Solution">🛠 解释+解决方案型</option>
                     <option value="Empathetic">🙏 安抚情绪型</option>
                     <option value="Replacement">🚚 换货方案型</option>
                     <option value="Refund">💬 退货/退款型</option>
                     <option value="Brand">💡 品牌专家型</option>
                     <option value="Engineer">👨‍💻 技术专家型</option>
                   </select>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isProcessing}
                className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all 
                  ${isProcessing ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}
                `}
              >
                {isProcessing ? 'AI 思考中...' : '生成回复 (Generate)'}
              </button>
            </div>
          </div>

          {/* Right Column: AI Output & Visualizer */}
          <div className="flex-1 bg-slate-100 h-full overflow-y-auto flex flex-col">
             
             {/* Top: Visualizer (Collapsible or compact) */}
             <div className="p-4 bg-slate-50 border-b border-slate-200">
                <RAGVisualizer 
                    isLoading={isProcessing}
                    retrievedDocs={retrievedDocs}
                    analysis={analysis}
                />
             </div>

             {/* Bottom: Dual Editor */}
             <div className="flex-1 p-4 overflow-hidden flex flex-col">
                {generatedDraft ? (
                    <div className="flex-1 flex flex-col md:flex-row gap-4 h-full">
                        {/* Editor 1: Chinese (Editable) */}
                        <div className="flex-1 bg-white rounded-lg shadow border border-slate-200 flex flex-col">
                            <div className="p-3 border-b border-slate-100 bg-amber-50 rounded-t-lg flex justify-between items-center">
                                <h3 className="font-bold text-amber-800 text-sm flex items-center gap-2">
                                    <span>🇨🇳</span> 中文草稿 (可编辑)
                                </h3>
                                <span className="text-[10px] text-amber-600 bg-white px-2 py-0.5 rounded border border-amber-100">请核对逻辑</span>
                            </div>
                            <textarea 
                                className="flex-1 p-4 text-sm text-slate-700 leading-relaxed outline-none resize-none"
                                value={generatedDraft.chineseBody}
                                onChange={(e) => setGeneratedDraft({...generatedDraft, chineseBody: e.target.value})}
                            />
                            <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
                                <button 
                                    onClick={handleSyncTranslation}
                                    disabled={isTranslating}
                                    className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 shadow-sm transition-colors disabled:bg-slate-300"
                                >
                                    {isTranslating ? '正在翻译...' : '⚡️ 同步翻译到右侧'}
                                </button>
                            </div>
                        </div>

                        {/* Editor 2: Target (Read Only / Final) */}
                        <div className="flex-1 bg-white rounded-lg shadow border border-slate-200 flex flex-col">
                            <div className="p-3 border-b border-slate-100 bg-indigo-50 rounded-t-lg flex justify-between items-center">
                                <h3 className="font-bold text-indigo-800 text-sm flex items-center gap-2">
                                    <span>🌍</span> 最终发送内容 ({selectedProduct.marketplace})
                                </h3>
                                <span className="text-[10px] text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-100">
                                    {getAmazonDomain(selectedProduct.marketplace)}
                                </span>
                            </div>
                            <div className="px-4 py-2 border-b border-slate-50 text-sm text-slate-500 bg-slate-50/50">
                                Subject: <span className="text-slate-800 font-medium">{generatedDraft.subject}</span>
                            </div>
                            <textarea 
                                className="flex-1 p-4 text-sm text-slate-700 leading-relaxed outline-none resize-none bg-slate-50"
                                value={generatedDraft.targetBody}
                                readOnly
                            />
                            <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
                                <button 
                                    onClick={handleCopyDraft}
                                    className="text-xs bg-indigo-600 text-white px-4 py-1.5 rounded hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-1 ml-auto"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                    复制 (Copy)
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        <p>等待生成...</p>
                    </div>
                )}
             </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
