import { getSupabase } from '../../lib/supabase';
import DashboardClient from '../../components/DashboardClient';

export const dynamic    = 'force-dynamic'; // always server-render; never pre-render at build time
export const revalidate = 0;

async function fetchData() {
  const babyId   = process.env.BABY_ID;
  const supabase = getSupabase();

  const [eventsRes, userRes] = await Promise.all([
    supabase
      .from('baby_events_effective')
      .select('id, kind, start_at, end_at, detail, source, logged_by')
      .eq('baby_id', babyId)
      .neq('kind', 'pd_question')
      .order('start_at', { ascending: true }),
    supabase
      .from('users')
      .select('baby_name')
      .eq('id', babyId)
      .maybeSingle(),
  ]);

  return {
    events:    eventsRes.data || [],
    babyName:  userRes.data?.baby_name || 'Baby',
  };
}

export default async function Dashboard() {
  const { events, babyName } = await fetchData();
  return <DashboardClient events={events} babyName={babyName} />;
}
