import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { BiUser } from "react-icons/bi";
import { AiOutlineUnlock } from "react-icons/ai";
import Link from 'next/link';
import axios from 'axios';
import bcrypt from 'bcrypt';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if(password!==confirmPassword){
      setError("Passwords do not match");
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await axios.post('/api/auth/signup', { email, password: hashedPassword });
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing up:', error);
      setError('Failed to create account');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className='bg-slate-800 border border-slate-400 rounded-md p-8 shadow-lg back backdrop-filter backdrop-blur-sm bg-opacity-30 relative text-orange-600'>
        <h1 className='text-4xl text-orange-600 font-bold text-center mb-6'>Register</h1>
        <form onSubmit={handleSignUp}>
          <div className='relative my-6'>
            <input type='email' placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className='block w-72 py-2 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:text-white focus:border-blue-600 peer'/>
            <BiUser className='absolute top-4 right-4' />
          </div>
          <div className='relative my-6'>
            <input type='password' placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className='block w-72 py-2 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:text-white focus:border-blue-600 peer'/>
            <AiOutlineUnlock className='absolute top-4 right-4' />
          </div>
          <div className='relative my-6'>
            <input type='password' placeholder='Confirm Password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className='block w-72 py-2 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:text-white focus:border-blue-600 peer'/>
            <AiOutlineUnlock className='absolute top-4 right-4' />
          </div>
          {error && <p className='text-red-600 mb-4'>{error}</p>}
          <button className="w-full mb-4 text-[18px] mt-6 rounded-full bg-white text-orange-600 hover:bg-orange-600 hover:text-white py-2 transition-colors duration-300" type="submit">
            Register
          </button>
          <div>
            <span className='m-4'>Already have an Account?<Link className="text-orange-600" href="/auth/login">Login</Link></span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
