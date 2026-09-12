const CR_CONFIG_READY = window.SUPABASE_CONFIG &&
  window.SUPABASE_CONFIG.url &&
  window.SUPABASE_CONFIG.publishableKey &&
  !window.SUPABASE_CONFIG.url.includes('PASTE_') &&
  !window.SUPABASE_CONFIG.publishableKey.includes('PASTE_');

window.CR_AUTH_READY = (async () => {
  const authView = document.getElementById('authView');
  const appShell = document.getElementById('appShell');
  const authMessage = document.getElementById('authMessage');
  const authTitle = document.getElementById('authTitle');
  const authSub = document.getElementById('authSub');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const showLogin = document.getElementById('showLogin');
  const showSignup = document.getElementById('showSignup');
  const forgotBtn = document.getElementById('forgotBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const accountEmail = document.getElementById('accountEmail');
  const setupBox = document.getElementById('authSetup');

  function showAuthMessage(text, type='info') {
    authMessage.textContent = text;
    authMessage.className = `auth-message ${type}`;
  }

  function showAuthMode(mode) {
    const login = mode === 'login';
    loginForm.classList.toggle('hidden', !login);
    signupForm.classList.toggle('hidden', login);
    showLogin.classList.toggle('active', login);
    showSignup.classList.toggle('active', !login);
    authTitle.textContent = login ? 'Welcome back.' : 'Create your account.';
    authSub.textContent = login
      ? 'Sign in to keep your CR scores private and synced across devices.'
      : 'Use your own account so your scores never mix with your friends\'.';
    showAuthMessage('');
  }

  if (!CR_CONFIG_READY) {
    authView.classList.remove('hidden');
    appShell.classList.add('hidden');
    setupBox.classList.remove('hidden');
    document.querySelector('.auth-card')?.classList.add('setup-mode');
    return { user: null, configured: false };
  }

  const client = window.supabase.createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.publishableKey,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );
  window.CR_SUPABASE = client;

  let { data: { session } } = await client.auth.getSession();

  async function loadCloudAttempts(userId) {
    const { data, error } = await client
      .from('cr_attempts')
      .select('id,set_id,set_name,score,correct,wrong,blank,accuracy,time_seconds,completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: true });
    if (error) throw error;
    const mapped = (data || []).map(row => ({
      id: row.id,
      setId: row.set_id,
      setName: row.set_name,
      date: row.completed_at,
      score: row.score,
      correct: row.correct,
      wrong: row.wrong,
      blank: row.blank,
      accuracy: Number(row.accuracy),
      timeSeconds: row.time_seconds
    }));
    localStorage.setItem(`crdrill_attempts_${userId}`, JSON.stringify(mapped));
    window.CR_ATTEMPT_KEY = `crdrill_attempts_${userId}`;
    return mapped;
  }

  window.CR_LOAD_ATTEMPTS = () => loadCloudAttempts(session.user.id);

  window.CR_SAVE_ATTEMPT = async attempt => {
    const { data, error } = await client
      .from('cr_attempts')
      .insert({
        user_id: session.user.id,
        set_id: attempt.setId,
        set_name: attempt.setName,
        score: attempt.score,
        correct: attempt.correct,
        wrong: attempt.wrong,
        blank: attempt.blank,
        accuracy: attempt.accuracy,
        time_seconds: attempt.timeSeconds
      })
      .select('id,completed_at')
      .single();
    if (error) throw error;
    return { ...attempt, id: data.id, date: data.completed_at };
  };

  window.CR_DELETE_ATTEMPTS = async () => {
    const { error } = await client.from('cr_attempts').delete().eq('user_id', session.user.id);
    if (error) throw error;
    localStorage.setItem(`crdrill_attempts_${session.user.id}`, '[]');
  };

  async function enterApp(currentSession) {
    session = currentSession;
    authView.classList.add('hidden');
    appShell.classList.remove('hidden');
    accountEmail.textContent = currentSession.user.email || 'Signed in';
    const name = currentSession.user.user_metadata?.display_name;
    document.getElementById('accountName').textContent = name || 'CR Student';
    try {
      await loadCloudAttempts(currentSession.user.id);
    } catch (error) {
      console.error(error);
      showAuthMessage('Could not load your saved scores. Check your Supabase table/RLS setup.', 'error');
      throw error;
    }
  }

  async function leaveApp() {
    await client.auth.signOut();
    localStorage.removeItem(`crdrill_attempts_${session?.user?.id || ''}`);
    location.reload();
  }

  showLogin.addEventListener('click', () => showAuthMode('login'));
  showSignup.addEventListener('click', () => showAuthMode('signup'));
  logoutBtn.addEventListener('click', leaveApp);

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    showAuthMessage('Signing you in…');
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    button.disabled = false;
    if (error) {
      showAuthMessage(error.message, 'error');
      return;
    }
    try {
      await enterApp(data.session);
      location.reload();
    } catch (_) {}
  });

  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const button = signupForm.querySelector('button[type="submit"]');
    button.disabled = true;
    showAuthMessage('Creating your account…');
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('signupName').value.trim();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: window.location.origin + window.location.pathname
      }
    });
    button.disabled = false;
    if (error) {
      showAuthMessage(error.message, 'error');
      return;
    }
    if (data.session) {
      await enterApp(data.session);
      location.reload();
    } else {
      showAuthMessage('Account created. Check your email and click the confirmation link, then log in.', 'success');
      showAuthMode('login');
    }
  });

  forgotBtn.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) {
      showAuthMessage('Enter your email first, then tap Forgot password.', 'error');
      return;
    }
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    showAuthMessage(error ? error.message : 'If that account exists, a password-reset email has been sent.', error ? 'error' : 'success');
  });

  client.auth.onAuthStateChange((event, nextSession) => {
    if (event === 'SIGNED_OUT') location.reload();
  });

  if (session) {
    authView.classList.add('hidden');
    appShell.classList.remove('hidden');
    accountEmail.textContent = session.user.email || 'Signed in';
    document.getElementById('accountName').textContent = session.user.user_metadata?.display_name || 'CR Student';
    await loadCloudAttempts(session.user.id);
  } else {
    authView.classList.remove('hidden');
    appShell.classList.add('hidden');
    showAuthMode('login');
  }

  return { user: session?.user || null, configured: true };
})();
