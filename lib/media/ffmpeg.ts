import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export class FfmpegNotAvailableError extends Error {
    constructor() {
        super(
            'ffmpeg/ffprobe tidak ditemukan di PATH. Pasang ffmpeg di server untuk impor Chokai.',
        );
        this.name = 'FfmpegNotAvailableError';
    }
}

function runCommand(
    bin: string,
    args: string[],
): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        const child = spawn(bin, args, { windowsHide: true });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk: Buffer) => {
            stdout += chunk.toString();
        });
        child.stderr.on('data', (chunk: Buffer) => {
            stderr += chunk.toString();
        });
        child.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'ENOENT') reject(new FfmpegNotAvailableError());
            else reject(err);
        });
        child.on('close', (code) => {
            if (code === 0) resolve({ stdout, stderr });
            else reject(new Error(`${bin} exited ${code}: ${stderr.slice(-500)}`));
        });
    });
}

/** Duration in seconds from audio buffer via ffprobe. */
export async function probeAudioDurationSec(buffer: Buffer): Promise<number> {
    const dir = await mkdtemp(join(tmpdir(), 'chokai-probe-'));
    const inputPath = join(dir, 'in.mp3');
    try {
        await writeFile(inputPath, buffer);
        const { stdout } = await runCommand('ffprobe', [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            inputPath,
        ]);
        const sec = Number.parseFloat(stdout.trim());
        if (!Number.isFinite(sec) || sec <= 0) {
            throw new Error('Durasi audio tidak valid.');
        }
        return sec;
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
}

/** Extract [startSec, endSec) clip as mp3 buffer. */
export async function sliceAudioToMp3(
    buffer: Buffer,
    startSec: number,
    endSec: number,
): Promise<Buffer> {
    if (endSec <= startSec) {
        throw new Error('Selesai harus lebih besar dari Mulai.');
    }
    const duration = endSec - startSec;
    const dir = await mkdtemp(join(tmpdir(), 'chokai-slice-'));
    const inputPath = join(dir, 'in.mp3');
    const outputPath = join(dir, 'out.mp3');
    try {
        await writeFile(inputPath, buffer);
        await runCommand('ffmpeg', [
            '-y',
            '-ss',
            String(startSec),
            '-i',
            inputPath,
            '-t',
            String(duration),
            '-acodec',
            'libmp3lame',
            '-q:a',
            '4',
            outputPath,
        ]);
        return await readFile(outputPath);
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
}
