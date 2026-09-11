import { LEVELS } from "@/lib/levels";

export function drawRunShareCard(opts: {
  distanceM: number;
  totalStars: number;
  furthestLevel: number;
  pointsEarned?: number;
}): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1350;
  const g = c.getContext("2d")!;

  const bg = g.createLinearGradient(0, 0, 0, 1350);
  bg.addColorStop(0, "#070C16");
  bg.addColorStop(1, "#101B33");
  g.fillStyle = bg;
  g.fillRect(0, 0, 1080, 1350);

  const glow = g.createRadialGradient(900, 220, 10, 900, 220, 320);
  glow.addColorStop(0, "rgba(47,184,224,0.22)");
  glow.addColorStop(1, "rgba(47,184,224,0)");
  g.fillStyle = glow;
  g.beginPath();
  g.arc(900, 220, 320, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "#8B98B8";
  g.font = "600 26px Arial";
  g.fillText("DECEMBER ISSA VYBE", 70, 130);

  g.fillStyle = "#F4F6FA";
  g.font = "700 56px Georgia, serif";
  g.fillText("THE RUN UP", 70, 195);

  const level = LEVELS.find((l) => l.level === opts.furthestLevel) ?? LEVELS[0];
  g.fillStyle = level.palette.accent;
  g.font = "700 32px Georgia, serif";
  g.fillText(`Reached: ${level.name}`, 70, 260);

  const grad = g.createLinearGradient(70, 320, 950, 460);
  grad.addColorStop(0, "#2E3F8C");
  grad.addColorStop(0.5, "#3C64C8");
  grad.addColorStop(1, "#2FB8E0");
  g.fillStyle = grad;
  g.font = "700 150px Georgia, serif";
  g.fillText(`${opts.distanceM}m`, 70, 470);

  // stars
  const starY = 560;
  for (let i = 0; i < 5; i++) {
    g.fillStyle = i < opts.totalStars ? "#F0A23C" : "rgba(255,255,255,0.12)";
    g.font = "700 46px Arial";
    g.fillText("\u2605", 70 + i * 56, starY);
  }
  g.fillStyle = "#8B98B8";
  g.font = "28px Arial";
  g.fillText(`${opts.totalStars} of 15 stars earned`, 70 + 5 * 56 + 24, starY - 2);

  if (opts.pointsEarned != null) {
    g.fillStyle = "#F4F6FA";
    g.font = "32px Arial";
    g.fillText(`+${opts.pointsEarned} Vybe Points`, 70, 630);
  }

  g.strokeStyle = "rgba(140,158,196,0.3)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(70, 720);
  g.lineTo(1010, 720);
  g.stroke();

  g.fillStyle = "#8B98B8";
  g.font = "28px Arial";
  g.fillText("Think you can beat it? The door opens 1 October.", 70, 790);
  g.fillStyle = "#F4F6FA";
  g.font = "700 42px Georgia, serif";
  g.fillText("Access Is The Vybe.", 70, 850);

  return c;
}

export async function shareRunCard(
  opts: { distanceM: number; totalStars: number; furthestLevel: number; pointsEarned?: number },
  onShared?: (channel: "native" | "download") => void
) {
  const canvas = drawRunShareCard(opts);
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], "the-run-up.png", { type: "image/png" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "The Run Up",
          text: `I reached ${LEVELS.find((l) => l.level === opts.furthestLevel)?.name ?? "the gate"} — ${opts.distanceM}m, ${opts.totalStars} stars. Access Is The Vybe.`,
        });
        onShared?.("native");
        return;
      } catch {
        // user cancelled the native share sheet — fall through to download
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "the-run-up.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    onShared?.("download");
  }, "image/png");
}
