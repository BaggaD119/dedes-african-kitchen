window.FoodieAuth = {
  isMobile(){ return window.matchMedia('(max-width:768px)').matches; },
  customerHome(){ return this.isMobile() ? 'food-mobile.html' : 'food-web.html'; },

  // Customer pages don't need any Supabase Auth session at all — see enterAsGuest.
  // This guard is only for pages that require a real account (currently Vendor.html).
  async guardPage({ allowRoles, onAuthorized }){
    try{
      const { data:{ session } } = await window.sbClient.auth.getSession();
      if(!session){ location.replace('login.html'); return; }

      const { data: profile, error } = await window.sbClient
        .from('profiles').select('role, full_name').eq('id', session.user.id).single();
      if(error || !profile){ location.replace('login.html'); return; }

      if(!allowRoles.includes(profile.role)){
        location.replace(profile.role === 'vendor' ? 'Vendor.html' : this.customerHome());
        return;
      }

      const reveal = () => {
        onAuthorized?.(profile, session);
        document.documentElement.style.visibility = 'visible';
      };
      if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reveal);
      else reveal();
    }catch(e){
      console.error('Auth guard failed', e);
      location.replace('login.html');
    }
  },

  // No login, no network wait — just a per-browser guest id from localStorage.
  enterAsGuest(onReady){
    const id = window.getGuestId();
    const name = localStorage.getItem('guestName') || 'Customer';
    const email = localStorage.getItem('guestEmail') || '';
    const reveal = () => {
      onReady?.({ id, name, email });
      document.documentElement.style.visibility = 'visible';
    };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reveal);
    else reveal();
  },

  async redirectIfLoggedIn(){
    try{
      const { data:{ session } } = await window.sbClient.auth.getSession();
      if(!session) return;
      const { data: profile } = await window.sbClient
        .from('profiles').select('role').eq('id', session.user.id).single();
      location.replace(profile?.role === 'vendor' ? 'Vendor.html' : this.customerHome());
    }catch(e){
      console.error('Session check failed', e);
    }
  },

  async signIn({ email, password }){
    return window.sbClient.auth.signInWithPassword({ email, password });
  },

  async signUp({ fullName, email, password }){
    return window.sbClient.auth.signUp({
      email, password,
      options:{ data:{ full_name: fullName } }
    });
  },

  async signOut(){
    await window.sbClient.auth.signOut();
    location.href = 'index.html';
  },
};
