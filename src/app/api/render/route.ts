import { NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import os from 'os';
import fs from 'fs';

const CACHE_DIR = path.join(os.tmpdir(), 'video-renders');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Force Node.js runtime
export const runtime = 'nodejs';
// Increase timeout since video rendering can take time
export const maxDuration = 300; // 5 minutes

export async function POST(req: Request) {
  try {
    const { videoClips, audioClips, textOverlays } = await req.json();

    // Create a unique ID for this render
    const renderId = Date.now().toString();
    const outputPath = path.join(CACHE_DIR, `${renderId}.mp4`);

    // Bundle the video
    const bundled = await bundle(
      path.join(process.cwd(), 'src', 'remotion', 'index.ts')
    );

    // Get the composition
    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'VideoEditor',
      inputProps: {
        videoClips,
        audioClips,
        textOverlays,
      },
    });

    // Render the video
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        videoClips,
        audioClips,
        textOverlays,
      },
      // You can adjust these settings based on your needs
      chromiumOptions: {
        disableWebSecurity: true,
      },
    });

    // Create a temporary URL for the rendered video
    const publicPath = `/renders/${renderId}.mp4`;
    const publicDir = path.join(process.cwd(), 'public', 'renders');
    
    // Ensure public renders directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Move the rendered video to the public directory
    fs.copyFileSync(outputPath, path.join(publicDir, `${renderId}.mp4`));
    
    // Clean up the temporary file
    fs.unlinkSync(outputPath);

    return NextResponse.json({ 
      success: true,
      path: publicPath,
    });

  } catch (error) {
    console.error('Error rendering video:', error);
    return NextResponse.json(
      { error: 'Failed to render video' },
      { status: 500 }
    );
  }
} 