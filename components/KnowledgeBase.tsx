import React, { useState } from 'react';
import { Product, Marketplace, QAPair } from '../types';
import { generateMockProductData, getAmazonDomain } from '../services/geminiService';

interface Props {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  userRole: 'admin' | 'cs';
}

const KnowledgeBase: React.FC<Props> = ({ products, onAddProduct, onDeleteProduct, userRole }) => {
  // Mode: 'list' | 'add' | 'edit'
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // --- ADD FORM STATE ---
  const [newAsin, setNewAsin] = useState('');
  const [newName, setNewName] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newMarketplace, setNewMarketplace] = useState<Marketplace>('US');
  const [newManual, setNewManual] = useState('');
  const [newTroubleshooting, setNewTroubleshooting] = useState('');
  const [newFeatures, setNewFeatures] = useState<string[]>([]);
  const [newPolicy, setNewPolicy] = useState('');
  const [newQA, setNewQA] = useState<QAPair[]>([]); // For initial creation if AI generates it
  
  const [isSimulatingSync, setIsSimulatingSync] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // --- EXPERT QA STATE (For Edit Mode) ---
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const [qaKeywords, setQaKeywords] = useState('');
  const [qaAuthor, setQaAuthor] = useState<'Engineer' | 'CustomerService'>('CustomerService');

  const handleSimulateSync = async () => {
    if (!newAsin) {
      alert("请输入 ASIN");
      return;
    }
    setIsSimulatingSync(true);
    const domain = getAmazonDomain(newMarketplace);
    setSyncStatus(`正在访问 https://www.${domain}/dp/${newAsin} 抓取数据...`);
    
    try {
      const data = await generateMockProductData(newAsin, newMarketplace);
      
      if (data) {
        setNewName(data.name || '');
        setNewModel(data.modelNumber || '');
        if ((data as any).mainImage) setNewImage((data as any).mainImage);
        setNewManual(data.manual_content || '');
        setNewTroubleshooting(data.troubleshooting || '');
        setNewFeatures(data.features || []);
        setNewPolicy(data.policy || '');
        if (data.expert_knowledge) setNewQA(data.expert_knowledge);
        
        setSyncStatus('✅ 数据爬取与解析成功！已自动填充表单。');
      }
    } catch (error) {
      console.error(error);
      setSyncStatus('❌ 模拟爬取失败，请检查网络或 API Key。');
    } finally {
      setIsSimulatingSync(false);
    }
  };

  // Handle local file upload (Convert to Base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isEditMode && editingProduct) {
            setEditingProduct({ ...editingProduct, image: result });
        } else {
            setNewImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNewProduct = () => {
    if (!newAsin || !newName) return;
    
    const newProduct: Product = {
      id: Date.now().toString(),
      asin: newAsin,
      name: newName,
      modelNumber: newModel,
      category: 'Imported',
      marketplace: newMarketplace,
      image: newImage, // Allow empty, UI will handle fallback
      features: newFeatures,
      manual_content: newManual,
      troubleshooting: newTroubleshooting,
      policy: newPolicy || (newMarketplace === 'DE' ? '30 Tage Rückgaberecht' : '30-Day Return Policy'),
      expert_knowledge: newQA
    };

    onAddProduct(newProduct);
    resetForm();
    setMode('list');
  };

  const resetForm = () => {
    setNewAsin('');
    setNewName('');
    setNewModel('');
    setNewImage('');
    setNewManual('');
    setNewTroubleshooting('');
    setNewFeatures([]);
    setNewPolicy('');
    setNewQA([]);
    setSyncStatus('');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct({...product}); // Clone deep enough for top level
    setMode('edit');
  };

  const handleSaveEdit = () => {
    if (editingProduct) {
        onDeleteProduct(editingProduct.id);
        onAddProduct(editingProduct);
        setMode('list');
        setEditingProduct(null);
    }
  };

  const handleDeleteWithAuth = (id: string, name: string) => {
    if (userRole !== 'admin') {
        alert('🚫 权限不足：只有管理员 (Admin) 才有权删除产品知识库链接。请联系管理员操作。');
        return;
    }
    
    if (window.confirm(`⚠️ 危险操作警告 ⚠️\n\n您确定要永久删除 [${name}] 的所有数据吗？\n包括说明书、故障库和专家问答记录。\n\n此操作不可恢复！`)) {
        onDeleteProduct(id);
    }
  };

  const handleAddQA = () => {
    if (!qaQuestion || !qaAnswer || !editingProduct) return;
    
    const newPair: QAPair = {
        id: Date.now().toString(),
        question: qaQuestion,
        answer: qaAnswer,
        keywords: qaKeywords.split(',').map(k => k.trim()).filter(k => k),
        author: qaAuthor,
        updatedAt: new Date().toISOString()
    };

    const updatedQA = editingProduct.expert_knowledge ? [...editingProduct.expert_knowledge, newPair] : [newPair];
    setEditingProduct({ ...editingProduct, expert_knowledge: updatedQA });
    
    // Reset inputs
    setQaQuestion('');
    setQaAnswer('');
    setQaKeywords('');
  };

  const handleDeleteQA = (qaId: string) => {
      if (!editingProduct || !editingProduct.expert_knowledge) return;
      const updatedQA = editingProduct.expert_knowledge.filter(qa => qa.id !== qaId);
      setEditingProduct({ ...editingProduct, expert_knowledge: updatedQA });
  };

  return (
    <div className="flex-1 h-full bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
        <div>
           <h1 className="text-xl font-bold text-slate-800">产品知识库 & 训练中心</h1>
           <p className="text-sm text-slate-500">管理 ASIN 数据、修正知识盲点，并录入专家级问答。</p>
        </div>
        {mode === 'list' && (
            <button 
            onClick={() => setMode('add')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            录入新产品
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        
        {/* VIEW: ADD PRODUCT */}
        {mode === 'add' && (
           <div className="mb-8 bg-white p-6 rounded-lg shadow-lg border border-indigo-100 animate-fade-in-down">
             <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
               <h3 className="font-bold text-lg text-indigo-900">录入新产品数据 (AI 智能导入)</h3>
               <button onClick={() => setMode('list')} className="text-slate-400 hover:text-slate-600">取消</button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">目标站点</label>
                    <select 
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newMarketplace}
                      onChange={(e) => setNewMarketplace(e.target.value as Marketplace)}
                    >
                      <option value="US">🇺🇸 US</option>
                      <option value="DE">🇩🇪 DE</option>
                      <option value="JP">🇯🇵 JP</option>
                      <option value="UK">🇬🇧 UK</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">ASIN</label>
                        <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-mono" placeholder="B0..." value={newAsin} onChange={(e) => setNewAsin(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">智能同步</label>
                        <button onClick={handleSimulateSync} disabled={isSimulatingSync} className={`w-full p-2 rounded text-xs font-medium border flex items-center justify-center gap-2 transition-all h-[38px] ${isSimulatingSync ? 'bg-indigo-50 text-indigo-400' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                            {isSimulatingSync ? '连接中...' : 'Link & Crawl'}
                        </button>
                    </div>
                  </div>
                  {syncStatus && <p className={`text-xs ${syncStatus.includes('✅') ? 'text-green-600' : 'text-indigo-500'}`}>{syncStatus}</p>}

                  {/* Basic Info Fields */}
                  <input type="text" className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="产品名称" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <input type="text" className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="Model Number (e.g. CT300)" value={newModel} onChange={(e) => setNewModel(e.target.value)} />
                  
                  {/* Image Upload / URL Input */}
                  <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase">产品首图 (Image)</label>
                      <div className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            className="flex-1 p-2 border border-slate-300 rounded text-sm" 
                            placeholder="输入图片 URL..." 
                            value={newImage} 
                            onChange={(e) => setNewImage(e.target.value)} 
                          />
                          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-3 py-2 text-xs font-medium flex items-center gap-1 shrink-0 text-slate-700">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             本地上传
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
                          </label>
                      </div>
                      
                      {newImage && (
                          <div className="w-full h-40 border border-slate-200 rounded p-2 bg-slate-50 flex items-center justify-center">
                              <img 
                                src={newImage} 
                                alt="Preview" 
                                className="max-w-full max-h-full object-contain shadow-sm bg-white" 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Load+Error';
                                }}
                              />
                          </div>
                      )}
                  </div>
                  <textarea className="w-full h-24 p-2 border border-slate-300 rounded text-xs" placeholder="Features (Bullet points)" value={newFeatures.join('\n')} onChange={(e) => setNewFeatures(e.target.value.split('\n'))} />
               </div>

               <div className="space-y-4">
                  <textarea className="w-full h-32 p-2 border border-slate-300 rounded text-xs font-mono" placeholder="Manual Content" value={newManual} onChange={(e) => setNewManual(e.target.value)} />
                  <textarea className="w-full h-32 p-2 border border-slate-300 rounded text-xs font-mono" placeholder="Troubleshooting" value={newTroubleshooting} onChange={(e) => setNewTroubleshooting(e.target.value)} />
               </div>
             </div>
             
             <div className="mt-6 flex justify-end gap-3">
               <button onClick={handleSaveNewProduct} disabled={!newName} className="bg-indigo-600 text-white px-6 py-2 rounded shadow hover:bg-indigo-700">保存并向量化</button>
             </div>
           </div>
        )}

        {/* VIEW: EDIT / TRAIN MODE */}
        {mode === 'edit' && editingProduct && (
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="text-indigo-600">🛠 知识修正 & 训练:</span> {editingProduct.name}
                        </h2>
                        <div className="flex gap-2 text-xs text-slate-500 mt-1">
                            <span className="bg-white border px-1 rounded">{editingProduct.asin}</span>
                            <span className="bg-white border px-1 rounded font-bold text-indigo-600">{editingProduct.modelNumber}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setMode('list')} className="px-3 py-1 text-slate-500 hover:bg-slate-200 rounded text-sm">返回列表</button>
                        <button onClick={handleSaveEdit} className="px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">保存所有更改</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* SECTION 0: BASIC INFO EDIT (Name, Model, Image) */}
                    <section className="bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            产品基础信息 (Identity)
                        </h3>
                        <div className="flex gap-6">
                            <div className="w-32 h-32 bg-white border border-slate-200 rounded p-2 flex items-center justify-center relative group">
                                {editingProduct.image ? (
                                    <img src={editingProduct.image} className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <span className="text-xs text-slate-400">No Image</span>
                                )}
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs cursor-pointer transition-opacity rounded">
                                    更换图片
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true)} />
                                </label>
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">产品名称</label>
                                    <input 
                                        className="w-full p-2 border border-slate-300 rounded text-sm" 
                                        value={editingProduct.name}
                                        onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Model Number (重要检索依据)</label>
                                    <input 
                                        className="w-full p-2 border border-slate-300 rounded text-sm font-mono text-indigo-700 font-semibold" 
                                        value={editingProduct.modelNumber}
                                        onChange={(e) => setEditingProduct({...editingProduct, modelNumber: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-slate-200" />

                    {/* SECTION 1: EXPERT Q&A */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-amber-100 rounded text-amber-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h3 className="font-bold text-slate-800">🏆 专家知识库 (Expert Q&A)</h3>
                            <span className="text-xs text-slate-500 ml-2">在此录入“标准答案”。AI 检索权重最高 (Priority 0.99)。</span>
                        </div>

                        {/* Add QA Form */}
                        <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <input 
                                    className="p-2 border border-slate-300 rounded text-sm focus:border-amber-500 outline-none" 
                                    placeholder="输入用户常见问题 (Question)" 
                                    value={qaQuestion}
                                    onChange={(e) => setQaQuestion(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 p-2 border border-slate-300 rounded text-sm focus:border-amber-500 outline-none" 
                                        placeholder="触发关键词 (Keywords, comma separated)" 
                                        value={qaKeywords}
                                        onChange={(e) => setQaKeywords(e.target.value)}
                                    />
                                    <select 
                                        className="p-2 border border-slate-300 rounded text-sm"
                                        value={qaAuthor}
                                        onChange={(e) => setQaAuthor(e.target.value as any)}
                                    >
                                        <option value="CustomerService">客服 CS</option>
                                        <option value="Engineer">工程师</option>
                                    </select>
                                </div>
                            </div>
                            <textarea 
                                className="w-full h-20 p-2 border border-slate-300 rounded text-sm mb-3 focus:border-amber-500 outline-none" 
                                placeholder="输入专家级标准回答 (The Gold Standard Answer)..."
                                value={qaAnswer}
                                onChange={(e) => setQaAnswer(e.target.value)}
                            />
                            <button 
                                onClick={handleAddQA}
                                disabled={!qaQuestion || !qaAnswer}
                                className={`w-full py-2 rounded text-sm font-semibold transition-colors
                                ${!qaQuestion || !qaAnswer ? 'bg-slate-200 text-slate-400' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
                            >
                                + 添加到专家库
                            </button>
                        </div>

                        {/* QA List */}
                        <div className="space-y-3">
                            {editingProduct.expert_knowledge?.map((qa) => (
                                <div key={qa.id} className="bg-white border border-slate-200 p-3 rounded group relative hover:border-amber-300 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${qa.author === 'Engineer' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {qa.author}
                                            </span>
                                            <h4 className="font-semibold text-slate-800 text-sm">{qa.question}</h4>
                                        </div>
                                        <button onClick={() => handleDeleteQA(qa.id)} className="text-slate-300 hover:text-red-500">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                    <p className="text-slate-600 text-sm mt-1">{qa.answer}</p>
                                    {qa.keywords.length > 0 && (
                                        <div className="mt-2 flex gap-1 flex-wrap">
                                            {qa.keywords.map(k => <span key={k} className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded">#{k}</span>)}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {(!editingProduct.expert_knowledge || editingProduct.expert_knowledge.length === 0) && (
                                <p className="text-center text-slate-400 text-sm py-4 italic">暂无专家问答数据。</p>
                            )}
                        </div>
                    </section>

                    <hr className="border-slate-200" />

                    {/* SECTION 2: MANUAL & TROUBLESHOOTING EDIT */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                说明书内容修正 (Manual)
                            </h3>
                            <textarea 
                                className="w-full h-64 p-3 border border-slate-300 rounded text-xs font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={editingProduct.manual_content}
                                onChange={(e) => setEditingProduct({...editingProduct, manual_content: e.target.value})}
                            />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                故障排查库修正 (Troubleshooting)
                            </h3>
                            <textarea 
                                className="w-full h-64 p-3 border border-slate-300 rounded text-xs font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={editingProduct.troubleshooting}
                                onChange={(e) => setEditingProduct({...editingProduct, troubleshooting: e.target.value})}
                            />
                        </div>
                    </section>
                </div>
            </div>
        )}

        {/* VIEW: LIST PRODUCTS */}
        {mode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
                <div key={p.id} className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group flex flex-col">
                <div className="h-40 bg-slate-100 relative flex items-center justify-center border-b border-slate-200">
                    {p.image ? (
                        <img 
                            src={p.image} 
                            alt={p.name} 
                            className="w-full h-full object-contain p-2 bg-white"
                            onError={(e) => {
                                // On error, hide the image element and show placeholder sibling logic if needed, 
                                // or just revert to a clean state.
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }} 
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                            <svg className="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-xs font-medium">No Image</span>
                        </div>
                    )}
                    {/* Fallback element that is usually hidden unless p.image is missing or errors out */}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50 ${p.image ? 'hidden' : ''}`}>
                         <svg className="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         <span className="text-xs font-medium">No Image</span>
                    </div>

                    <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-white/90 text-xs font-bold rounded shadow border border-slate-200">
                        {p.marketplace}
                    </span>
                    </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 line-clamp-1" title={p.name}>{p.name}</h3>
                    </div>
                    
                    <div className="flex gap-2 my-2">
                        <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{p.asin}</span>
                        {p.modelNumber && <span className="text-[10px] font-mono bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600 font-semibold border border-indigo-100">{p.modelNumber}</span>}
                    </div>
                    
                    <div className="space-y-2 mb-4 flex-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                            <span>说明书字符: {p.manual_content.length}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <span className={`w-2 h-2 rounded-full ${p.expert_knowledge && p.expert_knowledge.length > 0 ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                            <span className={p.expert_knowledge && p.expert_knowledge.length > 0 ? 'text-amber-600 font-medium' : ''}>
                                专家问答 (Q&A): {p.expert_knowledge ? p.expert_knowledge.length : 0} 条
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <button 
                            onClick={() => handleEditProduct(p)}
                            className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded text-xs font-bold hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            训练 / 修正
                        </button>
                        <button 
                            onClick={() => handleDeleteWithAuth(p.id, p.name)}
                            className={`px-3 py-2 rounded border border-transparent transition-colors ${userRole === 'admin' ? 'text-red-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100' : 'text-slate-300 hover:bg-slate-50 cursor-not-allowed'}`}
                            title={userRole === 'admin' ? "删除产品" : "权限不足"}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;