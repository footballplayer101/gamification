import Admin from '@/components/admin';
import {configured,isAdmin} from '@/lib/security';
export const dynamic='force-dynamic';
export default async function Page(){return <Admin initialAuthenticated={await isAdmin()} configured={configured()}/>;}
