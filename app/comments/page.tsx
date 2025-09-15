'use client';
import { useState } from 'react';

export default function CommentsPage() {
  const [text, setText] = useState('');
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert('Thanks for your comments!');
    window.history.back();
  }
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Comments</h1>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3">
          <textarea
            className="border rounded-md p-2 min-h-[140px]"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Share your comments..."
          />
          <div className="flex gap-3 justify-end">
            <a href="/" className="px-4 py-2 rounded-md border">Back</a>
            <button type="submit" className="px-4 py-2 rounded-md border">Submit</button>
          </div>
        </form>
      </div>
    </main>
  );
}
