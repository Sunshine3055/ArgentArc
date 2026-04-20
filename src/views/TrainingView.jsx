import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TRAINING_TYPES } from "../constants";
import { deleteTrainingEvent, insertTrainingEvent, updateTrainingEvent } from "../lib/supabase";
import { ExportMenu, PrimaryButton, StatusBadge } from "../components/common";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, Textarea } from "../components/ui";

export default function TrainingView({ training, setTraining, syncClient, ownerEmail, setSyncStatus }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("Internal");
  const [notes, setNotes] = useState("");

  const addTraining = async () => {
    if (!title || !date) return;
    const row = { title, event_date: date, event_type: type, status: "Scheduled", notes, owner_email: ownerEmail };
    if (syncClient) {
      try {
        setSyncStatus("Saving...");
        const saved = await insertTrainingEvent(syncClient, row);
        setTraining((prev) => [saved, ...prev]);
        setSyncStatus("Saved");
      } catch (err) {
        console.error("training save error:", err);
        setSyncStatus("Save error");
        return;
      }
    } else {
      setTraining((prev) => [{ id: `TRN-${Date.now()}`, ...row }, ...prev]);
    }
    setTitle("");
    setDate("");
    setType("Internal");
    setNotes("");
  };

  const toggleDone = async (item) => {
    const updated = { ...item, status: item.status === "Done" ? "Scheduled" : "Done" };
    setTraining((prev) => prev.map((row) => (row.id === item.id ? updated : row)));
    if (syncClient) {
      try {
        await updateTrainingEvent(syncClient, item.id, updated);
      } catch (err) {
        console.error("training update error:", err);
        setSyncStatus("Save error");
      }
    }
  };

  const handleDelete = async (item) => {
    setTraining((prev) => prev.filter((row) => row.id !== item.id));
    if (syncClient) {
      try {
        await deleteTrainingEvent(syncClient, item.id);
      } catch (err) {
        console.error("training delete error:", err);
        setSyncStatus("Delete error");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>Schedule Training</CardTitle><CardDescription>Track internal training, provider sessions, and special product education</CardDescription></div><ExportMenu label="Training Schedule" rows={training} baseName="training-schedule" /></div></CardHeader><CardContent className="space-y-4"><div><Label>Training Title</Label><Input className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} /></div><div><Label>Date</Label><Input className="mt-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div><div><Label>Training Type</Label><div className="mt-2"><Select value={type} onValueChange={setType}><SelectContent>{TRAINING_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div><div><Label>Notes</Label><Textarea className="mt-2 min-h-[120px]" value={notes} onChange={(e) => setNotes(e.target.value)} /></div><PrimaryButton className="w-full" onClick={addTraining}><Plus className="mr-2 h-4 w-4" /> Add Training Event</PrimaryButton></CardContent></Card>
      <Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><CardTitle>Training Schedule</CardTitle><CardDescription>Compact list view for quick operational planning</CardDescription></CardHeader><CardContent className="space-y-4">{training.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><div className="font-medium">{item.title}</div><div className="mt-1 text-sm text-slate-500">{item.event_date} · {item.event_type}</div><div className="mt-3 text-sm text-slate-600">{item.notes}</div></div><div className="flex flex-wrap gap-2"><StatusBadge value={item.status} /><Button size="sm" variant="outline" className="rounded-xl" onClick={() => toggleDone(item)}>{item.status === "Done" ? "Reopen" : "Mark Done"}</Button><Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleDelete(item)}><Trash2 className="h-4 w-4" /></Button></div></div></div>)}</CardContent></Card>
    </div>
  );
}
