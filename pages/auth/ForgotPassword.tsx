import React, { useState } from 'react';
import { useRouter } from 'next/router';

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('../api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setStep(2);
      } else {
        setError(data.error || 'Invalid email ID');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Error sending OTP:', err);
    }
  };

  const handleVerifyOTPAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        router.push('/auth/login');
      } else {
        setError(data.error || 'OTP is incorrect or expired');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Error resetting password:', err);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='bg-slate-800 border border-slate-400 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-sm bg-opacity-30 relative text-orange-600'>
        <h1 className='text-4xl text-orange-600 font-bold text-center mb-6'>
          Forgot Password
        </h1>
        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <div className='relative my-6'>
              <input
                type='email'
                title='email'
                placeholder='Your Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='block w-72 py-2 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:text-white focus:border-blue-600 peer'
              />
            </div>
            <button
              className='w-full mb-4 text-[18px] mt-6 rounded-full bg-white text-orange-600 hover:bg-orange-600 hover:text-white py-2 transition-colors duration-300'
              type='submit'
            >
              Send OTP
            </button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleVerifyOTPAndResetPassword}>
            <div className='relative my-4'>
              <input
                type='text'
                title='otp'
                placeholder='Enter OTP'
                value={otp}
                onChange={(e) => setOTP(e.target.value)}
                required
                className='block w-72 py-2 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:text-white focus:border-blue-600 peer'
              />
            </div>
            <div className='relative my-4'>
              <input
                type='password'
                title='newPassword'
                placeholder='New Password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className='block w-72 py-2 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:text-white focus:border-blue-600 peer'
              />
            </div>
            <div className='relative my-4'>
              <input
                type='password'
                title='confirmPassword'
                placeholder='Confirm Password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className='block w-72 py-2 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:text-white focus:border-blue-600 peer'
              />
            </div>
            <button
              className='w-full mb-4 text-[18px] mt-6 rounded-full bg-white text-orange-600 hover:bg-orange-600 hover:text-white py-2 transition-colors duration-300'
              type='submit'
            >
              Reset Password
            </button>
          </form>
        )}
        {error && <p className='text-red-600 text-center'>{error}</p>}
      </div>
    </div>
  );
};

export default ForgotPassword;
