"use client";

import { VideoEditor } from '../components/VideoEditor';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Video Editor</h1>
      <VideoEditor />
    </main>
  );
}
