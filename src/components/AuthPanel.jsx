function AuthPanel({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const client = getSupabaseClient();

  import { getSupabaseClient, isAllowedUser } from "../lib/supabase";
const handleSignIn = async () => {
  const cleanEmail = slugUser(email);

  if (!client) {
    setPassword("");
    setMessage("Supabase Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    return;
  }

  try {
    const allowed = await isAllowedUser(client, cleanEmail);

    if (!allowed) {
      setPassword("");
      setMessage("Access denied. This email is not approved for this app.");
      return;
    }
  } catch (err) {
    console.error("allowlist check error:", err);
    setPassword("");
    setMessage("Unable to verify access right now.");
    return;
  }

  if (!password || password.length < 6) {
    setPassword("");
    setMessage("Enter your invited account password.");
    return;
  }

  const { error } = await client.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    setPassword("");
    setMessage(error.message);
    return;
  }

  setPassword("");
  setShowPassword(false);
  setMessage("Signed in.");
  onAuthSuccess(cleanEmail);
};

  return (
    <Card className="mx-auto mt-16 max-w-md rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5 text-[#1f4fa3]" /> Member Sign In
        </CardTitle>
        <CardDescription>
          Invite-only access. Only approved members can use this application.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input
            className="mt-2"
            placeholder="member@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div>
          <Label>Password</Label>
          <div className="mt-2 flex gap-2">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl whitespace-nowrap"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </Button>
          </div>
        </div>

        <Button
          className="w-full rounded-2xl bg-[#1f4fa3] text-white hover:bg-[#173d82]"
          onClick={handleSignIn}
        >
          <LogIn className="mr-2 h-4 w-4" /> Sign In
        </Button>

        {message && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-[#1f4fa3]" />
              <span>{message}</span>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500">
          Invite-only mode is active. Create or invite approved users in Supabase Auth first, then sign in here.
        </div>
      </CardContent>
    </Card>
  );
}
