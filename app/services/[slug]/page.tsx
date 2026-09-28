import { redirect } from 'next/navigation';

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === 'music') redirect('/media?tab=music');
  if (slug === 'video') redirect('/media?tab=video');
  if (slug === 'stories') redirect('/media');
  if (slug === 'events') redirect('/communities');

  redirect('/services');
}
