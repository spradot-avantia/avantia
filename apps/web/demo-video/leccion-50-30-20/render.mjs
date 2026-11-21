// Renderiza index.html cuadro a cuadro (30 fps) y lo monta en MP4 con música suave generada.
// Uso: node render.mjs <carpeta-salida>   (desde cualquier lugar; necesita ffmpeg en el PATH)
// Determinista: pausa todas las animaciones CSS y las adelanta con currentTime, así cada
// cuadro sale nítido sin depender de la velocidad de la máquina.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DURACION = 74; // segundos
const FPS = 30;
const aqui = dirname(fileURLToPath(import.meta.url));
const salida = resolve(process.argv[2] ?? join(aqui, "salida"));
const cuadros = join(salida, "cuadros");
rmSync(cuadros, { recursive: true, force: true });
mkdirSync(cuadros, { recursive: true });

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await pagina.goto(pathToFileURL(join(aqui, "index.html")).href);
await pagina.evaluate(async () => {
  await document.fonts.ready;
  for (const a of document.getAnimations()) a.pause();
});

const total = DURACION * FPS;
for (let i = 0; i < total; i++) {
  const ms = (i / FPS) * 1000;
  await pagina.evaluate((t) => {
    for (const a of document.getAnimations()) a.currentTime = t;
  }, ms);
  await pagina.screenshot({ path: join(cuadros, `${String(i).padStart(5, "0")}.jpg`), type: "jpeg", quality: 92 });
  if (i % (FPS * 10) === 0) console.log(`cuadro ${i}/${total}`);
}
await navegador.close();

// Música: acordes suaves (La menor 9 → Fa maj7 → Do → Sol), cada 8 s, con fundido.
const acorde = (f) => f.map((hz) => `sin(2*PI*${hz}*t)`).join("+");
const A = [220, 261.63, 329.63, 493.88], F = [174.61, 220, 261.63, 329.63], C = [196, 261.63, 329.63, 392], G = [196, 246.94, 293.66, 392];
const sel = (k) => `eq(mod(floor(t/8),4),${k})`;
const expr = `0.045*(${sel(0)}*(${acorde(A)})+${sel(1)}*(${acorde(F)})+${sel(2)}*(${acorde(C)})+${sel(3)}*(${acorde(G)}))*(0.75+0.25*sin(2*PI*0.25*t))`;
const mp4 = join(salida, "leccion-50-30-20.mp4");
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  "-framerate", String(FPS), "-i", join(cuadros, "%05d.jpg"),
  // Comillas simples: las comas de la expresión no deben separar filtros.
  "-f", "lavfi", "-i", `aevalsrc=exprs='${expr}':s=48000:d=${DURACION}`,
  "-filter_complex", `[1:a]lowpass=f=1400,afade=t=in:d=2,afade=t=out:st=${DURACION - 3}:d=3,aecho=0.6:0.5:120:0.25[a]`,
  "-map", "0:v", "-map", "[a]",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
  "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", mp4,
], { stdio: "inherit" });
console.log(`listo: ${mp4}`);
