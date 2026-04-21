import React, { useState } from "react";
import { LogIn, ShieldAlert } from "lucide-react";
import { getSupabaseClient } from "../lib/supabase";
import { isRecognizedEmail, slugUser } from "../utils/helpers";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "./ui";

export default function AuthPanel({ onAuthSuccess, createClient }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const client = getSupabaseClient(createClient);

  const handleSignIn = async () => {
    const cleanEmail = slugUser(email);
    if (!isRecognizedEmail(cleanEmail)) {
      setMessage("Access denied. Only recognized members can use this app.");
      return;
    }
    if (!client) {
      setMessage("Supabase Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    if (!password || password.length < 6) {
      setMessage("Enter your invited account password.");
      return;
    }
    const { error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Signed in.");
    onAuthSuccess(cleanEmail);
  };

  return (
    <Card className="mx-auto mt-16 max-w-md rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><LogIn className="h-5 w-5 text-[#1f4fa3]" /> Member Sign In</CardTitle>
        <CardDescription>Invite-only access. Only approved members can use this application.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div><Label>Email</Label><Input className="mt-2" placeholder="member@company.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><Label>Password</Label><Input className="mt-2" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button className="w-full rounded-2xl bg-[#1f4fa3] text-white hover:bg-[#173d82]" onClick={handleSignIn}><LogIn className="mr-2 h-4 w-4" /> Sign In</Button>
        {message && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"><div className="flex items-start gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 text-[#1f4fa3]" /> <span>{message}</span></div></div>}
        <div className="text-xs text-slate-500">Invite-only mode is active. Create or invite approved users in Supabase Auth first, then sign in here.</div>
      </CardContent>
    </Card>
  );
}

