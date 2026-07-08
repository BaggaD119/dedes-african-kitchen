window.getGuestId = function(){
  let id = localStorage.getItem('guestId');
  if(!id){ id = crypto.randomUUID(); localStorage.setItem('guestId', id); }
  return id;
};

window.sbClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
  global: { headers: { 'x-guest-id': window.getGuestId() } },
});
