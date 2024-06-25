import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { BiUser } from "react-icons/bi";
import { AiOutlineUnlock } from "react-icons/ai";
import { signIn } from 'next-auth/react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.ok) {
      router.push('/');
    } else {
      console.error('Failed to login');
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='bg-slate-800 border border-slate-400 rounded-md p-8 shadow-lg back backdrop-filter backdrop-blur-sm bg-opacity-30 relative text-orange-600'>
        <h1 className='text-4xl text-orange-600 font-bold text-center mb-6'>Login</h1>
        <form onSubmit={handleLogin}>
          <div className='relative my-6'>
            <input type='email' title='email' placeholder='Your Email' onChange={(e) => setEmail(e.target.value)} required className='block w-72 py-2 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:text-white focus:border-blue-600 peer'/>
            <BiUser className='absolute top-4 right-4'/>
          </div>
          <div className='relative my-4'>
            <input type='password' title='password' placeholder='Your Password' onChange={(e) => setPassword(e.target.value)} required className='block w-72 py-2 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:text-white focus:border-blue-600 peer'/>
            <AiOutlineUnlock className='absolute top-4 right-4'/>
          </div>
          <div className='flex justify-between items-center'>
            <div className='flex gap-2 items-center'>
              <input type='checkbox' title='checkbox' name='' id=''/>
              <label htmlFor='Remember Me'>Remember Me</label>
            </div>
            <Link href="/forgot" className='text-orange-600'>Forgot Password</Link>
          </div>
          <button className="w-full mb-4 text-[18px] mt-6 rounded-full bg-white text-orange-600 hover:bg-orange-600 hover:text-white py-2 transition-colors duration-300" type="submit">Login</button>
          <div>
            <span className='m-4'>New Here? <Link className="text-orange-600" href="/auth/signup">Create an Account</Link></span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
