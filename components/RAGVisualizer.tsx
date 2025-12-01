
import React from 'react';
import { RetrievalResult, AIAnalysis } from '../types';

interface Props {
  isLoading: boolean;
  retrievedDocs: RetrievalResult[];
  analysis: AIAnalysis | null;
}

const RAGVisualizer: React.FC<Props> = ({ isLoading, retrievedDocs, analysis }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 animate-pulse">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="text-sm font-medium">AI 正在进行双重评估 (分析意图 -> 匹配最佳策略)...</span>
        </div>
        <div className="h-24 bg-slate-100 rounded-lg animate-pulse"></div>
        <div className="h-24 bg-slate-100 rounded-lg animate-pulse delay-75"></div>
      </div>
    );
  }

  if (!analysis && retrievedDocs.length === 0) return null;

  // Helper mappings for Chinese UI
  const intentMap: Record<string, string> = {
    'Product Defect': '产品缺陷',
    'Performance Issue': '性能/体验不佳',
    'Shipping Inquiry': '物流查询',
    'Returns': '退换货请求',
    'Usage Question': '使用咨询',
    'Tech Spec Question': '技术参数咨询',
    'Other': '其他问题'
  };

  const strategyMap: Record<string, string> = {
    'Empathetic': '🙏 安抚情绪型',
    'Solution': '🛠 解释+解决方案型',
    'Replacement': '🚚 换货方案型',
    'Refund': '💬 退货/退款型',
    'Brand': '💡 品牌专家型',
    'Engineer': '👨‍💻 技术专家型'
  };

  const sourceMap: Record<string, string> = {
    'Expert Q&A': '🏆 专家知识库 (Verified)',
    'Manual': '📄 说明书 (Manual)',
    'Listing': '📝 Listing 卖点',
    'Policy': '⚖️ 站点政策',
    'History': '📚 历史问答库'
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Intent Analysis */}
      {analysis && (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            第一步：意图与情感分析 (Analysis)
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge label={`意图: ${intentMap[analysis.intent] || analysis.intent}`} color="purple" />
            <Badge label={`情感: ${analysis.sentiment}`} color={analysis.sentiment === 'Negative' ? 'red' : 'green'} />
            <Badge label={`语言: ${analysis.language}`} color="slate" />
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
             <span className="font-semibold">提取痛点:</span> {analysis.keyIssues.join(', ')}
          </div>
        </div>
      )}

      {/* Step 2: Strategy Decision */}
      {analysis && analysis.suggestedStrategy && (
        <div className="bg-white p-4 rounded-lg border-l-4 border-amber-400 shadow-sm bg-amber-50/30 transition-all hover:shadow-md">
          <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            第二步：AI 策略判定 (Decision Logic)
          </h3>
          <div className="flex items-start gap-3">
             <div className="mt-1">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
             </div>
             <div>
                <p className="text-sm font-bold text-slate-800">
                    {strategyMap[analysis.suggestedStrategy] || analysis.suggestedStrategy}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                   {analysis.suggestedStrategy === 'Engineer' 
                     ? '检测到用户询问深层技术参数，将调用“工程师”人设，使用专业术语进行解释。'
                     : `检测到用户关于“${analysis.keyIssues[0]}”的反馈。AI 已选定此策略以最大程度提升满意度。`
                   }
                </p>
             </div>
          </div>
        </div>
      )}

      {/* Step 3: Retrieval */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm transition-all hover:shadow-md">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          第三步：检索增强上下文 (RAG Context)
        </h3>
        
        <div className="space-y-2">
          {retrievedDocs.length > 0 ? retrievedDocs.map((doc, idx) => (
            <div key={idx} 
                className={`p-2 rounded border text-xs hover:bg-opacity-80 transition-colors 
                ${doc.source === 'Expert Q&A' 
                    ? 'bg-amber-50 border-amber-200' 
                    : 'bg-blue-50/50 border-blue-100'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-semibold flex items-center gap-1 ${doc.source === 'Expert Q&A' ? 'text-amber-700' : 'text-blue-700'}`}>
                   {doc.source === 'Expert Q&A' && <span>🏆</span>}
                   {sourceMap[doc.source] || doc.source}
                </span>
                <span className="text-slate-400">Match: {(doc.relevanceScore * 100).toFixed(0)}%</span>
              </div>
              <p className="text-slate-600 leading-relaxed line-clamp-2" title={doc.content}>
                "{doc.content.trim()}"
              </p>
            </div>
          )) : (
            <p className="text-sm text-slate-400 italic">未找到高相关性文档。</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Badge = ({ label, color }: { label: string, color: string }) => {
  const colors: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${colors[color] || colors.slate}`}>
      {label}
    </span>
  );
};

export default RAGVisualizer;
