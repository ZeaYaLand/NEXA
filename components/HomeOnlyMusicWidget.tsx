'use client';
import {usePathname} from 'next/navigation';
import HomeMusicWidget from './HomeMusicWidget';
export default function HomeOnlyMusicWidget(){const pathname=usePathname();return pathname==='/'?<HomeMusicWidget/>:null}
