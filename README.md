# Merge Studio (Browser-based FFmpeg Merger)

Merge Studio is a browser-only demo that merges audio/video files using
ffmpeg.wasm (@ffmpeg/ffmpeg). It runs fully in the client with no server.

## Features
- Browser-only merging (no backend)
- Upload + drag & drop
- Fast copy (-c copy) first, auto re-encode on failure
- Progress/status/log output
- Download merged result
- Reset to clear state

## Supported formats
- Audio: MP3, M4A, WAV
- Video: MP4, MOV

## How to use
1) Drag and drop files or choose them from your device.  
2) Select at least two files.  
3) Pick a merge mode and click “Merge”.  
4) Download the output when it finishes.

## Run locally
```bash
npm install
npm run dev
```

## Notes / limitations
- Large files can be slow or run out of memory in the browser.
- MP4/MOV may fail with `-c copy` when codecs/resolution/frame rates differ;
  the app automatically retries with re-encoding.
- For high stability and large files, consider a server-side FFmpeg pipeline.

## Future ideas
- Server-side merging for large files
- Batch queues
- Optional format conversion

