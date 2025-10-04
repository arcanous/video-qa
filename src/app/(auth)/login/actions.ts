'use server';

import { redirect } from 'next/navigation';
import { setAuthCookie } from '../../../../lib/auth';

export async function loginAction(prevState: { success: boolean; error: string }, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  if (username === 'demo' && password === 'demo123') {
    await setAuthCookie();
    redirect('/upload');
  }
  
  // If we reach here, credentials are invalid
  // The client component will handle showing the error
  return { success: false, error: 'Invalid credentials' };
}
