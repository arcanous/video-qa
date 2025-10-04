import { redirect } from 'next/navigation';
import { isAuthenticated } from '../../lib/auth';
import { countVideos } from '../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function RootPage() {
  if (!(await isAuthenticated())) {
    redirect('/login');
  }
  
  const videoCount = countVideos();
  
  if (videoCount > 0) {
    redirect('/ask');
  } else {
    redirect('/upload');
  }
}