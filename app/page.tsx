"use client";

import Image from "next/image";
import { ChangeEvent, PointerEvent, useEffect, useState } from "react";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

const PHOTO_AREA = {
  x: 20,
  y: 356,
  width: 1040,
  height: 1208,
};

export default function ApoiePage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [scale, setScale] = useState(1);

  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const [isDragging, setIsDragging] = useState(false);

  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
  });

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }

    const url = URL.createObjectURL(file);

    setPhoto(file);
    setPhotoUrl(url);

    setScale(1);

    setPosition({
      x: 0,
      y: 0,
    });
  }

  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!photoUrl) return;

    event.preventDefault();

    setIsDragging(true);

    setDragStart({
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    });

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;

    const newX = event.clientX - dragStart.x;
    const newY = event.clientY - dragStart.y;

    setPosition({
      x: newX,
      y: newY,
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleCenterPhoto() {
    setPosition({
      x: 0,
      y: 0,
    });
  }

  async function handleDownload() {
    if (!photoUrl) return;

    const canvas = document.createElement("canvas");

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const photoImage = new window.Image();

    photoImage.src = photoUrl;

    await new Promise<void>((resolve, reject) => {
      photoImage.onload = () => resolve();

      photoImage.onerror = () =>
        reject(new Error("Erro ao carregar a foto."));
    });

    const imageRatio =
      photoImage.width / photoImage.height;

    const areaRatio =
      PHOTO_AREA.width / PHOTO_AREA.height;

    let baseWidth: number;
    let baseHeight: number;

    /*
     * AQUI ESTÁ A PRINCIPAL ALTERAÇÃO.
     *
     * A imagem inicialmente será CONTIDA dentro
     * da área, em vez de ser cortada.
     */
    if (imageRatio > areaRatio) {
      baseWidth = PHOTO_AREA.width;
      baseHeight = baseWidth / imageRatio;
    } else {
      baseHeight = PHOTO_AREA.height;
      baseWidth = baseHeight * imageRatio;
    }

    /*
     * APLICA O ZOOM
     */
    const drawWidth = baseWidth * scale;
    const drawHeight = baseHeight * scale;

    /*
     * CENTRALIZA A FOTO
     */
    let drawX =
      PHOTO_AREA.x +
      (PHOTO_AREA.width - drawWidth) / 2;

    let drawY =
      PHOTO_AREA.y +
      (PHOTO_AREA.height - drawHeight) / 2;

    /*
     * CONVERSÃO DO EDITOR PARA O CANVAS
     */
    const editorWidth =
      typeof window !== "undefined"
        ? Math.min(window.innerWidth - 40, 448)
        : 448;

    const canvasScale =
      CANVAS_WIDTH / editorWidth;

    drawX += position.x * canvasScale;
    drawY += position.y * canvasScale;

    /*
     * RECORTE DA ÁREA DA FOTO
     */
    ctx.save();

    ctx.beginPath();

    ctx.rect(
      PHOTO_AREA.x,
      PHOTO_AREA.y,
      PHOTO_AREA.width,
      PHOTO_AREA.height
    );

    ctx.clip();

    /*
     * DESENHA A FOTO
     */
    ctx.drawImage(
      photoImage,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    /*
     * CARREGA A MOLDURA
     */
    const frameImage = new window.Image();

    frameImage.src = "/moldura-renato.png";

    await new Promise<void>((resolve, reject) => {
      frameImage.onload = () => resolve();

      frameImage.onerror = () =>
        reject(
          new Error("Erro ao carregar a moldura.")
        );
    });

    /*
     * MOLDURA POR CIMA
     */
    ctx.drawImage(
      frameImage,
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    /*
     * DOWNLOAD
     */
    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        "apoie-renato-figueiredo.png";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <main className="min-h-screen bg-white px-5 py-10">
      <div className="mx-auto flex max-w-md flex-col items-center">
        {/* LOGO */}
        <Image
          src="/logo-renato.png"
          alt="Renato Figueiredo"
          width={200}
          height={80}
          priority
        />

        {/* TÍTULO */}
        <h1 className="mt-6 text-center text-black text-3xl font-bold">
          Apoie Renato Figueiredo
        </h1>

        {/* DESCRIÇÃO */}
        <p className="mt-3 text-center text-gray-600">
          Coloque sua foto e faça parte desse movimento.
        </p>

        {/* EDITOR */}
        <div className="mt-8 w-full">
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: "1080 / 1920",
            }}
          >
            {/* FOTO */}
            {photoUrl && (
              <div
                className="absolute overflow-hidden"
                style={{
                  left: `${(PHOTO_AREA.x / CANVAS_WIDTH) * 100}%`,
                  top: `${(PHOTO_AREA.y / CANVAS_HEIGHT) * 100}%`,
                  width: `${(PHOTO_AREA.width / CANVAS_WIDTH) * 100}%`,
                  height: `${(PHOTO_AREA.height / CANVAS_HEIGHT) * 100}%`,

                  borderRadius: "50%",
                }}
              >
                <div
                  className="relative h-full w-full cursor-grab touch-none active:cursor-grabbing"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                  }}
                >
                  <Image
                    src={photoUrl}
                    alt="Foto selecionada"
                    fill
                    unoptimized
                    draggable={false}
                    className="select-none object-contain"
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: "center center",
                    }}
                  />
                </div>
              </div>
            )}

            {/* MOLDURA */}
            <div className="pointer-events-none absolute inset-0 z-10">
              <Image
                src="/moldura-renato.png"
                alt="Moldura Renato Figueiredo"
                fill
                priority
                className="object-fill"
              />
            </div>
          </div>
        </div>

        {/* UPLOAD */}
        <label
          htmlFor="photo-upload"
          className="mt-8 cursor-pointer rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
        >
          {photo
            ? "Trocar minha foto"
            : "Escolher minha foto"}
        </label>

        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />

        {/* CONTROLES */}
        {photoUrl && (
          <>
            {/* ZOOM */}
            <div className="mt-6 w-full">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-black font-medium">
                  Ajustar tamanho
                </span>

                <span className="text-sm text-gray-500">
                  {Math.round(scale * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0.5"
                max="2"
                step="0.01"
                value={scale}
                onChange={(event) =>
                  setScale(Number(event.target.value))
                }
                className="w-full"
              />
            </div>

            {/* CENTRALIZAR */}
            <button
              type="button"
              onClick={handleCenterPhoto}
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black font-medium transition hover:bg-gray-100"
            >
              ↺ Centralizar foto
            </button>

            {/* DOWNLOAD */}
            <button
              type="button"
              onClick={handleDownload}
              className="mt-4 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800"
            >
              Baixar foto
            </button>
          </>
        )}

        {/* ARQUIVO */}
        {photo && (
          <p className="mt-3 text-center text-sm text-gray-500">
            {photo.name}
          </p>
        )}
      </div>
    </main>
  );
}