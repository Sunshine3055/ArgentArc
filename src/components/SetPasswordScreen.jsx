import React, { useState } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import { getSupabaseClient } from "../lib/supabase";
import { slugUser } from "../utils/helpers";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Label } from "./ui";

export default function SetPasswordScreen({ onComplete }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const client = getSupabaseClient();

  const handleSet = async () => {
    if (!password || password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { data, error } = await client.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // Clean the invite token from the URL
    window.history.replaceState(null, "", window.location.pathname);

    const email = data.user?.email || "";
    onComplete(slugUser(email));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#1f4fa3]" /> Set Your Password
          </CardTitle>
          <CardDescription>
            You're in. Create a password so you can sign in again next time.
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
          <div>
            <Label>Confirm Password</Label>
            <Input
              className="mt-2"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button
            className="w-full rounded-2xl bg-[#1f4fa3] text-white hover:bg-[#173d82]"
            onClick={handleSet}
            disabled={loading}
          >
            {loading ? "Saving..." : "Set Password & Continue"}
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
    </div>
  );
}