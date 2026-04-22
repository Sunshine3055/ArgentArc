import React, { useState, useEffect } from "react";
import { LogIn, ShieldAlert, KeyRound } from "lucide-react";
import { getSupabaseClient, isAllowedUser } from "../lib/supabase";
import { slugUser } from "../utils/helpers";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Label } from "./ui";

export default function AuthPanel({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("signin"); // "signin" | "setpassword"
  const [setting, setSetting] = useState(false);
  const client = getSupabaseClient();

  // Detect invite/recovery token in URL on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=invite") || hash.includes("type=recovery")) {
      setMode("setpassword");
      // Supabase auto-exchanges the token — session is now active
    }
  }, []);

  const handleSignIn = async () => {
    const cleanEmail = slugUser(email);
    if (!client) { setMessage("Supabase not configured."); return; }

    try {
      const allowed = await isAllowedUser(client, cleanEmail);
      if (!allowed) { setPassword(""); setMessage("Access denied. This email is not approved."); return; }
    } catch {
      setPassword(""); setMessage("Unable to verify access right now."); return;
    }

    if (!password || password.length < 6) { setMessage("Password must be at least 6 characters."); return; }

    const { error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) { setPassword(""); setMessage(error.message); return; }

    setPassword("");
    onAuthSuccess(cleanEmail);
  };

  const handleSetPassword = async () => {
    if (!password || password.length < 6) { setMessage("Password must be at least 6 characters."); return; }
    setSetting(true);

    const { data, error } = await client.auth.updateUser({ password });
    if (error) { setMessage(error.message); setSetting(false); return; }

    // Clear the hash from URL
    window.history.replaceState(null, "", window.location.pathname);

    const userEmail = data.user?.email || "";
    setMessage("Password set! Signing you in...");
    onAuthSuccess(slugUser(userEmail));
  };

  // --- Set Password Screen (invite flow) ---
  if (mode === "setpassword") {
    return (
      <Card className="mx-auto mt-16 max-w-md rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#1f4fa3]" /> Set Your Password
          </CardTitle>
          <CardDescription>
            You've been invited. Create a password to access the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>New Password</Label>
            <div className="mt-2 flex gap-2">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Button type="button" variant="outline" className="rounded-xl whitespace-nowrap"
                onClick={() => setShowPassword((p) => !p)}>
                {showPassword ? "Hide" : "Show"}
              </Button>
            </div>
          </div>
          <Button
            className="w-full rounded-2xl bg-[#1f4fa3] text-white hover:bg-[#173d82]"
            onClick={handleSetPassword}
            disabled={setting}
          >
            {setting ? "Setting password..." : "Set Password & Sign In"}
          </Button>
          {message && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-[#1f4fa3]" />
                <span>{message}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // --- Normal Sign In Screen ---
  return (
    <Card className="mx-auto mt-16 max-w-md rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5 text-[#1f4fa3]" /> Member Sign In
        </CardTitle>
        <CardDescription>
          Invite-only access. Contact your admin if you need access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input className="mt-2" placeholder="member@company.com" value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="off"
            autoCapitalize="none" spellCheck={false} />
        </div>
        <div>
          <Label>Password</Label>
          <div className="mt-2 flex gap-2">
            <Input type={showPassword ? "text" : "password"} placeholder="Enter password"
              value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
            <Button type="button" variant="outline" className="rounded-xl whitespace-nowrap"
              onClick={() => setShowPassword((p) => !p)}>
              {showPassword ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
        <Button className="w-full rounded-2xl bg-[#1f4fa3] text-white hover:bg-[#173d82]"
          onClick={handleSignIn}>
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
      </CardContent>
    </Card>
  );
}