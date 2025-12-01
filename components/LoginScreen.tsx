
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  // Countdown timer logic
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = () => {
    // Basic regex for Mainland China mobile numbers (Starts with 1, 11 digits)
    const cnPhoneRegex = /^1[3-9]\d{9}$/;

    if (!phoneNumber || !cnPhoneRegex.test(phoneNumber)) {
      setError('请输入有效的 11 位中国大陆手机号码');
      return;
    }
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      setCountdown(60); // 60s cooldown
      // Auto-fill code for demo convenience is removed to simulate real experience, 
      // but user can enter any 4 digits in this mock.
    }, 1000);
  };

  const handleVerify = () => {
    if (!otpCode || otpCode.length !== 4) {
      setError('请输入 4 位验证码');
      return;
    }
    setIsLoading(true);

    // Simulate Verification & Role Assignment Logic
    setTimeout(() => {
      setIsLoading(false);
      
      // Mock Login Logic based on phone number
      let role: 'admin' | 'cs' = 'cs';
      let name = '客服代表';
      
      // Demo: specific number for admin
      if (phoneNumber.endsWith('8888')) {
        role = 'admin';
        name = '系统管理员 Alex';
      }

      const user: User = {
        id: 'u_' + Date.now(),
        phone: phoneNumber,
        name: name,
        role: role,
        avatar: role === 'admin' 
          ? 'https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff' 
          : 'https://ui-avatars.com/api/?name=Agent&background=22c55e&color=fff'
      };

      onLogin(user);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Login Form */}
        <div className="w-full p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
              A
            </div>
            <h1 className="text-2xl font-bold text-slate-800">欢迎回来</h1>
            <p className="text-slate-500 text-sm mt-1">Amazon RAG 智能客服助手</p>
          </div>

          <div className="space-y-6">
            {/* Step 1: Phone Input */}
            <div className={step === 'phone' ? 'block' : 'hidden'}>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">手机号码 (中国大陆)</label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center border-r border-slate-300 bg-slate-50 rounded-l-lg text-slate-600 font-medium text-sm">
                  +86
                </div>
                <input 
                  type="tel" 
                  className="w-full pl-20 pr-4 py-3 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="请输入 11 位手机号"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">提示：测试账号尾号 8888 自动识别为管理员</p>
            </div>

            {/* Step 2: OTP Input */}
            <div className={step === 'otp' ? 'block' : 'hidden'}>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase">短信验证码</label>
                <button 
                  onClick={() => setStep('phone')}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  修改手机号
                </button>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center tracking-widest text-lg font-mono"
                  placeholder="0000"
                  maxLength={4}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  autoFocus
                />
                <button 
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  className={`w-36 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap
                    ${countdown > 0 ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}
                  `}
                >
                  {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">（模拟环境：默认验证码 8888）</p>
            </div>

            {error && (
              <div className="text-xs text-red-500 bg-red-50 p-2 rounded flex items-center gap-1 animate-pulse">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <button
              onClick={step === 'phone' ? handleSendCode : handleVerify}
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-bold text-white shadow-lg shadow-indigo-200 transition-all transform active:scale-95
                ${isLoading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'}
              `}
            >
              {isLoading ? '处理中...' : (step === 'phone' ? '获取验证码' : '登录系统')}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              点击登录即代表您同意 <a href="#" className="text-slate-600 hover:underline">服务条款</a> 和 <a href="#" className="text-slate-600 hover:underline">隐私政策</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
